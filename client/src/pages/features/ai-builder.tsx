import React from "react";
import { Link } from "wouter";
import { Sparkle, Zap, ArrowRight, Brain, PenLine, Palette, Bot, Repeat, Globe } from "lucide-react";
import { Meta } from "@/lib/meta";

const aiFeatures = [
  {
    icon: Brain,
    title: "AI Content Generation",
    description: "Generate professional content for your website with just a few prompts."
  },
  {
    icon: PenLine,
    title: "Smart Text Editor",
    description: "AI-powered text editor that helps you write better content with suggestions and improvements."
  },
  {
    icon: Palette,
    title: "Design Recommendations",
    description: "Get AI-powered design suggestions tailored to your industry and brand."
  },
  {
    icon: Bot,
    title: "Virtual Assistant",
    description: "Built-in AI assistant to help answer your questions as you build your site."
  },
  {
    icon: Repeat,
    title: "Automated Layouts",
    description: "AI arranges your content in professional, responsive layouts optimized for engagement."
  },
  {
    icon: Globe,
    title: "SEO Optimization",
    description: "AI automatically optimizes your content for search engines to improve visibility."
  }
];

export default function AIBuilder() {
  return (
    <>
      <Meta
        title="AI Website Builder - Echo"
        description="Create your website in minutes with our AI-powered builder. Generate content, get design recommendations, and optimize for search engines."
      />
      <main className="min-h-screen bg-gradient-to-br from-black to-gray-900">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <section className="py-12 text-center">
            <div className="inline-block mb-4">
              <div className="flex items-center bg-purple-900/30 rounded-full px-3 py-1 text-sm text-purple-400 font-medium">
                <Sparkle className="h-4 w-4 mr-1" />
                <span>Powered by advanced AI</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-purple-700 bg-clip-text text-transparent">
              Build Your Website with AI
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Create a stunning, professional website in minutes with our AI-powered website builder
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/signup" 
                className="flex items-center px-8 py-3 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-medium text-lg transition-colors"
              >
                <Zap className="h-5 w-5 mr-2" />
                Try AI Builder
              </Link>
              <Link 
                href="#how-it-works" 
                className="flex items-center px-8 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium text-lg transition-colors"
              >
                Learn More
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </div>
          </section>

          {/* How It Works */}
          <section id="how-it-works" className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-white">
                How It Works
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Building a website with AI is simple, fast, and effective
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-400">1</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Describe Your Business</h3>
                <p className="text-gray-300">
                  Tell our AI about your business, goals, and preferences in plain language.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-400">2</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Review AI Suggestions</h3>
                <p className="text-gray-300">
                  Our AI generates design, content, and structure suggestions based on your needs.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-400">3</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Customize & Publish</h3>
                <p className="text-gray-300">
                  Fine-tune your site with our intuitive editor and publish it to the world.
                </p>
              </div>
            </div>
          </section>

          {/* AI Features */}
          <section className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-white">
                AI-Powered Features
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Our advanced AI tools make website creation faster and easier than ever
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {aiFeatures.map((feature, index) => (
                <div key={index} className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:shadow-purple-900/20 hover:shadow-lg transition">
                  <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Showcase */}
          <section className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-white">
                Websites Built with AI
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                See real examples of websites created using our AI builder
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-purple-900/20 transition-shadow duration-300">
                  <div className="h-48 bg-gradient-to-br from-gray-700 to-gray-900"></div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white">Example Site {item}</h3>
                    <p className="text-sm text-gray-400 mb-3">Created in 10 minutes with AI</p>
                    <Link 
                      href={`/showcase/example-${item}`}
                      className="text-purple-400 hover:text-purple-300 text-sm font-medium inline-flex items-center"
                    >
                      View Live Site
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Testimonial */}
          <section className="py-16">
            <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 backdrop-blur-sm rounded-xl p-8 border border-purple-800/30 max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-purple-700 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  JS
                </div>
                <div>
                  <p className="text-lg text-gray-300 italic mb-4">
                    "I was amazed at how quickly the AI understood my business and created a perfect website. What would have taken me weeks took less than an hour. The content it generated was spot-on and saved me countless hours of writing."
                  </p>
                  <div>
                    <h4 className="font-bold text-white">John Smith</h4>
                    <p className="text-sm text-gray-400">Founder, Smith Consulting</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 text-center">
            <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 backdrop-blur-sm rounded-xl p-12 border border-purple-800/40">
              <h2 className="text-3xl font-bold mb-4 text-white">Ready to Build Your Website with AI?</h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
                Get started today and have your website live in minutes
              </p>
              <Link 
                href="/signup" 
                className="px-8 py-3 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-medium text-lg transition-colors inline-flex items-center"
              >
                <Sparkle className="h-5 w-5 mr-2" />
                Start Building for Free
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
