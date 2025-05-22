// client/src/pages/about.tsx

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    title: "Quick Launch & Easy Build",
    description:
      "Get your website up and running in minutes. No coding required — just drag, drop, and customize.",
  },
  {
    title: "Perfect for Everyone",
    description:
      "Whether you're a small business, creative professional, or building a personal site, Echoverse has you covered.",
  },
  {
    title: "Zero Technical Skills Needed",
    description:
      "Our intuitive interface and AI-powered tools make website creation accessible to everyone.",
  },
  {
    title: "All-in-One Platform",
    description:
      "Everything you need in one place — hosting, domain management, CMS, and more.",
  },
  {
    title: "Rich App Marketplace",
    description:
      "Enhance your site with hundreds of apps and integrations, all just one click away.",
  },
];

const testimonials = [
  {
    name: "Alice Johnson",
    role: "Founder, BrightStart Co.",
    feedback:
      "Echoverse transformed the way I build websites — intuitive, fast, and the support is unmatched. Highly recommend!",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    name: "Mark Thompson",
    role: "Creative Director, PixelCraft",
    feedback:
      "I’m blown away by how quickly I can create professional websites now. Echoverse’s marketplace apps are game changers.",
    avatar: "https://randomuser.me/api/portraits/men/75.jpg",
  },
  {
    name: "Sara Lee",
    role: "Entrepreneur",
    feedback:
      "No technical skills? No problem. Echoverse made my dream website a reality — stress-free and fast.",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
];

export default function About() {
  return (
    <div className="container mx-auto px-6 py-16 max-w-7xl">
      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-5xl font-extrabold text-center mb-14 leading-tight"
      >
        Why Choose <span className="text-indigo-600">Echoverse?</span>
      </motion.h1>

      {/* Benefits Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-20">
        {benefits.map((benefit, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.15, duration: 0.5 }}
          >
            <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out cursor-default">
              <CardContent className="p-6">
                <div className="flex items-start gap-5">
                  <CheckCircle className="w-7 h-7 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-xl mb-2">{benefit.title}</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Testimonials */}
      <section>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-center mb-12"
        >
          What Our Users Say
        </motion.h2>

        <div className="grid gap-10 md:grid-cols-3">
          {testimonials.map((testi, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.2, duration: 0.5 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-default">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={testi.avatar}
                    alt={`${testi.name} avatar`}
                    className="w-14 h-14 rounded-full object-cover"
                    loading="lazy"
                  />
                  <div>
                    <p className="font-semibold text-lg">{testi.name}</p>
                    <p className="text-sm text-gray-500">{testi.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic">"{testi.feedback}"</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="mt-20 bg-indigo-50 dark:bg-indigo-900 rounded-lg p-12 text-center"
      >
        <UserCheck className="mx-auto mb-4 w-12 h-12 text-indigo-600" />
        <h3 className="text-2xl font-semibold mb-4">
          Ready to launch your site with Echoverse?
        </h3>
        <p className="max-w-xl mx-auto mb-8 text-gray-700 dark:text-gray-300">
          Join thousands of satisfied users who have taken their websites to the next level.
          Start your journey today — no technical skills required.
        </p>
        <Button
          variant="solid"
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          onClick={() => alert("Let's get started! 🚀")}
        >
          Get Started Now
        </Button>
      </motion.section>
    </div>
  );
}
