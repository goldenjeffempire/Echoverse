
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function About() {
  const benefits = [
    {
      title: "Quick Launch & Easy Build",
      description: "Get your website up and running in minutes. No coding required - just drag, drop, and customize."
    },
    {
      title: "Perfect for Everyone",
      description: "Whether you're a small business, creative professional, or building a personal site, Echoverse has you covered."
    },
    {
      title: "Zero Technical Skills Needed",
      description: "Our intuitive interface and AI-powered tools make website creation accessible to everyone."
    },
    {
      title: "All-in-One Platform",
      description: "Everything you need in one place - hosting, domain management, CMS, and more."
    },
    {
      title: "Rich App Marketplace",
      description: "Enhance your site with hundreds of apps and integrations, all just one click away."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-12">Why Choose Echoverse?</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {benefits.map((benefit, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{benefit.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
