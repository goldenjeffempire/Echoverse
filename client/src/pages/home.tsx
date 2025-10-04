import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight, Sparkles, Zap, Globe, ShoppingCart, MessageSquare, TrendingUp, Puzzle, Shield, Smartphone, Check, Star, Users, Rocket, BarChart, Code } from "lucide-react";
import { useLocation } from "wouter";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
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
    color: "bg-blue-500"
  },
  {
    icon: ShoppingCart,
    title: "E-Commerce Suite", 
    description: "Complete business solution with inventory, orders, CRM, and integrated payments via Stripe.",
    color: "bg-green-500"
  },
  {
    icon: MessageSquare,
    title: "Social & Community",
    description: "Built-in messaging, chatbots, moderation tools, and community spaces for engagement.",
    color: "bg-purple-500"
  },
  {
    icon: TrendingUp,
    title: "Marketing Automation",
    description: "Smart funnels, A/B testing, lead capture, and affiliate programs to grow your business.",
    color: "bg-orange-500"
  },
  {
    icon: Puzzle,
    title: "Plugin Marketplace",
    description: "Extend functionality with one-click plugins. Developer portal with revenue sharing.",
    color: "bg-pink-500"
  },
  {
    icon: Shield,
    title: "Security & Compliance",
    description: "Enterprise-grade security with GDPR compliance, 2FA, audit logs, and encryption.",
    color: "bg-red-500"
  }
];

const stats = [
  { number: "10K+", label: "Websites Created" },
  { number: "$2M+", label: "Revenue Generated" },
  { number: "50+", label: "AI Models" },
  { number: "99.9%", label: "Uptime" }
];

const howItWorks = [
  {
    step: "1",
    icon: Rocket,
    title: "Describe Your Vision",
    description: "Tell our AI what you want to build using natural language. No coding required.",
    color: "bg-blue-500"
  },
  {
    step: "2",
    icon: Code,
    title: "AI Generates & Customizes",
    description: "Watch as our AI creates your website, store, or community in seconds. Customize every detail.",
    color: "bg-purple-500"
  },
  {
    step: "3",
    icon: BarChart,
    title: "Launch & Scale",
    description: "Publish instantly to web, iOS, and Android. Grow with built-in analytics and marketing tools.",
    color: "bg-green-500"
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
    popular: false
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
    popular: true
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
    popular: false
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

export default function HomePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EchoVerse
              </span>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <Button variant="ghost" onClick={() => setLocation('/dashboard')}>Dashboard</Button>
              <Button onClick={() => setLocation('/ai-builder')}>Get Started</Button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300">
              <Zap className="w-3 h-3 mr-1" />
              Powered by Advanced AI
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
              Build, Sell, & Scale
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                With AI Power
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              The complete platform for creators and entrepreneurs. Build stunning websites, manage e-commerce, 
              create content, and grow communities—all powered by cutting-edge AI technology.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
                onClick={() => setLocation('/ai-builder')}
              >
                Start Building Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="px-8 py-4 text-lg"
                onClick={() => setLocation('/dashboard')}
              >
                Explore Dashboard
              </Button>
            </div>
          </motion.div>

          {/* Floating Animation Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-20 left-10 w-20 h-20 bg-blue-200 dark:bg-blue-800 rounded-full opacity-20"
            />
            <motion.div
              animate={{
                y: [0, 15, 0],
                rotate: [0, -3, 0]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute top-40 right-20 w-16 h-16 bg-purple-200 dark:bg-purple-800 rounded-full opacity-20"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-16 px-4 sm:px-6 lg:px-8 border-y bg-white/50 dark:bg-slate-900/50"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div 
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {stats.map((stat, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              From AI-powered website creation to advanced e-commerce tools, 
              we have built the complete ecosystem for digital success.
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
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
              How It Works
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              From idea to launch in three simple steps
            </p>
          </motion.div>

          <motion.div 
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {howItWorks.map((step, index) => (
              <motion.div key={index} variants={fadeInUp} className="relative">
                <Card className="h-full border-0 bg-white dark:bg-slate-800">
                  <CardContent className="p-6 text-center">
                    <div className="relative inline-block mb-6">
                      <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center`}>
                        <step.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                        {step.step}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-blue-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
              Built for Every Business Type
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Whatever you're building, EchoVerse has the tools you need
            </p>
          </motion.div>

          <motion.div 
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6"
          >
            {useCases.map((useCase, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className={`h-full border-0 bg-gradient-to-br ${useCase.color} p-6 text-white hover:scale-105 transition-transform duration-300`}>
                  <CardContent className="p-0">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <useCase.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-semibold mb-2">
                          {useCase.title}
                        </h3>
                        <p className="opacity-90">
                          {useCase.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
              Loved by Creators Worldwide
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              See what our users are saying
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
                <Card className="h-full border-0 bg-white dark:bg-slate-800">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mb-6 italic">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                          {testimonial.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
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
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Choose the perfect plan for your needs
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
                <Card className={`h-full ${plan.popular ? 'border-2 border-blue-500 shadow-xl scale-105' : 'border-0'} bg-white dark:bg-slate-800 relative`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white px-4 py-1">Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      {plan.description}
                    </p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-slate-900 dark:text-white">
                        {plan.price}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {plan.period}
                      </span>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => setLocation('/ai-builder')}
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600"
      >
        <div className="max-w-4xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Ideas?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of creators building the future with EchoVerse. 
              Start your journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-slate-100 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/ai-builder')}
              >
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
                onClick={() => setLocation('/ecommerce')}
              >
                Explore E-Commerce
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">EchoVerse</span>
            </div>
            <div className="flex items-center space-x-4">
              <Smartphone className="w-5 h-5" />
              <span className="text-sm opacity-75">Mobile & PWA Ready</span>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-400">
            <p>&copy; 2025 EchoVerse. All rights reserved. Built with ❤️ and AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}