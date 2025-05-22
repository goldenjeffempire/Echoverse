import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function SchoolWidgets() {
  const { user } = useAuth();

  const { data: books, isLoading } = useQuery({
    queryKey: ["/api/library/books", user?.dob],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/library/books");
      return res.json();
    },
    enabled: !!user?.dob,
  });

  const age = user?.dob ? Math.floor((Date.now() - new Date(user.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
  const filteredBooks = (books || []).filter(book => age >= 18 ? true : !book.adult);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Recommended Books</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading books...</p>
          ) : filteredBooks.length === 0 ? (
            <p>No books found.</p>
          ) : (
            <ul className="space-y-2">
              {filteredBooks.map(book => (
                <li key={book.id} className="text-sm">
                  📘 {book.title}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
