
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const answerFormSchema = z.object({
  content: z.string().min(20, 'Your answer must be at least 20 characters long.'),
  code: z.string().optional(),
});

type AnswerFormValues = z.infer<typeof answerFormSchema>;

interface AnswerFormProps {
    onSubmit: (content: string, code: string) => Promise<void>;
}

export function AnswerForm({ onSubmit }: AnswerFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    const form = useForm<AnswerFormValues>({
        resolver: zodResolver(answerFormSchema),
        defaultValues: { content: '', code: '' },
    });

    const handleFormSubmit = async (data: AnswerFormValues) => {
        setIsLoading(true);
        try {
            await onSubmit(data.content, data.code || '');
            form.reset();
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

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl font-bold font-headline">Your Answer</CardTitle>
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
                                        <Textarea placeholder="Write your detailed answer here..." rows={8} {...field} />
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
                                    <FormControl>
                                        <Textarea placeholder="Add a code snippet (optional)..." rows={6} className="font-code" {...field} />
                                    </FormControl>
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
                                    Post Your Answer
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

    