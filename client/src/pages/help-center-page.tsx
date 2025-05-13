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
  AccordionTrigger,
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

const CategoryCard = ({ icon, title, description, count, link, color, index }: CategoryCardProps) => {
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
      description: "Quick fixes for the most frequent problems.",
      icon: <RefreshCw className="h-5 w-5" />,
      link: "#troubleshooting-guide"
    }
  ];

  // Filter FAQs based on search query
  const filteredFaqs = faqCategories.flatMap(category => 
    category.items
      .filter(item => 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(item => ({ ...item, category: category.category }))
  );

  return (
    <>
      <Helmet>
        <title>Help Center - Echoverse</title>
        <meta name="description" content="Find answers to your questions about Echoverse. Browse our documentation, FAQs, and tutorials to learn more about our platform." />
      </Helmet>

      <div className="min-h-screen bg-dark-base">
        {/* Hero section */}
        <div className="relative overflow-hidden bg-dark-default pt-16 pb-12">
          <div className="absolute inset-0 bg-mesh opacity-30"></div>
          
          <div className="container mx-auto px-6 relative z-10">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-6">
                <ArrowLeftCircle className="mr-2 h-4 w-4" /> Back to Home
              </Button>
            </Link>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-4xl mx-auto"
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                How can we help you?
              </h1>
              <p className="text-light-base/70 text-lg mb-8 max-w-2xl mx-auto">
                Search our knowledge base or browse categories to find answers to your questions.
              </p>
              
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-light-base/40" />
                <Input
                  type="text"
                  placeholder="Search for answers..."
                  className="pl-12 pr-4 py-6 bg-dark-card border-primary/20 rounded-lg text-lg w-full focus-visible:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main content */}
        <div className="container mx-auto px-6 py-12">
          {/* Featured articles section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-6">Featured Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredArticles.map((article, index) => (
                <div 
                  key={index}
                  className="bg-dark-card border border-primary/20 rounded-lg p-5 hover:border-primary/60 transition-all duration-300"
                >
                  <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center text-primary mb-4">
                    {article.icon}
                  </div>
                  <h3 className="font-medium mb-2">{article.title}</h3>
                  <p className="text-light-base/70 text-sm mb-3">{article.description}</p>
                  <Link href={article.link} className="text-primary text-sm flex items-center">
                    Read article <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Tabs section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Tabs defaultValue="browse" className="mb-16">
              <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
                <TabsTrigger value="browse">Browse</TabsTrigger>
                <TabsTrigger value="faq">FAQ</TabsTrigger>
                <TabsTrigger value="videos">Videos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="browse" className="mt-6">
                {searchQuery ? (
                  <div className="mb-8">
                    <h2 className="text-xl font-medium mb-4">Search Results for "{searchQuery}"</h2>
                    {filteredFaqs.length > 0 ? (
                      <div className="space-y-4">
                        {filteredFaqs.map((item, index) => (
                          <div key={index} className="bg-dark-card border border-primary/20 rounded-lg p-5">
                            <div className="flex items-start">
                              <HelpCircle className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                              <div>
                                <h3 className="font-medium mb-2">{item.question}</h3>
                                <p className="text-light-base/70 text-sm">{item.answer}</p>
                                <div className="mt-2 text-xs bg-primary/10 text-primary inline-block px-2 py-1 rounded-full">
                                  {item.category}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <HelpCircle className="h-12 w-12 text-light-base/30 mx-auto mb-3" />
                        <p className="text-light-base/70 mb-2">No results found for "{searchQuery}"</p>
                        <p className="text-sm text-light-base/50 mb-4">Try a different search term or browse categories below</p>
                        <Button variant="outline" onClick={() => setSearchQuery("")}>
                          Clear Search
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    {categories.map((category, index) => (
                      <CategoryCard key={index} {...category} />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="faq" className="mt-6">
                <div className="max-w-3xl mx-auto">
                  {faqCategories.map((category, categoryIndex) => (
                    <div key={categoryIndex} className="mb-8">
                      <div className="flex items-center mb-4">
                        <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center text-primary mr-2">
                          {category.icon}
                        </div>
                        <h2 className="text-xl font-medium">{category.category}</h2>
                      </div>
                      
                      <Accordion type="single" collapsible className="bg-dark-card rounded-lg border border-primary/20">
                        {category.items.map((item, itemIndex) => (
                          <AccordionItem key={itemIndex} value={`item-${categoryIndex}-${itemIndex}`}>
                            <AccordionTrigger className="px-6 text-left hover:no-underline">
                              {item.question}
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-4 text-light-base/70">
                              {item.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="videos" className="mt-6">
                <div className="text-center max-w-2xl mx-auto py-12">
                  <Video className="h-16 w-16 text-light-base/30 mx-auto mb-4" />
                  <h2 className="text-2xl font-medium mb-3">Video Tutorials Coming Soon</h2>
                  <p className="text-light-base/70 mb-6">
                    We're currently working on creating video tutorials to help you get the most out of Echoverse.
                    Check back soon or subscribe to our newsletter to be notified when they're available.
                  </p>
                  <Button>
                    Subscribe to Updates
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Contact support section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-gradient-to-r from-primary to-accent-purple p-0.5 rounded-xl shadow-md"
          >
            <div className="bg-dark-default rounded-lg p-8 flex flex-col md:flex-row items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
                <p className="text-light-base/70 max-w-xl">
                  Can't find what you're looking for? Our support team is ready to assist you with any questions you may have.
                </p>
              </div>
              <div className="mt-6 md:mt-0 flex flex-wrap gap-4">
                <Button variant="default" className="px-6">
                  <MessageSquare className="mr-2 h-4 w-4" /> Contact Support
                </Button>
                <Button variant="outline" className="px-6">
                  <Video className="mr-2 h-4 w-4" /> Request Demo
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}