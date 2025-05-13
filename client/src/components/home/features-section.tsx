
import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { 
  Monitor, ShoppingBag, BookOpen, 
  MessageSquare, Calendar, MessageCircle,
  Cpu, Zap, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Feature Card with Hover Effect
function FeatureCard({ feature, index }: { feature: any, index: number }) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);
  
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = event.clientX - centerX;
    const mouseY = event.clientY - centerY;
    x.set(mouseX);
    y.set(mouseY);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{ 
        rotateX, 
        rotateY, 
        transformStyle: "preserve-3d",
        perspective: 1000
      }}
      className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-primary/10 overflow-hidden transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10 opacity-0 z-0"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      <div className="p-6 relative z-10" style={{ transform: "translateZ(20px)" }}>
        <div className="w-14 h-14 mb-6 rounded-lg cosmic-gradient flex items-center justify-center transform transition-transform duration-300" 
          style={{ transform: hovered ? "scale(1.1) translateZ(30px)" : "translateZ(20px)" }}>
          {feature.icon}
        </div>
        
        <motion.h3 
          className="text-xl font-semibold mb-3"
          style={{ transform: "translateZ(10px)" }}
          animate={{ color: hovered ? "rgb(255, 255, 255)" : "rgb(229, 231, 235)" }}
        >
          {feature.title}
        </motion.h3>
        
        <p className="text-gray-400 mb-5" style={{ transform: "translateZ(5px)" }}>
          {feature.description}
        </p>
        
        <motion.div 
          className="mt-auto"
          animate={{ y: hovered ? 0 : 10, opacity: hovered ? 1 : 0.7 }}
          transition={{ duration: 0.3 }}
          style={{ transform: "translateZ(15px)" }}
        >
          <Button 
            variant="ghost" 
            className="px-0 text-primary hover:text-white flex items-center text-sm font-medium hover:bg-transparent"
            size="sm"
          >
            Learn more
            <motion.svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 ml-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              animate={{ x: hovered ? 5 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </motion.svg>
          </Button>
        </motion.div>

        {hovered && (
          <motion.div 
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute -inset-[100px] bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 opacity-30 blur-xl" 
              style={{ 
                transform: `translateX(${Math.random() * 100 - 50}%) translateY(${Math.random() * 100 - 50}%) rotate(${Math.random() * 360}deg)`,
                animation: `spotlight 5s infinite linear` 
              }}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export function FeaturesSection() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  
  const featureCategories = [
    { id: "websites", name: "Websites & Apps", icon: <Monitor className="h-5 w-5" /> },
    { id: "ecommerce", name: "E-Commerce", icon: <ShoppingBag className="h-5 w-5" /> },
    { id: "ai", name: "AI Tools", icon: <Cpu className="h-5 w-5" /> },
    { id: "social", name: "Social", icon: <MessageSquare className="h-5 w-5" /> },
  ];
  
  const features = [
    {
      title: "EchoWeb Builder",
      description: "Create stunning websites with AI-powered drag-and-drop tools or let AI build it for you.",
      icon: <Monitor className="h-7 w-7 text-white" />,
      category: "websites",
      highlights: ["AI Wireframe Generator", "Visual Editor", "Template Library"]
    },
    {
      title: "EchoCommerce",
      description: "Sell products, manage inventory, and process payments with AI to optimize your store.",
      icon: <ShoppingBag className="h-7 w-7 text-white" />,
      category: "ecommerce",
      highlights: ["Payment Processing", "Inventory Management", "Shipping Integration"]
    },
    {
      title: "EchoLearn",
      description: "Access a vast library of growth content for all ages with AI-generated recommendations.",
      icon: <BookOpen className="h-7 w-7 text-white" />,
      category: "websites",
      highlights: ["Course Builder", "Progress Tracking", "Interactive Quizzes"]
    },
    {
      title: "EchoMarketing",
      description: "Manage contacts, create campaigns, and automate your marketing with AI assistance.",
      icon: <MessageCircle className="h-7 w-7 text-white" />,
      category: "ecommerce",
      highlights: ["Email Campaigns", "Customer Segmentation", "Analytics Dashboard"]
    },
    {
      title: "EchoConnect",
      description: "Build your community with public feed, likes, comments, and AI content moderation.",
      icon: <MessageSquare className="h-7 w-7 text-white" />,
      category: "social",
      highlights: ["Community Feed", "User Profiles", "Content Moderation"]
    },
    {
      title: "EchoCRM",
      description: "Manage customer relationships, track interactions, and get AI insights for better service.",
      icon: <Calendar className="h-7 w-7 text-white" />,
      category: "ecommerce",
      highlights: ["Customer Tracking", "Meeting Scheduler", "Task Management"]
    },
    {
      title: "EchoWriter",
      description: "Generate content, articles, and marketing copy with advanced AI writing assistant.",
      icon: <Sparkles className="h-7 w-7 text-white" />,
      category: "ai",
      highlights: ["Blog Generator", "Ad Copy Creation", "SEO Optimization"]
    },
    {
      title: "EchoDesign",
      description: "Create logos, graphics, and visual content with AI design tools and templates.",
      icon: <Zap className="h-7 w-7 text-white" />,
      category: "ai",
      highlights: ["Logo Generator", "Social Media Graphics", "Brand Kit Creator"]
    },
  ];

  const filteredFeatures = hoveredCategory 
    ? features.filter(f => f.category === hoveredCategory) 
    : features;

  return (
    <section id="features" className="py-20 px-4 bg-gray-900/90 backdrop-blur-sm relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full filter blur-[180px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/10 rounded-full filter blur-[180px]" />
      </div>
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <motion.div 
            className="text-accent font-medium mb-3 flex items-center justify-center"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            <span>MODULAR PLATFORM</span>
          </motion.div>
          
          <motion.h2 
            className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-primary-foreground to-white"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Every Feature Your Business Needs
          </motion.h2>
          
          <motion.p 
            className="text-gray-300 max-w-2xl mx-auto text-lg"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            One platform with everything you need. Start with what you need now and expand as you grow.
          </motion.p>
        </div>
        
        <motion.div 
          className="flex flex-wrap justify-center gap-3 md:gap-5 mb-12"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button 
            variant={hoveredCategory === null ? "default" : "outline"}
            className={`rounded-full ${hoveredCategory === null ? 'bg-primary' : 'bg-transparent hover:bg-primary/10'}`}
            onClick={() => setHoveredCategory(null)}
          >
            All Features
          </Button>
          
          {featureCategories.map((category) => (
            <Button 
              key={category.id}
              variant={hoveredCategory === category.id ? "default" : "outline"}
              className={`rounded-full flex items-center gap-2 ${hoveredCategory === category.id ? 'bg-primary' : 'bg-transparent hover:bg-primary/10'}`}
              onClick={() => setHoveredCategory(category.id)}
              onMouseEnter={() => setHoveredCategory(category.id)}
            >
              {category.icon}
              {category.name}
            </Button>
          ))}
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredFeatures.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
        
        <motion.div 
          className="mt-24 bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 md:p-10 border border-white/5 relative overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/30 rounded-full filter blur-[100px]" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full filter blur-[100px]" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-xl">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 cosmic-text">Build Your Complete Digital Ecosystem</h3>
              <p className="text-gray-300 mb-6">
                Echoverse is designed to grow with your business. Start with the tools you need today and add more as you expand. 
                All modules work seamlessly together, sharing data and insights powered by advanced AI.
              </p>
              <Button 
                size="lg" 
                className="rounded-xl bg-primary shadow-glow hover:bg-primary/90 hover:scale-105 transition-all"
              >
                Explore All Features
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-4 md:max-w-xs">
              {[
                "AI Content Generation", 
                "Multi-Channel Marketing", 
                "Customer Analytics", 
                "Payment Processing", 
                "Team Collaboration",
                "SEO Optimization"
              ].map((tag, i) => (
                <motion.span 
                  key={i}
                  className="px-4 py-2 bg-gray-700/50 rounded-full text-sm text-white/80 border border-white/10"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 * i }}
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(139, 92, 246, 0.3)" }}
                >
                  {tag}
                </motion.span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default FeaturesSection;
