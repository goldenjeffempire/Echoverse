import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  Wand2, 
  Globe, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  Search,
  Bot,
  Cpu,
  Zap,
  ArrowRight,
  Check,
  Play,
  RefreshCw
} from "lucide-react";
import Navbar from "@/components/Navbar";

const features = [
  {
    icon: Globe,
    title: "AI Website Builder",
    description: "Generate complete websites from natural language descriptions",
    color: "from-blue-500 to-cyan-600",
    demo: "website"
  },
  {
    icon: FileText,
    title: "Content Generation",
    description: "Create blog posts, articles, and marketing copy instantly",
    color: "from-purple-500 to-pink-600",
    demo: "content"
  },
  {
    icon: MessageSquare,
    title: "AI Chatbot",
    description: "Intelligent conversational AI for customer support",
    color: "from-green-500 to-emerald-600",
    demo: "chatbot"
  },
  {
    icon: TrendingUp,
    title: "Marketing AI",
    description: "Generate marketing campaigns, funnels, and email sequences",
    color: "from-orange-500 to-red-600",
    demo: "marketing"
  },
  {
    icon: Search,
    title: "SEO Optimization",
    description: "AI-powered SEO analysis and content optimization",
    color: "from-indigo-500 to-purple-600",
    demo: "seo"
  },
  {
    icon: Cpu,
    title: "Component Generator",
    description: "Create custom UI components with AI assistance",
    color: "from-pink-500 to-rose-600",
    demo: "component"
  }
];

export default function AIDemoPage() {
  const [activeDemo, setActiveDemo] = useState("website");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty Prompt",
        description: "Please enter a description to generate content",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setResult(null);

    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use AI features.",
        variant: "destructive",
      });
      setIsGenerating(false);
      return;
    }

    try {
      let endpoint = "";
      let body = {};

      switch (activeDemo) {
        case "website":
          endpoint = "/api/ai/generate-complete-website";
          body = {
            description: prompt,
            businessType: "general",
            style: "modern",
            pages: ["home", "about", "contact"],
            colorScheme: "professional",
            features: ["responsive", "seo-optimized"]
          };
          break;
        case "content":
          endpoint = "/api/ai/generate-blog";
          body = {
            topic: prompt,
            tone: "professional",
            length: "medium",
            keywords: []
          };
          break;
        case "chatbot":
          endpoint = "/api/ai/chatbot";
          body = {
            message: prompt,
            context: "demo"
          };
          break;
        case "marketing":
          endpoint = "/api/ai/generate-marketing";
          body = {
            product: prompt,
            audience: "General audience interested in AI and technology",
            tone: "professional",
            format: "email"
          };
          break;
        case "seo":
          endpoint = "/api/ai/optimize-seo";
          body = {
            content: prompt,
            targetKeywords: ["AI", "SEO", "optimization", "digital marketing"],
            url: "/demo"
          };
          break;
        case "component":
          endpoint = "/api/ai/generate-component";
          body = {
            type: "hero",
            description: prompt,
            style: "modern"
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        toast({
          title: "Generation Complete!",
          description: "AI has generated your content successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Generation Failed",
          description: error.message || "Failed to generate content. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const demoPrompts: Record<string, string> = {
    website: "Create a modern SaaS landing page for a project management tool with pricing and features sections",
    content: "Write a comprehensive blog post about the future of artificial intelligence in business automation",
    chatbot: "How can AI help improve customer service and reduce response times?",
    marketing: "Create a launch campaign for an innovative AI-powered productivity app targeting remote teams",
    seo: "Optimize this content: AI tools are transforming how businesses operate in the digital age",
    component: "Design a modern hero section with gradient background, call-to-action buttons, and trust badges"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <Badge className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Platform
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-slate-900 via-purple-900 to-pink-900 dark:from-white dark:via-purple-100 dark:to-pink-100 bg-clip-text text-transparent">
              Experience AI Magic
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Explore our AI capabilities with live demonstrations. Generate websites, content, and more with natural language.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setActiveDemo(feature.demo)}
                className="cursor-pointer"
              >
                <Card className={`h-full border-2 transition-all hover:scale-105 ${activeDemo === feature.demo ? 'border-purple-500 shadow-2xl' : 'border-transparent'}`}>
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-slate-600 dark:text-slate-300">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* AI Demo Interface */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">AI Generator</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Powered by Ollama & OpenAI</p>
                </div>
              </div>
              <Badge variant="outline" className="border-green-500 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                AI Online
              </Badge>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Enter your prompt or use example:
                </label>
                <Textarea
                  placeholder={demoPrompts[activeDemo]}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPrompt(demoPrompts[activeDemo])}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Use Example
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPrompt("")}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-12"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-6 bg-slate-50 dark:bg-slate-800 rounded-xl"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="font-semibold text-green-600 dark:text-green-400">Generation Complete</span>
                  </div>
                  <pre className="bg-white dark:bg-slate-900 p-4 rounded-lg overflow-auto max-h-96 text-sm">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* AI Providers Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 grid md:grid-cols-2 gap-6"
          >
            <Card className="border-blue-200 dark:border-blue-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-6 h-6 text-blue-500" />
                  Local AI (Ollama)
                </CardTitle>
                <CardDescription>
                  Privacy-first AI processing on your infrastructure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">100% data privacy</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">No API costs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Offline capability</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-purple-200 dark:border-purple-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                  OpenAI Fallback
                </CardTitle>
                <CardDescription>
                  Cloud AI for advanced generation tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Advanced models</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Automatic failover</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">High availability</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
