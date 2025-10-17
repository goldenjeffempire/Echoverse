import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, User, ArrowRight, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useLocation } from "wouter";

const blogPosts = [
  {
    title: "How AI is Revolutionizing Website Building in 2025",
    excerpt: "Discover how artificial intelligence is transforming the way we create and manage websites, making professional web development accessible to everyone.",
    category: "AI & Technology",
    author: "Sarah Chen",
    date: "March 15, 2025",
    readTime: "5 min read",
    image: "/attached_assets/stock_images/futuristic_ai_techno_78868d22.jpg"
  },
  {
    title: "10 E-Commerce Strategies to Boost Your Sales",
    excerpt: "Learn proven strategies and tactics that successful online stores use to increase conversions and drive revenue growth.",
    category: "E-Commerce",
    author: "Marcus Rodriguez",
    date: "March 12, 2025",
    readTime: "7 min read",
    image: "/attached_assets/stock_images/successful_online_bu_c08662cf.jpg"
  },
  {
    title: "Building Thriving Online Communities",
    excerpt: "A comprehensive guide to creating, nurturing, and growing engaged online communities that drive business success.",
    category: "Community",
    author: "Emily Watson",
    date: "March 10, 2025",
    readTime: "6 min read",
    image: "/attached_assets/stock_images/happy_diverse_team_c_cc06b103.jpg"
  },
  {
    title: "Marketing Automation Best Practices for 2025",
    excerpt: "Master the art of marketing automation with these proven strategies and tools to scale your business efficiently.",
    category: "Marketing",
    author: "David Kim",
    date: "March 8, 2025",
    readTime: "8 min read",
    image: "/attached_assets/stock_images/digital_marketing_da_468a0a44.jpg"
  },
  {
    title: "The Future of Web Design: Trends to Watch",
    excerpt: "Explore the latest web design trends and learn how to create stunning, modern websites that captivate your audience.",
    category: "Design",
    author: "Lisa Park",
    date: "March 5, 2025",
    readTime: "5 min read",
    image: "/attached_assets/stock_images/website_design_creat_04708a16.jpg"
  },
  {
    title: "SEO Optimization with AI: A Complete Guide",
    excerpt: "Harness the power of AI to optimize your website for search engines and drive organic traffic to your business.",
    category: "SEO",
    author: "James Wilson",
    date: "March 3, 2025",
    readTime: "9 min read",
    image: "/attached_assets/stock_images/modern_website_build_48e9aeb4.jpg"
  }
];

export default function BlogPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              <BookOpen className="w-4 h-4 mr-2" />
              Blog & Insights
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
              Latest Articles & Insights
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Expert insights, tutorials, and industry trends to help you succeed with AI-powered digital solutions
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-xl hover:shadow-2xl transition-all overflow-hidden group cursor-pointer">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-blue-600 text-white">{post.category}</Badge>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="w-4 h-4" />
                          <span>{post.date}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="group-hover:text-blue-600">
                          Read More <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
              Stay Updated with Our Newsletter
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Get the latest articles, insights, and updates delivered directly to your inbox
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-800 border-0 focus:ring-2 focus:ring-white"
              />
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8">
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
