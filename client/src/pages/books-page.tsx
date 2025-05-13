
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

interface Book {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  readTime: number;
  genre: string;
  progress?: number;
  aiSummaryAvailable?: boolean;
}

export default function BooksPage() {
  const [filters, setFilters] = useState({
    category: "",
    age: "",
    genre: "",
    author: "",
    rating: 0,
    readingTime: "" as "short" | "medium" | "long" | "",
    language: "",
    format: "" as "ebook" | "audio" | "pdf" | "",
    difficulty: "" as "beginner" | "intermediate" | "advanced" | "",
    progress: "" as "not-started" | "in-progress" | "completed" | "",
    favorite: false,
    hasHighlights: false,
    recommended: false,
    aiEnhanced: false,
  });

  const [recommendations, setRecommendations] = useState<Book[]>([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      const res = await fetch('/api/books/recommendations');
      const data = await res.json();
      setRecommendations(data);
    };
    fetchRecommendations();
  }, []);

  const filterOptions = {
    ages: ["0-5", "6-8", "9-12", "13-17", "18+"],
    genres: ["Fiction", "Non-Fiction", "Business", "Self-Help", "Education", "Parenting"],
    formats: ["ebook", "audio", "pdf"],
    difficulties: ["beginner", "intermediate", "advanced"],
    readingTimes: ["short", "medium", "long"],
  };

  const { data: books, isLoading } = useQuery({
    queryKey: ['books', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters as any);
      const res = await fetch(`/api/books?${params}`);
      return res.json();
    }
  });

  return (
    <DashboardLayout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Books Library</h1>

        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search books..."
            className="max-w-sm"
            icon={<Search className="h-4 w-4" />}
          />
          <div className="flex gap-4 flex-wrap">
            <Select
              value={filters.age}
              onValueChange={(value) => setFilters(f => ({ ...f, age: value }))}
              options={[
                { label: "All Ages", value: "" },
                ...filterOptions.ages.map(age => ({
                  label: age,
                  value: age
                }))
              ]}
            />
            <Select
              value={filters.genre}
              onValueChange={(value) => setFilters(f => ({ ...f, genre: value }))}
              options={[
                { label: "All Genres", value: "" },
                ...filterOptions.genres.map(genre => ({
                  label: genre,
                  value: genre.toLowerCase()
                }))
              ]}
            />
            <Select
              value={filters.progress}
              onValueChange={(value) => setFilters(f => ({ ...f, progress: value as typeof f.progress }))}
              options={[
                { label: "All Progress", value: "" },
                { label: "Not Started", value: "not-started" },
                { label: "In Progress", value: "in-progress" },
                { label: "Completed", value: "completed" }
              ]}
            />
            <Select
              value={filters.readingTime}
              onValueChange={(value) => setFilters(f => ({ ...f, readingTime: value as typeof f.readingTime }))}
              options={[
                { label: "Any Length", value: "" },
                { label: "Short (<30 min)", value: "short" },
                { label: "Medium (30-60 min)", value: "medium" },
                { label: "Long (>60 min)", value: "long" }
              ]}
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={filters.favorite}
                onCheckedChange={(checked) => setFilters(f => ({ ...f, favorite: checked }))}
                id="favorite-filter"
              />
              <Label htmlFor="favorite-filter">Favorites</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={filters.hasHighlights}
                onCheckedChange={(checked) => setFilters(f => ({ ...f, hasHighlights: checked }))}
                id="highlights-filter"
              />
              <Label htmlFor="highlights-filter">With Highlights</Label>
            </div>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Recommended for You</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {recommendations.map((book) => (
                <Card key={book.id} className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-[3/4] relative mb-4 bg-muted rounded-lg overflow-hidden group">
                    {book.coverImage && (
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="object-cover rounded-lg transform transition-transform group-hover:scale-105"
                      />
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary">Recommended</Badge>
                    </div>
                  </div>
                  <h3 className="font-medium line-clamp-2 mb-1">{book.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
                  <p className="text-xs text-muted-foreground">Based on your reading history</p>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {!isLoading && books?.map((book: Book) => (
            <Card key={book.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="aspect-[3/4] relative mb-4 bg-muted rounded-lg overflow-hidden group">
                {book.coverImage && (
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="object-cover rounded-lg transform transition-transform group-hover:scale-105"
                  />
                )}
                {book.progress && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${book.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <h3 className="font-medium line-clamp-2 mb-1">{book.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{book.readTime} min read</span>
                <span>•</span>
                <span>{book.genre}</span>
                {book.aiSummaryAvailable && (
                  <>
                    <span>•</span>
                    <span className="text-primary">AI Summary</span>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
