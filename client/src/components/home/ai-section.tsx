import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, Variants } from "framer-motion";
import {
  FileText,
  Layout,
  DollarSign,
  BookOpen,
  Eye,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface AITool {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  audience: string;
  capabilities: string[];
  tags: string[];
}

interface AIToolCardProps {
  tool: AITool;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, delay: index * 0.1 },
  }),
  hover: {
    scale: 1.03,
    boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)",
    transition: { duration: 0.2 },
  },
};

const shineVariants: Variants = {
  hidden: { opacity: 0, x: "-100%" },
  hover: {
    opacity: 0.2,
    x: "100%",
    transition: { duration: 1, repeat: Infinity, repeatType: "loop", repeatDelay: 1 },
  },
};

const AIToolCard: React.FC<AIToolCardProps> = ({ tool, index, isActive, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      role="button"
      aria-pressed={isActive}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={`relative rounded-xl glass-effect p-6 border transition-all duration-300 cursor-pointer
        ${isActive ? "border-primary shadow-glow" : "border-white/5 hover:border-white/20"}
      `}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      whileHover="hover"
      viewport={{ once: true, margin: "-50px" }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl pointer-events-none"
        variants={shineVariants}
        initial="hidden"
        animate={isHovered ? "hover" : "hidden"}
      />

      <div className="flex items-start gap-4 relative z-10">
        <motion.div
          className={`w-12 h-12 rounded-lg ${tool.color} flex items-center justify-center shrink-0`}
          whileHover={{ scale: 1.1, rotate: [0, 5, -5, 0] }}
          transition={{ duration: 0.5 }}
          aria-hidden="true"
        >
          {tool.icon}
        </motion.div>

        <div>
          <h4
            className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
              isActive ? "text-primary" : "text-white"
            }`}
          >
            {tool.title}
          </h4>

          <p className="text-gray-300 text-sm mb-3">{tool.description}</p>

          <div className="flex flex-wrap gap-2">
            {tool.tags.map((tag, i) => (
              <motion.span
                key={i}
                className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      {isActive && (
        <motion.div
          className="absolute bottom-3 right-3 text-primary text-sm font-medium flex items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          aria-label="Active tool indicator"
        >
          <span className="h-2 w-2 bg-primary rounded-full animate-pulse inline-block"></span>
          <span>Active</span>
        </motion.div>
      )}
    </motion.div>
  );
};

interface AIToolShowcaseProps {
  tool: AITool;
}

const showcaseVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, staggerChildren: 0.1 },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const AIToolShowcase: React.FC<AIToolShowcaseProps> = ({ tool }) => {
  const y = useMotionValue(0);
  const rotate = useTransform(y, [-100, 100], [2, -2]);

  return (
    <motion.div
      className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-8 border border-white/5 relative overflow-hidden"
      variants={showcaseVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ y, rotate }}
      drag="y"
      dragConstraints={{ top: -5, bottom: 5 }}
      dragElastic={0.1}
      aria-live="polite"
      aria-atomic="true"
    >
      <motion.div className="relative z-10" variants={itemVariants}>
        <div className="flex items-center mb-6 gap-3">
          <div
            className={`w-14 h-14 rounded-xl ${tool.color} flex items-center justify-center shadow-lg`}
            aria-hidden="true"
          >
            {tool.icon}
          </div>
          <div>
            <h4 className="text-2xl font-bold text-white">{tool.title}</h4>
            <p className="text-primary-foreground/70">AI-powered assistant</p>
          </div>
        </div>

        <motion.p className="text-gray-300 mb-6" variants={itemVariants}>
          {tool.description}
        </motion.p>

        <motion.div
          className="bg-gray-900/50 rounded-lg p-4 mb-6 border border-white/5"
          variants={itemVariants}
        >
          <h5 className="font-medium mb-2 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Key Capabilities
          </h5>
          <ul className="space-y-2" role="list">
            {tool.capabilities.map((capability, i) => (
              <motion.li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-300"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <Sparkles className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                <span>{capability}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div className="flex flex-wrap gap-2 mb-6" variants={itemVariants}>
          <div className="text-sm text-gray-400 mr-2">Perfect for:</div>
          {tool.audience.split(", ").map((audience, i) => (
            <span
              key={i}
              className="text-sm bg-gray-700/30 text-white px-3 py-1 rounded-full"
            >
              {audience}
            </span>
          ))}
        </motion.div>

        <motion.div className="flex gap-3" variants={itemVariants}>
          <Button
            className="bg-primary shadow-glow hover:bg-primary/90"
            aria-label={`Try ${tool.title}`}
          >
            Try {tool.title}
          </Button>
          <Button
            variant="outline"
            className="border-primary/30 hover:bg-primary/10"
            aria-label={`View examples of ${tool.title}`}
          >
            View Examples
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export function AISection() {
  const [selectedTool, setSelectedTool] = useState<number>(0);
  const [isHovered, setIsHovered] = useState(false);

  const aiTools: AITool[] = [
    {
      title: "EchoWriter",
      description:
        "Advanced content generation AI that creates engaging blogs, product descriptions, marketing copy, and more.",
      icon: <FileText className="h-6 w-6 text-white" aria-hidden="true" />,
      color: "bg-gradient-to-br from-accent to-purple-600",
      audience: "Content creators, marketers, businesses",
      capabilities: [
        "SEO-optimized blog posts and articles",
        "Product descriptions that convert",
        "Creative writing and storytelling",
        "Multi-language content translation",
        "Brand-voice consistent copy",
      ],
      tags: ["Content", "Marketing", "SEO"],
    },
    {
      title: "EchoBuilder",
      description:
        "AI that transforms your ideas into complete websites or e-commerce stores from simple text prompts.",
      icon: <Layout className="h-6 w-6 text-white" aria-hidden="true" />,
      color: "bg-gradient-cosmic",
      audience: "Entrepreneurs, small businesses, startups",
      capabilities: [
        "Complete website generation from prompts",
        "Responsive designs that work on all devices",
        "E-commerce store setup with products",
        "SEO-friendly page structure",
        "Custom branding incorporation",
      ],
      tags: ["Web Design", "E-commerce", "UI/UX"],
    },
    {
      title: "EchoSeller",
      description:
        "Sales acceleration AI that creates high-converting sales pages, email sequences, and persuasive pitches.",
      icon: <DollarSign className="h-6 w-6 text-white" aria-hidden="true" />,
      color: "bg-gradient-to-br from-blue-600 to-cyan-500",
      audience: "Sales teams, entrepreneurs, marketing agencies",
      capabilities: [
        "High-converting sales page copy",
        "Email follow-up sequences",
        "Sales pitch scripts and presentations",
        "Objection handling suggestions",
        "Pricing strategy recommendations",
      ],
      tags: ["Sales", "Conversion", "Revenue"],
    },
    {
      title: "EchoTeacher",
      description:
        "Educational AI that generates personalized courses, assessments, and interactive learning materials.",
      icon: <BookOpen className="h-6 w-6 text-white" aria-hidden="true" />,
      color: "bg-gradient-to-br from-primary to-violet-400",
      audience: "Educators, parents, students, course creators",
      capabilities: [
        "Custom curriculum development",
        "Interactive quiz and assessment creation",
        "Personalized learning paths",
        "Knowledge gap identification",
        "Educational content simplification",
      ],
      tags: ["Education", "Learning", "Courses"],
    },
  ];

  useEffect(() => {
    // Optional: reset hover on tool change or implement keyboard navigation support
    setIsHovered(false);
  }, [selectedTool]);

  return (
    <section
      id="ai"
      aria-label="Explore AI-powered tools"
      className="relative max-w-7xl mx-auto px-6 py-16 md:py-24 select-none"
    >
      <div className="max-w-4xl mx-auto mb-12 text-center">
        <h2 className="text-4xl font-bold tracking-tight text-white mb-4">
          AI-Powered Tools to Amplify Your Workflow
        </h2>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Harness AI to turbocharge your productivity and creativity. Choose a tool below to see
          what it can do.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {aiTools.map((tool, i) => (
          <AIToolCard
            key={tool.title}
            tool={tool}
            index={i}
            isActive={selectedTool === i}
            onClick={() => setSelectedTool(i)}
          />
        ))}
      </div>

      <div className="mt-16 max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div key={aiTools[selectedTool].title}>
            <AIToolShowcase tool={aiTools[selectedTool]} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
