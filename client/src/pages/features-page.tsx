import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  BrainCircuit, 
  BarChart3, 
  Building2, 
  Layers, 
  MessageSquareText, 
  Lock, 
  Zap, 
  Cloud, 
  Users, 
  Globe, 
  LineChart, 
  ArrowLeftCircle 
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
  // Define feature sections
  const featureSections: FeatureSectionProps[] = [
    {
      title: "AI-Powered Tools",
      description: "Experience the power of cutting-edge AI integrated throughout the platform to boost productivity and provide valuable insights.",
      color: "from-purple-500 to-indigo-600",
      features: [
        {
          icon: <BrainCircuit />,
          title: "Smart Assistants",
          description: "AI assistants that learn from your business data to help with tasks and decision-making."
        },
        {
          icon: <MessageSquareText />,
          title: "Intelligent Chat",
          description: "Natural conversations with context-aware AI to answer questions and solve problems."
        },
        {
          icon: <LineChart />,
          title: "Predictive Analytics",
          description: "Forecast trends and anticipate customer needs with AI-driven predictions."
        },
      ],
      index: 0
    },
    {
      title: "Enterprise Solutions",
      description: "Scale your business with enterprise-grade features designed for growth and efficiency across your organization.",
      color: "from-blue-500 to-cyan-600",
      features: [
        {
          icon: <Building2 />,
          title: "Multi-tenant Architecture",
          description: "Securely manage multiple organizations with isolated environments and data separation."
        },
        {
          icon: <Users />,
          title: "Team Collaboration",
          description: "Seamless workflows for teams with role-based permissions and shared workspaces."
        },
        {
          icon: <Globe />,
          title: "White Labeling",
          description: "Customize branding and UI to match your company's identity and create a seamless experience."
        },
      ],
      reversed: true,
      index: 1
    },
    {
      title: "Data & Analytics",
      description: "Turn raw data into actionable insights with comprehensive analytics tools that help you understand your business better.",
      color: "from-amber-500 to-orange-600",
      features: [
        {
          icon: <BarChart3 />,
          title: "Business Intelligence",
          description: "Interactive dashboards and reports that visualize key metrics and performance indicators."
        },
        {
          icon: <Layers />,
          title: "Data Integration",
          description: "Connect with various data sources to centralize your business information."
        },
        {
          icon: <Zap />,
          title: "Real-time Analytics",
          description: "Monitor performance metrics in real-time to make quick, informed decisions."
        },
      ],
      index: 2
    },
    {
      title: "Security & Compliance",
      description: "Enterprise-level security features protect your sensitive data and ensure compliance with industry regulations.",
      color: "from-green-500 to-emerald-600",
      features: [
        {
          icon: <Lock />,
          title: "Advanced Encryption",
          description: "End-to-end encryption that keeps your data secure both in transit and at rest."
        },
        {
          icon: <Cloud />,
          title: "Secure Cloud Storage",
          description: "Redundant, distributed storage systems with automatic backups and disaster recovery."
        },
        {
          icon: <Users />,
          title: "Access Controls",
          description: "Granular permission systems to ensure users only access what they need."
        },
      ],
      reversed: true,
      index: 3
    },
  ];

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
                <Button size="lg" className="rounded-full px-8">
                  Get Started for Free
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8">
                  Request a Demo
                </Button>
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
  // Stagger animation for features
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className={cn(
      "py-16 border-b border-primary/10",
      index === 3 && "border-b-0" // No border for the last section
    )}>
      <div className={cn(
        "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center",
        reversed && "lg:flex-row-reverse"
      )}>
        <motion.div
          initial={{ opacity: 0, x: reversed ? 20 : -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className={cn(
            reversed && "lg:order-2"
          )}
        >
          <div className="max-w-xl">
            <div className={`inline-block mb-4 bg-gradient-to-r ${color} p-2 rounded-lg text-white`}>
              {features[0].icon}
            </div>
            <h2 className="text-3xl font-bold mb-4">{title}</h2>
            <p className="text-light-base/70 mb-8 text-lg">{description}</p>
            
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="space-y-8"
            >
              {features.map((feature, idx) => (
                <motion.div 
                  key={idx} 
                  variants={itemVariants}
                  className="flex"
                >
                  <div className={`mt-1 flex-shrink-0 bg-gradient-to-r ${color} p-2 rounded-lg text-white`}>
                    {feature.icon}
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-light-base/70">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className={cn(
            "bg-dark-card border border-primary/20 rounded-xl shadow-xl overflow-hidden",
            reversed && "lg:order-1"
          )}
        >
          <div className={`bg-gradient-to-r ${color} h-3 w-full`}></div>
          <div className="p-8">
            {/* Feature visualization - abstract representation */}
            <div className="h-80 w-full rounded-lg bg-gradient-to-br from-dark-base/50 to-dark-card/80 flex items-center justify-center">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${color} flex items-center justify-center text-white`}>
                {features[0].icon}
              </div>
              
              {/* Abstract geometric elements */}
              <div className="absolute">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`absolute w-${4 + i} h-${4 + i} rounded-full bg-gradient-to-r ${color} opacity-${2 + i * 2} blur-sm`} 
                    style={{ 
                      top: `${Math.sin(i * 1.5) * 100}px`,
                      left: `${Math.cos(i * 1.5) * 100}px`,
                      opacity: 0.05 + (i * 0.05),
                      width: `${20 + i * 10}px`,
                      height: `${20 + i * 10}px`,
                    }}
                  />
                ))}
              </div>
              
              {/* Connection lines */}
              <svg className="absolute w-full h-full pointer-events-none">
                <defs>
                  <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" className={`stop-${color.split(' ')[1]}`} style={{ stopColor: 'currentColor' }} />
                    <stop offset="100%" className={`stop-${color.split(' ')[2]}`} style={{ stopColor: 'currentColor' }} />
                  </linearGradient>
                </defs>
                {[...Array(6)].map((_, i) => (
                  <line 
                    key={i}
                    x1={50 + (Math.sin(i) * 50)} 
                    y1={50 + (Math.cos(i) * 50)}
                    x2={250 + (Math.sin(i * 2) * 50)} 
                    y2={150 + (Math.cos(i * 2) * 50)}
                    stroke={`url(#gradient-${index})`}
                    strokeWidth="1"
                    strokeOpacity="0.3"
                  />
                ))}
              </svg>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}