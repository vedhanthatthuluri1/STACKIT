
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const questionFormSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters long.').max(150, 'Title must be less than 150 characters.'),
  description: z.string().min(20, 'Description must be at least 20 characters long.'),
  code: z.string().optional(),
  tags: z.string().min(1, 'Please add at least one tag.').refine(s => s.split(',').every(tag => tag.trim().length > 0), { message: 'Tags cannot be empty.' }),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

export default function EditQuestionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState(null);
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const id = params.id as string;

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      title: '',
      description: '',
      code: '',
      tags: '',
    },
  });

  useEffect(() => {
    if (!id) return;
    const fetchQuestion = async () => {
      const docRef = doc(db, 'questions', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.authorId !== user?.uid) {
           toast({ variant: 'destructive', title: 'Unauthorized', description: "You can't edit this question." });
           return router.push(`/question/${id}`);
        }
        setQuestion(data);
        form.reset({
            title: data.title,
            description: data.description,
            code: data.code,
            tags: data.tags.join(','),
        });
      } else {
        toast({ variant: 'destructive', title: 'Not Found', description: "Question not found." });
        router.push('/');
      }
    };

    if (user) {
        fetchQuestion();
    }
  }, [id, user, router, toast, form]);

  const onSubmit = async (data: QuestionFormValues) => {
    setIsLoading(true);

    try {
      const tagsArray = data.tags.split(',').map(tag => tag.trim().toLowerCase());
      const questionRef = doc(db, 'questions', id);
      
      await updateDoc(questionRef, {
        title: data.title,
        description: data.description,
        code: data.code,
        tags: tagsArray,
      });

      toast({
        title: 'Question Updated!',
        description: 'Your question has been successfully updated.',
      });

      router.push(`/question/${id}`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!question) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen-minus-header">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Edit Your Question</CardTitle>
          <CardDescription>Make changes to your question and save them.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Question Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. How do I use Firestore security rules with Next.js?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe your problem in detail..." rows={6} {...field} />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Code Snippet (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any relevant code snippets here." rows={8} className="font-code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. react,firebase,nextjs" {...field} />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">Enter tags separated by commas.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
