
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import Link from 'next/link';

const questionFormSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters long.').max(150, 'Title must be less than 150 characters.'),
  description: z.string().min(20, 'Description must be at least 20 characters long.'),
  code: z.string().optional(),
  tags: z.string().min(1, 'Please add at least one tag.').refine(s => s.split(',').every(tag => tag.trim().length > 0), { message: 'Tags cannot be empty.' }),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

export default function AskQuestionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      title: '',
      description: '',
      code: '',
      tags: '',
    },
  });

  const onSubmit = async (data: QuestionFormValues) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'You must be logged in to ask a question.',
      });
      return router.push('/login');
    }

    setIsLoading(true);

    try {
      const tagsArray = data.tags.split(',').map(tag => tag.trim().toLowerCase());
      
      await addDoc(collection(db, 'questions'), {
        title: data.title,
        description: data.description,
        code: data.code,
        tags: tagsArray,
        authorId: user.uid,
        authorName: user.displayName || user.username,
        authorAvatar: user.photoURL || 'https://placehold.co/40x40.png',
        createdAt: serverTimestamp(),
        votes: 0,
        answersCount: 0,
        views: 0,
      });

      toast({
        title: 'Question Posted!',
        description: 'Your question has been successfully posted to the community.',
      });

      router.push('/');
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

  if (!user) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen-minus-header bg-gradient-to-br from-background to-card">
              <Card className="w-full max-w-md mx-4 text-center">
                  <CardHeader>
                      <CardTitle className="text-2xl font-bold font-headline">Access Denied</CardTitle>
                      <CardDescription>You need to be logged in to ask a question.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Button asChild>
                          <Link href="/login">Log In to Ask a Question</Link>
                      </Button>
                  </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Ask a Public Question</CardTitle>
          <CardDescription>Get help from the community by asking a clear and detailed question.</CardDescription>
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
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Post Your Question
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
