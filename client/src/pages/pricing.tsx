import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Rocket, Crown, DollarSign } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useLocation } from "wouter";

const pricingPlans = [
  {
    name: "Starter",
    icon: Zap,
    price: "Free",
    period: "forever",
    description: "Perfect for individuals and small projects",
    color: "from-blue-500 to-cyan-600",
    features: [
      "1 Website",
      "AI Content Generation (100 credits/month)",
      "Basic Templates",
      "Community Support",
      "5GB Storage",
      "SSL Certificate",
      "Mobile Responsive"
    ],
    cta: "Get Started Free",
    popular: false
  },
  {
    name: "Professional",
    icon: Rocket,
    price: "$29",
    period: "per month",
    description: "For growing businesses and professionals",
    color: "from-purple-500 to-pink-600",
    features: [
      "10 Websites",
      "AI Content Generation (Unlimited)",
      "Premium Templates",
      "Priority Support",
      "100GB Storage",
      "Custom Domain",
      "Advanced Analytics",
      "E-Commerce (up to 100 products)",
      "Marketing Automation",
      "API Access"
    ],
    cta: "Start Free Trial",
    popular: true
  },
  {
    name: "Enterprise",
    icon: Crown,
    price: "$99",
    period: "per month",
    description: "For large teams and organizations",
    color: "from-orange-500 to-red-600",
    features: [
      "Unlimited Websites",
      "AI Content Generation (Unlimited)",
      "All Templates + Custom",
      "24/7 Dedicated Support",
      "Unlimited Storage",
      "White Label",
      "Advanced Security",
      "E-Commerce (Unlimited)",
      "Full Marketing Suite",
      "Advanced API Access",
      "Team Collaboration",
      "Custom Integrations"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

export default function PricingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <Badge className="mb-6 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              <DollarSign className="w-4 h-4 mr-2" />
              Pricing Plans
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Choose the perfect plan for your needs. All plans include a 14-day free trial.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <Card className={`h-full border-0 shadow-2xl ${plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''} hover:shadow-3xl transition-all`}>
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mb-6`}>
                      <plan.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">{plan.description}</p>
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black">{plan.price}</span>
                        <span className="text-slate-500">/ {plan.period}</span>
                      </div>
                    </div>
                    <Button 
                      className={`w-full mb-8 bg-gradient-to-r ${plan.color} text-white hover:opacity-90`}
                      size="lg"
                      onClick={() => setLocation("/register")}
                    >
                      {plan.cta}
                    </Button>
                    <div className="space-y-4">
                      <div className="font-semibold text-sm text-slate-500 dark:text-slate-400">
                        WHAT'S INCLUDED
                      </div>
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className={`p-1 bg-gradient-to-br ${plan.color} rounded-full flex-shrink-0`}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white"
          >
            <h2 className="text-4xl font-black mb-4">Need a Custom Solution?</h2>
            <p className="text-xl mb-8 opacity-90">
              Contact our sales team for custom enterprise pricing and tailored solutions
            </p>
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-blue-50 px-8"
              onClick={() => setLocation("/contact")}
            >
              Contact Sales
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
