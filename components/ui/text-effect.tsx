"use client";

import React from "react";
import { motion, type Variants, type TargetAndTransition } from "motion/react";
import { cn } from "@/lib/utils";

type PresetType = "fade-in-blur" | "fade" | "scale" | "slide";
type PerType = "words" | "chars" | "line";

interface TextEffectProps {
  children: string;
  className?: string;
  preset?: PresetType;
  per?: PerType;
  as?: React.ElementType;
  delay?: number;
  staggerDuration?: number;
  segmentWrapperClassName?: string;
}

const defaultContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (custom: { delay: number; staggerDuration: number }) => ({
    opacity: 1,
    transition: {
      delayChildren: custom.delay,
      staggerChildren: custom.staggerDuration,
    },
  }),
};

const presetVariants: Record<
  PresetType,
  { hidden: TargetAndTransition; visible: TargetAndTransition }
> = {
  "fade-in-blur": {
    hidden: { opacity: 0, filter: "blur(12px)", y: 12 },
    visible: { opacity: 1, filter: "blur(0px)", y: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
  slide: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
};

export function TextEffect({
  children,
  className,
  preset = "fade-in-blur",
  per = "words",
  as: Component = "p",
  delay = 0,
  staggerDuration = 0.08,
  segmentWrapperClassName,
}: TextEffectProps) {
  const selectedPreset = presetVariants[preset];

  const itemVariants: Variants = {
    hidden: selectedPreset.hidden,
    visible: {
      ...selectedPreset.visible,
      transition: { duration: 0.5, ease: [0.2, 0.65, 0.3, 0.9] },
    },
  };

  const segments = per === "words" ? children.split(" ") : children.split("");

  return (
    <Component className={cn("inline-block", className)}>
      <motion.span
        variants={defaultContainerVariants}
        initial="hidden"
        animate="visible"
        custom={{ delay, staggerDuration }}
        className="inline-block"
      >
        {segments.map((segment, i) => (
          <motion.span
            key={`${segment}-${i}`}
            variants={itemVariants}
            className={cn(
              "inline-block",
              per === "words" && "mr-[0.25em] whitespace-pre",
              segmentWrapperClassName
            )}
          >
            {segment}
          </motion.span>
        ))}
      </motion.span>
    </Component>
  );
}

export default TextEffect;
