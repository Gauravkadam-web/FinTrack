"use client";

import React, { useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // max tilt angle in degrees
  glareEffect?: boolean;
  scaleOnHover?: number;
}

export function TiltCard({
  children,
  className,
  maxTilt = 10,
  glareEffect = true,
  scaleOnHover = 1.02,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for normalized cursor position (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring physics for natural tactile feel
  const springConfig = { damping: 20, stiffness: 260, mass: 0.5 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  // Transform coordinates to 3D rotation angles
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-maxTilt, maxTilt]);

  // Transform coordinates to glare reflection gradient position
  const glareX = useTransform(smoothX, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(smoothY, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate normalized position between -0.5 and 0.5
      x.set(mouseX / width - 0.5);
      y.set(mouseY / height - 0.5);
    },
    [x, y]
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
        rotateX,
        rotateY,
        scale: isHovered ? scaleOnHover : 1,
      }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative rounded-2xl transition-shadow duration-300",
        isHovered
          ? "shadow-2xl shadow-primary-500/10 dark:shadow-primary-500/5"
          : "shadow-md",
        className
      )}
      {...(props as any)}
    >
      {/* Glossy specular glare overlay */}
      {glareEffect && isHovered && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-30 rounded-2xl overflow-hidden opacity-40 mix-blend-overlay transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 60%)`,
          }}
        />
      )}

      {/* Card Content with 3D child preservation */}
      <div className="relative z-10 h-full w-full" style={{ transformStyle: "preserve-3d" }}>
        {children}
      </div>
    </motion.div>
  );
}
