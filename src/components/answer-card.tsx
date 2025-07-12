
"use client";

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, User } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { VoteButtons } from './vote-buttons';
import type { Answer } from '@/app/question/[id]/page';
import { useAuth } from '@/hooks/use-auth';

interface AnswerCardProps {
    questionId: string;
    answer: Answer;
}

export function AnswerCard({ questionId, answer }: AnswerCardProps) {
    const { user } = useAuth();
    const createdAtDate = answer.createdAt ? answer.createdAt.toDate() : new Date();

    // Placeholder for accept answer functionality
    const handleAcceptAnswer = () => {
        console.log("Accepting answer", answer.id);
    }

    return (
        <Card className={answer.isAccepted ? 'border-green-500' : ''}>
            <div className="flex gap-6 p-6 items-start">
                <VoteButtons type="answer" id={answer.id} questionId={questionId} initialVotes={answer.votes} />
                <div className="w-full">
                    <div className="prose dark:prose-invert max-w-none prose-p:text-foreground/90 prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-md prose-pre:overflow-x-auto">
                        <p>{answer.content}</p>
                        {answer.code && (
                             <pre>
                                <code className="font-code">{answer.code}</code>
                            </pre>
                        )}
                    </div>

                    <Separator className="my-4" />

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-2">
                           {user?.uid === answer.authorId && !answer.isAccepted && (
                                <Button size="sm" variant="outline" onClick={handleAcceptAnswer}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Accept
                                </Button>
                           )}
                           {answer.isAccepted && (
                               <div className="flex items-center gap-2 text-green-600 font-semibold">
                                   <CheckCircle2 className="h-5 w-5" />
                                   <span>Accepted Answer</span>
                               </div>
                           )}
                        </div>
                        <div className="bg-muted p-2 rounded-md text-sm">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={answer.authorAvatar} data-ai-hint="avatar" />
                                    <AvatarFallback>{answer.authorName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-foreground">{answer.authorName}</p>
                                    <p className="text-muted-foreground">answered {formatDistanceToNowStrict(createdAtDate, { addSuffix: true })}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

    