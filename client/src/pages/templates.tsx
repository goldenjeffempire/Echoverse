import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ShoppingBag, Briefcase, Heart, Gamepad, GraduationCap, Camera, Music } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useLocation } from "wouter";

const templates = [
  {
    name: "Modern Business",
    category: "Business",
    icon: Briefcase,
    description: "Professional business website with contact forms and portfolio",
    color: "from-blue-500 to-cyan-600",
    image: "/attached_assets/stock_images/modern_website_build_48e9aeb4.jpg",
    features: ["Responsive Design", "Contact Forms", "Portfolio Section"]
  },
  {
    name: "E-Commerce Store",
    category: "E-Commerce",
    icon: ShoppingBag,
    description: "Complete online store with product catalog and checkout",
    color: "from-purple-500 to-pink-600",
    image: "/attached_assets/stock_images/successful_online_bu_c08662cf.jpg",
    features: ["Product Catalog", "Shopping Cart", "Payment Integration"]
  },
  {
    name: "Creative Portfolio",
    category: "Portfolio",
    icon: Camera,
    description: "Stunning portfolio for photographers and designers",
    color: "from-orange-500 to-red-600",
    image: "/attached_assets/stock_images/website_design_creat_04708a16.jpg",
    features: ["Gallery Layouts", "Project Showcase", "Client Testimonials"]
  },
  {
    name: "SaaS Landing",
    category: "SaaS",
    icon: Sparkles,
    description: "Modern landing page for SaaS products and startups",
    color: "from-green-500 to-emerald-600",
    image: "/attached_assets/stock_images/futuristic_ai_techno_78868d22.jpg",
    features: ["Feature Highlights", "Pricing Tables", "CTA Sections"]
  },
  {
    name: "Educational Platform",
    category: "Education",
    icon: GraduationCap,
    description: "Learning management system with course catalog",
    color: "from-indigo-500 to-purple-600",
    image: "/attached_assets/stock_images/happy_diverse_team_c_cc06b103.jpg",
    features: ["Course Catalog", "Student Dashboard", "Progress Tracking"]
  },
  {
    name: "Blog & Magazine",
    category: "Blog",
    icon: Music,
    description: "Content-rich blog with article management",
    color: "from-pink-500 to-rose-600",
    image: "/attached_assets/stock_images/digital_marketing_da_468a0a44.jpg",
    features: ["Article Grid", "Categories", "Author Profiles"]
  }
];

const categories = ["All", "Business", "E-Commerce", "Portfolio", "SaaS", "Education", "Blog"];

export default function TemplatesPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <Badge className="mb-6 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
              <Sparkles className="w-4 h-4 mr-2" />
              Templates
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-slate-900 to-purple-900 dark:from-white dark:to-purple-100 bg-clip-text text-transparent">
              Beautiful Templates
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Start with professionally designed templates and customize with AI. Launch your website in minutes.
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-3 justify-center mb-12">
            {categories.map((category, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  index === 0 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:shadow-lg'
                }`}
              >
                {category}
              </motion.button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map((template, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-xl hover:shadow-2xl transition-all overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden">
                      <img
                        src={template.image}
                        alt={template.name}
                        className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 right-4">
                        <Badge className={`bg-gradient-to-r ${template.color} text-white`}>
                          {template.category}
                        </Badge>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                        <Button 
                          className="bg-white text-slate-900 hover:bg-blue-50"
                          onClick={() => setLocation("/ai-builder")}
                        >
                          Use Template
                        </Button>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className={`w-12 h-12 bg-gradient-to-br ${template.color} rounded-xl flex items-center justify-center mb-4`}>
                        <template.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{template.name}</h3>
                      <p className="text-slate-600 dark:text-slate-300 mb-4">{template.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {template.features.map((feature, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white"
          >
            <h2 className="text-4xl font-black mb-4">Can't Find What You Need?</h2>
            <p className="text-xl mb-8 opacity-90">
              Use our AI Builder to create a custom website from scratch
            </p>
            <Button 
              size="lg" 
              className="bg-white text-purple-600 hover:bg-purple-50 px-8"
              onClick={() => setLocation("/ai-builder")}
            >
              Start Building with AI
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
