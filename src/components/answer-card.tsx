
"use client";

import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { VoteButtons } from './vote-buttons';
import type { Answer } from '@/app/question/[id]/page';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteDoc, doc, increment, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { useRouter } from 'next/navigation';

interface AnswerCardProps {
    questionId: string;
    questionAuthorId: string;
    answer: Answer;
    onEdit: () => void;
}

export function AnswerCard({ questionId, questionAuthorId, answer, onEdit }: AnswerCardProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const createdAtDate = answer.createdAt ? answer.createdAt.toDate() : new Date();
    
    const isAnswerAuthor = user?.uid === answer.authorId;
    const isQuestionAuthor = user?.uid === questionAuthorId;

    const handleAcceptAnswer = async () => {
        if (!isQuestionAuthor) return;

        const answerRef = doc(db, 'questions', questionId, 'answers', answer.id);
        try {
            await updateDoc(answerRef, { isAccepted: !answer.isAccepted });
            toast({ title: "Success", description: `Answer marked as ${!answer.isAccepted ? 'accepted' : 'unaccepted'}.` });
            router.refresh();
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: error.message });
        }
    };

    const handleDeleteAnswer = async () => {
        if (!isAnswerAuthor) return;

        const answerRef = doc(db, 'questions', questionId, 'answers', answer.id);
        const questionRef = doc(db, 'questions', questionId);
        
        try {
            await deleteDoc(answerRef);
            await updateDoc(questionRef, { answersCount: increment(-1) });
            toast({ title: "Answer Deleted", description: "Your answer has been removed." });
            router.refresh();
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: error.message });
        }
    }

    return (
        <Card className={answer.isAccepted ? 'border-green-500 ring-2 ring-green-500/50' : ''}>
            <div className="flex gap-6 p-6 items-start relative">
                <VoteButtons type="answer" id={answer.id} questionId={questionId} initialVotes={answer.votes} />
                <div className="w-full">
                    <div 
                        className="prose dark:prose-invert max-w-none prose-p:text-foreground/90 prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-md prose-pre:overflow-x-auto"
                        dangerouslySetInnerHTML={{ __html: answer.content }}
                    />

                    <Separator className="my-4" />

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-2">
                           {isQuestionAuthor && !answer.isAccepted && (
                                <Button size="sm" variant="outline" onClick={handleAcceptAnswer}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Accept
                                </Button>
                           )}
                           {isQuestionAuthor && answer.isAccepted && (
                                <Button size="sm" variant="outline" onClick={handleAcceptAnswer} className="text-green-600 border-green-600">
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Accepted
                                </Button>
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
                 {isAnswerAuthor && (
                    <div className="absolute top-2 right-2">
                        <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={onEdit}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>Edit</span>
                                    </DropdownMenuItem>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Delete</span>
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your answer.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteAnswer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>
        </Card>
    );
}
