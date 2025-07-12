
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import type { DocumentData } from 'firebase/firestore';


interface Question extends DocumentData {
  id: string;
  title: string;
  description: string;
  code?: string;
  tags: string[];
  authorName: string;
  authorAvatar: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

const QuestionPageSkeleton = () => (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-4 w-full mt-4" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-5/6 mt-2" />

                <Skeleton className="h-40 w-full mt-6" />

                <div className="flex flex-wrap gap-2 mt-6">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                </div>
            </CardContent>
        </Card>
    </div>
)


export default function QuestionPage() {
    const [question, setQuestion] = useState<Question | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const params = useParams();
    const id = params.id as string;

    useEffect(() => {
        const fetchQuestion = async () => {
            if (!db) return;
            setIsLoading(true);
            try {
                const docRef = doc(db, 'questions', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setQuestion({ id: docSnap.id, ...docSnap.data() } as Question);
                } else {
                    console.log('No such document!');
                }
            } catch (error) {
                console.error("Error fetching question:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchQuestion();
        }
    }, [id]);

    if (isLoading) {
        return <QuestionPageSkeleton />;
    }

    if (!question) {
        return <div className="text-center py-10">Question not found.</div>;
    }

    const createdAtDate = question.createdAt ? new Date(question.createdAt.seconds * 1000) : new Date();

    return (
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold font-headline">{question.title}</CardTitle>
                     <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={question.authorAvatar} data-ai-hint="avatar" />
                            <AvatarFallback>{question.authorName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <span className="font-semibold text-foreground">{question.authorName}</span>
                            <p>Asked on {format(createdAtDate, 'PPP')}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="prose dark:prose-invert max-w-none prose-p:text-foreground/90 prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-md prose-pre:overflow-x-auto">
                        <p>{question.description}</p>
                        {question.code && (
                            <pre>
                                <code className="font-code">{question.code}</code>
                            </pre>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-6">
                        {question.tags.map(tag => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
