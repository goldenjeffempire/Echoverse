import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LogoProps {
  className?: string;
  variant?: "default" | "animated";
}

export function Logo({ className, variant = "default" }: LogoProps) {
  if (variant && !['default', 'animated', 'icon'].includes(variant)) {
    console.warn(`Invalid logo variant: ${variant}. Falling back to default.`);
    variant = 'default';
  }
  if (variant === "animated") {
    return (
      <motion.div 
        className={cn("h-8 w-auto flex items-center gap-2", className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative h-8 w-8 rounded-full bg-gradient-cosmic p-0.5 animate-pulse overflow-hidden">
          <motion.div 
            className="absolute inset-[2px] bg-dark-base rounded-full flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <span className="text-white text-sm font-bold">E</span>
          </motion.div>
        </div>
        <motion.span 
          className="text-white font-display font-bold text-xl"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 120 }}
        >
          Echoverse
        </motion.span>
      </motion.div>
    );
  }

  return (
    <div className={cn("h-8 w-auto flex items-center gap-2", className)}>
      <div className="relative h-8 w-8 rounded-full bg-gradient-cosmic p-0.5 overflow-hidden">
        <div className="absolute inset-[2px] bg-dark-base rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">E</span>
        </div>
      </div>
      <span className="text-white font-display font-bold text-xl">Echoverse</span>
    </div>
  );
}

export default Logo;
