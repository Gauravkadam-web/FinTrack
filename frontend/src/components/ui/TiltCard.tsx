"use client";

import React, { useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // max tilt angle in degrees (8-12 deg)
  sheenEffect?: boolean;
  scaleOnHover?: number; // 1.01 - 1.03
}

export function TiltCard({
  children,
  className,
  maxTilt = 10,
  sheenEffect = true,
  scaleOnHover = 1.02,
  style,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Motion values for normalized cursor position (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Exact spring physics: stiffness 150, damping 20
  const springConfig = { damping: 20, stiffness: 150, mass: 0.5 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  // Transform coordinates to 3D rotation angles (rotateX/rotateY ±8-12 deg max)
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-maxTilt, maxTilt]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (shouldReduceMotion || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      x.set(mouseX / width - 0.5);
      y.set(mouseY / height - 0.5);
    },
    [x, y, shouldReduceMotion]
  );

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1000,
        rotateX: shouldReduceMotion ? 0 : rotateX,
        rotateY: shouldReduceMotion ? 0 : rotateY,
        scale: isHovered && !shouldReduceMotion ? scaleOnHover : 1,
        willChange: isHovered ? "transform" : "auto",
        ...style,
      }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative rounded-2xl overflow-hidden bg-surface-50 border border-border text-foreground transition-shadow duration-300",
        isHovered
          ? "shadow-xl dark:shadow-2xl dark:shadow-black/50 border-slate-300 dark:border-slate-700/80"
          : "shadow-sm border-border",
        className
      )}
      {...(props as any)}
    >
      {/* Sheen sweep: diagonal gradient band (35% width) sweep left->right on hover */}
      {sheenEffect && !shouldReduceMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
        >
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={
              isHovered
                ? { x: "200%", opacity: [0, 0.35, 0] }
                : { x: "-100%", opacity: 0 }
            }
            transition={{
              duration: 0.85,
              ease: [0.4, 0.0, 0.2, 1],
            }}
            className="w-[35%] h-full bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent transform -skew-x-25"
          />
        </motion.div>
      )}

      {/* 3D Child Content with preserve-3d */}
      <div
        className="relative z-10 h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
      </div>
    </motion.div>
  );
}
