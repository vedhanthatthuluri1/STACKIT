
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { SearchComponent } from '@/components/search-component';
import { QuestionCard } from '@/components/question-card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import type { DocumentData } from 'firebase/firestore';

interface Question extends DocumentData {
  id: string;
  title: string;
  authorId: string;
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
      <div className="flex items-center gap-2 ml-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2 mt-4">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-6 w-16" />
    </div>
  </div>
)

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recent');

  const fetchQuestions = useCallback(async () => {
    if (!db) return;
    setIsLoading(true);

    try {
      const q = collection(db, 'questions');
      let dataQuery;

      switch (activeTab) {
        case 'most-voted':
          dataQuery = query(q, orderBy('votes', 'desc'));
          break;
        case 'unanswered':
          dataQuery = query(q, where('answersCount', '==', 0), orderBy('createdAt', 'desc'));
          break;
        case 'recent':
        default:
          dataQuery = query(q, orderBy('createdAt', 'desc'));
          break;
      }
      
      const querySnapshot = await getDocs(dataQuery);
      const questionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
      setQuestions(questionsData);
    } catch (error) {
      console.error("Error fetching questions: ", error);
      // Optionally, show a toast message to the user
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);


  const renderQuestions = () => {
    if (isLoading) {
       return Array.from({ length: 3 }).map((_, index) => <QuestionSkeleton key={index} />);
    }

    if (questions.length === 0) {
      return (
         <div className="text-center py-16 text-muted-foreground rounded-lg border-2 border-dashed">
            <p className="text-lg">No questions found for this category.</p>
            <p className="text-sm">Be the first to ask a question!</p>
          </div>
      )
    }

    return questions.map((q) => (
      <QuestionCard
        key={q.id}
        id={q.id}
        title={q.title}
        author={q.authorName}
        authorId={q.authorId}
        authorAvatar={q.authorAvatar}
        tags={q.tags}
        votes={q.votes}
        answersCount={q.answersCount}
        views={q.views}
        contentSnippet={q.description}
        createdAt={q.createdAt}
      />
    ));
  }


  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center my-12">
        <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tighter bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient-x">
          StackIt
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          A Minimal & Futuristic Q&A Forum where problems meet solutions in the vast expanse of code.
        </p>
      </div>
      
      <SearchComponent />

      <div className="mt-16">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-3xl font-bold font-headline tracking-tight">Community Questions</h2>
          <Button asChild>
            <Link href="/ask-question">
              <PlusCircle className="mr-2 h-4 w-4" />
              Ask Question
            </Link>
          </Button>
        </div>
        <Tabs defaultValue="recent" className="w-full" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="most-voted">Most Voted</TabsTrigger>
            <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
          </TabsList>
          <TabsContent value="recent" className="mt-6">
            <div className="space-y-4">{renderQuestions()}</div>
          </TabsContent>
          <TabsContent value="most-voted" className="mt-6">
             <div className="space-y-4">{renderQuestions()}</div>
          </TabsContent>
          <TabsContent value="unanswered" className="mt-6">
             <div className="space-y-4">{renderQuestions()}</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
