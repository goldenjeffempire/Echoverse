import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Check, X, Globe } from "lucide-react";
import { Meta } from "@/lib/meta";

interface PricingTier {
  name: string;
  pricing: {
    USD: number;
    EUR: number;
    GBP: number;
    CAD: number;
    AUD: number;
    JPY: number;
  };
  cycle: "monthly" | "annual";
  description: string;
  features: string[];
  notIncluded?: string[];
  cta: string;
  popular?: boolean;
  highlight?: boolean;
  badge?: string;
}

interface CurrencyInfo {
  code: string;
  symbol: string;
  locale: string;
}

const currencies: Record<string, CurrencyInfo> = {
  USD: { code: "USD", symbol: "$", locale: "en-US" },
  EUR: { code: "EUR", symbol: "€", locale: "de-DE" },
  GBP: { code: "GBP", symbol: "£", locale: "en-GB" },
  CAD: { code: "CAD", symbol: "$", locale: "en-CA" },
  AUD: { code: "AUD", symbol: "$", locale: "en-AU" },
  JPY: { code: "JPY", symbol: "¥", locale: "ja-JP" },
};

const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    pricing: {
      USD: 0,
      EUR: 0,
      GBP: 0,
      CAD: 0,
      AUD: 0,
      JPY: 0,
    },
    cycle: "monthly",
    description: "For individuals starting their online journey",
    features: [
      "1 website",
      "Echo subdomain",
      "Mobile-optimized website",
      "SSL security included",
      "Basic templates",
      "Community support"
    ],
    notIncluded: [
      "Custom domain",
      "E-commerce functionality",
      "Premium templates",
      "Advanced analytics"
    ],
    cta: "Sign Up Free"
  },
  {
    name: "Starter",
    pricing: {
      USD: 9.99,
      EUR: 8.99,
      GBP: 7.99,
      CAD: 12.99,
      AUD: 13.99,
      JPY: 1100,
    },
    cycle: "monthly",
    description: "Perfect for beginners and personal projects",
    features: [
      "1 website",
      "Free custom domain for 1 year",
      "Mobile-optimized website",
      "SSL security included",
      "Basic analytics",
      "24/7 customer care",
      "20+ premium templates"
    ],
    notIncluded: [
      "E-commerce functionality",
      "Advanced marketing tools",
      "Multiple contributor access"
    ],
    cta: "Get Started"
  },
  {
    name: "Business",
    pricing: {
      USD: 19.99,
      EUR: 17.99,
      GBP: 15.99,
      CAD: 24.99,
      AUD: 26.99,
      JPY: 2200,
    },
    cycle: "monthly",
    description: "For growing businesses and online stores",
    features: [
      "All Starter features",
      "5 websites",
      "E-commerce store (up to 500 products)",
      "Appointment scheduling",
      "Advanced analytics",
      "Remove Echo branding",
      "Priority support",
      "Accept online payments"
    ],
    cta: "Start Free Trial",
    popular: true
  },
  {
    name: "Professional",
    pricing: {
      USD: 29.99,
      EUR: 26.99,
      GBP: 23.99,
      CAD: 36.99,
      AUD: 39.99,
      JPY: 3300,
    },
    cycle: "monthly",
    description: "For established businesses with advanced needs",
    features: [
      "All Business features",
      "10 websites",
      "Unlimited e-commerce products",
      "Custom code injection",
      "Multiple team members (up to 5)",
      "Advanced SEO tools",
      "Marketing automation",
      "API access"
    ],
    cta: "Start Free Trial",
    highlight: true
  },
  {
    name: "Agency",
    pricing: {
      USD: 49.99,
      EUR: 44.99,
      GBP: 39.99,
      CAD: 59.99,
      AUD: 64.99,
      JPY: 5500,
    },
    cycle: "monthly",
    description: "For agencies managing multiple client websites",
    features: [
      "All Professional features",
      "25 websites",
      "Unlimited team members",
      "Client management portal",
      "White-label solutions",
      "Bulk website management",
      "Agency analytics dashboard",
      "Priority phone support"
    ],
    cta: "Start Free Trial",
    badge: "Best for Agencies"
  },
  {
    name: "Enterprise",
    pricing: {
      USD: 99.99,
      EUR: 89.99,
      GBP: 79.99,
      CAD: 119.99,
      AUD: 129.99,
      JPY: 11000,
    },
    cycle: "monthly",
    description: "Custom solutions for large organizations",
    features: [
      "All Agency features",
      "Unlimited websites",
      "Custom integrations",
      "Dedicated account manager",
      "Custom security features",
      "Advanced API capabilities",
      "SLA guarantees",
      "24/7 priority support"
    ],
    cta: "Contact Sales"
  }
];

export default function Pricing() {
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  
  // Detect user's region based on browser locale and set appropriate currency
  useEffect(() => {
    const userLocale = navigator.language;
    
    if (userLocale.includes("en-US")) {
      setSelectedCurrency("USD");
    } else if (userLocale.includes("en-GB")) {
      setSelectedCurrency("GBP");
    } else if (userLocale.includes("en-CA")) {
      setSelectedCurrency("CAD");
    } else if (userLocale.includes("en-AU")) {
      setSelectedCurrency("AUD");
    } else if (userLocale.includes("ja")) {
      setSelectedCurrency("JPY");
    } else if (userLocale.includes("de") || userLocale.includes("fr") || userLocale.includes("es") || userLocale.includes("it")) {
      setSelectedCurrency("EUR");
    }
  }, []);

  // Format price based on selected currency and locale
  const formatPrice = (price: number, currencyCode: string) => {
    const { symbol, locale } = currencies[currencyCode];
    
    // Special case for JPY which doesn't use decimal places
    if (currencyCode === "JPY") {
      return `${symbol}${price.toLocaleString(locale)}`;
    }
    
    return `${symbol}${price.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate price based on billing cycle (annual gets 20% discount)
  const calculatePrice = (tier: PricingTier) => {
    // Get the price for the selected currency
    const basePrice = tier.pricing[selectedCurrency as keyof typeof tier.pricing] as number;
    
    if (billingCycle === "annual") {
      // 20% discount for annual billing
      return formatPrice(basePrice * 0.8, selectedCurrency);
    }
    
    return formatPrice(basePrice, selectedCurrency);
  };

  const toggleCurrencyDropdown = () => {
    setCurrencyDropdownOpen(!currencyDropdownOpen);
  };

  const selectCurrency = (currency: string) => {
    setSelectedCurrency(currency);
    setCurrencyDropdownOpen(false);
  };

  return (
    <>
      <Meta
        title="Pricing - Echo Website Builder"
        description="Choose the right Echo plan for your website needs. Flexible pricing for individuals, growing businesses, and established companies."
      />
      <main className="min-h-screen bg-gradient-to-br from-black to-gray-900">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-purple-700 bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Choose the plan that's right for your business needs
            </p>
            
            {/* Controls */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
              {/* Billing Cycle Toggle */}
              <div className="relative inline-flex bg-gray-800 rounded-lg p-1 min-w-[240px]">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-all rounded-md ${
                    billingCycle === "monthly"
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("annual")}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-all rounded-md ${
                    billingCycle === "annual"
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Annual (20% off)
                </button>
              </div>
              
              {/* Currency Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={toggleCurrencyDropdown}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg border border-gray-700"
                >
                  <Globe className="h-4 w-4" />
                  <span>{currencies[selectedCurrency].code}</span>
                  <svg
                    className={`h-4 w-4 transition-transform ${currencyDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {currencyDropdownOpen && (
                  <div className="absolute z-10 right-0 mt-2 w-48 rounded-md bg-gray-800 border border-gray-700 shadow-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto">
                    {Object.keys(currencies).map((currencyCode) => (
                      <button
                        key={currencyCode}
                        onClick={() => selectCurrency(currencyCode)}
                        className={`flex items-center w-full px-4 py-2 text-sm ${
                          selectedCurrency === currencyCode
                            ? "bg-purple-700/40 text-white"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        }`}
                      >
                        <span className="w-6 inline-block">{currencies[currencyCode].symbol}</span>
                        <span>{currencies[currencyCode].code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* All 6 Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
            {pricingTiers.map((tier, index) => (
              <div 
                key={index} 
                className={`relative rounded-xl backdrop-blur-sm transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-900/20 h-full
                  ${tier.popular 
                    ? "border-2 border-purple-600 bg-gray-800/60 shadow-lg shadow-purple-900/10" 
                    : tier.highlight
                      ? "border border-gray-600 bg-gradient-to-b from-gray-800/60 to-purple-900/20 shadow-md"
                      : tier.badge
                        ? "border border-indigo-600/50 bg-gray-800/60" 
                        : "border border-gray-700 bg-gray-800/40"
                  }
                `}
              >
                {/* Plan Badge */}
                {tier.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white text-xs font-bold py-1 px-4 rounded-full shadow-md">
                    MOST POPULAR
                  </div>
                )}
                {tier.badge && !tier.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-xs font-bold py-1 px-4 rounded-full shadow-md">
                    {tier.badge}
                  </div>
                )}
                
                <div className="p-6 lg:p-8">
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                    <div className="flex justify-center items-baseline mb-3">
                      <span className={`${tier.popular ? "text-4xl" : "text-3xl"} font-extrabold ${
                        tier.popular 
                          ? "bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent" 
                          : tier.name === "Free" 
                            ? "text-gray-300" 
                            : "text-white"
                      }`}>
                        {calculatePrice(tier)}
                      </span>
                      <span className="text-gray-400 ml-1">
                        {tier.name !== "Free" && `/${billingCycle === "monthly" ? "mo" : "yr"}`}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{tier.description}</p>
                  </div>
                  
                  {/* Plan Features */}
                  <ul className="space-y-2 mb-6 text-sm">
                    {tier.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                    
                    {tier.notIncluded && tier.notIncluded.map((feature, fIndex) => (
                      <li key={`not-${fIndex}`} className="flex items-start text-gray-500">
                        <X className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* CTA Button */}
                  <div className="text-center mt-auto">
                    <Link 
                      href={`/signup?plan=${tier.name.toLowerCase()}&billing=${billingCycle}`}
                      className={`block w-full py-3 px-4 rounded-lg font-medium transition-all ${
                        tier.popular 
                          ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg hover:shadow-purple-900/30" 
                          : tier.highlight
                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg hover:shadow-purple-900/20"
                            : tier.badge
                              ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md" 
                              : tier.name === "Free"
                                ? "bg-gray-700 hover:bg-gray-600 text-white"
                                : "bg-gray-700 hover:bg-gray-600 text-white"
                      }`}
                    >
                      {tier.cta}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8 text-white">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
                <h3 className="text-xl font-bold mb-2 text-white">Can I change my plan later?</h3>
                <p className="text-gray-300">
                  Yes, you can upgrade or downgrade your plan at any time. When you upgrade, you'll be charged the prorated difference for the remainder of your billing cycle.
                </p>
              </div>
              
              <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
                <h3 className="text-xl font-bold mb-2 text-white">Is there a free trial?</h3>
                <p className="text-gray-300">
                  Yes, all paid plans come with a 14-day free trial. No credit card required until you decide to continue.
                </p>
              </div>
              
              <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
                <h3 className="text-xl font-bold mb-2 text-white">What payment methods do you accept?</h3>
                <p className="text-gray-300">
                  We accept all major credit cards, PayPal, and in select countries, we also offer direct debit payments.
                </p>
              </div>
              
              <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
                <h3 className="text-xl font-bold mb-2 text-white">Do you offer custom enterprise plans?</h3>
                <p className="text-gray-300">
                  Yes, we offer custom solutions for large businesses with specific needs. Contact our sales team to discuss your requirements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
