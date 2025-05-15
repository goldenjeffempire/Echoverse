import React from "react";
import { Link } from "wouter";
import { 
  Search, 
  HelpCircle, 
  FileText, 
  MessageSquare, 
  Book, 
  Video, 
  Users,
  Layout, 
  ShoppingCart, 
  Globe, 
  TrendingUp, 
  ShieldCheck 
} from "lucide-react";
import { Meta } from "@/lib/meta";

// Popular articles data
const popularArticles = [
  {
    title: "Getting Started with Echo",
    description: "Learn the basics of setting up your Echo website",
    icon: Book,
    href: "/support/articles/getting-started"
  },
  {
    title: "How to Use the AI Website Builder",
    description: "Step-by-step guide to creating a site with our AI tools",
    icon: Video,
    href: "/support/articles/ai-builder-guide"
  },
  {
    title: "Setting Up Your Online Store",
    description: "Complete guide to setting up products, payments, and shipping",
    icon: FileText,
    href: "/support/articles/ecommerce-setup"
  },
  {
    title: "Managing Your Website",
    description: "Learn how to edit, update, and maintain your site",
    icon: FileText,
    href: "/support/articles/website-management"
  },
  {
    title: "Troubleshooting Common Issues",
    description: "Solutions to frequent questions and problems",
    icon: HelpCircle,
    href: "/support/articles/troubleshooting"
  },
  {
    title: "Custom Domain Setup",
    description: "How to connect your own domain to your Echo website",
    icon: FileText,
    href: "/support/articles/domain-setup"
  }
];

// Help categories data
const helpCategories = [
  {
    title: "Account & Billing",
    description: "Manage your account, subscription, and payment details",
    icon: Users,
    href: "/support/categories/account"
  },
  {
    title: "Website Editor",
    description: "Learn how to design and customize your website",
    icon: Layout,
    href: "/support/categories/editor"
  },
  {
    title: "eCommerce",
    description: "Set up and manage your online store",
    icon: ShoppingCart,
    href: "/support/categories/ecommerce"
  },
  {
    title: "Domains & Hosting",
    description: "Connect domains and understand hosting options",
    icon: Globe,
    href: "/support/categories/domains"
  },
  {
    title: "Marketing & SEO",
    description: "Optimize your site and grow your audience",
    icon: TrendingUp,
    href: "/support/categories/marketing"
  },
  {
    title: "Security & Privacy",
    description: "Keep your website and customer data secure",
    icon: ShieldCheck,
    href: "/support/categories/security"
  }
];

export default function HelpCenter() {
  return (
    <>
      <Meta
        title="Help Center - Echo Support"
        description="Find answers to your questions about Echo website builder. Browse our knowledge base, tutorials, and contact support."
      />
      <main className="min-h-screen bg-gradient-to-br from-black to-gray-900">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section with Search */}
          <section className="py-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-purple-700 bg-clip-text text-transparent">
              How Can We Help You?
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Search our knowledge base or browse help categories below
            </p>
            
            <div className="max-w-2xl mx-auto relative mb-12">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for help articles, tutorials, and more..."
                className="w-full pl-12 pr-4 py-4 bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
              />
              <button className="absolute right-2 top-2 bottom-2 px-4 bg-purple-700 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors">
                Search
              </button>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/support/contact"
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                Contact Support
              </Link>
              <Link
                href="/support/livechat"
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                Live Chat
              </Link>
              <Link
                href="/support/tutorial-videos"
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <Video className="h-4 w-4" />
                Video Tutorials
              </Link>
            </div>
          </section>

          {/* Popular Articles */}
          <section className="py-12">
            <h2 className="text-2xl font-bold mb-8 text-white">Popular Help Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularArticles.map((article, index) => (
                <Link key={index} href={article.href} className="block">
                  <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 h-full hover:border-purple-500 hover:shadow-lg hover:shadow-purple-900/20 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <article.icon className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white mb-1">{article.title}</h3>
                        <p className="text-sm text-gray-400">{article.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Help Categories */}
          <section className="py-12">
            <h2 className="text-2xl font-bold mb-8 text-white">Browse Help by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {helpCategories.map((category, index) => (
                <Link key={index} href={category.href} className="block">
                  <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 h-full hover:border-purple-500 hover:shadow-lg hover:shadow-purple-900/20 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <category.icon className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white mb-1">{category.title}</h3>
                        <p className="text-sm text-gray-400">{category.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Community Forum */}
          <section className="py-12">
            <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 backdrop-blur-sm rounded-xl p-8 border border-purple-800/30">
              <div className="md:flex items-center justify-between">
                <div className="md:w-2/3 mb-6 md:mb-0">
                  <h2 className="text-2xl font-bold mb-2 text-white">Join Our Community Forum</h2>
                  <p className="text-gray-300">
                    Connect with other Echo users, share tips, and get help from our community experts.
                  </p>
                </div>
                <div>
                  <Link
                    href="/support/community"
                    className="inline-block px-6 py-3 bg-white text-purple-900 hover:bg-gray-200 font-medium rounded-lg transition-colors"
                  >
                    Visit Forum
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Support */}
          <section className="py-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-white">
                Can't Find What You're Looking For?
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Our support team is ready to help you with any questions
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
              <div className="p-8">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Your Name</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                      <input 
                        type="email" 
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Message</label>
                    <textarea 
                      rows={5} 
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    ></textarea>
                  </div>
                  
                  <div>
                    <button 
                      type="submit"
                      className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors"
                    >
                      Send Message
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}