import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight, Sparkles, Zap, Globe, ShoppingCart, MessageSquare, TrendingUp, Puzzle, Shield, Smartphone, Check, Star, Users, Rocket, BarChart, Code, Layers, Cpu, Wand2, Database, Cloud, Lock, Palette, BookOpen, Award, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const fadeInLeft = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.7 }
};

const fadeInRight = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.7 }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const features = [
  {
    icon: Globe,
    title: "AI Website Builder",
    description: "Transform ideas into stunning websites with natural language. Drag-and-drop editor with responsive templates.",
    color: "bg-gradient-to-br from-blue-500 to-cyan-600",
    gradient: "from-blue-500/10 to-cyan-600/10"
  },
  {
    icon: ShoppingCart,
    title: "E-Commerce Suite", 
    description: "Complete business solution with inventory, orders, CRM, and integrated payments via Stripe.",
    color: "bg-gradient-to-br from-green-500 to-emerald-600",
    gradient: "from-green-500/10 to-emerald-600/10"
  },
  {
    icon: MessageSquare,
    title: "Social & Community",
    description: "Built-in messaging, chatbots, moderation tools, and community spaces for engagement.",
    color: "bg-gradient-to-br from-purple-500 to-pink-600",
    gradient: "from-purple-500/10 to-pink-600/10"
  },
  {
    icon: TrendingUp,
    title: "Marketing Automation",
    description: "Smart funnels, A/B testing, lead capture, and affiliate programs to grow your business.",
    color: "bg-gradient-to-br from-orange-500 to-red-600",
    gradient: "from-orange-500/10 to-red-600/10"
  },
  {
    icon: Puzzle,
    title: "Plugin Marketplace",
    description: "Extend functionality with one-click plugins. Developer portal with revenue sharing.",
    color: "bg-gradient-to-br from-pink-500 to-rose-600",
    gradient: "from-pink-500/10 to-rose-600/10"
  },
  {
    icon: Shield,
    title: "Security & Compliance",
    description: "Enterprise-grade security with GDPR compliance, 2FA, audit logs, and encryption.",
    color: "bg-gradient-to-br from-red-500 to-orange-600",
    gradient: "from-red-500/10 to-orange-600/10"
  }
];

const stats = [
  { number: "10K+", label: "Websites Created", icon: Globe },
  { number: "$2M+", label: "Revenue Generated", icon: TrendingUp },
  { number: "50+", label: "AI Models", icon: Cpu },
  { number: "99.9%", label: "Uptime", icon: Shield }
];

const howItWorks = [
  {
    step: "1",
    icon: Rocket,
    title: "Describe Your Vision",
    description: "Tell our AI what you want to build using natural language. No coding required.",
    color: "bg-gradient-to-br from-blue-500 to-cyan-600"
  },
  {
    step: "2",
    icon: Wand2,
    title: "AI Generates & Customizes",
    description: "Watch as our AI creates your website, store, or community in seconds. Customize every detail.",
    color: "bg-gradient-to-br from-purple-500 to-pink-600"
  },
  {
    step: "3",
    icon: BarChart,
    title: "Launch & Scale",
    description: "Publish instantly to web, iOS, and Android. Grow with built-in analytics and marketing tools.",
    color: "bg-gradient-to-br from-green-500 to-emerald-600"
  }
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "E-commerce Entrepreneur",
    content: "EchoVerse transformed my online store. The AI builder created a stunning site in minutes, and sales increased 300% in the first month!",
    avatar: "SC",
    rating: 5
  },
  {
    name: "Marcus Rodriguez",
    role: "Content Creator",
    content: "The community features are incredible. I built a thriving membership site with 5,000+ members using just the AI tools.",
    avatar: "MR",
    rating: 5
  },
  {
    name: "Emily Watson",
    role: "Digital Marketer",
    content: "Marketing automation that actually works! The A/B testing and funnel builder doubled my conversion rates.",
    avatar: "EW",
    rating: 5
  }
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "Perfect for individuals and small projects",
    features: [
      "5 AI-generated websites",
      "Basic e-commerce (100 products)",
      "Community features",
      "Email support",
      "50GB storage"
    ],
    popular: false,
    gradient: "from-slate-500 to-slate-700"
  },
  {
    name: "Professional",
    price: "$99",
    period: "/month",
    description: "For growing businesses and creators",
    features: [
      "Unlimited AI websites",
      "Advanced e-commerce (unlimited)",
      "Full marketing automation",
      "Priority support",
      "500GB storage",
      "Custom domain",
      "API access"
    ],
    popular: true,
    gradient: "from-blue-500 to-purple-600"
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations",
    features: [
      "Everything in Professional",
      "Dedicated account manager",
      "Custom integrations",
      "White-label options",
      "Unlimited storage",
      "SLA guarantee",
      "Advanced security"
    ],
    popular: false,
    gradient: "from-purple-500 to-pink-600"
  }
];

const useCases = [
  {
    icon: ShoppingCart,
    title: "E-Commerce Stores",
    description: "Build and scale online stores with AI-powered inventory management and checkout.",
    color: "from-green-500 to-emerald-600"
  },
  {
    icon: Users,
    title: "Membership Sites",
    description: "Create thriving communities with forums, chatbots, and member management.",
    color: "from-purple-500 to-pink-600"
  },
  {
    icon: Globe,
    title: "Business Websites",
    description: "Professional websites that convert visitors into customers with AI optimization.",
    color: "from-blue-500 to-cyan-600"
  },
  {
    icon: MessageSquare,
    title: "Content Platforms",
    description: "Launch blogs and content hubs with AI writing assistance and SEO tools.",
    color: "from-orange-500 to-red-600"
  }
];

const aiFeatures = [
  {
    icon: Wand2,
    title: "Natural Language Builder",
    description: "Just describe what you want - our AI brings it to life"
  },
  {
    icon: Layers,
    title: "Smart Components",
    description: "Pre-built, AI-optimized components that adapt to your needs"
  },
  {
    icon: Palette,
    title: "Auto Design System",
    description: "AI generates cohesive color schemes and typography"
  },
  {
    icon: Code,
    title: "Code Generation",
    description: "Clean, production-ready code generated automatically"
  }
];

const integrations = [
  { name: "Stripe", logo: "💳" },
  { name: "OpenAI", logo: "🤖" },
  { name: "Mailchimp", logo: "📧" },
  { name: "Google Analytics", logo: "📊" },
  { name: "Slack", logo: "💬" },
  { name: "Zapier", logo: "⚡" },
  { name: "AWS", logo: "☁️" },
  { name: "GitHub", logo: "🔧" }
];

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const { scrollYProgress } = useScroll();
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  const handleGetStarted = () => {
    if (user) {
      setLocation('/ai-builder');
    } else {
      setLocation('/register');
    }
  };

  const handleDashboard = () => {
    if (user) {
      setLocation('/dashboard');
    } else {
      setLocation('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          style={{ y: backgroundY }}
          className="absolute inset-0"
        >
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-200 dark:bg-blue-800 rounded-full opacity-10 blur-3xl" />
          <div className="absolute top-60 right-20 w-96 h-96 bg-purple-200 dark:bg-purple-800 rounded-full opacity-10 blur-3xl" />
          <div className="absolute bottom-40 left-1/3 w-96 h-96 bg-pink-200 dark:bg-pink-800 rounded-full opacity-10 blur-3xl" />
        </motion.div>
      </div>

      {/* Professional Navbar */}
      <Navbar />

      {/* Hero Section - Visually Enhanced with Background Image */}
      <section className="relative pt-32 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Hero Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/90 to-purple-900/95 dark:from-slate-950/95 dark:via-blue-950/90 dark:to-purple-950/95 z-10" />
          <motion.img 
            src="/attached_assets/stock_images/futuristic_ai_techno_78868d22.jpg"
            alt="AI Technology Workspace"
            className="w-full h-full object-cover opacity-40"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Badge className="mb-6 bg-gradient-to-r from-blue-400/30 to-purple-400/30 backdrop-blur-sm text-blue-100 border border-blue-400/50 px-6 py-2 text-sm font-medium shadow-lg">
                  <Zap className="w-4 h-4 mr-2" />
                  Powered by Advanced AI Technology
                </Badge>
              </motion.div>
              
              <motion.h1 
                className="text-6xl md:text-8xl font-black mb-8 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
              >
                <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                  Build, Sell, & Scale
                </span>
                <br />
                <motion.span 
                  className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent inline-block"
                  animate={{ 
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{ 
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear" 
                  }}
                  style={{ backgroundSize: '200% auto' }}
                >
                  With AI Power
                </motion.span>
              </motion.h1>
              
              <motion.p 
                className="text-xl md:text-2xl text-slate-200 dark:text-slate-200 mb-10 max-w-4xl mx-auto leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.7 }}
              >
                The complete platform for creators and entrepreneurs. Build stunning websites, manage e-commerce, 
                create content, and grow communities—all powered by cutting-edge AI technology.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-10 py-6 text-lg font-semibold shadow-2xl hover:shadow-blue-500/50 transition-all"
                    onClick={handleGetStarted}
                  >
                    Start Building Free
                    <ArrowRight className="ml-2 w-6 h-6" />
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="px-10 py-6 text-lg font-semibold border-2 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all"
                    onClick={handleDashboard}
                  >
                    Explore Dashboard
                  </Button>
                </motion.div>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="flex flex-wrap justify-center gap-8 text-sm text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Cancel anytime</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Floating Animation Elements - Enhanced */}
            <motion.div
              className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-20 blur-2xl"
              animate={{
                y: [0, -30, 0],
                scale: [1, 1.2, 1],
                rotate: [0, 10, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full opacity-20 blur-2xl"
              animate={{
                y: [0, 20, 0],
                scale: [1, 1.1, 1],
                rotate: [0, -5, 0]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
            <motion.div
              className="absolute bottom-20 left-1/4 w-28 h-28 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full opacity-15 blur-2xl"
              animate={{
                y: [0, -20, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
            />
          </div>
        </div>
      </section>

      {/* Visual Showcase Section - NEW */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered Creation
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
                Transform Ideas Into Reality in Seconds
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Watch as our advanced AI understands your vision and creates stunning, production-ready websites complete with content, design, and functionality—all without writing a single line of code.
              </p>
              <div className="space-y-4">
                {['Natural language input', 'Instant generation', 'Fully customizable', 'Production-ready code'].map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + (idx * 0.1) }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-3xl blur-3xl" />
              <motion.img
                src="/attached_assets/stock_images/modern_website_build_48e9aeb4.jpg"
                alt="Website Builder Interface"
                className="relative rounded-2xl shadow-2xl w-full h-auto"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Stats Section - Enhanced */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-y border-slate-200 dark:border-slate-800 relative z-10"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div 
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center"
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                variants={scaleIn}
                whileHover={{ scale: 1.1, y: -5 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                  <stat.icon className="w-8 h-8 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
                  <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 font-medium">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Marketing Analytics Visual Showcase - NEW */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="mb-4 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                <BarChart className="w-3 h-3 mr-1" />
                Marketing & Analytics
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-slate-900 to-orange-900 dark:from-white dark:to-orange-100 bg-clip-text text-transparent">
                Data-Driven Growth
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Make smarter decisions with powerful analytics and marketing tools. Track every metric, optimize conversions, and scale your business with data-backed insights.
              </p>
              <div className="space-y-4">
                {[
                  { icon: TrendingUp, text: 'Real-time analytics dashboard' },
                  { icon: Users, text: 'Customer behavior tracking' },
                  { icon: BarChart, text: 'A/B testing & optimization' },
                  { icon: Rocket, text: 'Marketing automation' }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + (idx * 0.1) }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-3xl blur-3xl" />
              <motion.img
                src="/attached_assets/stock_images/digital_marketing_da_468a0a44.jpg"
                alt="Marketing Analytics Dashboard"
                className="relative rounded-2xl shadow-2xl w-full h-auto"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* AI Features Showcase - ENHANCED WITH VISUALS */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
              <Cpu className="w-3 h-3 mr-1" />
              AI-Powered Platform
            </Badge>
            <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-slate-900 to-purple-900 dark:from-white dark:to-purple-100 bg-clip-text text-transparent">
              See What Our AI Can Do
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Advanced artificial intelligence that transforms your ideas into reality—no coding required
            </p>
          </motion.div>

          {/* AI Feature Grid with Visuals */}
          <motion.div 
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          >
            {aiFeatures.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="h-full"
                >
                  <Card className="h-full border-0 bg-white dark:bg-slate-800 shadow-xl hover:shadow-2xl transition-all overflow-hidden group">
                    <CardContent className="p-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                        <feature.icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300 text-sm">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* AI Visual Demonstration */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8 mb-16"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl blur-2xl group-hover:blur-3xl transition-all" />
              <Card className="relative border-0 overflow-hidden shadow-2xl">
                <CardContent className="p-0">
                  <img
                    src="/attached_assets/stock_images/ai_artificial_intell_10494fca.jpg"
                    alt="AI Chatbot Assistant"
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-6 bg-white dark:bg-slate-800">
                    <h3 className="text-2xl font-black mb-3 text-slate-900 dark:text-white">
                      AI Chatbot Assistant
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                      Intelligent conversational AI that understands context, answers questions, and assists your customers 24/7 in multiple languages.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['Natural Language', 'Multi-lingual', '24/7 Support'].map((tag) => (
                        <Badge key={tag} className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-2xl blur-2xl group-hover:blur-3xl transition-all" />
              <Card className="relative border-0 overflow-hidden shadow-2xl">
                <CardContent className="p-0">
                  <img
                    src="/attached_assets/stock_images/website_design_creat_04708a16.jpg"
                    alt="AI Content Generation"
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-6 bg-white dark:bg-slate-800">
                    <h3 className="text-2xl font-black mb-3 text-slate-900 dark:text-white">
                      AI Content Generation
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                      Generate blog posts, product descriptions, marketing copy, and social media content with advanced AI that matches your brand voice.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['SEO Optimized', 'Brand Voice', 'Instant'].map((tag) => (
                        <Badge key={tag} className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* AI Capabilities List */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl"
          >
            <h3 className="text-3xl font-black mb-8 text-center text-slate-900 dark:text-white">
              Complete AI-Powered Toolkit
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: 'Website Generation', desc: 'Create entire websites from text descriptions', icon: Globe },
                { title: 'Smart SEO', desc: 'Automatic optimization for search engines', icon: TrendingUp },
                { title: 'Design System', desc: 'AI-generated color schemes & layouts', icon: Palette },
                { title: 'Content Writing', desc: 'Blog posts, articles, and copy', icon: BookOpen },
                { title: 'Image Suggestions', desc: 'AI recommends perfect visuals', icon: Sparkles },
                { title: 'Code Generation', desc: 'Production-ready code automatically', icon: Code }
              ].map((capability, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <capability.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">{capability.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{capability.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              From AI-powered website creation to advanced e-commerce tools, 
              we've built the complete ecosystem for digital success.
            </p>
          </motion.div>

          <motion.div 
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                variants={fadeInUp}
                onHoverStart={() => setHoveredFeature(index)}
                onHoverEnd={() => setHoveredFeature(null)}
              >
                <motion.div
                  whileHover={{ y: -10, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className={`h-full border-0 shadow-xl hover:shadow-2xl transition-all overflow-hidden group ${
                    hoveredFeature === index ? 'bg-gradient-to-br ' + feature.gradient : 'bg-white dark:bg-slate-800'
                  }`}>
                    <CardContent className="p-8 relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-bl-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                      <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all relative z-10`}>
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white relative z-10">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed relative z-10">
                        {feature.description}
                      </p>
                      <motion.div 
                        className="mt-4 flex items-center text-blue-600 dark:text-blue-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity relative z-10"
                        initial={{ x: -10 }}
                        animate={{ x: hoveredFeature === index ? 0 : -10 }}
                      >
                        Learn more <ChevronRight className="w-4 h-4 ml-1" />
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section - Enhanced */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              <Rocket className="w-3 h-3 mr-1" />
              Simple Process
            </Badge>
            <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-slate-900 to-green-900 dark:from-white dark:to-green-100 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              From idea to launch in three simple steps—no coding required
            </p>
          </motion.div>

          <motion.div 
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-12 relative"
          >
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 opacity-20" />
            
            {howItWorks.map((step, index) => (
              <motion.div key={index} variants={fadeInUp} className="relative">
                <motion.div
                  whileHover={{ scale: 1.05, y: -10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="h-full border-0 bg-white dark:bg-slate-800 shadow-xl hover:shadow-2xl transition-all">
                    <CardContent className="p-8 text-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-600/5 opacity-0 hover:opacity-100 transition-opacity" />
                      <div className="relative z-10">
                        <div className="relative inline-block mb-6">
                          <motion.div 
                            className={`w-20 h-20 ${step.color} rounded-2xl flex items-center justify-center shadow-xl`}
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.6 }}
                          >
                            <step.icon className="w-10 h-10 text-white" />
                          </motion.div>
                          <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-black text-lg shadow-lg">
                            {step.step}
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
                          {step.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* E-Commerce Visual Showcase - NEW */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 md:order-1 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-3xl blur-3xl" />
              <motion.img
                src="/attached_assets/stock_images/successful_online_bu_c08662cf.jpg"
                alt="E-Commerce Success"
                className="relative rounded-2xl shadow-2xl w-full h-auto"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="order-1 md:order-2"
            >
              <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                <ShoppingCart className="w-3 h-3 mr-1" />
                E-Commerce Platform
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-slate-900 to-green-900 dark:from-white dark:to-green-100 bg-clip-text text-transparent">
                Sell Online with Confidence
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Launch your online store in minutes with our complete e-commerce suite. Manage inventory, process payments, track orders, and grow your business—all from one powerful platform.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Products', value: 'Unlimited' },
                  { label: 'Payment Methods', value: 'Multiple' },
                  { label: 'Order Tracking', value: 'Real-time' },
                  { label: 'Analytics', value: 'Advanced' }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + (idx * 0.1) }}
                    className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-green-200 dark:border-green-800"
                  >
                    <div className="text-2xl font-black text-green-600 dark:text-green-400">{item.value}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{item.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Team Collaboration Visual Showcase - NEW */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                <Users className="w-3 h-3 mr-1" />
                Team Collaboration
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-slate-900 to-purple-900 dark:from-white dark:to-purple-100 bg-clip-text text-transparent">
                Build Together, Grow Together
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Empower your team with collaborative tools designed for modern creators. From real-time editing to project management, work seamlessly together from anywhere in the world.
              </p>
              <div className="space-y-3">
                {[
                  'Real-time collaboration',
                  'Team workspaces & permissions',
                  'Built-in communication tools',
                  'Progress tracking & analytics'
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + (idx * 0.1) }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-3xl blur-3xl" />
              <motion.img
                src="/attached_assets/stock_images/happy_diverse_team_c_cc06b103.jpg"
                alt="Team Collaboration"
                className="relative rounded-2xl shadow-2xl w-full h-auto"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Use Cases Section - Enhanced */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-slate-900 to-purple-900 dark:from-white dark:to-purple-100 bg-clip-text text-transparent">
              Built for Every Business Type
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Whatever you're building, EchoVerse has the tools you need to succeed
            </p>
          </motion.div>

          <motion.div 
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8"
          >
            {useCases.map((useCase, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <motion.div
                  whileHover={{ scale: 1.03, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className={`h-full border-0 bg-gradient-to-br ${useCase.color} p-8 text-white shadow-2xl hover:shadow-3xl transition-all relative overflow-hidden group`}>
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-0 relative z-10">
                      <div className="flex items-start gap-6">
                        <motion.div 
                          className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-xl"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <useCase.icon className="w-8 h-8" />
                        </motion.div>
                        <div className="flex-1">
                          <h3 className="text-3xl font-black mb-3">
                            {useCase.title}
                          </h3>
                          <p className="opacity-95 text-lg leading-relaxed">
                            {useCase.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Integrations Section - New */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-slate-900 dark:text-white">
              Integrates With Your Favorite Tools
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Connect seamlessly with the tools you already use
            </p>
          </motion.div>

          <motion.div 
            className="flex flex-wrap justify-center gap-6"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {integrations.map((integration, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ scale: 1.1, y: -5 }}
                className="w-32 h-32 bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl flex flex-col items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-all"
              >
                <span className="text-4xl">{integration.logo}</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{integration.name}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section - Enhanced */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <Badge className="mb-4 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
              <Star className="w-3 h-3 mr-1" />
              Customer Love
            </Badge>
            <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-slate-900 to-yellow-900 dark:from-white dark:to-yellow-100 bg-clip-text text-transparent">
              Loved by Creators Worldwide
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Join thousands of successful entrepreneurs and creators
            </p>
          </motion.div>

          <motion.div 
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <motion.div
                  whileHover={{ y: -10, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="h-full border-0 bg-white dark:bg-slate-800 shadow-xl hover:shadow-2xl transition-all">
                    <CardContent className="p-8">
                      <div className="flex gap-1 mb-6">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.1 * i }}
                          >
                            <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                          </motion.div>
                        ))}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 mb-8 text-lg leading-relaxed italic">
                        "{testimonial.content}"
                      </p>
                      <div className="flex items-center gap-4">
                        <Avatar className="w-14 h-14 border-2 border-blue-500">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                            {testimonial.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-lg">
                            {testimonial.name}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {testimonial.role}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section - Enhanced */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              <Award className="w-3 h-3 mr-1" />
              Pricing
            </Badge>
            <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Choose the perfect plan for your needs—scale as you grow
            </p>
          </motion.div>

          <motion.div 
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {pricingPlans.map((plan, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <motion.div
                  whileHover={{ scale: plan.popular ? 1.05 : 1.02, y: -10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className={`h-full ${plan.popular ? 'border-4 border-blue-500 shadow-2xl scale-105 relative' : 'border-0 shadow-xl'} bg-white dark:bg-slate-800 transition-all`}>
                    {plan.popular && (
                      <motion.div 
                        className="absolute -top-5 left-1/2 transform -translate-x-1/2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Badge className={`bg-gradient-to-r ${plan.gradient} text-white px-6 py-2 text-sm font-bold shadow-xl`}>
                          ⭐ Most Popular
                        </Badge>
                      </motion.div>
                    )}
                    <CardContent className="p-8">
                      <div className="text-center mb-8">
                        <h3 className="text-3xl font-black mb-3 text-slate-900 dark:text-white">
                          {plan.name}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                          {plan.description}
                        </p>
                        <div className="mb-6">
                          <span className={`text-6xl font-black bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                            {plan.price}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400 text-xl">
                            {plan.period}
                          </span>
                        </div>
                        <Button 
                          className={`w-full py-6 text-lg font-semibold ${
                            plan.popular 
                              ? `bg-gradient-to-r ${plan.gradient} text-white shadow-xl hover:shadow-2xl` 
                              : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          }`}
                          onClick={handleGetStarted}
                        >
                          Get Started
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {plan.features.map((feature, i) => (
                          <motion.div 
                            key={i} 
                            className="flex items-start gap-3"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <Check className={`w-6 h-6 ${plan.popular ? 'text-blue-500' : 'text-green-500'} flex-shrink-0 mt-0.5`} />
                            <span className="text-slate-600 dark:text-slate-300">{feature}</span>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <motion.section 
        className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20px 20px, white 2px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2 
              className="text-5xl md:text-7xl font-black mb-8 text-white"
              animate={{ 
                textShadow: [
                  '0 0 20px rgba(255,255,255,0.5)',
                  '0 0 40px rgba(255,255,255,0.8)',
                  '0 0 20px rgba(255,255,255,0.5)',
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Ready to Build Something Amazing?
            </motion.h2>
            <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed">
              Join thousands of creators and entrepreneurs who are already building their dreams with EchoVerse.
              Start your free trial today—no credit card required.
            </p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              variants={stagger}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <motion.div variants={scaleIn} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-blue-50 px-12 py-7 text-xl font-bold shadow-2xl"
                  onClick={handleGetStarted}
                >
                  Start Building Free
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
              </motion.div>
              <motion.div variants={scaleIn} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-12 py-7 text-xl font-bold"
                  onClick={() => setLocation('/dashboard')}
                >
                  View Demo
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer - Enhanced */}
      <footer className="bg-slate-900 dark:bg-black text-slate-300 py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">EchoVerse</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                The complete AI-powered platform for building, selling, and scaling your digital presence.
              </p>
              <div className="flex gap-4">
                <motion.button whileHover={{ scale: 1.2 }} className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <span className="text-xl">𝕏</span>
                </motion.button>
                <motion.button whileHover={{ scale: 1.2 }} className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <span className="text-xl">in</span>
                </motion.button>
                <motion.button whileHover={{ scale: 1.2 }} className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <span className="text-xl">IG</span>
                </motion.button>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4 text-lg">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</a></li>
                <li><a href="/marketplace" className="hover:text-blue-400 transition-colors">Integrations</a></li>
                <li><a href="/ai-builder" className="hover:text-blue-400 transition-colors">AI Builder</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4 text-lg">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/about" className="hover:text-blue-400 transition-colors">About Us</a></li>
                <li><a href="/blog" className="hover:text-blue-400 transition-colors">Blog</a></li>
                <li><a href="/careers" className="hover:text-blue-400 transition-colors">Careers</a></li>
                <li><a href="/contact" className="hover:text-blue-400 transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4 text-lg">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/documentation" className="hover:text-blue-400 transition-colors">Documentation</a></li>
                <li><a href="/api-reference" className="hover:text-blue-400 transition-colors">API Reference</a></li>
                <li><a href="/community" className="hover:text-blue-400 transition-colors">Community</a></li>
                <li><a href="/support" className="hover:text-blue-400 transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-400">
                &copy; 2025 EchoVerse. All rights reserved. Built with ❤️ and AI.
              </p>
              <div className="flex gap-6 text-sm">
                <a href="/privacy" className="hover:text-blue-400 transition-colors">Privacy</a>
                <a href="/terms" className="hover:text-blue-400 transition-colors">Terms</a>
                <a href="/cookie-policy" className="hover:text-blue-400 transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
