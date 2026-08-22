"use client";

import React, { useState, useId } from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";
import { cn } from "@/lib/utils";

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  defaultValue?: string;
  className?: string;
  transition?: Transition;
  enableHover?: boolean;
  onValueChange?: (newActiveId: string | null) => void;
}

export function AnimatedBackground({
  children,
  defaultValue,
  className,
  transition = {
    type: "spring",
    bounce: 0.15,
    duration: 0.35,
  },
  enableHover = true,
  onValueChange,
}: AnimatedBackgroundProps) {
  const [activeId, setActiveId] = useState<string | null>(defaultValue ?? null);
  const uniqueId = useId();

  // Sync activeId with defaultValue when defaultValue prop changes
  React.useEffect(() => {
    if (defaultValue !== undefined) {
      setActiveId(defaultValue);
    }
  }, [defaultValue]);

  const handleHover = (id: string | null) => {
    if (enableHover) {
      setActiveId(id);
      if (onValueChange) onValueChange(id);
    }
  };

  return (
    <div
      className="relative inline-flex items-center p-1.5 gap-1.5 bg-black/20 backdrop-blur-md rounded-full border border-white/10 shadow-inner"
      onMouseLeave={() => handleHover(defaultValue ?? null)}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;

        const id = (child.props as any)["data-id"];
        const isSelected = activeId === id;

        return (
          <div
            key={id}
            className="relative inline-flex items-center cursor-pointer"
            onMouseEnter={() => handleHover(id)}
          >
            {isSelected && (
              <motion.div
                layoutId={`animated-bg-${uniqueId}`}
                className={cn("absolute inset-0 z-0 rounded-full", className)}
                transition={transition}
              />
            )}
            <div className="relative z-10">{child}</div>
          </div>
        );
      })}
    </div>
  );
}

export default AnimatedBackground;
