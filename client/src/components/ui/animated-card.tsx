import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AnimatedCardProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  hover?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  style?: React.CSSProperties;
  id?: string;
}

export const AnimatedCard = ({
  title,
  description,
  footer,
  children,
  className,
  delay = 0,
  direction = "up",
  hover = true,
  onClick,
  ...props
}: AnimatedCardProps) => {
  // Direction-based animations
  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { y: 40, opacity: 0 };
      case "down":
        return { y: -40, opacity: 0 };
      case "left":
        return { x: 40, opacity: 0 };
      case "right":
        return { x: -40, opacity: 0 };
      default:
        return { y: 20, opacity: 0 };
    }
  };

  const getAnimatePosition = () => {
    switch (direction) {
      case "up":
      case "down":
        return { y: 0, opacity: 1 };
      case "left":
      case "right":
        return { x: 0, opacity: 1 };
      default:
        return { y: 0, opacity: 1 };
    }
  };

  // Hover animations
  const hoverAnimation = hover
    ? {
        whileHover: {
          scale: 1.02,
          transition: { duration: 0.2 }
        },
        whileTap: { scale: 0.98 }
      }
    : {};

  return (
    <motion.div
      initial={getInitialPosition()}
      animate={getAnimatePosition()}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay,
      }}
      whileHover={hover ? { scale: 1.02 } : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
      className={cn("", className)}
      onClick={onClick}
      style={props.style}
      id={props.id}
    >
          </motion.div>
  );
};

interface FadeInElementProps {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  className?: string;
}

export function FadeInElement({ children, direction = "up", delay = 0, className }: FadeInElementProps) {
  const directions = {
    up: { y: 20, x: 0 },
    down: { y: -20, x: 0 },
    left: { x: 20, y: 0 },
    right: { x: -20, y: 0 },
  };

  return (
    <motion.div
      initial={{ 
        opacity: 0,
        ...directions[direction]
      }}
      animate={{ 
        opacity: 1,
        x: 0,
        y: 0
      }}
      transition={{ 
        duration: 0.5,
        delay,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FloatingElement({ 
  children, 
  duration = 4,
  distance = 4,
  className 
}: {
  children: React.ReactNode;
  duration?: number;
  distance?: number;
  className?: string;
}) {
  return (
    <motion.div
      animate={{ 
        y: [-distance, distance],
      }}
      transition={{ 
        duration,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function GlowingText({ 
  children,
  color = "#7c3aed",
  className 
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span 
      className={cn("relative inline-block", className)}
      style={{
        textShadow: `0 0 10px ${color}40, 0 0 20px ${color}30, 0 0 30px ${color}20`
      }}
    >
      {children}
    </span>
  );
}