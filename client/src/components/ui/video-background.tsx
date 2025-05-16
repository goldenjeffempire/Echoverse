import React from "react";
import { cn } from "@/lib/utils";

interface VideoBackgroundProps {
  opacity?: number;
}

export function AIVideoBackground({ opacity = 0.1 }: VideoBackgroundProps) {
  return (
    <div className={cn(
      "absolute inset-0 z-0 overflow-hidden",
      `opacity-[${opacity}]`
    )}>
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      >
        <source src="/assets/background.mp4" type="video/mp4" />
      </video>
    </div>
  );
}

export function GradientOverlay({ opacity = 0.05 }: { opacity?: number }) {
  return (
    <div 
      className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background"
      style={{ opacity }}
    />
  );
}