// client/src/pages/ai-tools/books-page.tsx

import React from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Book {
  title: string;
  author: string;
  description: string;
  category: string;
  price: string;
}

const books: Book[] = [
  {
    title: "AI Development Fundamentals",
    author: "John Smith",
    description: "Learn the basics of AI development",
    category: "Technology",
    price: "$29.99",
  },
  {
    title: "Machine Learning in Practice",
    author: "Sarah Johnson",
    description: "Practical applications of ML",
    category: "Technology",
    price: "$34.99",
  },
];

const categoryColors: Record<string, string> = {
  Technology: "bg-blue-600 text-white",
  Development: "bg-green-600 text-white",
  // Add other categories/colors here if needed
};

export default function BooksPage() {
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
                key={`${book.title}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="h-full bg-dark-card hover:shadow-lg hover:scale-[1.02] transition-transform duration-200">
                  <CardContent className="p-6 flex flex-col justify-between h-full">
                    <h3 className="text-xl font-semibold mb-2">{book.title}</h3>
                    <address className="not-italic text-light-base/70 mb-2">
                      By {book.author}
                    </address>
                    <p className="text-light-base/70 mb-4">{book.description}</p>
                    <div className="flex justify-between items-center">
                      <Badge className={categoryColors[book.category] || "bg-gray-600 text-white"}>
                        {book.category}
                      </Badge>
                      <div className="flex items-center gap-4">
                        <span className="text-primary font-semibold text-lg">{book.price}</span>
                        <Button variant="outline" aria-label={`Preview ${book.title}`}>
                          Preview
                        </Button>
                        <Button variant="default" aria-label={`Buy ${book.title}`}>
                          Buy Now
                        </Button>
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
