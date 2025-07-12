
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QuestionCard } from '@/components/question-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag } from 'lucide-react';

interface Question extends DocumentData {
    id: string;
    title: string;
    authorName: string;
    authorAvatar: string;
    tags: string[];
    votes: number;
    answersCount: number;
    views: number;
    description: string;
    createdAt: {
        seconds: number;
        nanoseconds: number;
    };
}

const QuestionSkeleton = () => (
  <div className="p-6 border rounded-lg">
    <div className="flex justify-between items-start">
      <div className="space-y-3 flex-grow">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
    <div className="flex items-center gap-2 mt-4">
      <Skeleton className="h-6 w-20" />
    </div>
  </div>
)

export default function TagPage() {
  const params = useParams();
  const tag = params.tag as string;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuestionsByTag = useCallback(async () => {
    if (!db || !tag) return;
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'questions'),
        where('tags', 'array-contains', decodeURIComponent(tag)),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const questionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
      setQuestions(questionsData);
    } catch (error) {
      console.error(`Error fetching questions for tag ${tag}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [tag]);

  useEffect(() => {
    fetchQuestionsByTag();
  }, [fetchQuestionsByTag]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline flex items-center gap-3">
          <Tag className="h-8 w-8 text-primary" />
          Questions tagged [{decodeURIComponent(tag)}]
        </h1>
      </div>
      <div className="space-y-4">
        {isLoading ? (
           Array.from({ length: 3 }).map((_, index) => <QuestionSkeleton key={index} />)
        ) : questions.length > 0 ? (
          questions.map((q) => (
            <QuestionCard
              key={q.id}
              id={q.id}
              title={q.title}
              author={q.authorName}
              authorAvatar={q.authorAvatar}
              tags={q.tags}
              votes={q.votes}
              answersCount={q.answersCount}
              views={q.views}
              contentSnippet={q.description}
              createdAt={q.createdAt}
            />
          ))
        ) : (
          <div className="text-center py-16 text-muted-foreground rounded-lg border-2 border-dashed">
            <p className="text-lg">No questions found for this tag.</p>
          </div>
        )}
      </div>
    </div>
  );
}
