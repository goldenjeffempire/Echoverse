import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

export function SchoolGreeting({ username }: { username: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold">Welcome, {username}</h2>
      <p className="text-muted-foreground">Hope you’re ready to ace today.</p>
    </div>
  );
}

export function AssignmentBoard({ assignments = [] }: { assignments: any[] }) {
  if (assignments.length === 0) {
    return <p className="text-sm text-muted-foreground">No assignments due.</p>;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Upcoming Assignments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {assignments.map((task, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span>{task.title}</span>
            <span className="text-muted-foreground">{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function AgeBasedLibrary({ books = [], dob }: { books: any[], dob: string }) {
  const age = dob ? Math.floor((new Date().getTime() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 0;
  const filteredBooks = books.filter((book) =>
    age < 18 ? book.ageGroup === 'teen' : book.ageGroup === 'adult'
  );

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Recommended Reads</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {filteredBooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No books available for your age group.</p>
        ) : (
          filteredBooks.map((book, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="font-medium">{book.title}</span>
              <span className="text-xs text-muted-foreground">{book.author}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
