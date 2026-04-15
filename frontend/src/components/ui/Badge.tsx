import { ReactNode } from 'react';

type BadgeVariant = 'blue' | 'green' | 'yellow' | 'red' | 'gray';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  green:  'bg-green-500/10 text-green-400 border-green-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  red:    'bg-red-500/10 text-red-400 border-red-500/20',
  gray:   'bg-white/5 text-gray-400 border-white/10',
};

export default function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border
        ${variantClasses[variant]} ${className}
      `}
    >
      {children}
    </span>
  );
}
