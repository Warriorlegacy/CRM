import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  closable?: boolean;
  onClose?: () => void;
  dot?: boolean;
  children?: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'border-zinc-700 bg-zinc-900 text-zinc-300',
  success: 'border-green-800 bg-green-900/30 text-green-400',
  warning: 'border-yellow-800 bg-yellow-900/30 text-yellow-400',
  danger: 'border-red-800 bg-red-900/30 text-red-400',
  info: 'border-blue-800 bg-blue-900/30 text-blue-400',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-zinc-400',
  success: 'bg-green-400',
  warning: 'bg-yellow-400',
  danger: 'bg-red-400',
  info: 'bg-blue-400',
};

export default function Badge({
  text,
  variant = 'default',
  closable = false,
  onClose,
  dot = false,
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${variantStyles[variant]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />
      )}
      {children || text}
      {closable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          className="shrink-0 p-0.5 -mr-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}
