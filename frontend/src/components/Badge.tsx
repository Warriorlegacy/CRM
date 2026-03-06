interface BadgeProps {
  text: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export default function Badge({ text, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'border-zinc-700 bg-zinc-900 text-zinc-300',
    success: 'border-green-800 bg-green-900/30 text-green-400',
    warning: 'border-yellow-800 bg-yellow-900/30 text-yellow-400',
    danger: 'border-red-800 bg-red-900/30 text-red-400',
  };

  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border ${variants[variant]}`}>
      {text}
    </span>
  );
}
