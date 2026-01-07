import * as React from 'react';
import { cn } from '@/lib/utils';

// Simple ScrollArea replacement using native CSS
export function ScrollArea({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('overflow-auto', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ScrollBar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props} />;
}
