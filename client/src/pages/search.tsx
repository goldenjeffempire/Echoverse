import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search as SearchIcon, Loader2, FileText, Package, Users, Folder } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface SearchResult {
  id: string;
  type: 'product' | 'post' | 'community' | 'website';
  title: string;
  description: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export default function SearchPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get('q') || '';

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const [products, posts, communities] = await Promise.all([
        api.get<{ data: Array<Record<string, unknown>> }>('/products', { params: { search: searchQuery, limit: 10, offset: 0 } }).catch(() => ({ data: [] })),
        api.get<{ data: Array<Record<string, unknown>> }>('/posts', { params: { search: searchQuery, limit: 10, offset: 0 } }).catch(() => ({ data: [] })),
        api.get<{ data: Array<Record<string, unknown>> }>('/communities', { params: { search: searchQuery, limit: 10, offset: 0 } }).catch(() => ({ data: [] })),
      ]);

      const allResults: SearchResult[] = [
        ...(products.data || []).map((p: Record<string, unknown>) => ({
          id: String(p.id || ''),
          type: 'product' as const,
          title: String(p.name || ''),
          description: String(p.description || ''),
          metadata: p,
        })),
        ...(posts.data || []).map((p: Record<string, unknown>) => ({
          id: String(p.id || ''),
          type: 'post' as const,
          title: String(p.title || ''),
          description: String((p.content as string | undefined)?.substring(0, 200) || ''),
          url: `/posts/${p.slug}`,
          metadata: p,
        })),
        ...(communities.data || []).map((c: Record<string, unknown>) => ({
          id: String(c.id || ''),
          type: 'community' as const,
          title: String(c.name || ''),
          description: String(c.description || ''),
          url: `/community/${c.slug}`,
          metadata: c,
        })),
      ];

      setResults(allResults);
    } catch (err: any) {
      toast({
        title: 'Search failed',
        description: err.response?.data?.message || 'Could not perform search',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation(`/search?q=${encodeURIComponent(query)}`);
    performSearch(query);
  };

  const filteredResults = activeTab === 'all' 
    ? results 
    : results.filter(r => r.type === activeTab);

  const getIcon = (type: string) => {
    switch (type) {
      case 'product': return <Package className="h-5 w-5" />;
      case 'post': return <FileText className="h-5 w-5" />;
      case 'community': return <Users className="h-5 w-5" />;
      case 'website': return <Folder className="h-5 w-5" />;
      default: return <SearchIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Search</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Find products, posts, communities, and more
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search for anything..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 text-lg"
                autoFocus
              />
            </div>
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              All ({results.length})
            </TabsTrigger>
            <TabsTrigger value="product">
              Products ({results.filter(r => r.type === 'product').length})
            </TabsTrigger>
            <TabsTrigger value="post">
              Posts ({results.filter(r => r.type === 'post').length})
            </TabsTrigger>
            <TabsTrigger value="community">
              Communities ({results.filter(r => r.type === 'community').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {filteredResults.map((result) => (
              <Card key={`${result.type}-${result.id}`} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getIcon(result.type)}
                        <Badge variant="secondary">{result.type}</Badge>
                      </div>
                      <CardTitle className="text-xl hover:text-blue-600 cursor-pointer">
                        {result.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {result.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                {result.url && (
                  <CardContent>
                    <Button variant="outline" onClick={() => setLocation(result.url!)}>
                      View Details
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}

      {!loading && query && results.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <SearchIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try searching with different keywords
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
