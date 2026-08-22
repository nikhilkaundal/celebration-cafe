"use client";

import { motion, AnimatePresence, type Transition } from "motion/react";
import React, { Children, cloneElement, useState } from "react";

interface AnimatedBackgroundProps {
  children: React.ReactElement[];
  defaultValue?: string;
  onValueChange?: (newActiveId: string | null) => void;
  className?: string;
  transition?: Transition;
  enableHover?: boolean;
}

export function AnimatedBackground({
  children,
  defaultValue,
  onValueChange,
  className = "",
  transition = {
    type: "spring",
    bounce: 0.15,
    duration: 0.35,
  },
  enableHover = false,
}: AnimatedBackgroundProps) {
  const [activeId, setActiveId] = useState<string | null>(defaultValue || null);

  const handleSetActiveId = (id: string | null) => {
    setActiveId(id);
    if (onValueChange) {
      onValueChange(id);
    }
  };

  return (
    <div className="flex flex-row items-center relative p-1.5 gap-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 shadow-inner">
      {Children.map(children, (child, index) => {
        const id = child.props["data-id"] ?? index.toString();
        const isActive = activeId === id;

        return (
          <div
            key={id}
            className="relative"
            onMouseEnter={() => {
              if (enableHover) handleSetActiveId(id);
            }}
            onMouseLeave={() => {
              if (enableHover) handleSetActiveId(defaultValue ?? null);
            }}
          >
            <AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="animated-tab-background-pill"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={transition}
                  className={`absolute inset-0 z-0 ${className}`}
                />
              )}
            </AnimatePresence>
            <div className="relative z-10">{child}</div>
          </div>
        );
      })}
    </div>
  );
}

export default AnimatedBackground;
