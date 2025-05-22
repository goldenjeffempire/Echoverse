// client/src/pages/pricing-page.tsx
import React from 'react';
import { MainLayout } from '@/components/layouts/main-layout';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface Plan {
  name: string;
  price: number | string;
  description?: string;
  features: string[];
  cta: string;
}

const plans: Plan[] = [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started',
    features: ['Basic AI tools', 'Community support', '1 project', 'Basic analytics'],
    cta: 'Get Started',
  },
  {
    name: 'Pro',
    price: 29,
    description: 'Best for professionals',
    features: ['Advanced AI tools', 'Priority support', 'Unlimited projects', 'Advanced analytics', 'Custom branding'],
    cta: 'Upgrade to Pro',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations',
    features: ['Custom AI solutions', '24/7 support', 'Unlimited everything', 'Custom integrations', 'SLA guarantee'],
    cta: 'Contact Sales',
  },
];

export default function PricingPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-light-base/70">Choose the plan that fits your needs</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="flex flex-col"
            >
              <Card className="relative flex-grow flex flex-col">
                <CardHeader>
                  <CardTitle>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <p className="text-4xl font-bold mt-4">
                      {typeof plan.price === 'number' ? `$${plan.price}` : plan.price}
                      {typeof plan.price === 'number' && '/mo'}
                    </p>
                  </CardTitle>
                  {plan.description && <p className="text-light-base/70 mt-2">{plan.description}</p>}
                </CardHeader>

                <CardContent className="flex-grow">
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check className="h-5 w-5 text-primary mr-2" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <div className="p-4 pt-0">
                  <Button className="w-full" aria-label={`${plan.cta} for ${plan.name} plan`}>
                    {plan.cta}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
