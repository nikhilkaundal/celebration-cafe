"use client";

import React from "react";
import { motion, type Transition } from "motion/react";
import { cn } from "@/lib/utils";

interface BorderTrailProps {
  className?: string;
  size?: number;
  transition?: Transition;
  onAnimationComplete?: () => void;
  style?: React.CSSProperties;
}

export function BorderTrail({
  className,
  size = 120,
  transition = {
    repeat: Infinity,
    duration: 3,
    ease: "linear",
  },
  onAnimationComplete,
  style,
}: BorderTrailProps) {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden z-10">
      <motion.div
        className={cn(
          "absolute rounded-full bg-gradient-to-r from-transparent via-[#F5B942] to-transparent blur-[2px]",
          className
        )}
        style={{
          width: size,
          height: style?.height ?? 8,
          offsetPath: "rect(0 100% 100% 0 round 1rem)",
          ...style,
        }}
        animate={{
          offsetDistance: ["0%", "100%"],
        }}
        transition={transition}
        onAnimationComplete={onAnimationComplete}
      />
    </div>
  );
}

export default BorderTrail;
