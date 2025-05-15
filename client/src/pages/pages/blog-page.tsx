import { MainLayout } from "@/components/layouts/main-layout";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BlogPage() {
  const posts = [
    {
      title: "The Future of AI Development",
      author: "John Smith",
      date: "Feb 1, 2024",
      excerpt: "Exploring upcoming trends in AI development",
      category: "Technology"
    },
    {
      title: "Building Better AI Tools",
      author: "Sarah Johnson",
      date: "Jan 28, 2024", 
      excerpt: "Best practices for AI tool development",
      category: "Development"
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
          <h1 className="text-4xl font-bold mb-6">Blog</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {posts.map((post, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="h-full bg-dark-card">
                  <CardContent className="p-6">
                    <Badge variant="secondary" className="mb-4">{post.category}</Badge>
                    <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                    <p className="text-light-base/70 mb-4">{post.excerpt}</p>
                    <div className="flex justify-between items-center text-sm text-light-base/50">
                      <span>By {post.author}</span>
                      <span>{post.date}</span>
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