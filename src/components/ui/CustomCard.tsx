
import React from 'react';
import { cn } from '@/lib/utils';

interface CustomCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'elevated' | 'neon' | 'forest' | 'coral' | 'lavender';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const CustomCard = ({ 
  children, 
  className, 
  variant = 'default', 
  padding = 'md',
  ...props 
}: CustomCardProps) => {
  return (
    <div 
      className={cn(
        "rounded-xl overflow-hidden",
        // Variants
        variant === 'default' && "bg-card border border-border/40 shadow-apple-sm dark:shadow-none",
        variant === 'glass' && "glass-card",
        variant === 'elevated' && "elevated-card",
        variant === 'neon' && "bg-card border border-neon-purple shadow-neon-sm dark:shadow-neon-md",
        variant === 'forest' && "bg-white border-l-4 border-l-forest shadow-apple-sm dark:bg-card/80",
        variant === 'coral' && "bg-white border-l-4 border-l-coral shadow-apple-sm dark:bg-card/80",
        variant === 'lavender' && "bg-white border-l-4 border-l-lavender shadow-apple-sm dark:bg-card/80",
        // Padding
        padding === 'none' && "p-0",
        padding === 'sm' && "p-3",
        padding === 'md' && "p-5",
        padding === 'lg' && "p-7",
        // Additional classes
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default CustomCard;
