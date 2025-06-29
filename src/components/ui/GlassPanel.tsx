import React from 'react';
import { motion } from 'framer-motion';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glowEffect?: boolean;
  onClick?: () => void;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = '',
  hoverEffect = false,
  glowEffect = false,
  onClick,
}) => {
  const baseClasses = 'relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden';
  const hoverClasses = hoverEffect ? 'hover:border-white/20 hover:bg-white/10 transition-all duration-300' : '';
  const glowClasses = glowEffect ? 'before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-indigo-500/20 before:via-purple-500/20 before:to-pink-500/20 before:opacity-0 before:transition-opacity hover:before:opacity-100' : '';
  
  return (
    <motion.div
      className={`${baseClasses} ${hoverClasses} ${glowClasses} ${className}`}
      whileHover={hoverEffect ? { y: -5, scale: 1.02 } : {}}
      transition={{ duration: 0.3 }}
      onClick={onClick}
    >
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};