interface NotificationBadgeProps {
  count: number;
  variant?: 'default' | 'urgent';
}

export default function NotificationBadge({ count, variant = 'default' }: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count;

  const variants = {
    default: 'bg-red-500 text-white',
    urgent: 'bg-red-600 text-white animate-pulse',
  };

  return (
    <span
      className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full ${variants[variant]}`}
    >
      {displayCount}
    </span>
  );
}
