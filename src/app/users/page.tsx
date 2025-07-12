
"use client";

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

interface User extends DocumentData {
    uid: string;
    displayName: string;
    username: string;
    email: string;
    reputation: number;
    photoURL?: string;
}

const UserSkeleton = () => (
    <Card>
        <CardContent className="p-4 flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className='space-y-2'>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
            </div>
        </CardContent>
    </Card>
)

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!db) return;
            setIsLoading(true);
            try {
                const usersQuery = query(collection(db, 'users'), orderBy('reputation', 'desc'));
                const querySnapshot = await getDocs(usersQuery);
                const usersData = querySnapshot.docs.map(doc => doc.data() as User);
                setUsers(usersData);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, []);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold font-headline flex items-center gap-3">
                    <Users className="h-8 w-8 text-primary" />
                    Users
                </h1>
                <p className="text-muted-foreground mt-2">
                    The members of the StackIt community.
                </p>
            </div>

            {isLoading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => <UserSkeleton key={i} />)}
                 </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {users.map(user => (
                        <Link href={`/profile/${user.uid}`} key={user.uid} passHref>
                            <Card className="hover:border-primary/50 hover:bg-muted/50 transition-all duration-200 h-full">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={user.photoURL} data-ai-hint="avatar" />
                                        <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-primary">{user.displayName}</p>
                                        <p className="text-sm text-muted-foreground">Reputation: {user.reputation}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

