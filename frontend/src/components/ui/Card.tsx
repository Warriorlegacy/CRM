import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  clickable?: boolean;
  variant?: 'default' | 'strong' | 'light' | 'premium';
}

interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function CardHeader({ children, className = '', ...props }: CardSectionProps) {
  return (
    <div className={`px-6 py-4 border-b border-white/[0.06] ${className}`} {...props}>
      {children}
    </div>
  );
}

function CardContent({ children, className = '', ...props }: CardSectionProps) {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

function CardFooter({ children, className = '', ...props }: CardSectionProps) {
  return (
    <div className={`px-6 py-4 border-t border-white/[0.06] ${className}`} {...props}>
      {children}
    </div>
  );
}

const variantStyles = {
  default: 'glass-panel',
  strong: 'glass-panel-strong',
  light: 'glass-panel-light',
  premium: 'glass-panel-strong border-gradient',
};

export default function Card({
  children,
  hover = false,
  clickable = false,
  variant = 'default',
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'rounded-xl',
        variantStyles[variant],
        hover ? 'card-hover-premium' : '',
        clickable ? 'cursor-pointer' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}

export { CardHeader, CardContent, CardFooter };
