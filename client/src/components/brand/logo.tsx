
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LogoProps {
  variant?: "default" | "icon";
  className?: string;
}

export function Logo({ variant = "default", className }: LogoProps) {
  if (variant === "icon") {
    return (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("text-primary", className)}
      >
        <path
          d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4zm0 2a9.98 9.98 0 017.071 2.929l-4.242 4.242a4 4 0 01-5.658-5.658l2.829-2.829A9.925 9.925 0 0116 6zm-7.071 4.929a9.98 9.98 0 00-2.929 7.071c0 5.523 4.477 10 10 10a9.98 9.98 0 007.071-2.929l-4.242-4.242a4 4 0 01-5.658-5.658l-4.242-4.242z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        <path
          d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4zm0 2a9.98 9.98 0 017.071 2.929l-4.242 4.242a4 4 0 01-5.658-5.658l2.829-2.829A9.925 9.925 0 0116 6zm-7.071 4.929a9.98 9.98 0 00-2.929 7.071c0 5.523 4.477 10 10 10a9.98 9.98 0 007.071-2.929l-4.242-4.242a4 4 0 01-5.658-5.658l-4.242-4.242z"
          fill="currentColor"
        />
      </svg>
      <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
        Echoverse
      </span>
    </div>
  );
}

export function AnimatedLogo({ className }: { className?: string }) {
  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: "easeInOut",
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-primary"
        >
          <motion.path
            d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4zm0 2a9.98 9.98 0 017.071 2.929l-4.242 4.242a4 4 0 01-5.658-5.658l2.829-2.829A9.925 9.925 0 0116 6zm-7.071 4.929a9.98 9.98 0 00-2.929 7.071c0 5.523 4.477 10 10 10a9.98 9.98 0 007.071-2.929l-4.242-4.242a4 4 0 01-5.658-5.658l-4.242-4.242z"
            stroke="currentColor"
            strokeWidth="0.5"
            variants={pathVariants}
            initial="hidden"
            animate="visible"
          />
        </svg>
      </motion.div>
      <motion.span
        variants={textVariants}
        initial="hidden"
        animate="visible"
        className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70"
      >
        Echoverse
      </motion.span>
    </div>
  );
}

export default Logo;
