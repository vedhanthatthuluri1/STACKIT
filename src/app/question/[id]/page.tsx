
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, getDocs, orderBy, query, writeBatch, increment, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { AnswerCard } from '@/components/answer-card';
import { AnswerForm } from '@/components/answer-form';
import { VoteButtons } from '@/components/vote-buttons';
import type { DocumentData, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface Question extends DocumentData {
  id: string;
  title: string;
  description: string;
  code?: string;
  tags: string[];
  authorId: string;
  authorName: string;
  authorAvatar: string;
  votes: number;
  answersCount: number;
  views: number;
  createdAt: Timestamp;
}

export interface Answer extends DocumentData {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  votes: number;
  createdAt: Timestamp;
  isAccepted: boolean;
}


const QuestionPageSkeleton = () => (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
             <div className="md:col-span-9">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4 mb-4" />
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <Skeleton className="h-20 w-12" />
                            <div className="space-y-4 w-full">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-40 w-full mt-2" />
                            </div>
                        </div>
                         <div className="flex flex-wrap gap-2 mt-6">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-24" />
                        </div>
                    </CardContent>
                </Card>
            </div>
             <div className="md:col-span-3">
                <Card>
                    <CardContent className="p-4 space-y-3">
                         <Skeleton className="h-5 w-full" />
                         <Skeleton className="h-5 w-full" />
                         <Skeleton className="h-5 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
)


export default function QuestionPage() {
    const [question, setQuestion] = useState<Question | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const { toast } = useToast();
    const params = useParams();
    const id = params.id as string;

    const fetchQuestionAndAnswers = useCallback(async () => {
        if (!db || !id) return;
        setIsLoading(true);
        try {
            const batch = writeBatch(db);
            const questionRef = doc(db, 'questions', id);

            // Increment view count
            batch.update(questionRef, { views: increment(1) });
            await batch.commit();

            const questionSnap = await getDoc(questionRef);

            if (questionSnap.exists()) {
                const questionData = { id: questionSnap.id, ...questionSnap.data(), views: questionSnap.data().views + 1 } as Question;
                setQuestion(questionData);

                // Fetch answers
                const answersQuery = query(collection(db, 'questions', id, 'answers'), orderBy('createdAt', 'desc'));
                const answersSnap = await getDocs(answersQuery);
                const answersData = answersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Answer));
                setAnswers(answersData);

            } else {
                console.log('No such document!');
                 toast({ variant: 'destructive', title: 'Error', description: 'Question not found.' });
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load question details.' });
        } finally {
            setIsLoading(false);
        }
    }, [id, toast]);

    useEffect(() => {
        if (id) {
            fetchQuestionAndAnswers();
        }
    }, [id, fetchQuestionAndAnswers]);

    const handleAnswerSubmit = async (content: string) => {
        if (!user || !question) {
            toast({ variant: 'destructive', title: 'Authentication Required', description: 'You must be logged in to post an answer.' });
            return;
        }

        try {
            const batch = writeBatch(db);
            const answerRef = doc(collection(db, 'questions', question.id, 'answers'));
            
            batch.set(answerRef, {
                content,
                authorId: user.uid,
                authorName: user.displayName || user.username,
                authorAvatar: user.photoURL || `https://placehold.co/40x40.png`,
                votes: 0,
                createdAt: serverTimestamp(),
                isAccepted: false,
            });

            const questionRef = doc(db, 'questions', question.id);
            batch.update(questionRef, { answersCount: increment(1) });

            await batch.commit();

            // Refresh answers
            fetchQuestionAndAnswers();
            
            toast({ title: 'Success!', description: 'Your answer has been posted.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to post answer: ${error.message}` });
        }
    };


    if (isLoading) {
        return <QuestionPageSkeleton />;
    }

    if (!question) {
        return <div className="text-center py-10">Question not found.</div>;
    }

    const createdAtDate = question.createdAt ? question.createdAt.toDate() : new Date();

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                <div className="md:col-span-9 space-y-8">
                    {/* Question Card */}
                    <Card>
                        <CardHeader>
                            <h1 className="text-3xl font-bold font-headline">{question.title}</h1>
                            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={question.authorAvatar} data-ai-hint="avatar" />
                                    <AvatarFallback>{question.authorName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <span className="font-semibold text-foreground">{question.authorName}</span>
                                    <p>Asked {formatDistanceToNowStrict(createdAtDate, { addSuffix: true })}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <Separator />
                        <CardContent className="pt-6">
                             <div className="flex gap-6">
                                <VoteButtons type="question" id={question.id} initialVotes={question.votes} />
                                <div className="prose dark:prose-invert max-w-none prose-p:text-foreground/90 prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-md prose-pre:overflow-x-auto w-full">
                                    <p>{question.description}</p>
                                    {question.code && (
                                        <pre>
                                            <code className="font-code">{question.code}</code>
                                        </pre>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-6 ml-16">
                                {question.tags.map(tag => (
                                    <Badge key={tag} variant="secondary">{tag}</Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Answers Section */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold font-headline">{answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}</h2>
                        {answers.map(answer => (
                           <AnswerCard key={answer.id} questionId={question.id} answer={answer} />
                        ))}
                    </div>
                    
                    {/* Your Answer Section */}
                    <AnswerForm onSubmit={handleAnswerSubmit} />

                </div>
                {/* Right Sidebar */}
                <div className="md:col-span-3">
                    <Card>
                        <CardContent className="p-4 space-y-3 text-sm">
                           <div className="flex justify-between">
                                <span className="text-muted-foreground">Asked</span>
                                <span>{format(createdAtDate, 'PPP')}</span>
                           </div>
                           <Separator />
                           <div className="flex justify-between">
                                <span className="text-muted-foreground">Views</span>
                                <span>{question.views} times</span>
                           </div>
                           <Separator />
                           <div className="flex justify-between">
                                <span className="text-muted-foreground">Answers</span>
                                <span>{question.answersCount}</span>
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
