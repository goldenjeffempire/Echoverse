
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const plans = [
  {
    name: 'Free',
    price: 0,
    features: ['Basic AI assistant', 'Limited content generation', 'Community support'],
    cta: 'Get Started'
  },
  {
    name: 'Pro',
    price: 29,
    features: ['Advanced AI features', 'Unlimited content', 'Priority support', 'Custom branding'],
    cta: 'Upgrade to Pro'
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    features: ['Custom AI models', 'Dedicated support', 'SLA guarantees', 'Advanced security'],
    cta: 'Contact Sales'
  }
]

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-12">Simple, Transparent Pricing</h1>
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card key={plan.name} className="p-6">
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <div className="text-3xl font-bold mb-6">
              {typeof plan.price === 'number' ? `$${plan.price}/mo` : plan.price}
            </div>
            <ul className="mb-6 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center">
                  <span className="mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <Button className="w-full">{plan.cta}</Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
