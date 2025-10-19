import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Code, Palette, Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const demoSteps = [
  {
    id: 1,
    title: "Describe Your Vision",
    description: "Tell our AI what you want to build in plain English",
    prompt: "Create a modern landing page for an eco-friendly coffee brand with a minimalist design",
    icon: Sparkles,
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: 2,
    title: "AI Generates Design",
    description: "Watch as AI creates layouts, selects colors, and designs components",
    icon: Palette,
    color: "from-purple-500 to-pink-500"
  },
  {
    id: 3,
    title: "Production-Ready Code",
    description: "Get clean, optimized code ready to deploy instantly",
    icon: Code,
    color: "from-green-500 to-emerald-500"
  }
];

export function AIBuilderDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Memoize particle positions to prevent recalculation on every render
  const particles = useMemo(() => {
    if (typeof window === 'undefined') return [];
    const particleCount = 20;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      startX: (i * 100) % screenWidth,
      startY: (i * 50) % screenHeight,
      endY: ((i + 1) * 70) % screenHeight,
      duration: 15 + (i % 5),
    }));
  }, []);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, demoSteps.length - 1));
      setIsGenerating(false);
    }, 2000);
  };

  const resetDemo = () => {
    setCurrentStep(0);
    setIsGenerating(false);
  };

  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 relative overflow-hidden" data-testid="section-ai-demo">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 bg-blue-400 rounded-full"
            initial={{
              x: particle.startX,
              y: particle.startY,
              opacity: 0
            }}
            animate={{
              y: [particle.startY, particle.endY],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm px-6 py-2">
            <Zap className="w-4 h-4 mr-2" />
            Interactive Demo
          </Badge>
          <h2 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
            See AI in Action
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Watch how EchoVerse AI transforms your ideas into fully functional websites in real-time
          </p>
        </motion.div>

        {/* Demo Interface */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Steps */}
          <div className="space-y-6">
            {demoSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  data-testid={`step-${step.id}`}
                >
                  <Card className={`relative overflow-hidden transition-all duration-500 ${
                    isActive 
                      ? 'border-2 border-blue-500 shadow-2xl shadow-blue-500/50 scale-105' 
                      : isCompleted
                      ? 'border-2 border-green-500 opacity-75'
                      : 'border border-slate-300 dark:border-slate-700 opacity-50'
                  } ${isActive ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800'}`}>
                    <CardContent className="p-8">
                      <div className="flex items-start gap-6">
                        {/* Icon */}
                        <motion.div
                          className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} p-3 relative`}
                          animate={isActive ? {
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0],
                          } : {}}
                          transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
                        >
                          <Icon className="w-full h-full text-white" />
                          {isCompleted && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                            >
                              <ChevronRight className="w-4 h-4 text-white" />
                            </motion.div>
                          )}
                        </motion.div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                              STEP {step.id}
                            </span>
                            {isActive && (
                              <motion.div
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="flex gap-1"
                              >
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              </motion.div>
                            )}
                          </div>
                          <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
                            {step.title}
                          </h3>
                          <p className="text-slate-600 dark:text-slate-300 mb-4">
                            {step.description}
                          </p>
                          {step.prompt && index === 0 && (
                            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 font-mono text-sm text-slate-700 dark:text-slate-200">
                              "{step.prompt}"
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>

                    {/* Progress Bar */}
                    {isActive && (
                      <motion.div
                        className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${step.color}`}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2 }}
                      />
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Right: Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="sticky top-24"
          >
            <Card className="relative overflow-hidden border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Live Preview
                  </h3>
                  <Badge className="bg-green-500 text-white">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                    Live
                  </Badge>
                </div>

                {/* Preview Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900 rounded-xl p-8 min-h-[400px] flex items-center justify-center"
                  >
                    {currentStep === 0 && (
                      <div className="text-center">
                        <Sparkles className="w-20 h-20 mx-auto mb-4 text-blue-500" />
                        <p className="text-lg text-slate-600 dark:text-slate-300">
                          Ready to generate your website
                        </p>
                      </div>
                    )}
                    {currentStep === 1 && (
                      <div className="w-full space-y-4">
                        <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
                        <div className="grid grid-cols-2 gap-4">
                          <div className="h-32 bg-slate-200 dark:bg-slate-600 rounded animate-pulse" />
                          <div className="h-32 bg-slate-200 dark:bg-slate-600 rounded animate-pulse" />
                        </div>
                        <div className="h-16 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
                      </div>
                    )}
                    {currentStep === 2 && (
                      <div className="w-full">
                        <pre className="bg-slate-900 text-green-400 p-6 rounded-lg text-xs overflow-x-auto font-mono">
{`<div className="landing-page">
  <header className="hero">
    <h1>Eco Coffee</h1>
    <p>Sustainable & Delicious</p>
  </header>
  <section className="features">
    {/* Generated content */}
  </section>
</div>`}
                        </pre>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Controls */}
                <div className="mt-8 flex gap-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || currentStep === demoSteps.length - 1}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    data-testid="button-generate"
                  >
                    {isGenerating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mr-2"
                        >
                          <Zap className="w-5 h-5" />
                        </motion.div>
                        Generating...
                      </>
                    ) : currentStep === demoSteps.length - 1 ? (
                      "Demo Complete!"
                    ) : (
                      <>
                        Generate Next Step
                        <ChevronRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                  {currentStep > 0 && (
                    <Button
                      onClick={resetDemo}
                      variant="outline"
                      data-testid="button-reset"
                    >
                      Reset Demo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
