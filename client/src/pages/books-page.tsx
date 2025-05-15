import { MainLayout } from "@/components/layouts/main-layout";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BooksPage() {
  const books = [
    {
      title: "AI Development Fundamentals",
      author: "John Smith",
      description: "Learn the basics of AI development",
      category: "Technology",
      price: "$29.99"
    },
    {
      title: "Machine Learning in Practice",
      author: "Sarah Johnson",
      description: "Practical applications of ML",
      category: "Technology",
      price: "$34.99"
    }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-6">Books</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {books.map((book, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="h-full bg-dark-card">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{book.title}</h3>
                    <p className="text-light-base/70 mb-2">By {book.author}</p>
                    <p className="text-light-base/70 mb-4">{book.description}</p>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">{book.category}</Badge>
                      <div className="flex items-center gap-4">
                        <span className="text-primary">{book.price}</span>
                        <Button variant="outline">Preview</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}