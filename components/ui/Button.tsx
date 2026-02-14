/**
 * Button Component
 *
 * Linear-inspired button with variants and sizes.
 */

'use client';

import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-lg font-medium',
          'transition-all duration-200 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:opacity-50 disabled:pointer-events-none',

          // Variants
          {
            // Default (primary) - accent color
            'bg-accent text-white hover:bg-accent-hover active:scale-95':
              variant === 'default',

            // Secondary - subtle background
            'bg-background-tertiary text-foreground border border-border hover:bg-background-hover hover:border-border-focus':
              variant === 'secondary',

            // Ghost - no background
            'text-foreground-secondary hover:bg-background-tertiary hover:text-foreground':
              variant === 'ghost',

            // Danger - red for destructive actions
            'bg-error text-white hover:bg-error/90 active:scale-95':
              variant === 'danger',
          },

          // Sizes
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
          },

          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
