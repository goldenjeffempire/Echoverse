import React from "react";
import { Link } from "wouter";
import { PageTemplate } from "@/components/page-template";
import { Calendar, Clock, ArrowRight } from "lucide-react";

// Blog post data
const blogPosts = [
  {
    id: 1,
    title: "How to Create a Website That Converts Visitors Into Customers",
    excerpt: "Learn the essential elements of high-converting websites and implementation strategies to boost your conversion rates.",
    category: "Website Design",
    author: "Alex Morgan",
    authorImage: "/assets/author-1.jpg",
    date: "May 12, 2025",
    readTime: "8 min read",
    featured: true,
    image: "/assets/blog-1.jpg"
  },
  {
    id: 2,
    title: "10 AI Tools That Will Transform Your Website Building Process",
    excerpt: "Discover AI-powered tools that can help you design, develop, and optimize your website faster and more efficiently.",
    category: "AI Technology",
    author: "Jamie Lee",
    authorImage: "/assets/author-2.jpg",
    date: "May 5, 2025",
    readTime: "6 min read",
    featured: false,
    image: "/assets/blog-2.jpg"
  },
  {
    id: 3,
    title: "E-commerce SEO: A Complete Guide for Online Stores",
    excerpt: "Learn proven strategies to optimize your online store for search engines and drive more organic traffic to your products.",
    category: "SEO",
    author: "Chris Zhang",
    authorImage: "/assets/author-3.jpg",
    date: "April 28, 2025",
    readTime: "12 min read",
    featured: false,
    image: "/assets/blog-3.jpg"
  },
  {
    id: 4,
    title: "Building Your Brand: Website Design Tips for Consistent Branding",
    excerpt: "Discover how to create a website that reflects your brand identity and resonates with your target audience.",
    category: "Branding",
    author: "Sarah Johnson",
    authorImage: "/assets/author-4.jpg",
    date: "April 21, 2025",
    readTime: "9 min read",
    featured: false,
    image: "/assets/blog-4.jpg"
  },
  {
    id: 5,
    title: "The Ultimate Guide to Mobile-First Web Design",
    excerpt: "Learn why mobile-first design matters and how to implement it effectively on your website.",
    category: "Mobile Design",
    author: "David Chen",
    authorImage: "/assets/author-5.jpg",
    date: "April 14, 2025",
    readTime: "10 min read",
    featured: false,
    image: "/assets/blog-5.jpg"
  },
  {
    id: 6,
    title: "Website Performance: How to Speed Up Your Site and Improve User Experience",
    excerpt: "Discover practical techniques to optimize your website's loading speed and enhance overall user experience.",
    category: "Performance",
    author: "Taylor Patel",
    authorImage: "/assets/author-6.jpg",
    date: "April 7, 2025",
    readTime: "11 min read",
    featured: false,
    image: "/assets/blog-6.jpg"
  }
];

// Blog categories
const categories = [
  "All Categories",
  "Website Design",
  "AI Technology",
  "SEO",
  "E-commerce",
  "Branding",
  "Mobile Design",
  "Performance",
  "Analytics",
  "Case Studies"
];

export default function Blog() {
  const featuredPost = blogPosts.find(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);
  
  return (
    <PageTemplate
      title="Blog"
      description="Insights, tips, and strategies to help you build and grow your online presence"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "Blog", href: "/resources/blog" }
      ]}
    >
      {/* Categories */}
      <div className="mb-12 overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {categories.map((category, index) => (
            <Link 
              key={index} 
              href={`/resources/blog${index === 0 ? '' : `?category=${encodeURIComponent(category)}`}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                index === 0 
                  ? 'bg-purple-700 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {category}
            </Link>
          ))}
        </div>
      </div>
      
      {/* Featured post */}
      {featuredPost && (
        <div className="mb-16">
          <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
              <div className="aspect-video bg-gray-800 rounded-2xl overflow-hidden">
                <div className="w-full h-full bg-gray-700 animate-pulse"></div>
              </div>
              <div className="p-8 lg:py-12 flex flex-col justify-center">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-purple-900/60 text-purple-200 rounded-full text-xs font-medium">
                    {featuredPost.category}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  {featuredPost.title}
                </h2>
                <p className="text-gray-300 mb-6">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center text-sm text-gray-400 mb-6">
                  <div className="w-8 h-8 bg-gray-700 rounded-full mr-3"></div>
                  <span>{featuredPost.author}</span>
                  <span className="mx-2">•</span>
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{featuredPost.date}</span>
                  <span className="mx-2">•</span>
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{featuredPost.readTime}</span>
                </div>
                <Link 
                  href={`/resources/blog/${featuredPost.id}`}
                  className="inline-flex items-center text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  Read Article
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Regular posts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {regularPosts.map(post => (
          <Link key={post.id} href={`/resources/blog/${post.id}`} className="group">
            <article className="bg-gray-800/30 border border-gray-700 rounded-xl overflow-hidden transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-900/20">
              <div className="aspect-video bg-gray-700 animate-pulse"></div>
              <div className="p-6">
                <div className="mb-3">
                  <span className="inline-block px-2 py-1 bg-purple-900/60 text-purple-200 rounded-full text-xs font-medium">
                    {post.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {post.excerpt}
                </p>
                <div className="flex items-center text-xs text-gray-400">
                  <div className="w-6 h-6 bg-gray-700 rounded-full mr-2"></div>
                  <span>{post.author}</span>
                  <span className="mx-2">•</span>
                  <span>{post.date}</span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
      
      {/* Load more button */}
      <div className="mt-12 text-center">
        <button className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors">
          Load More Articles
        </button>
      </div>
      
      {/* Newsletter subscription */}
      <div className="mt-20 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 backdrop-blur-sm rounded-xl p-8 md:p-12 border border-purple-800/30">
        <div className="md:flex items-center justify-between">
          <div className="md:w-2/3 mb-6 md:mb-0">
            <h2 className="text-2xl font-bold mb-2 text-white">Subscribe to Our Newsletter</h2>
            <p className="text-gray-300">
              Get the latest insights, tips, and updates delivered straight to your inbox.
            </p>
          </div>
          <div className="md:w-1/3">
            <div className="flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white font-medium rounded-r-lg transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}