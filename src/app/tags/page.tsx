
"use client";

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag } from 'lucide-react';

interface TagData {
  name: string;
  count: number;
}

const TagSkeleton = () => (
    <Card>
        <CardContent className="p-4 flex flex-col items-center justify-center">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-4 w-20" />
        </CardContent>
    </Card>
)

export default function TagsPage() {
  const [tags, setTags] = useState<TagData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
        if (!db) return;
        setIsLoading(true);
        try {
            const questionsSnapshot = await getDocs(collection(db, 'questions'));
            const tagsMap: Record<string, number> = {};

            questionsSnapshot.forEach(doc => {
                const questionTags = doc.data().tags as string[];
                if (questionTags) {
                    questionTags.forEach(tag => {
                        tagsMap[tag] = (tagsMap[tag] || 0) + 1;
                    });
                }
            });

            const sortedTags = Object.entries(tagsMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);

            setTags(sortedTags);
        } catch (error) {
            console.error("Error fetching tags: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchTags();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline flex items-center gap-3">
          <Tag className="h-8 w-8 text-primary" />
          Tags
        </h1>
        <p className="text-muted-foreground mt-2">
          A tag is a keyword or label that categorizes your question with other, similar questions.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
           {Array.from({ length: 8 }).map((_, i) => <TagSkeleton key={i} />)}
        </div>
      ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tags.map(tag => (
            <Link href={`/tags/${tag.name}`} key={tag.name} passHref>
              <Card className="hover:border-primary/50 hover:bg-muted/50 transition-all duration-200">
                <CardContent className="p-4">
                  <Badge variant="secondary" className="font-code text-primary bg-primary/10 mb-2">{tag.name}</Badge>
                  <p className="text-sm text-muted-foreground">{tag.count} {tag.count === 1 ? 'question' : 'questions'}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
