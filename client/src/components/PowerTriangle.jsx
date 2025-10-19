import { motion, useInView } from "framer-motion";
import { Zap, Brain, Rocket } from "lucide-react";
import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
const trianglePoints = [
    {
        id: "speed",
        icon: Zap,
        title: "Lightning Speed",
        description: "Build and deploy in minutes, not months. Our AI accelerates every step.",
        color: "from-yellow-400 to-orange-500",
        position: "top",
        stats: "10x Faster"
    },
    {
        id: "intelligence",
        icon: Brain,
        title: "AI Intelligence",
        description: "Advanced ML models that understand context and create intelligently.",
        color: "from-purple-400 to-pink-500",
        position: "left",
        stats: "50+ Models"
    },
    {
        id: "freedom",
        icon: Rocket,
        title: "Total Freedom",
        description: "Full control, no vendor lock-in. Export, customize, scale infinitely.",
        color: "from-blue-400 to-cyan-500",
        position: "right",
        stats: "100% Yours"
    }
];
export function PowerTriangle() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });
    const [activePoint, setActivePoint] = useState(null);
    return (<section ref={ref} className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 dark:from-black dark:via-purple-950 dark:to-black relative overflow-hidden" data-testid="section-power-triangle">
      {/* Cosmic Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse"/>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}/>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}/>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="text-center mb-20">
          <h2 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
            The Power Triangle
          </h2>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
            Three pillars that make EchoVerse unstoppable: Speed, Intelligence, and Freedom
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          {/* Center Triangle Visualization */}
          <motion.div className="relative w-full aspect-square max-w-2xl mx-auto mb-16" initial={{ scale: 0, rotate: -180 }} animate={isInView ? { scale: 1, rotate: 0 } : {}} transition={{ duration: 1.2, ease: "easeOut" }}>
            {/* Triangle SVG */}
            <svg className="w-full h-full absolute inset-0" viewBox="0 0 300 300">
              <defs>
                <linearGradient id="triangleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3"/>
                  <stop offset="50%" stopColor="#ec4899" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3"/>
                </linearGradient>
              </defs>
              <motion.polygon points="150,50 50,250 250,250" fill="url(#triangleGrad)" stroke="url(#triangleGrad)" strokeWidth="2" initial={{ pathLength: 0, opacity: 0 }} animate={isInView ? { pathLength: 1, opacity: 1 } : {}} transition={{ duration: 2, ease: "easeInOut" }}/>
              {/* Connection Lines */}
              <motion.line x1="150" y1="50" x2="150" y2="250" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" initial={{ pathLength: 0 }} animate={isInView ? { pathLength: 1 } : {}} transition={{ duration: 1.5, delay: 0.5 }}/>
              <motion.line x1="50" y1="250" x2="250" y2="250" stroke="#ec4899" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" initial={{ pathLength: 0 }} animate={isInView ? { pathLength: 1 } : {}} transition={{ duration: 1.5, delay: 0.7 }}/>
              <motion.line x1="150" y1="50" x2="250" y2="250" stroke="#3b82f6" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" initial={{ pathLength: 0 }} animate={isInView ? { pathLength: 1 } : {}} transition={{ duration: 1.5, delay: 0.9 }}/>
            </svg>

            {/* Center Glow */}
            <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-full blur-3xl" animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
        }} transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
        }}/>
          </motion.div>

          {/* Triangle Points */}
          <div className="grid md:grid-cols-3 gap-8 relative">
            {trianglePoints.map((point, index) => {
            const Icon = point.icon;
            return (<motion.div key={point.id} initial={{ opacity: 0, y: 50 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 + index * 0.2, duration: 0.6 }} onMouseEnter={() => setActivePoint(point.id)} onMouseLeave={() => setActivePoint(null)} onFocus={() => setActivePoint(point.id)} onBlur={() => setActivePoint(null)} onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActivePoint(point.id);
                    }
                }} tabIndex={0} role="button" aria-label={`${point.title}: ${point.description}`} data-testid={`card-power-${point.id}`}>
                  <Card className={`relative overflow-hidden border-2 transition-all duration-500 ${activePoint === point.id
                    ? 'border-purple-500 scale-105 shadow-2xl shadow-purple-500/50'
                    : 'border-slate-700 hover:border-slate-600 focus-visible:border-purple-400'} bg-slate-900/50 backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`}>
                    <CardContent className="p-8">
                      {/* Icon with Gradient Background */}
                      <motion.div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${point.color} p-4 mb-6 mx-auto`} whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.6 }}>
                        <Icon className="w-full h-full text-white"/>
                      </motion.div>

                      {/* Stats Badge */}
                      <div className={`inline-block px-4 py-1 rounded-full bg-gradient-to-r ${point.color} text-white text-sm font-bold mb-4`}>
                        {point.stats}
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl font-black text-white mb-4">
                        {point.title}
                      </h3>

                      {/* Description */}
                      <p className="text-slate-300 leading-relaxed">
                        {point.description}
                      </p>

                      {/* Animated Bottom Border */}
                      <motion.div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${point.color}`} initial={{ width: "0%" }} animate={{ width: activePoint === point.id ? "100%" : "0%" }} transition={{ duration: 0.3 }}/>
                    </CardContent>
                  </Card>
                </motion.div>);
        })}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 1.5, duration: 0.8 }} className="text-center mt-20">
          <p className="text-xl text-slate-300 mb-6">
            Experience the perfect balance of speed, intelligence, and freedom
          </p>
          <motion.button className="px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white font-bold rounded-full text-lg shadow-2xl" whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(139, 92, 246, 0.5)" }} whileTap={{ scale: 0.95 }} data-testid="button-explore-triangle">
            Explore the Power Triangle
          </motion.button>
        </motion.div>
      </div>
    </section>);
}
