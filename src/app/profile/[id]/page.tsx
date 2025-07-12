
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, Calendar, Award } from 'lucide-react';
import { format } from 'date-fns';
import { QuestionCard } from '@/components/question-card';
import Link from 'next/link';

interface UserProfile extends DocumentData {
    uid: string;
    displayName: string;
    username: string;
    email: string;
    reputation: number;
    createdAt: { seconds: number };
    photoURL?: string;
}

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
  createdAt: { seconds: number; nanoseconds: number; };
}

interface Answer extends DocumentData {
    id: string;
    questionId: string;
    questionTitle: string;
    content: string;
    createdAt: { seconds: number; };
}


const ProfileSkeleton = () => (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
                <Card>
                    <CardHeader className="items-center">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <Skeleton className="h-6 w-32 mt-4" />
                        <Skeleton className="h-4 w-24 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-3">
                 <Skeleton className="h-10 w-48 mb-4" />
                 <Skeleton className="h-40 w-full" />
            </div>
        </div>
    </div>
)


export default function ProfilePage() {
    const params = useParams();
    const userId = params.id as string;
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfileData = useCallback(async () => {
        if (!db || !userId) return;
        setIsLoading(true);
        try {
            // Fetch user profile
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                setUserProfile(userDoc.data() as UserProfile);
            }

            // Fetch user's questions
            const questionsQuery = query(
                collection(db, 'questions'),
                where('authorId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const questionsSnapshot = await getDocs(questionsQuery);
            setQuestions(questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question)));

            // Fetch user's answers
            const answersSnapshot = await getDocs(
                query(collection(db, "answers"), where("authorId", "==", userId))
            );
            const answersData: Answer[] = [];
            for (const answerDoc of answersSnapshot.docs) {
                const answer = answerDoc.data();
                const questionSnap = await getDoc(doc(db, 'questions', answer.questionId));
                if (questionSnap.exists()) {
                    answersData.push({
                        id: answerDoc.id,
                        questionId: answer.questionId,
                        questionTitle: questionSnap.data().title,
                        content: answer.content,
                        createdAt: answer.createdAt
                    });
                }
            }
            setAnswers(answersData.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds));

        } catch (error) {
            console.error("Error fetching profile data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    if (isLoading) {
        return <ProfileSkeleton />;
    }

    if (!userProfile) {
        return <div className="text-center py-20">User not found.</div>;
    }
    
    const memberSince = userProfile.createdAt ? format(new Date(userProfile.createdAt.seconds * 1000), 'PPP') : 'N/A';

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Profile Sidebar */}
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader className="items-center text-center">
                            <Avatar className="h-24 w-24 text-4xl mb-2">
                                <AvatarImage src={userProfile.photoURL} data-ai-hint="avatar" />
                                <AvatarFallback>{userProfile.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <h1 className="text-2xl font-bold font-headline">{userProfile.displayName}</h1>
                            <p className="text-muted-foreground">@{userProfile.username}</p>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-3">
                            <div className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-primary" />
                                <span>Reputation: <span className="font-semibold text-foreground">{userProfile.reputation}</span></span>
                            </div>
                             <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-primary" />
                                <span>{userProfile.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span>Member since {memberSince}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="md:col-span-3">
                    <Tabs defaultValue="questions" className="w-full">
                        <TabsList>
                            <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
                            <TabsTrigger value="answers">Answers ({answers.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="questions" className="mt-6">
                            <div className="space-y-4">
                                {questions.length > 0 ? (
                                    questions.map(q => <QuestionCard 
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
                                    />)
                                ) : (
                                    <p className="text-muted-foreground text-center py-10">This user hasn't asked any questions yet.</p>
                                )}
                            </div>
                        </TabsContent>
                        <TabsContent value="answers" className="mt-6">
                           <div className="space-y-4">
                                {answers.length > 0 ? (
                                    answers.map(answer => (
                                        <Card key={answer.id}>
                                            <CardContent className="p-4">
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    Answered on: <Link href={`/question/${answer.questionId}`} className="text-primary hover:underline">{answer.questionTitle}</Link>
                                                </p>
                                                <div className="prose prose-sm dark:prose-invert max-w-none line-clamp-3" dangerouslySetInnerHTML={{ __html: answer.content }} />
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                     <p className="text-muted-foreground text-center py-10">This user hasn't answered any questions yet.</p>
                                )}
                           </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
