import React from "react";
import { Link } from "wouter";
import { PenTool, Layers, Layout, Move, Code, Palette } from "lucide-react";
import { Meta } from "@/lib/meta";

const features = [
  {
    icon: PenTool,
    title: "Intuitive Design Tools",
    description: "Our drag-and-drop editor makes it easy to create beautiful designs without coding knowledge."
  },
  {
    icon: Layers,
    title: "Advanced Layout Options",
    description: "Create complex layouts with grids, flexbox, and responsive container systems."
  },
  {
    icon: Layout,
    title: "Responsive Design",
    description: "All designs automatically adapt to different screen sizes, ensuring your site looks great everywhere."
  },
  {
    icon: Move,
    title: "Animations & Effects",
    description: "Add motion and interactive effects to engage visitors and highlight important content."
  },
  {
    icon: Code,
    title: "Custom Code",
    description: "For advanced users, directly edit HTML, CSS, and JavaScript to create custom functionality."
  },
  {
    icon: Palette,
    title: "Design Systems",
    description: "Create and maintain consistent branding with reusable color palettes, typography, and components."
  }
];

export default function WebsiteDesign() {
  return (
    <>
      <Meta
        title="Website Design Features - Echo"
        description="Create your site with intuitive design features. Drag-and-drop editing, responsive layouts, and professional design tools."
      />
      <main className="min-h-screen bg-gradient-to-br from-black to-gray-900">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <section className="py-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-purple-700 bg-clip-text text-transparent">
              Website Design Tools
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Create stunning websites with our professional design tools. No coding required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/signup"
                className="px-8 py-3 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-medium text-lg transition-colors"
              >
                Start Designing
              </Link>
              <Link 
                href="/features/templates"
                className="px-8 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium text-lg transition-colors"
              >
                Browse Templates
              </Link>
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
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

          {/* Video Demo Section */}
          <section className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-white">
                See Our Design Tools in Action
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Watch how easy it is to create a professional website with Echo
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 bg-gray-900 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-purple-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </div>
                  <p className="text-xl text-gray-300">Video Demo Coming Soon</p>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-white">
                What Our Customers Say
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center text-white font-medium mr-4">
                    JD
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Jane Doe</h4>
                    <p className="text-sm text-gray-400">Photographer</p>
                  </div>
                </div>
                <p className="text-gray-300 italic">
                  "Echo's design tools allowed me to create a stunning portfolio that perfectly showcases my work. The intuitive interface made it easy to bring my vision to life."
                </p>
              </div>
              
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center text-white font-medium mr-4">
                    MS
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Mike Smith</h4>
                    <p className="text-sm text-gray-400">Small Business Owner</p>
                  </div>
                </div>
                <p className="text-gray-300 italic">
                  "As someone with zero design experience, I was amazed at how quickly I could create a professional website. The responsive design tools saved me from having to worry about mobile optimization."
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 text-center">
            <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 backdrop-blur-sm rounded-xl p-12 border border-purple-800/40">
              <h2 className="text-3xl font-bold mb-4 text-white">Ready to Design Your Website?</h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
                Sign up today and start creating with our powerful design tools
              </p>
              <Link 
                href="/signup" 
                className="px-8 py-3 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-medium text-lg transition-colors"
              >
                Get Started for Free
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
