import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Phone, MapPin, Send, Clock, HelpCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    description: "Get in touch via email",
    contact: "support@echoverse.com",
    link: "mailto:support@echoverse.com"
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    description: "Chat with our team",
    contact: "Available 24/7",
    action: "Start Chat"
  },
  {
    icon: Phone,
    title: "Call Us",
    description: "Speak to our support team",
    contact: "+1 (555) 123-4567",
    link: "tel:+15551234567"
  },
  {
    icon: MapPin,
    title: "Visit Us",
    description: "Our headquarters",
    contact: "123 Tech Avenue, San Francisco, CA 94105"
  }
];

const faqs = [
  {
    question: "What is EchoVerse?",
    answer: "EchoVerse is an AI-powered platform that helps you build websites, e-commerce stores, and community platforms without coding."
  },
  {
    question: "How does the AI builder work?",
    answer: "Simply describe what you want to build in natural language, and our AI generates a complete website tailored to your needs."
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card required."
  },
  {
    question: "What kind of support do you offer?",
    answer: "We provide 24/7 customer support via email, live chat, and phone. Enterprise customers get dedicated account managers."
  }
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24 hours.",
    });

    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />
        
        <motion.div 
          className="relative max-w-7xl mx-auto text-center"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            Contact Us
          </Badge>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            Get in
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Touch
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Have questions? We're here to help. Reach out to our team anytime.
          </p>
        </motion.div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactMethods.map((method, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <method.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">{method.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{method.description}</p>
                    {method.link ? (
                      <a href={method.link} className="text-sm text-blue-600 hover:underline">
                        {method.contact}
                      </a>
                    ) : method.action ? (
                      <Button variant="outline" size="sm" className="w-full">
                        {method.action}
                      </Button>
                    ) : (
                      <p className="text-sm font-medium">{method.contact}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold mb-6">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="How can we help?"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us more about your inquiry..."
                    rows={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full gap-2">
                  <Send className="w-4 h-4" />
                  Send Message
                </Button>
              </form>
            </motion.div>

            {/* FAQs */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <HelpCircle className="w-8 h-8 text-blue-600" />
                <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
              </div>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-2">{faq.question}</h3>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="mt-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-0">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Clock className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Response Time</h3>
                      <p className="text-sm text-muted-foreground">
                        We typically respond to all inquiries within 24 hours during business days. 
                        For urgent matters, please use our live chat for immediate assistance.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-black text-slate-300 py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">EchoVerse</h3>
              <p className="text-sm">AI-powered platform for building stunning websites, stores, and communities.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/ai-builder" className="hover:text-blue-400 transition-colors">AI Builder</a></li>
                <li><a href="/marketplace" className="hover:text-blue-400 transition-colors">Marketplace</a></li>
                <li><a href="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/about" className="hover:text-blue-400 transition-colors">About Us</a></li>
                <li><a href="/contact" className="hover:text-blue-400 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
                <li><a href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} EchoVerse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
