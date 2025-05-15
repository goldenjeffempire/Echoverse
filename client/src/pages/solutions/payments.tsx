import React from "react";
import { Link } from "wouter";
import { PageTemplate } from "@/components/page-template";
import { Check, ArrowRight, CreditCard, DollarSign, ShieldCheck, Globe, Zap, Clock } from "lucide-react";

// Define the features
const features = [
  {
    icon: CreditCard,
    title: "Multiple Payment Methods",
    description: "Accept credit cards, digital wallets, and local payment methods worldwide."
  },
  {
    icon: ShieldCheck,
    title: "Secure Transactions",
    description: "PCI-compliant infrastructure with fraud detection and advanced security."
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description: "Support for 135+ currencies and payment methods in over 190 countries."
  },
  {
    icon: Zap,
    title: "Optimized Checkout",
    description: "Streamlined payment process to maximize conversion rates."
  },
  {
    icon: DollarSign,
    title: "Transparent Pricing",
    description: "No hidden fees, just simple and predictable pricing models."
  },
  {
    icon: Clock,
    title: "Fast Payouts",
    description: "Get paid quickly with flexible payout schedules to your bank account."
  }
];

// Define pricing plans
const pricingPlans = [
  {
    name: "Starter",
    price: "1.9% + $0.30",
    description: "Perfect for new businesses just getting started.",
    features: [
      "Basic payment processing",
      "Standard checkout",
      "Email support",
      "Basic fraud protection",
      "Weekly payouts"
    ],
    cta: "Choose Starter"
  },
  {
    name: "Growth",
    price: "1.5% + $0.25",
    description: "For growing businesses with increasing transaction volume.",
    features: [
      "Everything in Starter, plus:",
      "Advanced checkout customization",
      "Priority support",
      "Enhanced fraud protection",
      "Faster payouts (2 days)",
      "Subscription management"
    ],
    popular: true,
    cta: "Choose Growth"
  },
  {
    name: "Scale",
    price: "1.2% + $0.20",
    description: "For established businesses processing high volumes.",
    features: [
      "Everything in Growth, plus:",
      "Volume discounts",
      "Dedicated account manager",
      "Same-day payouts",
      "Advanced reporting & analytics",
      "Multi-currency support",
      "Custom payment flows"
    ],
    cta: "Choose Scale"
  }
];

export default function Payments() {
  return (
    <PageTemplate
      title="Payment Solutions"
      description="Seamless payment processing for your website or online store. Accept payments globally with our secure and flexible solutions."
      breadcrumbs={[
        { label: "Solutions", href: "/solutions" },
        { label: "Payments", href: "/solutions/payments" }
      ]}
    >
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 backdrop-blur-sm rounded-xl p-8 md:p-12 border border-purple-800/30 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4 text-white">
              Accept Payments Anywhere, Anytime
            </h2>
            <p className="text-gray-300 mb-6">
              Our payment solutions integrate seamlessly with your Echo website, letting you accept payments from customers around the world. With competitive rates and powerful tools, we make online payments simple.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/signup?plan=payments"
                className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/solutions/payments/demo"
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                See Demo
              </Link>
            </div>
          </div>
          <div className="rounded-xl overflow-hidden bg-gradient-to-r from-purple-600/20 to-indigo-600/20 p-1">
            <div className="bg-gray-800 rounded-lg p-4 h-64 flex items-center justify-center">
              <div className="text-center">
                <CreditCard className="h-16 w-16 text-purple-400 mb-4 mx-auto" />
                <div className="text-sm text-gray-400">Payment Processing Illustration</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-10 text-white text-center">
          Powerful Payment Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-900/20"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Integration Section */}
      <section className="mb-16">
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-8 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-4 text-white">
                Easy Integration, Developer-Friendly
              </h2>
              <p className="text-gray-300 mb-6">
                Our payments API is designed to be easy to implement, with comprehensive documentation and developer tools. Connect payments to your Echo website with just a few clicks.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  "Simple API with clear documentation",
                  "Pre-built checkout components",
                  "Webhooks for real-time notifications",
                  "Testing environment for development",
                  "SDKs for popular programming languages"
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Link 
                href="/solutions/payments/developers"
                className="inline-flex items-center text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                View Developer Docs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <div className="text-sm font-mono text-gray-400 overflow-x-auto p-2">
                <pre>
{`// Simple payment integration example
import { echoPayments } from '@echo/payments';

// Initialize the payment client
const payments = echoPayments.create({
  apiKey: 'your_api_key',
  environment: 'production' // or 'sandbox' for testing
});

// Create a payment session
const session = await payments.createSession({
  amount: 1999, // $19.99
  currency: 'usd',
  successUrl: 'https://yoursite.com/success',
  cancelUrl: 'https://yoursite.com/cancel'
});

// Redirect to checkout
window.location = session.checkoutUrl;`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-4 text-white text-center">
          Pricing Plans
        </h2>
        <p className="text-gray-300 text-center max-w-2xl mx-auto mb-10">
          Transparent pricing with no hidden fees. Choose the plan that's right for your business.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <div 
              key={index} 
              className={`bg-gray-800/40 backdrop-blur-sm border ${
                plan.popular ? 'border-purple-500' : 'border-gray-700'
              } rounded-xl overflow-hidden transition-all hover:shadow-lg hover:shadow-purple-900/20 relative`}
            >
              {plan.popular && (
                <div className="absolute top-0 inset-x-0 bg-purple-600 text-white text-center text-sm py-1 font-medium">
                  Most Popular
                </div>
              )}
              <div className={`p-6 ${plan.popular ? 'pt-9' : ''}`}>
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400 ml-1">per transaction</span>
                </div>
                <p className="text-gray-400 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/signup?plan=${plan.name.toLowerCase()}`}
                  className={`block text-center py-3 ${
                    plan.popular 
                      ? 'bg-purple-700 hover:bg-purple-600' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  } text-white font-medium rounded-lg transition-colors w-full`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials/CTA */}
      <section>
        <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 backdrop-blur-sm rounded-xl p-8 md:p-12 border border-purple-800/30 text-center">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Ready to Start Accepting Payments?
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Join thousands of businesses that trust Echo Payments for their online transactions.
            Get set up quickly and start accepting payments in minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/signup?plan=payments"
              className="px-6 py-3 bg-white text-purple-900 hover:bg-gray-100 font-medium rounded-lg transition-colors"
            >
              Create Account
            </Link>
            <Link
              href="/contact-sales"
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </PageTemplate>
  );
}