"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpatialTransitionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function SpatialTransition({
  children,
  className,
  ...props
}: SpatialTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    initial: shouldReduceMotion
      ? { opacity: 0 }
      : {
          opacity: 0,
          scale: 0.95,
          rotateX: 4,
        },
    animate: shouldReduceMotion
      ? { opacity: 1 }
      : {
          opacity: 1,
          scale: 1,
          rotateX: 0,
        },
    exit: shouldReduceMotion
      ? { opacity: 0 }
      : {
          opacity: 0,
          scale: 0.98,
          rotateX: -2,
        },
  };

  const transition = {
    duration: shouldReduceMotion ? 0.2 : 0.32,
    ease: [0.2, 0.9, 0.3, 1], // Exact compositor-safe easing
  };

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transition}
      style={{
        transformPerspective: 1000,
        transformStyle: "preserve-3d",
      }}
      className={cn("w-full", className)}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}
