
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, Brain, BarChart2, Zap } from "lucide-react";

export function HeroSection() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-advance testimonials
  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(() => {
        setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isHovered]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const stats = [
    { count: "15+", label: "AI Modules", icon: <Brain className="h-6 w-6 text-primary mb-2" /> },
    { count: "98%", label: "Customer Satisfaction", icon: <BarChart2 className="h-6 w-6 text-primary mb-2" /> },
    { count: "24/7", label: "AI Support", icon: <Zap className="h-6 w-6 text-primary mb-2" /> },
    { count: "500+", label: "Integrations", icon: <Sparkles className="h-6 w-6 text-primary mb-2" /> }
  ];

  const featurePills = [
    { name: "Students", bgColor: "bg-accent-purple/20", textColor: "text-accent-purple" },
    { name: "Developers", bgColor: "bg-accent-cyan/20", textColor: "text-accent-cyan" },
    { name: "Marketers", bgColor: "bg-secondary/20", textColor: "text-secondary-light" },
    { name: "Educators", bgColor: "bg-accent-pink/20", textColor: "text-accent-pink" },
    { name: "Entrepreneurs", bgColor: "bg-success/20", textColor: "text-success" }
  ];

  const testimonials = [
    {
      quote: "Echoverse transformed our business with its AI tools. In just weeks, we saw a 40% increase in efficiency.",
      author: "Sarah Johnson",
      role: "CEO, TechNova"
    },
    {
      quote: "The all-in-one platform helped us replace 5 different tools. Our team is more productive than ever.",
      author: "Michael Chen",
      role: "Marketing Director, GrowthX"
    },
    {
      quote: "We built our entire online presence with Echoverse. From website to e-commerce to marketing - it does it all.",
      author: "Jessica Williams",
      role: "Founder, Artisan Collective"
    }
  ];

  return (
    <section className="relative bg-mesh pt-20 overflow-hidden" ref={containerRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-24 sm:pb-32">
        <motion.div
          className="grid md:grid-cols-2 gap-10 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="text-center md:text-left">
            <motion.div
              className="inline-block px-4 py-1 bg-primary/10 rounded-full border border-primary/20 text-primary-foreground text-sm font-medium mb-4"
              variants={itemVariants}
            >
              <span className="mr-2">✨</span>
              Introducing Echoverse
              <span className="ml-2">✨</span>
            </motion.div>

            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold"
              variants={itemVariants}
            >
              <span className="block text-white">The Ultimate</span>
              <span className="text-gradient block">AI-Native Platform</span>
            </motion.h1>
            
            <motion.p 
              className="mt-6 text-xl text-light-base/80 max-w-xl mx-auto md:mx-0"
              variants={itemVariants}
            >
              Build, learn, sell, and grow with our modular AI tools designed for every role, from students to enterprise teams.
            </motion.p>
            
            <motion.div 
              className="mt-8 flex flex-col sm:flex-row justify-center md:justify-start gap-4"
              variants={itemVariants}
            >
              <Link href="/auth">
                <Button className="glow-border px-6 py-3 bg-primary hover:bg-primary-light text-white font-medium rounded-lg transition-colors text-center flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Start For Free
                </Button>
              </Link>
              <Button 
                variant="outline"
                className="px-6 py-3 bg-dark-card border border-primary/30 hover:border-primary/60 text-white font-medium rounded-lg transition-colors"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Watch Demo
              </Button>
            </motion.div>
            
            <motion.div 
              className="mt-12 flex flex-wrap justify-center md:justify-start gap-2"
              variants={itemVariants}
            >
              {featurePills.map((pill, index) => (
                <motion.span 
                  key={index}
                  className={`text-xs font-medium px-3 py-1 rounded-full ${pill.bgColor} ${pill.textColor}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + (index * 0.1), duration: 0.3 }}
                >
                  {pill.name}
                </motion.span>
              ))}
            </motion.div>
          </div>
          
          <motion.div 
            className="relative"
            variants={itemVariants}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-primary/30 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-60 h-60 bg-accent-purple/20 rounded-full filter blur-3xl"></div>
            
            <div className="relative z-10 bg-dark-card border border-dark-base p-4 rounded-xl shadow-glow">
              <div className="relative aspect-video w-full bg-gradient-to-br from-dark-base to-dark-card rounded-lg flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20 mix-blend-overlay">
                  <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />
                  </svg>
                </div>
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-cosmic p-1 mx-auto"
                  >
                    <div className="w-full h-full rounded-full bg-dark-base flex items-center justify-center">
                      <span className="text-white text-3xl md:text-4xl font-display font-bold">E</span>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="mt-4 text-white font-display font-bold text-xl md:text-2xl"
                  >
                    Echoverse Platform
                  </motion.div>
                </div>
              </div>
              
              <motion.div 
                className="absolute -top-6 -left-6 bg-dark-base p-3 rounded-lg border border-primary/30 shadow-glow-pink animate-float" 
                style={{ animationDelay: "0.2s" }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent-pink/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent-pink" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-white">Multi-Tenant</span>
                </div>
              </motion.div>
              
              <motion.div 
                className="absolute top-1/2 -right-6 transform -translate-y-1/2 bg-dark-base p-3 rounded-lg border border-primary/30 shadow-glow-cyan animate-float" 
                style={{ animationDelay: "0.4s" }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4, duration: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent-cyan/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent-cyan" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-white">AI-Powered</span>
                </div>
              </motion.div>
              
              <motion.div 
                className="absolute -bottom-6 right-10 bg-dark-base p-3 rounded-lg border border-primary/30 shadow-glow animate-float" 
                style={{ animationDelay: "0.6s" }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6, duration: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent-purple" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-white">Modular Design</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        <div className="mt-16">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="bg-dark-card/50 backdrop-blur-sm p-6 rounded-xl border border-primary/10 text-center"
                variants={itemVariants}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              >
                <div className="flex justify-center">{stat.icon}</div>
                <div className="text-2xl font-bold text-white mt-2">{stat.count}</div>
                <div className="text-light-base/70 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            className="relative bg-dark-card/30 backdrop-blur-sm rounded-xl p-8 border border-primary/10"
            variants={itemVariants}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <p className="text-xl text-light-base/90 italic mb-6">
                  "{testimonials[activeTestimonial].quote}"
                </p>
                <p className="font-medium text-white">{testimonials[activeTestimonial].author}</p>
                <p className="text-light-base/70">{testimonials[activeTestimonial].role}</p>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === activeTestimonial ? "bg-primary w-6" : "bg-primary/30"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
