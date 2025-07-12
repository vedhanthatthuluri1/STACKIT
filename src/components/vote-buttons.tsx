
"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, writeBatch, increment, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ArrowBigDown, ArrowBigUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface VoteButtonsProps {
    type: 'question' | 'answer';
    id: string;
    questionId?: string; // only for answers
    initialVotes: number;
}

export function VoteButtons({ type, id, questionId, initialVotes }: VoteButtonsProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [votes, setVotes] = useState(initialVotes);
    const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
    const [isLoading, setIsLoading] = useState(false);

     useEffect(() => {
        const fetchUserVote = async () => {
            if (!user) return;
            const voteRef = doc(db, 'users', user.uid, 'votes', id);
            const voteSnap = await getDoc(voteRef);
            if (voteSnap.exists()) {
                setUserVote(voteSnap.data().type);
            }
        };
        fetchUserVote();
    }, [user, id]);

    const handleVote = async (voteType: 'up' | 'down') => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Authentication Required', description: 'You must be logged in to vote.' });
            return;
        }
        if (isLoading) return;
        setIsLoading(true);

        const batch = writeBatch(db);
        const refPath = type === 'question' ? `questions/${id}` : `questions/${questionId}/answers/${id}`;
        const contentRef = doc(db, refPath);
        const voteRef = doc(db, 'users', user.uid, 'votes', id);
        
        let voteChange = 0;

        if (userVote === voteType) {
            // Undoing vote
            voteChange = voteType === 'up' ? -1 : 1;
            batch.delete(voteRef);
            setUserVote(null);
        } else {
            if (userVote === 'up') voteChange--;
            if (userVote === 'down') voteChange++;
            
            voteChange += voteType === 'up' ? 1 : -1;
            
            batch.set(voteRef, { type: voteType, contentId: id, contentType: type });
            setUserVote(voteType);
        }

        batch.update(contentRef, { votes: increment(voteChange) });

        try {
            await batch.commit();
            setVotes(prev => prev + voteChange);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to cast vote: ${error.message}` });
            // Revert optimistic UI updates on error
            setUserVote(userVote); 
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-1">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => handleVote('up')}
                disabled={isLoading}
                className={cn("h-10 w-10 rounded-full", userVote === 'up' && 'bg-accent text-accent-foreground')}
            >
                <ArrowBigUp className="h-6 w-6" />
            </Button>
            <span className="text-xl font-bold">{votes}</span>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => handleVote('down')}
                disabled={isLoading}
                className={cn("h-10 w-10 rounded-full", userVote === 'down' && 'bg-accent text-accent-foreground')}
            >
                <ArrowBigDown className="h-6 w-6" />
            </Button>
        </div>
    );
}

// A simple useEffect was needed in this component. I'm adding it here to avoid a separate change.
import { useEffect } from 'react';

    