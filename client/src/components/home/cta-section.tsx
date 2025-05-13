import { motion } from "framer-motion";
import { Link } from "wouter";

export function CTASection() {
  return (
    <section className="py-20 bg-mesh">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="bg-dark-card border border-primary/30 rounded-2xl overflow-hidden shadow-glow"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="p-8 md:p-12">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">
                Ready to transform your workflow?
              </h2>
              <p className="mt-4 text-xl text-light-base/70">
                Join thousands of innovators using Echoverse to learn, build, and grow faster than ever before.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/auth"
                  className="glow-border px-6 py-3 bg-primary hover:bg-primary-light text-white font-medium rounded-lg transition-colors text-center"
                >
                  Get Started Free
                </Link>
                <button className="px-6 py-3 bg-dark-base border border-primary/30 hover:border-primary/60 text-white font-medium rounded-lg transition-colors">
                  Schedule Demo
                </button>
              </div>
              
              <p className="mt-6 text-sm text-light-base/60">
                No credit card required. Free plan available with limited features.
              </p>
            </div>
            
            <div className="relative h-full hidden md:block">
              <div className="aspect-video w-full bg-gradient-to-br from-dark-base to-dark-card rounded-r-xl flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-dark-base to-transparent z-10"></div>
                <div className="absolute inset-0 mix-blend-overlay opacity-20">
                  <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />
                  </svg>
                </div>
                
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-6">
                    <motion.div 
                      className="bg-dark-base/80 backdrop-blur-sm p-4 rounded-lg border border-primary/20"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <div className="text-3xl font-bold text-accent-purple">500K+</div>
                      <div className="text-sm text-light-base/70">Active Users</div>
                    </motion.div>
                    
                    <motion.div 
                      className="bg-dark-base/80 backdrop-blur-sm p-4 rounded-lg border border-primary/20"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      <div className="text-3xl font-bold text-accent-cyan">10M+</div>
                      <div className="text-sm text-light-base/70">AI Generations</div>
                    </motion.div>
                    
                    <motion.div 
                      className="bg-dark-base/80 backdrop-blur-sm p-4 rounded-lg border border-primary/20"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      <div className="text-3xl font-bold text-accent-pink">98%</div>
                      <div className="text-sm text-light-base/70">Satisfaction</div>
                    </motion.div>
                    
                    <motion.div 
                      className="bg-dark-base/80 backdrop-blur-sm p-4 rounded-lg border border-primary/20"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                    >
                      <div className="text-3xl font-bold text-secondary">24/7</div>
                      <div className="text-sm text-light-base/70">AI Support</div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default CTASection;
