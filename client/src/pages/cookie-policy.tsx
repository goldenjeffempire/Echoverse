import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Cookie } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950">
      <Navbar />
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="mb-6 bg-amber-100 text-amber-700">
              <Cookie className="w-4 h-4 mr-2" />
              Cookie Policy
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black mb-8 bg-gradient-to-r from-slate-900 to-amber-900 dark:from-white dark:to-amber-100 bg-clip-text text-transparent">
              Cookie Policy
            </h1>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
                Last updated: March 15, 2025
              </p>
              
              <h2>What Are Cookies</h2>
              <p>
                Cookies are small text files that are placed on your computer or mobile device when you visit our website. 
                They help us provide you with a better experience and allow certain features to function properly.
              </p>

              <h2>How We Use Cookies</h2>
              <p>We use cookies for the following purposes:</p>
              <ul>
                <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our website</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
              </ul>

              <h2>Managing Cookies</h2>
              <p>
                You can control and manage cookies in your browser settings. Please note that removing or blocking 
                cookies may impact your user experience and some features may no longer function properly.
              </p>

              <h2>Third-Party Cookies</h2>
              <p>
                We may use third-party services such as Google Analytics, Stripe, and other platforms that may 
                set their own cookies to provide their services.
              </p>

              <h2>Contact Us</h2>
              <p>
                If you have questions about our use of cookies, please contact us at privacy@echoverse.com
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
