import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, X, ArrowRight, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
const questions = [
    {
        id: "business-size",
        question: "What's your business size?",
        options: [
            { value: "solo", label: "Just me", points: { starter: 3, professional: 1, enterprise: 0 } },
            { value: "small-team", label: "Small team (2-10)", points: { starter: 1, professional: 3, enterprise: 1 } },
            { value: "medium", label: "Medium (11-50)", points: { starter: 0, professional: 2, enterprise: 3 } },
            { value: "large", label: "Enterprise (50+)", points: { starter: 0, professional: 0, enterprise: 5 } }
        ]
    },
    {
        id: "monthly-revenue",
        question: "Expected monthly revenue goal?",
        options: [
            { value: "under-5k", label: "Under $5K", points: { starter: 3, professional: 1, enterprise: 0 } },
            { value: "5k-25k", label: "$5K - $25K", points: { starter: 1, professional: 3, enterprise: 1 } },
            { value: "25k-100k", label: "$25K - $100K", points: { starter: 0, professional: 2, enterprise: 3 } },
            { value: "over-100k", label: "$100K+", points: { starter: 0, professional: 1, enterprise: 5 } }
        ]
    },
    {
        id: "features-needed",
        question: "Which features matter most?",
        options: [
            { value: "basic", label: "Basic website builder", points: { starter: 3, professional: 1, enterprise: 0 } },
            { value: "ecommerce", label: "E-commerce + Marketing", points: { starter: 1, professional: 3, enterprise: 2 } },
            { value: "advanced", label: "Advanced AI + Analytics", points: { starter: 0, professional: 2, enterprise: 3 } },
            { value: "enterprise", label: "White-label + Custom", points: { starter: 0, professional: 0, enterprise: 5 } }
        ]
    }
];
const plans = {
    starter: {
        name: "Starter",
        price: "$29",
        period: "/month",
        description: "Perfect for solopreneurs and side projects",
        features: [
            { text: "5 websites", included: true },
            { text: "Basic AI features", included: true },
            { text: "Community support", included: true },
            { text: "100GB storage", included: true },
            { text: "Advanced analytics", included: false },
            { text: "Priority support", included: false },
            { text: "Custom integrations", included: false }
        ],
        color: "from-blue-500 to-cyan-500",
        popular: false
    },
    professional: {
        name: "Professional",
        price: "$99",
        period: "/month",
        description: "For growing businesses and teams",
        features: [
            { text: "Unlimited websites", included: true },
            { text: "Advanced AI features", included: true },
            { text: "Priority support", included: true },
            { text: "500GB storage", included: true },
            { text: "Advanced analytics", included: true },
            { text: "Team collaboration", included: true },
            { text: "White-label options", included: false }
        ],
        color: "from-purple-500 to-pink-500",
        popular: true
    },
    enterprise: {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "For large organizations with custom needs",
        features: [
            { text: "Everything in Professional", included: true },
            { text: "Dedicated account manager", included: true },
            { text: "Custom integrations", included: true },
            { text: "White-label options", included: true },
            { text: "Unlimited storage", included: true },
            { text: "SLA guarantee", included: true },
            { text: "Custom AI models", included: true }
        ],
        color: "from-orange-500 to-red-500",
        popular: false
    }
};
export function AIPricingRecommender() {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [recommendation, setRecommendation] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    // Memoize particle positions to prevent recalculation on every render
    const particles = useMemo(() => {
        if (typeof window === 'undefined')
            return [];
        const particleCount = 50;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        return Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            startX: (i * 50) % screenWidth,
            startY: (i * 30) % screenHeight,
            endY: ((i + 1) * 40) % screenHeight,
            duration: 2 + (i % 3),
        }));
    }, []);
    const handleAnswer = (questionId, value) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
        if (currentQuestion < questions.length - 1) {
            setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
        }
        else {
            // Calculate recommendation
            setIsCalculating(true);
            setTimeout(() => {
                const scores = { starter: 0, professional: 0, enterprise: 0 };
                Object.entries(answers).forEach(([questionId, answerValue]) => {
                    const question = questions.find(q => q.id === questionId);
                    const option = question?.options.find(o => o.value === answerValue);
                    if (option) {
                        scores.starter += option.points.starter;
                        scores.professional += option.points.professional;
                        scores.enterprise += option.points.enterprise;
                    }
                });
                // Also include the last answer
                const lastQuestion = questions[questions.length - 1];
                const lastOption = lastQuestion.options.find(o => o.value === value);
                if (lastOption) {
                    scores.starter += lastOption.points.starter;
                    scores.professional += lastOption.points.professional;
                    scores.enterprise += lastOption.points.enterprise;
                }
                const recommended = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)[0];
                setRecommendation(recommended);
                setIsCalculating(false);
            }, 1500);
        }
    };
    const resetQuiz = () => {
        setCurrentQuestion(0);
        setAnswers({});
        setRecommendation(null);
        setIsCalculating(false);
    };
    return (<section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-purple-950 dark:to-black relative overflow-hidden" data-testid="section-ai-pricing">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        {particles.map((particle) => (<motion.div key={particle.id} className="absolute w-1 h-1 bg-white rounded-full" initial={{
                x: particle.startX,
                y: particle.startY,
            }} animate={{
                y: [particle.startY, particle.endY],
                opacity: [0, 1, 0],
            }} transition={{
                duration: particle.duration,
                repeat: Infinity,
                ease: "linear"
            }}/>))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <Badge className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2">
            <Brain className="w-4 h-4 mr-2"/>
            AI-Powered Recommendation
          </Badge>
          <h2 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
            Find Your Perfect Plan
          </h2>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
            Answer 3 quick questions and let our AI recommend the ideal plan for your business
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!recommendation && !isCalculating && (<motion.div key="questions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto">
              <Card className="bg-white/10 dark:bg-black/30 backdrop-blur-xl border-2 border-white/20">
                <CardContent className="p-8 md:p-12">
                  {/* Progress */}
                  <div className="mb-8">
                    <div className="flex justify-between text-sm text-slate-300 mb-2">
                      <span>Question {currentQuestion + 1} of {questions.length}</span>
                      <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" initial={{ width: "0%" }} animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} transition={{ duration: 0.3 }}/>
                    </div>
                  </div>

                  {/* Question */}
                  <AnimatePresence mode="wait">
                    <motion.div key={currentQuestion} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
                      <h3 className="text-3xl font-bold text-white mb-8">
                        {questions[currentQuestion].question}
                      </h3>

                      <RadioGroup value={answers[questions[currentQuestion].id]} onValueChange={(value) => handleAnswer(questions[currentQuestion].id, value)}>
                        <div className="space-y-4">
                          {questions[currentQuestion].options.map((option) => (<motion.div key={option.value} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Label htmlFor={option.value} className={`flex items-center space-x-3 p-6 rounded-xl border-2 cursor-pointer transition-all ${answers[questions[currentQuestion].id] === option.value
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'}`}>
                                <RadioGroupItem value={option.value} id={option.value}/>
                                <span className="text-lg text-white font-medium flex-1">
                                  {option.label}
                                </span>
                              </Label>
                            </motion.div>))}
                        </div>
                      </RadioGroup>
                    </motion.div>
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>)}

          {isCalculating && (<motion.div key="calculating" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center py-20">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-24 h-24 mx-auto mb-6">
                <Brain className="w-full h-full text-purple-500"/>
              </motion.div>
              <h3 className="text-3xl font-bold text-white mb-4">
                AI is analyzing your needs...
              </h3>
              <p className="text-xl text-slate-300">
                Finding the perfect plan for you
              </p>
            </motion.div>)}

          {recommendation && !isCalculating && (<motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {/* Recommended Plan */}
              <div className="text-center mb-12">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
                  <Badge className="mb-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 text-lg">
                    <Sparkles className="w-5 h-5 mr-2"/>
                    AI Recommendation
                  </Badge>
                </motion.div>
                <h3 className="text-4xl font-bold text-white mb-2">
                  We recommend the <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {plans[recommendation].name}
                  </span> plan
                </h3>
                <p className="text-xl text-slate-300">
                  Based on your answers, this plan is the perfect fit for your needs
                </p>
              </div>

              {/* Plan Comparison */}
              <div className="grid md:grid-cols-3 gap-8">
                {Object.entries(plans).map(([key, plan]) => {
                const isRecommended = key === recommendation;
                return (<motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: isRecommended ? 0 : 0.2 }} whileHover={{ y: -10 }} data-testid={`plan-${key}`}>
                      <Card className={`relative overflow-hidden h-full ${isRecommended
                        ? 'border-4 border-purple-500 scale-105 shadow-2xl shadow-purple-500/50'
                        : 'border-2 border-slate-700'} ${isRecommended ? 'bg-white dark:bg-slate-900' : 'bg-white/50 dark:bg-slate-900/50 opacity-75'}`}>
                        {isRecommended && (<div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 font-bold">
                            <Zap className="w-4 h-4 inline mr-2"/>
                            RECOMMENDED FOR YOU
                          </div>)}
                        <CardContent className={`p-8 ${isRecommended ? 'pt-16' : ''}`}>
                          <h4 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
                            {plan.name}
                          </h4>
                          <p className="text-slate-600 dark:text-slate-300 mb-6">
                            {plan.description}
                          </p>
                          <div className="mb-6">
                            <span className="text-5xl font-black text-slate-900 dark:text-white">
                              {plan.price}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {plan.period}
                            </span>
                          </div>
                          <ul className="space-y-3 mb-8">
                            {plan.features.map((feature, idx) => (<li key={idx} className="flex items-start gap-3">
                                {feature.included ? (<Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"/>) : (<X className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5"/>)}
                                <span className={feature.included ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}>
                                  {feature.text}
                                </span>
                              </li>))}
                          </ul>
                          <Button className={`w-full ${isRecommended
                        ? `bg-gradient-to-r ${plan.color} hover:opacity-90 text-white`
                        : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`} data-testid={`button-choose-${key}`}>
                            Choose {plan.name}
                            <ArrowRight className="ml-2 w-5 h-5"/>
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>);
            })}
              </div>

              {/* Reset Button */}
              <div className="text-center mt-12">
                <Button onClick={resetQuiz} variant="outline" className="border-2 border-white text-white hover:bg-white/10" data-testid="button-retake-quiz">
                  Retake Quiz
                </Button>
              </div>
            </motion.div>)}
        </AnimatePresence>
      </div>
    </section>);
}
