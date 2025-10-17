import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Zap, Globe, Heart, Target, Award, Rocket } from "lucide-react";
import { useLocation } from "wouter";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const values = [
  {
    icon: Shield,
    title: "Trust & Security",
    description: "We prioritize your data security and privacy with enterprise-grade encryption and compliance."
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "Leveraging cutting-edge AI technology to simplify complex web development tasks."
  },
  {
    icon: Users,
    title: "Community First",
    description: "Building tools that empower creators, entrepreneurs, and businesses worldwide."
  },
  {
    icon: Globe,
    title: "Accessibility",
    description: "Making professional web development accessible to everyone, regardless of technical skill."
  }
];

const team = [
  {
    name: "Alex Johnson",
    role: "CEO & Founder",
    bio: "Former Google engineer with 15+ years in AI and web technologies.",
    avatar: "AJ"
  },
  {
    name: "Maria Garcia",
    role: "CTO",
    bio: "PhD in Machine Learning, previously led AI teams at Meta.",
    avatar: "MG"
  },
  {
    name: "David Kim",
    role: "Head of Product",
    bio: "Product visionary with successful launches at Shopify and Stripe.",
    avatar: "DK"
  },
  {
    name: "Lisa Chen",
    role: "Head of Design",
    bio: "Award-winning designer specializing in user experience and accessibility.",
    avatar: "LC"
  }
];

export default function AboutPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />
        
        <motion.div 
          className="relative max-w-7xl mx-auto text-center"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            About EchoVerse
          </Badge>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            Building the Future of
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Web Development
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
            We're on a mission to democratize web development with AI-powered tools that anyone can use.
          </p>
        </motion.div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="grid md:grid-cols-2 gap-12 items-center"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-8 h-8 text-blue-600" />
                <h2 className="text-3xl font-bold">Our Mission</h2>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                EchoVerse was born from a simple vision: make professional web development accessible to everyone. 
                We believe that anyone with an idea should have the tools to bring it to life, regardless of their 
                technical background.
              </p>
              <p className="text-lg text-muted-foreground">
                Our AI-powered platform empowers creators, entrepreneurs, and businesses to build stunning websites, 
                e-commerce stores, and community platforms without writing a single line of code.
              </p>
            </div>
            
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center">
                <Rocket className="w-24 h-24 text-blue-600" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground">The principles that guide everything we do</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                      <value.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-lg text-muted-foreground">The minds behind EchoVerse</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{member.avatar}</span>
                </div>
                <h3 className="font-semibold text-lg">{member.name}</h3>
                <p className="text-sm text-blue-600 mb-2">{member.role}</p>
                <p className="text-sm text-muted-foreground">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <motion.div 
          className="max-w-4xl mx-auto text-center text-white"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <Heart className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Join Our Journey</h2>
          <p className="text-xl mb-8 opacity-90">
            Be part of the future of web development. Start building with EchoVerse today.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => setLocation("/register")}
            className="gap-2"
          >
            Get Started Free
            <Rocket className="w-5 h-5" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-black text-slate-300 py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">EchoVerse</h3>
              <p className="text-sm">AI-powered platform for building stunning websites, stores, and communities.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/ai-builder" className="hover:text-blue-400 transition-colors">AI Builder</a></li>
                <li><a href="/marketplace" className="hover:text-blue-400 transition-colors">Marketplace</a></li>
                <li><a href="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/about" className="hover:text-blue-400 transition-colors">About Us</a></li>
                <li><a href="/contact" className="hover:text-blue-400 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
                <li><a href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} EchoVerse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
