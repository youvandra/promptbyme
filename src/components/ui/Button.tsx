import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  href,
  to,
  onClick,
  disabled = false,
  className = '',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  type = 'button',
}) => {
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300';
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
  };
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/20 hover:scale-105',
    secondary: 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/15 hover:scale-105',
    outline: 'bg-transparent border border-white/20 text-white hover:bg-white/5 hover:border-white/30 hover:scale-105',
    ghost: 'bg-transparent text-white hover:bg-white/5 hover:scale-105',
  };
  
  // Disabled classes
  const disabledClasses = 'opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-none';
  
  // Full width class
  const fullWidthClass = fullWidth ? 'w-full' : '';
  
  // Combine all classes
  const classes = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${disabled ? disabledClasses : ''}
    ${fullWidthClass}
    ${className}
  `;
  
  // Content with icon
  const content = (
    <>
      {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </>
  );
  
  // Render as motion component
  const MotionComponent = motion.button;
  
  // Render based on the type of button (link, router link, or button)
  if (href) {
    return (
      <motion.a
        href={href}
        className={classes}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
      >
        {content}
      </motion.a>
    );
  }
  
  if (to) {
    return (
      <motion.div
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
      >
        <Link to={to} className={classes}>
          {content}
        </Link>
      </motion.div>
    );
  }
  
  return (
    <MotionComponent
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      {content}
    </MotionComponent>
  );
};