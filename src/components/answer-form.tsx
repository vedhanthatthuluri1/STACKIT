
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2, Send, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { RichTextEditor } from './rich-text-editor';
import type { Answer } from '@/app/question/[id]/page';

const answerFormSchema = z.object({
  content: z.string().min(20, 'Your answer must be at least 20 characters long.'),
});

type AnswerFormValues = z.infer<typeof answerFormSchema>;

interface AnswerFormProps {
    onSubmit: (content: string) => Promise<void>;
    existingAnswer?: Answer | null;
}

export function AnswerForm({ onSubmit, existingAnswer = null }: AnswerFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    const form = useForm<AnswerFormValues>({
        resolver: zodResolver(answerFormSchema),
        defaultValues: { content: '' },
    });

    useEffect(() => {
        if (existingAnswer) {
            form.setValue('content', existingAnswer.content);
        } else {
            form.reset({ content: '' });
        }
    }, [existingAnswer, form]);


    const handleFormSubmit = async (data: AnswerFormValues) => {
        setIsLoading(true);
        try {
            await onSubmit(data.content);
            if (!existingAnswer) {
               form.reset();
            }
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit your answer.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!user) {
        return (
            <div className="text-center py-6">
                <p className="text-lg font-semibold">You must be logged in to answer.</p>
                <Button asChild className="mt-2">
                    <Link href="/login">Log In to Answer</Link>
                </Button>
            </div>
        )
    }

    const isEditing = !!existingAnswer;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl font-bold font-headline">
                    {isEditing ? 'Edit Your Answer' : 'Your Answer'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <RichTextEditor 
                                            value={field.value} 
                                            onChange={field.onChange}
                                            placeholder="Write your detailed answer here..."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isLoading} size="lg">
                             {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isEditing ? 'Saving...' : 'Posting...'}
                                </>
                                ) : (
                                <>
                                    {isEditing ? <Edit className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                                    {isEditing ? 'Save Changes' : 'Post Your Answer'}
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
