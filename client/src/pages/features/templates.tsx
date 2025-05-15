import React from "react";
import { Link } from "wouter";
import { Meta } from "@/lib/meta";

// Template category interface
interface TemplateCategory {
  name: string;
  count: number;
  image: string;
  href: string;
}

// Featured template interface
interface FeaturedTemplate {
  name: string;
  category: string;
  image: string;
  href: string;
  new?: boolean;
}

// Template categories data
const categories: TemplateCategory[] = [
  { 
    name: "Business", 
    count: 235, 
    image: "linear-gradient(135deg, #6366F1, #8B5CF6)", 
    href: "/features/templates/business" 
  },
  { 
    name: "E-commerce", 
    count: 182, 
    image: "linear-gradient(135deg, #F59E0B, #EF4444)", 
    href: "/features/templates/ecommerce" 
  },
  { 
    name: "Portfolio", 
    count: 145, 
    image: "linear-gradient(135deg, #10B981, #3B82F6)", 
    href: "/features/templates/portfolio" 
  },
  { 
    name: "Blog", 
    count: 98, 
    image: "linear-gradient(135deg, #EC4899, #8B5CF6)", 
    href: "/features/templates/blog" 
  },
  { 
    name: "Restaurant", 
    count: 76, 
    image: "linear-gradient(135deg, #F97316, #FBBF24)", 
    href: "/features/templates/restaurant" 
  },
  { 
    name: "Health & Beauty", 
    count: 64, 
    image: "linear-gradient(135deg, #06B6D4, #3B82F6)", 
    href: "/features/templates/health-beauty" 
  },
];

// Featured templates data
const featuredTemplates: FeaturedTemplate[] = [
  { 
    name: "Minimal Studio", 
    category: "Portfolio", 
    image: "linear-gradient(135deg, #111827, #374151)", 
    href: "/features/templates/minimal-studio",
    new: true 
  },
  { 
    name: "Urban Store", 
    category: "E-commerce", 
    image: "linear-gradient(135deg, #1E293B, #334155)", 
    href: "/features/templates/urban-store" 
  },
  { 
    name: "Bistro", 
    category: "Restaurant", 
    image: "linear-gradient(135deg, #27272A, #3F3F46)", 
    href: "/features/templates/bistro" 
  },
  { 
    name: "Creative Agency", 
    category: "Business", 
    image: "linear-gradient(135deg, #0F172A, #1E293B)", 
    href: "/features/templates/creative-agency" 
  },
  { 
    name: "Tech Blog", 
    category: "Blog", 
    image: "linear-gradient(135deg, #18181B, #27272A)", 
    href: "/features/templates/tech-blog",
    new: true 
  },
  { 
    name: "Wellness Spa", 
    category: "Health & Beauty", 
    image: "linear-gradient(135deg, #0F766E, #0D9488)", 
    href: "/features/templates/wellness-spa" 
  },
];

export default function Templates() {
  return (
    <>
      <Meta
        title="Website Templates - Echo"
        description="Choose from over 900 professionally designed website templates for every industry. Fully customizable and responsive."
      />
      <main className="min-h-screen bg-gradient-to-br from-black to-gray-900">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <section className="py-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-purple-700 bg-clip-text text-transparent">
              900+ Website Templates
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Choose from our collection of professionally designed templates for every industry
            </p>
          </section>

          {/* Template Categories */}
          <section className="py-12">
            <h2 className="text-2xl font-bold mb-8 text-white">Browse by Category</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <Link key={index} href={category.href} className="group">
                  <div className="relative rounded-xl overflow-hidden h-48 hover:shadow-lg hover:shadow-purple-900/20 transition-shadow duration-300">
                    <div
                      className="absolute inset-0 w-full h-full"
                      style={{ background: category.image }}
                    ></div>
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors"></div>
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <h3 className="text-2xl font-bold text-white mb-1">{category.name}</h3>
                      <p className="text-gray-300">{category.count} templates</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Featured Templates */}
          <section className="py-12">
            <h2 className="text-2xl font-bold mb-8 text-white">Featured Templates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTemplates.map((template, index) => (
                <Link key={index} href={template.href} className="group">
                  <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-purple-900/20 transition-shadow duration-300">
                    <div 
                      className="h-48 w-full"
                      style={{ background: template.image }}
                    >
                      {template.new && (
                        <div className="bg-purple-600 text-white text-xs font-bold py-1 px-3 rounded-br-lg inline-block">
                          NEW
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-white">{template.name}</h3>
                      <p className="text-sm text-gray-400">{template.category}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link 
                href="/features/templates/all" 
                className="px-6 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors inline-flex items-center"
              >
                View All Templates
                <svg className="ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </section>

          {/* Custom Templates Section */}
          <section className="py-12">
            <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 backdrop-blur-sm rounded-xl p-8 border border-purple-800/40">
              <div className="lg:flex items-center justify-between">
                <div className="lg:w-3/4 mb-6 lg:mb-0">
                  <h2 className="text-2xl font-bold mb-2 text-white">Need a Custom Template?</h2>
                  <p className="text-gray-300">
                    If you can't find the perfect template, let us create a custom design that meets your specific needs.
                  </p>
                </div>
                <div>
                  <Link 
                    href="/support/professionals" 
                    className="px-6 py-3 rounded-lg bg-white text-purple-900 font-medium hover:bg-gray-200 transition-colors"
                  >
                    Hire a Designer
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-12">
            <h2 className="text-2xl font-bold mb-8 text-white">Frequently Asked Questions</h2>
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-2 text-white">Can I customize the templates?</h3>
                <p className="text-gray-300">
                  Yes, all templates are fully customizable. You can change colors, fonts, layouts, and add your own content.
                </p>
              </div>
              
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-2 text-white">Are the templates mobile responsive?</h3>
                <p className="text-gray-300">
                  Absolutely! All Echo templates are designed to look great on all devices, from desktops to smartphones.
                </p>
              </div>
              
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-2 text-white">Can I switch templates after creating my site?</h3>
                <p className="text-gray-300">
                  Yes, you can change your template at any time. Your content will be transferred to the new template automatically.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
