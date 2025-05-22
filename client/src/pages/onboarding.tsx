import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  CheckCircle,
  PlusCircle,
  Sparkles,
  Shield,
  ChevronRight,
  Users,
  Building,
  User,
  GraduationCap,
} from "lucide-react";
import { UserRole } from "@shared/schema";
import { motion } from "framer-motion";
import { Logo } from "@/components/brand/logo";
import { Progress } from "@/components/ui/progress";
import { AIVideoBackground } from "@/components/ui/video-background";
import { AnimatedCard, FadeInElement } from "@/components/ui/animated-card";

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    // Calculate and update progress based on current step & total steps
    const stepsLength = getStepsForRole(user.role).length;
    setProgress(((currentStep + 1) / stepsLength) * 100);
  }, [user, currentStep, navigate]);

  const handleContinue = () => {
    if (!user) return; // Just in case

    const roleSteps = getStepsForRole(user.role);

    if (currentStep < roleSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/dashboard");
    }
  };

  const getStepsForRole = (role: UserRole): OnboardingStep[] => {
    const commonSteps: OnboardingStep[] = [
      {
        title: "Welcome to Echoverse",
        description: "Let's get started with your AI workspace",
        icon: <CheckCircle className="h-6 w-6 text-primary" />,
        content: (
          <FadeInElement>
            <h3 className="text-xl font-medium">Welcome to Echoverse, {user?.username}!</h3>
            <p className="text-gray-400 mt-2">
              We're excited to help you get started with our AI-powered workspace platform.
              Your account has been successfully created, and we'll guide you through
              setting up your environment.
            </p>
          </FadeInElement>
        ),
      },
    ];

    const roleSpecificSteps: Record<UserRole, OnboardingStep[]> = {
      [UserRole.GENERAL]: [
        {
          title: "Personal Preferences",
          description: "Customize your AI workspace",
          icon: <User className="h-6 w-6 text-primary" />,
          content: (
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Tell us about your interests</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <AnimatedCard
                  title="Content Creation"
                  description="Writing, design, and creative work"
                  direction="up"
                  delay={0.1}
                  hover
                  onClick={() => navigate("/dashboard/content")}
                />
                <AnimatedCard
                  title="Productivity"
                  description="Task management and organization"
                  direction="up"
                  delay={0.2}
                  hover
                  onClick={() => navigate("/dashboard/productivity")}
                />
              </div>
            </div>
          ),
        },
        {
          title: "AI Preferences",
          description: "Choose your AI features",
          icon: <Sparkles className="h-6 w-6 text-primary" />,
          content: (
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Personal AI Assistant Setup</h3>
              <p className="text-gray-400">
                Your personal AI workspace helps you manage tasks, create content, and automate your workflow.
                Let's customize it to suit your needs.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <AnimatedCard
                  title="Content Creation"
                  description="Create blog posts, reports, and more"
                  direction="up"
                  delay={0.1}
                  hover
                />
                <AnimatedCard
                  title="Task Management"
                  description="Organize your projects and track progress"
                  direction="up"
                  delay={0.2}
                  hover
                />
              </div>
            </div>
          ),
        },
      ],
      [UserRole.WORK]: [
        {
          title: "Business Profile",
          description: "Configure your business workspace",
          icon: <Building className="h-6 w-6 text-primary" />,
          content: (
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Business Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <AnimatedCard
                  title="Team Collaboration"
                  description="Set up team workspaces"
                  direction="up"
                  delay={0.1}
                  hover
                  onClick={() => navigate("/dashboard/teams")}
                />
                <AnimatedCard
                  title="AI Workflows"
                  description="Automate business processes"
                  direction="up"
                  delay={0.2}
                  hover
                  onClick={() => navigate("/dashboard/workflows")}
                />
              </div>
            </div>
          ),
        },
        {
          title: "Industry Focus",
          description: "Customize for your industry",
          icon: <Building className="h-6 w-6 text-primary" />,
          content: (
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Business Workspace Configuration</h3>
              <p className="text-gray-400">
                Let's set up your business workspace to enhance productivity, streamline operations,
                and leverage AI for your enterprise needs.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <AnimatedCard
                  title="Team Collaboration"
                  description="Work together efficiently with AI assistance"
                  direction="up"
                  delay={0.1}
                  hover
                />
                <AnimatedCard
                  title="Business Analytics"
                  description="Get insights from your data with AI"
                  direction="up"
                  delay={0.2}
                  hover
                />
              </div>
            </div>
          ),
        },
        {
          title: "Team Integration",
          description: "Connect with your team members",
          icon: <Users className="h-6 w-6 text-primary" />,
          content: (
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Team Integration</h3>
              <p className="text-gray-400">
                Connect with your team members and set up collaboration tools for your workspace.
              </p>
            </div>
          ),
        },
      ],
      [UserRole.SCHOOL]: [
        {
          title: "Academic Profile",
          description: "Configure your educational workspace",
          icon: <GraduationCap className="h-6 w-6 text-primary" />,
          content: (
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Educational Focus</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <AnimatedCard
                  title="Student Tools"
                  description="Learning and study resources"
                  direction="up"
                  delay={0.1}
                  hover
                  onClick={() => navigate("/dashboard/student")}
                />
                <AnimatedCard
                  title="Research Assistant"
                  description="AI-powered research tools"
                  direction="up"
                  delay={0.2}
                  hover
                  onClick={() => navigate("/dashboard/research")}
                />
              </div>
            </div>
          ),
        },
        {
          title: "Learning Style",
          description: "Customize your learning experience",
          icon: <GraduationCap className="h-6 w-6 text-primary" />,
          content: (
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Educational Workspace Setup</h3>
              <p className="text-gray-400">
                Let's set up your educational workspace to enhance learning, manage assignments,
                and collaborate with teachers and students.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <AnimatedCard
                  title="Assignment Management"
                  description="Create and track assignments with AI assistance"
                  direction="up"
                  delay={0.1}
                  hover
                />
                <AnimatedCard
                  title="Learning Resources"
                  description="Access AI-powered educational content"
                  direction="up"
                  delay={0.2}
                  hover
                />
              </div>
            </div>
          ),
        },
      ],
      [UserRole.PERSONAL]: [
        {
          title: "Personal Setup",
          description: "Configure your personal workspace",
          icon: <User className="h-6 w-6 text-primary" />,
          content: (
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Personal Workspace Setup</h3>
              <p className="text-gray-400">
                Let's customize your personal workspace to help with daily tasks, creativity,
                and personal growth.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <AnimatedCard
                  title="Creative Projects"
                  description="Generate content and creative works with AI"
                  direction="up"
                  delay={0.1}
                  hover
                />
                <AnimatedCard
                  title="Personal Assistant"
                  description="AI help for scheduling and daily tasks"
                  direction="up"
                  delay={0.2}
                  hover
                />
              </div>
            </div>
          ),
        },
      ],
    };

    return [
      ...commonSteps,
      ...roleSpecificSteps[role],
      {
        title: "Ready to Go",
        description: "Your workspace is ready to use",
        icon: <CheckCircle className="h-6 w-6 text-green-500" />,
        content: (
          <div className="space-y-4">
            <h3 className="text-xl font-medium">All Set!</h3>
            <p className="text-gray-400">
              Your Echoverse workspace is now ready. You can access all features and start using the platform.
            </p>
          </div>
        ),
      },
    ];
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const steps = getStepsForRole(user.role);
  const currentStepData = steps[currentStep];

  return (
    <>
      <Helmet>
        <title>Onboarding | Echoverse</title>
      </Helmet>
      <div className="min-h-screen bg-black text-white relative">
        {/* Background animation */}
        <div className="absolute inset-0 z-0">
          <AIVideoBackground opacity={0.1} />
        </div>

        {/* Logo in top left */}
        <div className="absolute top-6 left-6 z-20">
          <Logo variant="default" className="cursor-pointer" onClick={() => navigate("/")} />
        </div>

        <div className="container mx-auto py-20 px-4 relative z-10">
          {/* Progress indicator */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-400">Onboarding Progress</span>
              <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex flex-col md:flex-row max-w-4xl mx-auto bg-[#111] rounded-lg overflow-hidden border border-[#333]">
            {/* Steps sidebar */}
            <div className="w-full md:w-1/3 bg-[#111] border-r border-[#333] p-4">
              <div className="space-y-1">
                {steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-all ${
                      currentStep === index
                        ? "bg-[#1f1f1f] border-l-4 border-primary"
                        : index < currentStep
                        ? "text-green-400"
                        : "text-gray-500 hover:bg-[#222]"
                    }`}
                    onClick={() => setCurrentStep(index)}
                  >
                    <span>{step.icon}</span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{step.title}</span>
                      <span className="text-xs text-gray-400">{step.description}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Step content */}
            <div className="flex-1 p-6 relative">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="min-h-[250px]"
              >
                {currentStepData.content}
              </motion.div>

              <div className="mt-8 flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleContinue}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {currentStep === steps.length - 1 ? "Go to Dashboard" : "Continue"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
