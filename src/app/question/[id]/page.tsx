
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, getDocs, orderBy, query, writeBatch, increment, serverTimestamp, updateDoc, addDoc } from 'firebase/firestore';
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
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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
                            <div className="min-w-0 flex-1">
                               <div className="space-y-4 w-full">
                                  <Skeleton className="h-4 w-full" />
                                  <Skeleton className="h-4 w-full" />
                                  <Skeleton className="h-4 w-5/6" />
                                  <Skeleton className="h-40 w-full mt-2" />
                               </div>
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
    const [userAnswer, setUserAnswer] = useState<Answer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const { toast } = useToast();
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const fetchQuestionAndAnswers = useCallback(async () => {
        if (!db || !id) return;
        
        try {
            const questionRef = doc(db, 'questions', id);
            const questionSnap = await getDoc(questionRef);

            if (questionSnap.exists()) {
                const questionData = { id: questionSnap.id, ...questionSnap.data() } as Question;
                setQuestion(questionData);

                // Fetch answers
                const answersQuery = query(collection(db, 'questions', id, 'answers'), orderBy('createdAt', 'desc'));
                const answersSnap = await getDocs(answersQuery);
                const answersData = answersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Answer));
                
                const currentUserAnswer = answersData.find(answer => answer.authorId === user?.uid) || null;
                setUserAnswer(currentUserAnswer);
                setAnswers(answersData);

            } else {
                 toast({ variant: 'destructive', title: 'Error', description: 'Question not found.' });
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load question details.' });
        } finally {
            setIsLoading(false);
        }
    // We are disabling the exhaustive-deps rule here because we *only* want this to run when id changes.
    // Re-running on user change would cause an infinite loop of re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, toast]);

    useEffect(() => {
        if (id) {
            setIsLoading(true);
            const questionRef = doc(db, 'questions', id);
            updateDoc(questionRef, { views: increment(1) }).catch(e => console.warn("Could not increment view count", e));
            fetchQuestionAndAnswers();
        }
    }, [id, fetchQuestionAndAnswers]);

    const handleAnswerSubmit = async (content: string) => {
        if (!user || !question) {
            toast({ variant: 'destructive', title: 'Authentication Required', description: 'You must be logged in to post an answer.' });
            return;
        }

        try {
            if (userAnswer) {
                // Editing existing answer
                const answerRef = doc(db, 'questions', question.id, 'answers', userAnswer.id);
                await updateDoc(answerRef, { content });
                toast({ title: 'Success!', description: 'Your answer has been updated.' });
            } else {
                // Creating new answer
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

                // Send notification only if someone else answers the question
                if (user.uid !== question.authorId) {
                    await addDoc(collection(db, 'notifications'), {
                        recipientId: question.authorId,
                        senderId: user.uid,
                        senderName: user.displayName || user.username,
                        type: 'new_answer',
                        questionId: question.id,
                        questionTitle: question.title,
                        read: false,
                        createdAt: serverTimestamp(),
                    });
                }
                 toast({ title: 'Success!', description: 'Your answer has been posted.' });
            }
            
            // Refresh answers
            await fetchQuestionAndAnswers();

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to submit answer: ${error.message}` });
        }
    };


    if (isLoading && !question) {
        return <QuestionPageSkeleton />;
    }

    if (!question) {
        return <div className="text-center py-10">Question not found.</div>;
    }

    const createdAtDate = question.createdAt ? question.createdAt.toDate() : new Date();

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to questions
            </Button>
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
                                <div className="min-w-0 flex-1">
                                    <div className="prose dark:prose-invert max-w-none prose-p:text-foreground/90 w-full" dangerouslySetInnerHTML={{ __html: question.description }} />
                                    {question.code && (
                                        <pre className="bg-muted p-4 rounded-md overflow-x-auto mt-4 font-code">
                                            <code>{question.code}</code>
                                        </pre>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-6 ml-16">
                                {question.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="bg-accent/20 text-accent-foreground border-accent/30 hover:bg-accent/30">{tag}</Badge>
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
                    <AnswerForm 
                        onSubmit={handleAnswerSubmit}
                        existingAnswer={userAnswer}
                    />

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

