import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface PricingTierProps {
  title: string;
  price: string;
  description: string;
  features: { available: boolean; text: string }[];
  cta: string;
  popular?: boolean;
  index: number;
  billingCycle: "monthly" | "annual";
}

const PricingTier = ({ 
  title, 
  price, 
  description, 
  features, 
  cta, 
  popular, 
  index,
  billingCycle
}: PricingTierProps) => {
  const cardClasses = popular
    ? "bg-dark-card border-2 border-accent-purple rounded-xl overflow-hidden relative transform hover:scale-105 transition-transform duration-300"
    : "bg-dark-card border border-primary/20 rounded-xl overflow-hidden";

  const buttonClasses = popular
    ? "w-full py-2 bg-accent-purple hover:bg-opacity-90 text-white font-medium rounded-lg transition-colors"
    : "w-full py-2 border border-primary/50 hover:border-primary text-white font-medium rounded-lg transition-colors";

  return (
    <motion.div 
      className={cardClasses}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
    >
      {popular && (
        <div className="absolute top-0 right-0 bg-accent-purple text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
          Most Popular
        </div>
      )}
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <div className="mt-4 flex items-baseline">
          <span className="text-4xl font-bold text-white">{price}</span>
          <span className="ml-1 text-light-base/60">/{billingCycle === "monthly" ? "month" : "year"}</span>
        </div>
        <p className="mt-2 text-sm text-light-base/60">{description}</p>
        
        <ul className="mt-6 space-y-3">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start">
              {feature.available ? (
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-error flex-shrink-0" />
              )}
              <span className={`ml-2 text-sm ${feature.available ? "text-light-base/80" : "text-light-base/60"}`}>
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="px-6 pb-6">
        {title === "Free" ? (
          <Link href="/auth">
            <button className={buttonClasses}>
              {cta}
            </button>
          </Link>
        ) : title === "Premium" ? (
          <a 
            href="mailto:sales@echoverse.ai?subject=Enterprise Inquiry" 
            className={buttonClasses}
          >
            {cta}
          </a>
        ) : (
          <Link href={`/checkout?plan=${title.toLowerCase()}&amount=${price.replace("$", "")}`}>
            <button className={buttonClasses}>
              {cta}
            </button>
          </Link>
        )}
      </div>
    </motion.div>
  );
};

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");

  const pricingTiers = [
    {
      title: "Free",
      price: billingCycle === "monthly" ? "$0" : "$0",
      description: "Limited access to basic tools and features.",
      features: [
        { available: true, text: "View all AI tools" },
        { available: true, text: "Global news feed access" },
        { available: true, text: "10 AI generations/month" },
        { available: false, text: "No AI memory" },
        { available: false, text: "Limited analytics" }
      ],
      cta: "Get Started Free"
    },
    {
      title: "Pro",
      price: billingCycle === "monthly" ? "$29" : "$278",
      description: "Full access to all tools and basic AI features.",
      features: [
        { available: true, text: "All Free features" },
        { available: true, text: "Full access to AI tools" },
        { available: true, text: "200 AI generations/month" },
        { available: true, text: "Basic AI memory (7 days)" },
        { available: true, text: "Enhanced analytics" }
      ],
      cta: "Start 7-Day Free Trial",
      popular: true
    },
    {
      title: "Premium",
      price: billingCycle === "monthly" ? "$79" : "$758",
      description: "Advanced AI features for teams and businesses.",
      features: [
        { available: true, text: "All Pro features" },
        { available: true, text: "Unlimited AI generations" },
        { available: true, text: "Full AI memory (30 days)" },
        { available: true, text: "Team dashboards (5 users)" },
        { available: true, text: "Advanced analytics & API" }
      ],
      cta: "Contact Sales"
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-dark-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold">
            <span className="text-white">Simple,</span>{" "}
            <span className="text-gradient">Transparent</span>{" "}
            <span className="text-white">Pricing</span>
          </h2>
          <p className="mt-4 text-xl text-light-base/70 max-w-3xl mx-auto">
            Choose the plan that fits your needs with flexible options for individuals, teams, and enterprises.
          </p>
        </motion.div>
        
        <motion.div 
          className="flex items-center justify-center space-x-3 mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span className={`text-sm ${billingCycle === "monthly" ? "text-white font-medium" : "text-light-base/70"}`}>Monthly</span>
          <Switch 
            checked={billingCycle === "annual"} 
            onCheckedChange={(checked) => setBillingCycle(checked ? "annual" : "monthly")}
            className="bg-dark-card"
          />
          <span className={`text-sm ${billingCycle === "annual" ? "text-white font-medium" : "text-light-base/70"}`}>Annual</span>
          <span className="ml-2 px-2 py-1 text-xs bg-primary/20 text-primary-light rounded-full">Save 20%</span>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <PricingTier
              key={index}
              title={tier.title}
              price={tier.price}
              description={tier.description}
              features={tier.features}
              cta={tier.cta}
              popular={tier.popular}
              index={index}
              billingCycle={billingCycle}
            />
          ))}
        </div>
        
        <motion.div 
          className="mt-16 bg-gradient-to-r from-primary to-accent-purple p-0.5 rounded-xl shadow-glow"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="bg-dark-base rounded-lg p-8 flex flex-col md:flex-row items-center justify-between">
            <div>
              <h3 className="text-2xl font-display font-bold text-white">Enterprise Plan</h3>
              <p className="mt-2 text-light-base/70 max-w-xl">Custom solutions for large teams with advanced security, white-labeling, and dedicated support.</p>
            </div>
            <div className="mt-6 md:mt-0">
              <a 
                href="mailto:enterprise@echoverse.ai?subject=Enterprise Plan Inquiry" 
                className="px-6 py-3 bg-white hover:bg-opacity-90 text-primary font-medium rounded-lg transition-colors inline-block"
              >
                Contact Enterprise Team
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default PricingSection;
