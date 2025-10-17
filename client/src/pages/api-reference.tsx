import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, Webhook, Key, Database } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function ApiReferencePage() {
  const endpoints = [
    { method: "POST", path: "/api/ai/generate", description: "Generate website content with AI", auth: true },
    { method: "GET", path: "/api/websites", description: "List all user websites", auth: true },
    { method: "POST", path: "/api/websites", description: "Create a new website", auth: true },
    { method: "GET", path: "/api/products", description: "List e-commerce products", auth: true },
    { method: "POST", path: "/api/orders", description: "Create a new order", auth: true },
    { method: "GET", path: "/api/analytics", description: "Get analytics data", auth: true }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <Navbar />
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <Badge className="mb-6 bg-indigo-100 text-indigo-700">
              <Code2 className="w-4 h-4 mr-2" />
              API Reference
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-slate-900 to-indigo-900 dark:from-white dark:to-indigo-100 bg-clip-text text-transparent">
              API Documentation
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Complete API reference for integrating EchoVerse into your applications
            </p>
          </motion.div>
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {[
              { icon: Key, title: "Authentication", desc: "JWT-based API authentication" },
              { icon: Webhook, title: "Webhooks", desc: "Real-time event notifications" },
              { icon: Database, title: "Rate Limits", desc: "API usage and quotas" }
            ].map((item, index) => (
              <Card key={index} className="border-0 shadow-xl">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black mb-6">API Endpoints</h2>
            {endpoints.map((endpoint, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-6 flex items-center gap-6">
                    <Badge className={`${endpoint.method === 'GET' ? 'bg-green-600' : 'bg-blue-600'} text-white font-mono`}>
                      {endpoint.method}
                    </Badge>
                    <code className="flex-1 font-mono text-slate-700 dark:text-slate-200">{endpoint.path}</code>
                    <span className="text-slate-600 dark:text-slate-300">{endpoint.description}</span>
                    {endpoint.auth && <Badge variant="outline">🔒 Auth Required</Badge>}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
