import React from "react";
import { Link } from "wouter";
import { ShoppingCart, CreditCard, Package, TrendingUp, Layout, Tag, Globe } from "lucide-react";
import { Meta } from "@/lib/meta";

const features = [
  {
    icon: ShoppingCart,
    title: "Product Management",
    description: "Easily add, edit, and organize your products with customizable categories and tags."
  },
  {
    icon: CreditCard,
    title: "Flexible Payment Options",
    description: "Accept credit cards, PayPal, and other payment methods with secure checkout."
  },
  {
    icon: Package,
    title: "Order Management",
    description: "Track orders, manage inventory, and handle shipping with our integrated tools."
  },
  {
    icon: TrendingUp,
    title: "Sales Analytics",
    description: "Get detailed insights on sales, customer behavior, and inventory performance."
  },
  {
    icon: Layout,
    title: "Customizable Store Design",
    description: "Create a beautiful, branded online store with customizable templates and layouts."
  },
  {
    icon: Tag,
    title: "Discount & Promotion Tools",
    description: "Create coupons, run sales, and offer special promotions to drive conversions."
  }
];

export default function Ecommerce() {
  return (
    <>
      <Meta
        title="eCommerce Website Builder - Echo"
        description="Build and grow your online store with Echo's powerful eCommerce tools. Manage products, process payments, and increase sales."
      />
      <main className="min-h-screen bg-gradient-to-br from-black to-gray-900">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <section className="py-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-purple-700 bg-clip-text text-transparent">
              Build Your Online Store
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Everything you need to sell online and grow your business with powerful eCommerce tools
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="px-8 py-3 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-medium text-lg transition-colors"
              >
                Start Selling Online
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium text-lg transition-colors"
              >
                See Plans & Pricing
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

          {/* Success Story */}
          <section className="py-16">
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
              <div className="lg:flex">
                <div className="lg:w-1/2 bg-gradient-to-br from-purple-800/30 to-indigo-900/30 p-12">
                  <h2 className="text-3xl font-bold mb-4 text-white">Success Story</h2>
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-purple-700 flex items-center justify-center text-white font-medium mr-4">
                        RM
                      </div>
                      <div>
                        <h4 className="font-bold text-white">Rebecca Miller</h4>
                        <p className="text-sm text-gray-400">Founder, Handmade Creations</p>
                      </div>
                    </div>
                    <p className="text-gray-300 text-lg italic">
                      "Since launching my store with Echo, my sales have increased by 230%. The platform makes it so easy to manage products and process orders, allowing me to focus on creating new items for my customers."
                    </p>
                  </div>
                  <p className="text-gray-400">
                    Rebecca went from selling at local markets to shipping internationally in just 3 months after launching her Echo online store.
                  </p>
                </div>
                <div className="lg:w-1/2 bg-gradient-to-br from-gray-800 to-gray-900 p-12">
                  <div className="space-y-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-900/30 rounded-full flex items-center justify-center text-purple-400 flex-shrink-0 mr-4">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">230% Increase in Sales</h3>
                        <p className="text-gray-400">Within the first 6 months of launching</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-900/30 rounded-full flex items-center justify-center text-purple-400 flex-shrink-0 mr-4">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">Global Customer Base</h3>
                        <p className="text-gray-400">Now shipping to over 15 countries</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-900/30 rounded-full flex items-center justify-center text-purple-400 flex-shrink-0 mr-4">
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">Streamlined Operations</h3>
                        <p className="text-gray-400">Managing 200+ orders per month effortlessly</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-white">
                Start Selling Online Today
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Choose the right plan for your business needs
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Basic Store</h3>
                  <div className="text-3xl font-extrabold text-white mb-2">$19<span className="text-lg font-normal text-gray-400">/mo</span></div>
                  <p className="text-gray-400">For small businesses starting out</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Up to 100 products</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">2.5% transaction fee</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Basic analytics</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Standard support</span>
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className="block w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-center font-medium transition"
                >
                  Get Started
                </Link>
              </div>
              
              <div className="bg-gray-800/40 backdrop-blur-sm border border-purple-600 rounded-xl p-6 transform scale-105 shadow-lg shadow-purple-900/20">
                <div className="bg-purple-600 text-white text-xs font-bold py-1 px-3 rounded-full inline-block mb-4">
                  MOST POPULAR
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Business</h3>
                  <div className="text-3xl font-extrabold text-white mb-2">$49<span className="text-lg font-normal text-gray-400">/mo</span></div>
                  <p className="text-gray-400">For growing online businesses</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Unlimited products</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">1% transaction fee</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Advanced analytics</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Discount codes & coupons</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Priority support</span>
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className="block w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-center font-medium transition"
                >
                  Get Started
                </Link>
              </div>
              
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                  <div className="text-3xl font-extrabold text-white mb-2">$149<span className="text-lg font-normal text-gray-400">/mo</span></div>
                  <p className="text-gray-400">For large online retailers</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Everything in Business</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">0.5% transaction fee</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Multi-currency support</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Advanced APIs & integrations</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Dedicated account manager</span>
                  </li>
                </ul>
                <Link
                  href="/contact-sales"
                  className="block w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-center font-medium transition"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 text-center">
            <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 backdrop-blur-sm rounded-xl p-12 border border-purple-800/40">
              <h2 className="text-3xl font-bold mb-4 text-white">Ready to Start Selling Online?</h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
                Join thousands of successful businesses selling with Echo
              </p>
              <Link
                href="/signup"
                className="px-8 py-3 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-medium text-lg transition-colors"
              >
                Create Your Store
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}