import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Code, Rocket, Shield, Zap, Database } from "lucide-react";
import Navbar from "@/components/Navbar";
export default function DocumentationPage() {
    const sections = [
        { icon: Rocket, title: "Getting Started", description: "Quick start guides and tutorials", color: "from-blue-500 to-cyan-600" },
        { icon: Code, title: "API Reference", description: "Complete API documentation", color: "from-purple-500 to-pink-600" },
        { icon: Zap, title: "Integrations", description: "Connect with third-party services", color: "from-orange-500 to-red-600" },
        { icon: Shield, title: "Security", description: "Best practices and security guides", color: "from-green-500 to-emerald-600" },
        { icon: Database, title: "Database", description: "Database setup and management", color: "from-indigo-500 to-purple-600" },
        { icon: BookOpen, title: "Guides", description: "In-depth tutorials and examples", color: "from-pink-500 to-rose-600" }
    ];
    return (<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      <Navbar />
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <Badge className="mb-6 bg-blue-100 text-blue-700">
              <BookOpen className="w-4 h-4 mr-2"/>
              Documentation
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
              Developer Documentation
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Everything you need to build, integrate, and scale with EchoVerse
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {sections.map((section, index) => (<motion.div key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                <Card className="h-full border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer group">
                  <CardContent className="p-8 text-center">
                    <div className={`w-20 h-20 bg-gradient-to-br ${section.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                      <section.icon className="w-10 h-10 text-white"/>
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{section.title}</h3>
                    <p className="text-slate-600 dark:text-slate-300">{section.description}</p>
                  </CardContent>
                </Card>
              </motion.div>))}
          </div>
        </div>
      </section>
    </div>);
}
