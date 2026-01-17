import * as React from 'react';
import { cn } from '@/lib/utils';

interface PulsingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  isPulsing: boolean;
  children: React.ReactNode;
}

/**
 * A wrapper component that adds a pulsing glow animation to indicate active work.
 * When isPulsing is true, displays a sky-500 colored ring with pulse animation.
 */
export function PulsingCard({
  isPulsing,
  children,
  className,
  ...props
}: PulsingCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl transition-all',
        isPulsing && 'animate-pulse ring-2 ring-sky-500/50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default PulsingCard;
