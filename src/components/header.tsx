
"use client";

import { Cpu, Bell, LogOut, User as UserIcon, Bookmark, Settings, MessageSquare, Badge } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from '@/hooks/use-auth';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, writeBatch, doc } from 'firebase/firestore';
import { formatDistanceToNowStrict } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"


interface Notification {
    id: string;
    senderName: string;
    questionTitle: string;
    questionId: string;
    type: 'new_answer';
    read: boolean;
    createdAt: {
        seconds: number;
        nanoseconds: number;
    };
}

export function Header() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    if (user && db) {
      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        setNotifications(notifs);
        const unread = notifs.filter(n => !n.read).length;
        setUnreadCount(unread);
      }, (error) => {
        console.error("Error fetching notifications:", error);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const handlePopoverOpenChange = async (open: boolean) => {
    setIsPopoverOpen(open);
    if (!open && unreadCount > 0 && db) {
        // Mark all as read when popover closes
        const batch = writeBatch(db);
        notifications.forEach(notif => {
            if (!notif.read) {
                const notifRef = doc(db, 'notifications', notif.id);
                batch.update(notifRef, { read: true });
            }
        });
        await batch.commit();
    }
  }
  
  const getTimestamp = (createdAt: Notification['createdAt']) => {
    if (!createdAt?.seconds) {
      return 'just now';
    }
    const date = new Date(createdAt.seconds * 1000 + createdAt.nanoseconds / 1000000);
    return formatDistanceToNowStrict(date, { addSuffix: true });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="flex items-center space-x-2 mr-6">
          <Cpu className="h-7 w-7 text-primary" />
          <span className="font-bold text-lg font-headline">StackIt</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">Questions</Link>
          <Link href="/tags" className="transition-colors hover:text-foreground">Tags</Link>
          <Link href="/users" className="transition-colors hover:text-foreground">Users</Link>
          {user?.role === 'admin' && (
            <Link href="#" className="transition-colors hover:text-foreground">Admin</Link>
          )}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
           <ThemeToggle />
          {user ? (
            <>
              <Popover open={isPopoverOpen} onOpenChange={handlePopoverOpenChange}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                        <span className="relative inline-flex items-center justify-center rounded-full h-3 w-3 bg-accent text-accent-foreground text-[8px] font-bold">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0">
                  <div className="p-4 font-medium border-b">Notifications</div>
                   <div className="flex flex-col">
                      {notifications.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">No notifications yet.</p>
                      ) : (
                        notifications.map(notif => (
                           <Link
                              href={`/question/${notif.questionId}`}
                              key={notif.id}
                              className={cn(
                                'flex items-start gap-3 p-4 border-b hover:bg-muted/50 transition-colors',
                                !notif.read && 'bg-accent/10'
                              )}
                              onClick={() => setIsPopoverOpen(false)}
                           >
                              <div className="mt-1">
                                <MessageSquare className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 text-sm">
                                <p>
                                  <span className="font-semibold">{notif.senderName}</span> answered your question: <span className="text-muted-foreground italic">"{notif.questionTitle}"</span>
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">{getTimestamp(notif.createdAt)}</p>
                              </div>
                           </Link>
                        ))
                      )}
                   </div>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border-2 border-transparent hover:border-accent transition-colors">
                      <AvatarImage src={user.photoURL ?? 'https://placehold.co/40x40.png'} alt={user.displayName ?? 'user'} data-ai-hint="avatar" />
                      <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName ?? user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${user.uid}`}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bookmark className="mr-2 h-4 w-4" />
                    <span>Bookmarks</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
