"use client";

import { useState } from 'react';
import { advancedSearch, AdvancedSearchOutput } from '@/ai/flows/advanced-search';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AdvancedSearchOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResults(null);

    try {
      const searchResult = await advancedSearch({ query });
      setResults(searchResult);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: "The AI search assistant is currently unavailable. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search questions with AI..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-11 h-12 text-base rounded-full"
          />
        </div>
        <Button type="submit" size="lg" disabled={isLoading} className="rounded-full">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Search'
          )}
        </Button>
      </form>

      {isLoading && (
        <div className="text-center text-muted-foreground py-10">
          <Loader2 className="mx-auto h-10 w-10 animate-spin my-4 text-primary" />
          <p className="text-lg">Searching for answers in the cosmos...</p>
        </div>
      )}

      {results && (
        <div className="space-y-4 mt-8">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <span>AI Search Results ({results.results.length})</span>
          </h3>
          {results.results.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">No results found for your query.</p>
          ) : (
            results.results.map((result, index) => (
              <Link href={result.link} key={index} passHref>
                <Card className="hover:border-accent transition-colors duration-300 cursor-pointer bg-card/50">
                  <CardHeader>
                    <CardTitle>{result.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{result.content}</p>
                    <div className="flex gap-2 flex-wrap">
                      {result.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="font-code">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
