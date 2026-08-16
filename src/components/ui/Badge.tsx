import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  tone?: Tone;
  className?: string;
  children: ReactNode;
  dot?: boolean;
}

const tones: Record<Tone, string> = {
  default: 'bg-secondary text-secondary-foreground',
  primary: 'bg-primary-50 text-primary-700 dark:bg-primary-50/15 dark:text-primary-300',
  success: 'bg-success-50 text-success-700 dark:bg-success-50/15 dark:text-success-500',
  warning: 'bg-warning-50 text-warning-700 dark:bg-warning-50/15 dark:text-warning-500',
  danger: 'bg-danger-50 text-danger-700 dark:bg-danger-50/15 dark:text-danger-500',
  info: 'bg-info-50 text-info-600 dark:bg-info-50/15 dark:text-info-500',
  neutral: 'bg-muted text-muted-foreground',
};

const dotColors: Record<Tone, string> = {
  default: 'bg-muted-foreground',
  primary: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  info: 'bg-info-500',
  neutral: 'bg-muted-foreground',
};

export function Badge({ tone = 'default', className, children, dot = false }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[tone])} />}
      {children}
    </span>
  );
}
