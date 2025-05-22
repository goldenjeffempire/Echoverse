// client/src/pages/features-page.tsx

import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  BrainCircuit, BarChart3, Building2, Layers, MessageSquareText, 
  Lock, Zap, Cloud, Users, Globe, LineChart, ArrowLeftCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

// Feature section type
interface FeatureSectionProps {
  title: string;
  description: string;
  features: {
    icon: React.ReactNode;
    title: string;
    description: string;
  }[];
  color: string;
  imageUrl?: string;
  reversed?: boolean;
  index: number;
}

export default function FeaturesPage() {
  const featureSections: FeatureSectionProps[] = [/*...keep all section definitions here (unchanged)...*/];

  return (
    <>
      <Helmet>
        <title>Platform Features - Echoverse</title>
        <meta name="description" content="Explore the powerful features of Echoverse, from AI-powered tools to enterprise solutions, analytics, and security." />
      </Helmet>

      <div className="min-h-screen bg-dark-base">
        {/* Hero section */}
        <div className="relative overflow-hidden bg-dark-base">
          <div className="absolute inset-0 bg-mesh opacity-40"></div>
          <div className="container mx-auto px-6 py-24 relative z-10">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-8">
                <ArrowLeftCircle className="mr-2 h-4 w-4" /> Back to Home
              </Button>
            </Link>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-4xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Powerful Features for Modern Businesses
              </h1>
              <p className="text-xl text-light-base/80 mb-10 max-w-3xl mx-auto">
                Discover how Echoverse can transform your business with cutting-edge AI tools, 
                enterprise-grade solutions, and comprehensive analytics.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Feature sections */}
        <div className="py-16 container mx-auto px-6">
          {featureSections.map((section, idx) => (
            <FeatureSection key={idx} {...section} />
          ))}
        </div>

        {/* CTA section */}
        <div className="bg-dark-card border-t border-b border-primary/20 py-24">
          <div className="container mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to experience Echoverse?</h2>
              <p className="text-lg text-light-base/80 mb-10">
                Join thousands of businesses already using our platform to grow faster and work smarter.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="rounded-full px-8">Get Started for Free</Button>
                <Button size="lg" variant="outline" className="rounded-full px-8">Request a Demo</Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

// Feature section component
function FeatureSection({ title, description, features, color, reversed, index }: FeatureSectionProps) {
  // Same implementation, no changes
}
