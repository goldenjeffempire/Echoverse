import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

// Dark theme color palette from the uploaded image (black background with purple/gray accents)
const particleColors = ["#6B12C1", "#8A6BFF", "#7C4DFF", "#9572FF"];

interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  velocity: {
    x: number;
    y: number;
  };
  opacity: number;
}

export const AIAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles
    const particleCount = 50;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 2 + 1;
      const color = particleColors[Math.floor(Math.random() * particleColors.length)];
      
      particles.push({
        x: Math.random() * canvas.width / window.devicePixelRatio,
        y: Math.random() * canvas.height / window.devicePixelRatio,
        radius,
        color,
        velocity: {
          x: (Math.random() - 0.5) * 0.5,
          y: (Math.random() - 0.5) * 0.5,
        },
        opacity: Math.random() * 0.5 + 0.3,
      });
    }

    particlesRef.current = particles;

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
      
      // Draw and update particles
      particlesRef.current.forEach(particle => {
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
        
        // Update position
        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;
        
        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width / window.devicePixelRatio) {
          particle.velocity.x = -particle.velocity.x;
        }
        
        if (particle.y < 0 || particle.y > canvas.height / window.devicePixelRatio) {
          particle.velocity.y = -particle.velocity.y;
        }
      });
      
      // Draw connections between particles
      const maxDistance = 100;
      
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p1 = particlesRef.current[i];
          const p2 = particlesRef.current[j];
          
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < maxDistance) {
            const opacity = 1 - (distance / maxDistance);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(124, 77, 255, ${opacity * 0.2})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.8 }}
      />
    </div>
  );
};

export const PulsingCircle: React.FC<{className?: string, color?: string}> = ({ 
  className = "", 
  color = "#7C4DFF" 
}) => {
  return (
    <div className={`relative ${className}`}>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: `${color}33` }} // 20% opacity
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.3, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: `${color}4D` }} // 30% opacity
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.7, 0.2, 0.7]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2
        }}
      />
      <div 
        className="absolute inset-0 rounded-full" 
        style={{ backgroundColor: `${color}80` }} // 50% opacity
      />
    </div>
  );
};

// AI Brain visualization that pulses and glows
export const AIBrain: React.FC = () => {
  return (
    <div className="relative w-72 h-72 mx-auto">
      {/* Brain outline SVG */}
      <motion.svg 
        viewBox="0 0 512 512" 
        className="absolute inset-0 z-10"
        initial={{ opacity: 0.8 }}
        animate={{ 
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <g fill="#9572FF">
          <path d="M256 92c-33.23 0-60.1 32.3-60.1 73.2 0 9.6 1.47 18.7 4.12 27.1-20.75 18.5-32.07 52.9-32.07 96.1 0 .5.24.9.24 1.4-20.8-13.3-32.19-52.5-32.19-52.5s-29.5 17.8-29.5 74.5c0 34.3 11.5 50.3 21.9 55.7-3.5 5.5-21.9 15.3-21.9 57.1 0 43.4 41.6 44.1 41.6 44.1s0 6.3 7.9 12.5c4.4 3.5 8.5 4.1 11.7 4.1 3.9 0 7.2-1.1 9.7-1.9 14 8 29.4 13.4 45.6 16-1.6-11-2.6-23.7-2.6-37.8 0-70.2 34-117.9 79.5-117.9s79.5 47.7 79.5 117.9c0 14.1-1 26.8-2.6 37.8 16.2-2.6 31.6-8 45.6-16 2.5.8 5.8 1.9 9.7 1.9 3.2 0 7.3-.6 11.7-4.1 7.9-6.2 7.9-12.5 7.9-12.5s41.6-.7 41.6-44.1c0-41.8-18.4-51.6-21.9-57.1 10.4-5.4 21.9-21.4 21.9-55.7 0-56.7-29.5-74.5-29.5-74.5s-11.39 39.2-32.19 52.5c0-.5.24-.9.24-1.4 0-43.2-11.32-77.6-32.07-96.1 2.65-8.4 4.12-17.5 4.12-27.1 0-40.9-26.87-73.2-60.1-73.2zm-41.2 306.6c-10.5 0-19-8.5-19-19s8.5-19 19-19 19 8.5 19 19-8.5 19-19 19zm82.4 0c-10.5 0-19-8.5-19-19s8.5-19 19-19 19 8.5 19 19-8.5 19-19 19z"/>
        </g>
      </motion.svg>
      
      {/* Glowing background effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ 
          background: "radial-gradient(circle, rgba(149,114,255,0.3) 0%, rgba(149,114,255,0.1) 40%, rgba(0,0,0,0) 70%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.7, 0.9, 0.7]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Connection points */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2">
        <PulsingCircle color="#7C4DFF" />
      </div>
      <div className="absolute top-1/3 right-1/4 w-3 h-3">
        <PulsingCircle color="#9572FF" />
      </div>
      <div className="absolute bottom-1/3 left-1/3 w-2 h-2">
        <PulsingCircle color="#8A6BFF" />
      </div>
      <div className="absolute bottom-1/4 right-1/3 w-4 h-4">
        <PulsingCircle color="#6B12C1" />
      </div>
    </div>
  );
};