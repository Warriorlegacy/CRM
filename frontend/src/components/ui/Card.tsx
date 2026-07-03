import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  clickable?: boolean;
}

interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function CardHeader({ children, className = '', ...props }: CardSectionProps) {
  return (
    <div className={`px-6 py-4 border-b border-zinc-800 ${className}`} {...props}>
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
    <div className={`px-6 py-4 border-t border-zinc-800 ${className}`} {...props}>
      {children}
    </div>
  );
}

export default function Card({
  children,
  hover = false,
  clickable = false,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'glass-panel rounded-xl',
        hover ? 'transition-all duration-200 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/20' : '',
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
