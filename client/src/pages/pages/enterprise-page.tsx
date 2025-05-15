
import { MainLayout } from "@/components/layouts/main-layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, Users, Zap } from "lucide-react";

export default function EnterprisePage() {
  const features = [
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: "Enterprise Security",
      description: "Advanced security features and compliance measures"
    },
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      title: "Team Collaboration",
      description: "Tools for large team coordination"
    },
    {
      icon: <Zap className="w-6 h-6 text-primary" />,
      title: "Custom Solutions",
      description: "Tailored AI solutions for your business"
    }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-6">Enterprise Solutions</h1>
            <p className="text-xl text-light-base/70 max-w-2xl mx-auto">
              Powerful AI tools and solutions customized for your enterprise needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="p-6 rounded-lg bg-dark-card"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-light-base/70">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Contact Sales
            </Button>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
