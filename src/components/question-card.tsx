
import { ArrowBigUp, MessageSquare, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

type QuestionCardProps = {
  id: string;
  title: string;
  author: string;
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

export function QuestionCard({ id, title, author, authorAvatar, tags, votes, answersCount, views, contentSnippet, createdAt }: QuestionCardProps) {
  
  const getTimestamp = () => {
    if (!createdAt?.seconds) {
      return 'just now';
    }
    const date = new Date(createdAt.seconds * 1000 + createdAt.nanoseconds / 1000000);
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return (
    <Card className="hover:border-primary/50 transition-colors duration-300 group">
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
    </Card>
  );
}
