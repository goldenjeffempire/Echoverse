import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import {
  Search,
  Book,
  HelpCircle,
  FileText,
  MessageSquare,
  Video,
  ArrowLeftCircle,
  ChevronRight,
  Lightbulb,
  RefreshCw
} from "lucide-react";

// Category card component
interface CategoryCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  count: number;
  link: string;
  color: string;
  index: number;
}

const CategoryCard = ({
  icon,
  title,
  description,
  count,
  link,
  color,
  index
}: CategoryCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 * index }}
      className="bg-dark-card border border-primary/20 rounded-lg overflow-hidden hover:border-primary/60 transition-all duration-300"
    >
      <Link href={link}>
        <div className="p-6 cursor-pointer">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4 ${color}`}>
            {icon}
          </div>
          <h3 className="text-lg font-medium mb-2 flex items-center justify-between">
            {title}
            <span className="text-sm bg-dark-base/40 px-2 py-1 rounded-full text-light-base/70">
              {count} articles
            </span>
          </h3>
          <p className="text-light-base/70 text-sm mb-4">{description}</p>
          <div className="text-primary text-sm flex items-center">
            Browse articles <ChevronRight className="h-4 w-4 ml-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// FAQ item type
interface FaqItem {
  question: string;
  answer: string;
}

// FAQ categories with corresponding items
interface FaqCategory {
  category: string;
  icon: React.ReactNode;
  items: FaqItem[];
}

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Help center categories
  const categories: CategoryCardProps[] = [
    {
      icon: <Book className="h-6 w-6" />,
      title: "Getting Started",
      description: "Learn the basics of Echoverse and how to set up your account.",
      count: 12,
      link: "#getting-started",
      color: "bg-gradient-to-br from-blue-500 to-cyan-500",
      index: 0
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "AI Features",
      description: "Discover how to use the AI-powered tools and assistants.",
      count: 18,
      link: "#ai-features",
      color: "bg-gradient-to-br from-purple-500 to-violet-500",
      index: 1
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Billing & Subscriptions",
      description: "Information about plans, payments, and account management.",
      count: 9,
      link: "#billing",
      color: "bg-gradient-to-br from-green-500 to-emerald-500",
      index: 2
    },
    {
      icon: <RefreshCw className="h-6 w-6" />,
      title: "API Integration",
      description: "How to integrate Echoverse with your existing tools and software.",
      count: 14,
      link: "#api",
      color: "bg-gradient-to-br from-orange-500 to-amber-500",
      index: 3
    },
    {
      icon: <Lightbulb className="h-6 w-6" />,
      title: "Tips & Tricks",
      description: "Learn advanced techniques and best practices.",
      count: 15,
      link: "#tips",
      color: "bg-gradient-to-br from-pink-500 to-rose-500",
      index: 4
    },
    {
      icon: <HelpCircle className="h-6 w-6" />,
      title: "Troubleshooting",
      description: "Common issues and how to resolve them quickly.",
      count: 11,
      link: "#troubleshooting",
      color: "bg-gradient-to-br from-red-500 to-pink-500",
      index: 5
    },
  ];

  // FAQ data
  const faqCategories: FaqCategory[] = [
    {
      category: "Account",
      icon: <HelpCircle />,
      items: [
        {
          question: "How do I create an account?",
          answer: "To create an account, click the 'Sign Up' button in the top-right corner of the homepage. You'll need to provide your email address, create a username and password, and verify your email address to complete the registration process."
        },
        {
          question: "Can I use Echoverse without creating an account?",
          answer: "While some basic features are available to explore without an account, you'll need to create an account to save your work, access personalized AI features, and use most of the platform's functionality."
        },
        {
          question: "How do I reset my password?",
          answer: "If you've forgotten your password, click the 'Sign In' button, then select 'Forgot password?' on the login page. Enter your email address, and we'll send you instructions to reset your password."
        },
        {
          question: "Can I change my username?",
          answer: "Currently, usernames cannot be changed after account creation. We recommend choosing a username you'll want to keep long-term."
        },
      ]
    },
    {
      category: "Billing",
      icon: <FileText />,
      items: [
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover), as well as PayPal for subscription payments."
        },
        {
          question: "How do I cancel my subscription?",
          answer: "To cancel your subscription, go to Settings > Subscription Management, and click 'Cancel Subscription'. Your subscription will remain active until the end of your current billing period."
        },
        {
          question: "Will I get a refund if I cancel my subscription?",
          answer: "We don't offer prorated refunds for partial months when you cancel a subscription. Your subscription will remain active until the end of your current billing period."
        },
        {
          question: "How do I upgrade or downgrade my plan?",
          answer: "You can change your plan at any time by going to Settings > Subscription Management. If you upgrade, you'll be charged the prorated difference immediately. If you downgrade, the change will take effect at the start of your next billing cycle."
        },
      ]
    },
    {
      category: "Features",
      icon: <Lightbulb />,
      items: [
        {
          question: "What are AI credits and how do they work?",
          answer: "AI credits are the currency used for AI-powered features on Echoverse. Each plan includes a monthly allocation of credits that refresh at the beginning of your billing cycle. Different AI tools consume different amounts of credits based on their complexity."
        },
        {
          question: "How does the AI chat assistant work?",
          answer: "Our AI chat assistant uses advanced language models to understand your questions and provide helpful responses. It has access to general knowledge and can help with a variety of tasks related to the platform. The assistant maintains context within a conversation to provide more relevant responses."
        },
        {
          question: "Can I export my data from Echoverse?",
          answer: "Yes, you can export your data from the platform. Go to Settings > Data Management to download your data in various formats, including JSON, CSV, or PDF depending on the type of data."
        },
        {
          question: "Is my data secure?",
          answer: "Yes, we take data security seriously. All data is encrypted both in transit and at rest. We use industry-standard security practices and regularly undergo security audits. For more information, please see our Security Policy."
        },
      ]
    },
  ];

  // Featured articles
  const featuredArticles = [
    {
      title: "Getting Started with Echoverse",
      description: "Learn the basics and set up your workspace in minutes.",
      icon: <Book className="h-5 w-5" />,
      link: "#getting-started-guide"
    },
    {
      title: "Understanding AI Credit Usage",
      description: "How credits work and tips to maximize your usage.",
      icon: <Lightbulb className="h-5 w-5" />,
      link: "#ai-credits"
    },
    {
      title: "Subscription Management Guide",
      description: "Everything you need to know about managing your subscription.",
      icon: <FileText className="h-5 w-5" />,
      link: "#subscription-guide"
    },
    {
      title: "Troubleshooting Common Issues",
      description: "Quick fixes for common platform problems.",
      icon: <HelpCircle className="h-5 w-5" />,
      link: "#troubleshooting"
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Help Center | Echoverse</title>
      </Helmet>

      <h1 className="text-4xl font-bold text-primary mb-6">Help Center</h1>

      {/* Search Input */}
      <div className="mb-8">
        <Input
          className="w-full"
          placeholder="Search Help Center"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search className="w-5 h-5 text-light-base/60" />}
        />
      </div>

      {/* Help Center Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {categories.map((category) => (
          <CategoryCard key={category.title} {...category} />
        ))}
      </div>

      {/* Featured Articles */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-4">Featured Articles</h2>
        <div className="space-y-4">
          {featuredArticles.map((article, index) => (
            <div
              key={article.title}
              className="flex items-center bg-dark-card p-4 rounded-lg border border-primary/20 hover:border-primary/60 transition-all"
            >
              <div className="mr-4">{article.icon}</div>
              <div>
                <h3 className="text-lg font-medium">{article.title}</h3>
                <p className="text-sm text-light-base/70">{article.description}</p>
                <Link href={article.link} className="text-primary text-sm">
                  Read more
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Accordion */}
      <div>
        <Tabs defaultValue="account">
          <TabsList className="space-x-4">
            {faqCategories.map((category) => (
              <TabsTrigger key={category.category} value={category.category.toLowerCase()}>
                <div className="flex items-center space-x-2">
                  {category.icon}
                  <span>{category.category}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
          {faqCategories.map((category) => (
            <TabsContent key={category.category} value={category.category.toLowerCase()}>
              <Accordion type="single" collapsible>
                {category.items.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
