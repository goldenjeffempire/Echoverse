
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { 
  TrendingUp, Lightbulb, Users, CalendarDays, Clock, 
  BookOpen, Brain, Zap, Star, ArrowRight, Search, 
  Bookmark, Share2, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";

function BookCard({ book, index }: { book: any; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const getCategoryGradient = (category: string) => {
    switch(category) {
      case "Business Growth":
        return "from-blue-500 to-cyan-400";
      case "Personal Development":
        return "from-purple-500 to-pink-400";
      case "Kids & Learning":
        return "from-teal-500 to-green-400";
      case "Productivity":
        return "from-orange-500 to-amber-400";
      case "Leadership":
        return "from-primary to-violet-500";
      default:
        return "from-primary to-accent";
    }
  };
  
  return (
    <motion.div
      ref={ref}
      className="rounded-xl overflow-hidden preserve-3d transform transition-all duration-300 bg-gray-900/50 backdrop-blur-sm border border-white/5"
      style={{ 
        boxShadow: isHovered 
          ? "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px 0px rgba(139, 92, 246, 0.3)" 
          : "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <motion.img 
          src={book.cover}
          alt={book.title}
          className="w-full h-full object-cover"
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.4 }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
        
        {book.aiSummary && (
          <motion.div 
            className="absolute top-3 right-3 bg-primary/90 text-white px-2 py-1 rounded-full text-xs flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Brain className="h-3 w-3 mr-1" />
            AI Summary
          </motion.div>
        )}
        
        <motion.div 
          className={`absolute top-3 left-3 bg-gradient-to-r ${getCategoryGradient(book.category)} text-white px-3 py-1 rounded-full text-xs`}
          animate={{ y: isHovered ? 0 : -5, opacity: isHovered ? 1 : 0.8 }}
        >
          {book.category}
        </motion.div>
        
        <motion.div 
          className="absolute bottom-4 left-4 right-4"
          animate={{ y: isHovered ? -8 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.h4 
            className="text-xl font-bold mb-2"
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.3 }}
          >
            {book.title}
          </motion.h4>
          
          {book.author && (
            <div className="text-sm text-gray-300 mb-2">by {book.author}</div>
          )}
          
          <div className="flex items-center mb-2">
            {Array(5).fill(0).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < Math.floor(book.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
              />
            ))}
            <span className="text-xs text-gray-400 ml-1">{book.rating.toFixed(1)}</span>
            
            <div className="ml-auto flex items-center text-gray-400 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {book.readTime}
            </div>
          </div>
        </motion.div>
      </div>
      
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button className="rounded-full bg-primary hover:bg-primary/90 h-10 w-10 p-0">
              <BookOpen className="h-5 w-5" />
            </Button>
            <Button className="rounded-full bg-white text-gray-800 hover:bg-gray-200 h-10 w-10 p-0">
              <Bookmark className="h-5 w-5" />
            </Button>
            <Button className="rounded-full bg-accent hover:bg-accent/90 h-10 w-10 p-0">
              <Share2 className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="p-5">
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center text-gray-400">
            <Users className="h-4 w-4 mr-1" />
            <span>{book.reads}+ reads</span>
          </div>
          
          {book.badges && book.badges.length > 0 && (
            <div className="flex items-center gap-1">
              {book.badges.map((badge: string, i: number) => (
                <span 
                  key={i} 
                  className="px-2 py-0.5 bg-primary/20 text-primary-foreground rounded text-xs"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="flex items-center justify-center border-primary/30 hover:bg-primary/10"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Read
          </Button>
          <Button className="flex items-center justify-center bg-primary hover:bg-primary/90">
            <Brain className="h-4 w-4 mr-2" />
            AI Summary
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function CategoryItem({ category, active, onClick }: { 
  category: any; 
  active: boolean; 
  onClick: () => void; 
}) {
  return (
    <motion.div
      className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-300 ${
        active 
          ? "bg-primary/20 border border-primary/20" 
          : "glass-effect border border-white/5 hover:bg-gray-700/30"
      }`}
      whileHover={{ scale: 1.02, boxShadow: "0 5px 10px rgba(0,0,0,0.15)" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      layout
    >
      <div className="flex items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
          active ? "bg-primary" : "bg-gray-700"
        }`}>
          {category.icon}
        </div>
        <div>
          <div className="font-medium">{category.name}</div>
          <div className="text-xs text-gray-400">{category.count}</div>
        </div>
      </div>
      
      {active && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-primary"
        >
          <ArrowRight className="h-5 w-5" />
        </motion.div>
      )}
    </motion.div>
  );
}

export function LibraryPreviewSection() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const sectionRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const scrollY = window.scrollY;
        const sectionTop = sectionRef.current.offsetTop;
        const offset = scrollY - sectionTop;
        
        if (offset > -500 && offset < 500) {
          const elements = sectionRef.current.querySelectorAll('.parallax-element');
          elements.forEach((el) => {
            const speed = parseFloat((el as HTMLElement).dataset.speed || "0.1");
            (el as HTMLElement).style.transform = `translateY(${offset * speed}px)`;
          });
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const categories = [
    {
      name: "All",
      icon: <BookOpen className="h-5 w-5 text-white" />,
      count: "432 books"
    },
    {
      name: "Business Growth",
      icon: <TrendingUp className="h-5 w-5 text-white" />,
      count: "86 books"
    },
    {
      name: "Personal Development",
      icon: <Lightbulb className="h-5 w-5 text-white" />,
      count: "123 books"
    },
    {
      name: "Leadership",
      icon: <Award className="h-5 w-5 text-white" />,
      count: "64 books"
    },
    {
      name: "Kids & Learning",
      icon: <CalendarDays className="h-5 w-5 text-white" />,
      count: "92 books"
    },
    {
      name: "Productivity",
      icon: <Clock className="h-5 w-5 text-white" />,
      count: "74 books"
    }
  ];

  const books = [
    {
      title: "The Growth Mindset: Strategies for Business Success",
      author: "Dr. Emily Johnson",
      category: "Business Growth",
      cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=1200",
      rating: 4.2,
      readTime: "15 min read",
      reads: "1.2k",
      badges: ["Trending"],
      aiSummary: true
    },
    {
      title: "Space Adventures: A Journey Through the Universe",
      author: "Marcus Wilson",
      category: "Kids & Learning",
      cover: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=1200",
      rating: 4.8,
      readTime: "10 min read",
      reads: "5.4k",
      badges: ["Popular"],
      aiSummary: true
    },
    {
      title: "Deep Focus: Master Your Productivity",
      author: "Sarah Chen",
      category: "Productivity",
      cover: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=1200",
      rating: 4.5,
      readTime: "18 min read",
      reads: "3.7k",
      badges: ["Bestseller"],
      aiSummary: true
    },
    {
      title: "The Leadership Compass: Navigating Complex Challenges",
      author: "Robert James",
      category: "Leadership",
      cover: "https://images.unsplash.com/photo-1513001900722-370f803f498d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=1200",
      rating: 4.6,
      readTime: "20 min read",
      reads: "2.9k",
      badges: ["New"],
      aiSummary: true
    }
  ];

  const filteredBooks = books.filter(book => {
    const matchesCategory = activeCategory === "All" || book.category === activeCategory;
    const matchesSearch = !searchQuery || 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="library" className="py-24 px-4 relative overflow-hidden" ref={sectionRef}>
      <div className="absolute inset-0 opacity-40 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-10 right-[30%] w-[500px] h-[500px] rounded-full filter blur-[150px] parallax-element"
          style={{ 
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.1))",
          }}
          data-speed="0.05"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.15, 0.2]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div 
          className="absolute bottom-40 left-[20%] w-[400px] h-[400px] rounded-full filter blur-[120px] parallax-element"
          style={{ 
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(16, 185, 129, 0.1))",
          }}
          data-speed="-0.08"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.1, 0.15]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 1
          }}
        />
      </div>
      
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none"></div>
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <motion.div 
            className="text-accent font-medium mb-3 flex items-center justify-center"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <BookOpen className="w-5 h-5 mr-2" />
            <span>KNOWLEDGE BASE</span>
          </motion.div>
          
          <motion.h2 
            className="text-3xl md:text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Books & <span className="text-gradient-animated">Growth Library</span>
          </motion.h2>
          
          <motion.p 
            className="text-gray-300 max-w-2xl mx-auto text-lg"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Access our vast collection of growth books for all ages with AI-generated summaries and personalized recommendations.
          </motion.p>
          
          <motion.div 
            className="max-w-lg mx-auto mt-8 relative"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search for books, topics, or authors..."
                className="w-full px-5 py-4 pl-12 bg-gray-800/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.div 
            className="lg:col-span-3 space-y-4"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <Bookmark className="h-5 w-5 mr-2 text-primary" />
              Browse Categories
            </h3>
            
            <div className="space-y-4">
              {categories.map((category, index) => (
                <CategoryItem 
                  key={index}
                  category={category}
                  active={activeCategory === category.name}
                  onClick={() => setActiveCategory(category.name)}
                />
              ))}
            </div>
            
            <motion.div 
              className="mt-8 p-6 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div className="ml-3">
                  <h4 className="text-lg font-semibold">AI Reading Assistant</h4>
                  <p className="text-sm text-gray-300">Personalized for you</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-300 mb-4">
                Get AI-generated summaries, insights, and personalized reading recommendations.
              </p>
              
              <Button 
                className="w-full bg-primary hover:bg-primary/90"
                variant="default"
              >
                <Zap className="h-4 w-4 mr-2" />
                Activate Assistant
              </Button>
            </motion.div>
          </motion.div>
          
          <div className="lg:col-span-9">
            <div className="flex items-center justify-between mb-8">
              <motion.h3 
                className="text-xl font-semibold"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                {activeCategory === "All" ? "Featured Books" : activeCategory}
                <span className="text-sm text-gray-400 ml-2">
                  {filteredBooks.length} books
                </span>
              </motion.h3>
              
              <motion.a 
                href="#" 
                className="text-primary hover:text-primary/80 text-sm font-medium flex items-center"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </motion.a>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map((book, index) => (
                <BookCard key={index} book={book} index={index} />
              ))}
            </div>
            
            {filteredBooks.length === 0 && (
              <motion.div 
                className="text-center py-20 bg-gray-800/30 rounded-xl border border-white/5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Search className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                <h4 className="text-xl font-medium mb-2">No books found</h4>
                <p className="text-gray-400 mb-6">
                  We couldn't find any books matching "{searchQuery}" in {activeCategory === "All" ? "all categories" : activeCategory}
                </p>
                <Button onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}>
                  Clear filters
                </Button>
              </motion.div>
            )}
            
            <motion.div 
              className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {[
                { 
                  icon: <Zap className="h-5 w-5 text-primary" />, 
                  title: "15-Minute Summaries", 
                  description: "Get the key insights from any book in just 15 minutes" 
                },
                { 
                  icon: <Brain className="h-5 w-5 text-primary" />, 
                  title: "AI Personalization", 
                  description: "Recommendations tailored to your reading preferences" 
                },
                { 
                  icon: <TrendingUp className="h-5 w-5 text-primary" />, 
                  title: "Track Progress", 
                  description: "Set goals and track your reading achievements" 
                }
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-5 border border-white/5"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                >
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mr-3">
                      {feature.icon}
                    </div>
                    <h4 className="font-medium">{feature.title}</h4>
                  </div>
                  <p className="text-gray-400 text-sm">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
        
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button 
            className="px-8 py-6 bg-primary shadow-glow hover:bg-primary/90 text-lg font-medium rounded-xl"
            size="lg"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Explore Full Library
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

export default LibraryPreviewSection;
