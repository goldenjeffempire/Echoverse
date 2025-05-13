import { motion } from "framer-motion";

interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  index: number;
}

const TestimonialCard = ({ quote, name, role, index }: TestimonialCardProps) => {
  return (
    <motion.div 
      className="bg-dark-card border border-primary/20 rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
    >
      <div className="flex items-center space-x-1 text-warning mb-4">
        {[...Array(5)].map((_, i) => (
          <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <blockquote className="text-light-base/80 mb-6">
        "{quote}"
      </blockquote>
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-gradient-cosmic flex items-center justify-center">
          <span className="text-white font-semibold">{name.charAt(0)}</span>
        </div>
        <div className="ml-3">
          <h4 className="text-white font-medium">{name}</h4>
          <p className="text-xs text-light-base/60">{role}</p>
        </div>
      </div>
    </motion.div>
  );
};

export function TestimonialsSection() {
  const testimonials = [
    {
      quote: "Echoverse has completely transformed my online business. The AI tools helped me create a stunning website and marketing campaigns that actually convert. I've seen a 3x increase in sales!",
      name: "Sarah Johnson",
      role: "Founder, StyleHaven"
    },
    {
      quote: "As an educator, EchoTeacher has saved me countless hours creating curriculum and assessments. My students love the interactive content, and I can focus more on actual teaching.",
      name: "Michael Rodriguez",
      role: "High School Teacher"
    },
    {
      quote: "Our dev team leverages EchoDevBot daily. It's slashed our development time by 40% and helps us build better products faster. The API integration is seamless and powerful.",
      name: "David Chen",
      role: "CTO, TechNova"
    }
  ];

  return (
    <section className="py-20 bg-dark-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold">
            <span className="text-white">Loved by</span>{" "}
            <span className="text-gradient">Innovators</span>{" "}
            <span className="text-white">Worldwide</span>
          </h2>
          <p className="mt-4 text-xl text-light-base/70 max-w-3xl mx-auto">
            See how Echoverse is transforming how people learn, build, and grow.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard 
              key={index}
              quote={testimonial.quote}
              name={testimonial.name}
              role={testimonial.role}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
