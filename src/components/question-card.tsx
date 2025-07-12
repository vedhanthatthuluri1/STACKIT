
"use client";

import { ArrowBigUp, MessageSquare, Eye, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from './ui/button';
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
import { doc, deleteDoc, writeBatch, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';


type QuestionCardProps = {
  id: string;
  title: string;
  author: string;
  authorId: string;
  authorAvatar: string;
  tags: string[];
  votes: number;
  answersCount: number;
  views: number;
  contentSnippet: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
};

export function QuestionCard({ id, title, author, authorId, authorAvatar, tags, votes, answersCount, views, contentSnippet, createdAt }: QuestionCardProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const isAuthor = user && user.uid === authorId;
  const isProfilePage = pathname.startsWith('/profile');
  
  const getTimestamp = () => {
    if (!createdAt?.seconds) {
      return 'just now';
    }
    const date = new Date(createdAt.seconds * 1000 + createdAt.nanoseconds / 1000000);
    return formatDistanceToNow(date, { addSuffix: true });
  }

  const handleDelete = async () => {
    if (!isAuthor) return;

    try {
        const batch = writeBatch(db);

        // Delete the question itself
        const questionRef = doc(db, 'questions', id);
        batch.delete(questionRef);

        // Delete all answers associated with the question
        const answersRef = collection(db, 'questions', id, 'answers');
        const answersSnapshot = await getDocs(answersRef);
        answersSnapshot.forEach(doc => batch.delete(doc.ref));
        
        // Optionally, delete notifications related to this question
        const notificationsRef = collection(db, 'notifications');
        const notificationsQuery = query(notificationsRef, where('questionId', '==', id));
        const notificationsSnapshot = await getDocs(notificationsQuery);
        notificationsSnapshot.forEach(doc => batch.delete(doc.ref));

        await batch.commit();

        toast({
            title: "Question Deleted",
            description: "Your question and all its related content have been removed.",
        });
        
        // Refresh the page or navigate away if needed
        router.refresh();

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error Deleting Question",
            description: error.message,
        });
    }
  };


  return (
    <Card className="hover:border-primary/50 transition-colors duration-300 group relative">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 p-6">
            <div className="flex flex-row md:flex-col gap-2 md:gap-1 items-center md:items-end text-center pr-6 border-r border-border">
                <div className="flex items-center gap-1 text-lg">
                    <span>{votes}</span>
                    <span className="text-sm text-muted-foreground">votes</span>
                </div>
                <div className="flex items-center gap-1 text-lg">
                    <span>{answersCount}</span>
                    <span className="text-sm text-muted-foreground">answers</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>{views} views</span>
                </div>
            </div>

            <div className="flex flex-col">
                <Link href={`/question/${id}`} className="focus:outline-none">
                    <CardTitle className="text-xl font-headline group-hover:text-primary transition-colors focus:underline">{title}</CardTitle>
                </Link>
                <p className="text-muted-foreground text-sm line-clamp-2 mt-2">{contentSnippet}</p>
                 <div className="flex flex-wrap items-center gap-2 mt-4">
                    {tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="font-code">{tag}</Badge>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 self-start md:self-end">
                <Avatar className="h-8 w-8">
                <AvatarImage src={authorAvatar} data-ai-hint="avatar" />
                <AvatarFallback>{author?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm font-medium">{author}</p>
                    <p className="text-xs text-muted-foreground">asked {getTimestamp()}</p>
                </div>
            </div>
        </div>

        {isAuthor && isProfilePage && (
          <div className="absolute top-2 right-2">
            <AlertDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => router.push(`/question/edit/${id}`)}>
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
                          This action cannot be undone. This will permanently delete your
                          question and all of its answers.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                      </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
    </Card>
  );
}
