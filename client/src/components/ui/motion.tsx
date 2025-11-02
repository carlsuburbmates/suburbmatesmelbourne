import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

/**
 * Motion Wrapper Components for Enhanced Design System
 * Provides reusable animation patterns with Framer Motion
 */

// Fade in animation for content
export const FadeIn = ({ 
  children, 
  delay = 0, 
  className = "" 
}: { 
  children: ReactNode; 
  delay?: number; 
  className?: string;
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

// Stagger animation for lists
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const staggerItem: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

export const StaggerList = ({ 
  children, 
  className = "" 
}: { 
  children: ReactNode; 
  className?: string;
}) => (
  <motion.div
    className={className}
    variants={staggerContainer}
    initial="hidden"
    animate="visible"
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ 
  children, 
  className = "" 
}: { 
  children: ReactNode; 
  className?: string;
}) => (
  <motion.div
    className={className}
    variants={staggerItem}
  >
    {children}
  </motion.div>
);

// Scale on hover for interactive elements
export const HoverScale = ({ 
  children, 
  scale = 1.02, 
  className = "" 
}: { 
  children: ReactNode; 
  scale?: number; 
  className?: string;
}) => (
  <motion.div
    className={className}
    whileHover={{ scale }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 400, damping: 25 }}
  >
    {children}
  </motion.div>
);

// Slide in from direction
export const SlideIn = ({ 
  children, 
  direction = "left", 
  delay = 0, 
  className = "" 
}: { 
  children: ReactNode; 
  direction?: "left" | "right" | "up" | "down";
  delay?: number; 
  className?: string;
}) => {
  const directions = {
    left: { x: -30, y: 0 },
    right: { x: 30, y: 0 },
    up: { x: 0, y: -30 },
    down: { x: 0, y: 30 }
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

// Attention-grabbing pulse for important elements
export const AttentionPulse = ({ 
  children, 
  className = "" 
}: { 
  children: ReactNode; 
  className?: string;
}) => (
  <motion.div
    className={className}
    animate={{ 
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1]
    }}
    transition={{ 
      duration: 2, 
      repeat: Infinity, 
      ease: "easeInOut" 
    }}
  >
    {children}
  </motion.div>
);