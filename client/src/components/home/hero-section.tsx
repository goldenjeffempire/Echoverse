import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, Brain, BarChart2, Zap, Users2, Blocks } from "lucide-react";

export function HeroSection() {
  const [isHovered, setIsHovered] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const testimonials = [
    {
      quote: "Echoverse transformed our business with its AI tools. In just weeks, we saw a 40% increase in efficiency.",
      author: "Sarah Johnson",
      role: "CEO, TechNova",
    },
    {
      quote: "The all-in-one platform helped us replace 5 different tools. Our team is more productive than ever.",
      author: "Michael Chen",
      role: "Marketing Director, GrowthX",
    },
    {
      quote: "We built our entire online presence with Echoverse. From website to e-commerce to marketing - it does it all.",
      author: "Jessica Williams",
      role: "Founder, Artisan Collective",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials]);

  const stats = [
    { count: "15+", label: "AI Modules", icon: <Brain className="h-6 w-6 text-primary mb-2" /> },
    { count: "98%", label: "Customer Satisfaction", icon: <BarChart2 className="h-6 w-6 text-primary mb-2" /> },
    { count: "24/7", label: "AI Support", icon: <Zap className="h-6 w-6 text-primary mb-2" /> },
    { count: "500+", label: "Integrations", icon: <Sparkles className="h-6 w-6 text-primary mb-2" /> },
  ];

  const featurePills = [
    { name: "Students", bgColor: "bg-accent-purple/20", textColor: "text-accent-purple" },
    { name: "Developers", bgColor: "bg-accent-cyan/20", textColor: "text-accent-cyan" },
    { name: "Marketers", bgColor: "bg-secondary/20", textColor: "text-secondary-light" },
    { name: "Educators", bgColor: "bg-accent-pink/20", textColor: "text-accent-pink" },
    { name: "Entrepreneurs", bgColor: "bg-success/20", textColor: "text-success" },
  ];

  return (
    <div className="relative bg-dark-base pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <span>✨</span>
              <span>Introducing Echoverse</span>
              <span>✨</span>
            </div>

            <h1 className="text-5xl font-bold mb-6">
              <span className="block text-white">The Ultimate</span>
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-purple">AI-Native Platform</span>
            </h1>

            <p className="text-xl text-light-base/70 mb-8">
              Build, learn, sell, and grow with our modular AI tools designed for every role, from students to enterprise teams.
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mb-8">
              <Link href="/auth">
                <Button className="w-full sm:w-auto text-lg px-8 py-6 bg-primary hover:bg-primary/90">
                  Start For Free
                </Button>
              </Link>
              <Button variant="outline" className="w-full sm:w-auto text-lg px-8 py-6">
                Watch Demo
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {featurePills.map((pill, index) => (
                <span key={index} className={`px-3 py-1 rounded-full ${pill.bgColor} ${pill.textColor} text-sm`}>
                  {pill.name}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square lg:aspect-video relative bg-dark-card rounded-xl border border-primary/20 p-8">
              <div className="absolute inset-0 bg-mesh opacity-10"></div>
              <div className="relative z-10 flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary to-accent-purple p-1 mx-auto mb-4">
                    <div className="w-full h-full rounded-full bg-dark-base flex items-center justify-center">
                      <span className="text-4xl font-bold">E</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Echoverse Platform</h3>
                </div>
              </div>

              <div className="absolute -top-4 -left-4 bg-dark-base p-3 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm">Multi-Tenant</span>
                </div>
              </div>

              <div className="absolute -bottom-4 right-8 bg-dark-base p-3 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center">
                    <Blocks className="w-4 h-4 text-accent-purple" />
                  </div>
                  <span className="text-sm">Modular Design</span>
                </div>
              </div>

              <div className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-dark-base p-3 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent-cyan/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-accent-cyan" />
                  </div>
                  <span className="text-sm">AI-Powered</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="bg-dark-card/50 backdrop-blur-sm p-6 rounded-xl border border-primary/10 text-center"
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              >
                <div className="flex justify-center">{stat.icon}</div>
                <div className="text-2xl font-bold text-white mt-2">{stat.count}</div>
                <div className="text-light-base/70 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div className="relative bg-dark-card/30 backdrop-blur-sm rounded-xl p-8 border border-primary/10">
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
                  className={`w-3 h-3 rounded-full ${index === activeTestimonial ? 'bg-primary' : 'bg-light-base/40'}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
