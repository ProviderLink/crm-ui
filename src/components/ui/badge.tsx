/* eslint-disable react-refresh/only-export-components */
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded font-mono text-[10px] font-medium uppercase tracking-[0.08em] px-2 py-0.5 border transition-colors duration-150',
  {
    variants: {
      variant: {
        default: 'border-white/10 bg-white/[0.04] text-text-secondary',
        secondary: 'border-white/10 bg-white/[0.04] text-text-secondary',
        destructive: 'border-destructive/20 bg-destructive/10 text-destructive',
        outline: 'border-border text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
