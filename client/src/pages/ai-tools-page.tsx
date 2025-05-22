import { MainLayout } from "@/components/layouts/main-layout";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AIToolsPage() {
  const navigate = useNavigate();

  const tools = [
    {
      title: "Text Generator",
      description: "Generate creative and engaging content with AI",
      icon: <Wand2 className="w-6 h-6" />,
      path: "text-generator",
    },
    {
      title: "Code Assistant",
      description: "Get help with coding and debugging",
      icon: <Wand2 className="w-6 h-6" />,
      path: "code-assistant",
    },
    {
      title: "Image Generator",
      description: "Create unique images with AI",
      icon: <Wand2 className="w-6 h-6" />,
      path: "image-generator",
    },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-6">AI Tools</h1>
          <p className="text-xl text-light-base/70 mb-12">
            Powerful AI tools to enhance your workflow
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tools.map((tool, index) => (
              <motion.div
                key={tool.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="h-full bg-dark-card hover:bg-dark-card/80 transition-colors">
                  <CardContent className="p-6">
                    <div className="mb-4">{tool.icon}</div>
                    <h3 className="text-xl font-semibold mb-2">{tool.title}</h3>
                    <p className="text-light-base/70 mb-4">{tool.description}</p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/ai-tools/${tool.path}`)}
                    >
                      Try Now
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
