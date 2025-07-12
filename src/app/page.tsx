import { SearchComponent } from '@/components/search-component';
import { QuestionCard } from '@/components/question-card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle } from 'lucide-react';

const questions = [
  {
    id: '1',
    title: 'How to implement 3D effects in a Next.js app?',
    author: 'Jane Doe',
    authorAvatar: 'https://placehold.co/40x40.png',
    tags: ['react', 'nextjs', 'threejs'],
    votes: 125,
    answersCount: 5,
    views: 2300,
    contentSnippet: 'I am trying to integrate Three.js with my Next.js application but running into hydration errors. What is the best practice for setting up a 3D scene on the client side without causing mismatches with server-rendered content? Any examples using @react-three/fiber would be appreciated...'
  },
  {
    id: '2',
    title: 'Best way to manage state in a large-scale React application?',
    author: 'John Smith',
    authorAvatar: 'https://placehold.co/40x40.png',
    tags: ['react', 'state-management', 'redux'],
    votes: 98,
    answersCount: 12,
    views: 5600,
    contentSnippet: 'Our application has grown significantly, and prop-drilling is becoming a nightmare. We are considering Redux, MobX, and Zustand. What are the pros and cons of each in 2024 for a project with complex state logic and real-time updates?'
  },
    {
    id: '3',
    title: 'How to secure Firebase Firestore rules for a social media app?',
    author: 'Aisha Khan',
    authorAvatar: 'https://placehold.co/40x40.png',
    tags: ['firebase', 'firestore', 'security'],
    votes: 210,
    answersCount: 8,
    views: 8900,
    contentSnippet: 'I am building a social media app and need to structure my Firestore security rules to allow users to see their friends\' posts but not posts from strangers. What is an efficient way to structure rules for read/write access based on a "friends" subcollection?'
  }
];


export default function Home() {
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
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ask Question
          </Button>
        </div>
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="most-voted">Most Voted</TabsTrigger>
            <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
          </TabsList>
          <TabsContent value="recent" className="mt-6">
            <div className="space-y-4">
              {questions.map((q) => (
                <QuestionCard key={q.id} {...q} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="most-voted" className="mt-6">
            <div className="space-y-4">
              {[...questions].sort((a,b) => b.votes - a.votes).map((q) => (
                <QuestionCard key={q.id} {...q} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="unanswered" className="mt-6">
            <div className="text-center py-16 text-muted-foreground rounded-lg border-2 border-dashed">
              <p className="text-lg">No unanswered questions found.</p>
              <p className="text-sm">Be the first to ask or answer a question!</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
