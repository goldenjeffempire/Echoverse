import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Mail, Phone, HelpCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
export default function SupportPage() {
    const supportOptions = [
        { icon: MessageCircle, title: "Live Chat", description: "Chat with our support team in real-time", action: "Start Chat", color: "from-blue-500 to-cyan-600" },
        { icon: Mail, title: "Email Support", description: "Get help via email within 24 hours", action: "Send Email", color: "from-purple-500 to-pink-600" },
        { icon: Phone, title: "Phone Support", description: "Enterprise customers can call us", action: "Call Now", color: "from-green-500 to-emerald-600" }
    ];
    const faqs = [
        { q: "How do I get started?", a: "Sign up for free and use our AI builder to create your first website in minutes." },
        { q: "What payment methods do you accept?", a: "We accept all major credit cards, PayPal, and bank transfers for enterprise plans." },
        { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time with no penalties." },
        { q: "Do you offer refunds?", a: "We offer a 14-day money-back guarantee for all paid plans." }
    ];
    return (<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 dark:from-slate-950 dark:via-slate-900 dark:to-green-950">
      <Navbar />
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <Badge className="mb-6 bg-green-100 text-green-700">
              <HelpCircle className="w-4 h-4 mr-2"/>
              Support Center
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-slate-900 to-green-900 dark:from-white dark:to-green-100 bg-clip-text text-transparent">
              How Can We Help?
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Our team is here to help you succeed. Choose the best way to reach us
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {supportOptions.map((option, index) => (<motion.div key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <Card className="h-full border-0 shadow-xl hover:shadow-2xl transition-all">
                  <CardContent className="p-8 text-center">
                    <div className={`w-20 h-20 bg-gradient-to-br ${option.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                      <option.icon className="w-10 h-10 text-white"/>
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{option.title}</h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">{option.description}</p>
                    <Button className={`bg-gradient-to-r ${option.color} text-white w-full`}>{option.action}</Button>
                  </CardContent>
                </Card>
              </motion.div>))}
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 shadow-2xl">
            <h2 className="text-3xl font-black mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (<motion.div key={index} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="border-b border-slate-200 dark:border-slate-700 pb-6">
                  <h3 className="text-xl font-bold mb-3">{faq.q}</h3>
                  <p className="text-slate-600 dark:text-slate-300">{faq.a}</p>
                </motion.div>))}
            </div>
          </div>
        </div>
      </section>
    </div>);
}
