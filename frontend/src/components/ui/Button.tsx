import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'premium' | 'glass';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  as?: 'link';
  href?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 focus:ring-emerald-500/50 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/40',
  secondary:
    'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 focus:ring-zinc-500/50 border border-zinc-700 hover:border-zinc-600',
  danger:
    'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500/50 shadow-lg shadow-red-900/20',
  ghost:
    'bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 focus:ring-zinc-500/50',
  outline:
    'bg-transparent text-zinc-200 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 focus:ring-zinc-500/50',
  premium:
    'btn-gradient text-white font-bold shadow-[0_18px_45px_rgba(65,211,155,0.25)] hover:shadow-[0_18px_60px_rgba(65,211,155,0.35)]',
  glass:
    'btn-glass text-zinc-200 hover:text-white font-medium',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-4 py-2 text-sm gap-2 rounded-lg',
  lg: 'px-6 py-3 text-base gap-2.5 rounded-xl',
  xl: 'px-8 py-4 text-lg gap-3 rounded-2xl',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      as,
      href,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const classes = [
      'group inline-flex items-center justify-center font-semibold transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-zinc-950',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'active:scale-[0.98]',
      variantStyles[variant],
      sizeStyles[size],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const content = (
      <>
        {loading ? (
          <Loader2 className="animate-spin shrink-0" size={size === 'sm' ? 14 : size === 'xl' ? 22 : 16} />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        {children && <span>{children}</span>}
        {!loading && rightIcon && <span className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">{rightIcon}</span>}
      </>
    );

    if (as === 'link' && href) {
      return (
        <Link href={href} className={classes}>
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {content}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
