import React from 'react';
import { motion } from 'framer-motion';
import { Container } from './Container';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  animate?: boolean;
}

export const Section: React.FC<SectionProps> = ({
  children,
  className = '',
  id,
  containerSize = 'lg',
  animate = true,
}) => {
  return (
    <section id={id} className={`py-12 md:py-20 ${className}`}>
      {animate ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <Container size={containerSize}>{children}</Container>
        </motion.div>
      ) : (
        <Container size={containerSize}>{children}</Container>
      )}
    </section>
  );
};