import { useState } from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  online?: boolean;
  className?: string;
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; dot: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]', dot: 'w-2 h-2 -bottom-0 -right-0' },
  sm: { container: 'w-8 h-8', text: 'text-xs', dot: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5' },
  md: { container: 'w-10 h-10', text: 'text-sm', dot: 'w-3 h-3 -bottom-0.5 -right-0.5' },
  lg: { container: 'w-12 h-12', text: 'text-base', dot: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5' },
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const bgColors = [
  'bg-emerald-600',
  'bg-blue-600',
  'bg-purple-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-cyan-600',
];

function getColorForName(name?: string): string {
  if (!name) return bgColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
}

export default function Avatar({
  src,
  alt,
  name,
  size = 'md',
  online,
  className = '',
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const styles = sizeStyles[size];
  const showImage = src && !imgError;

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <div
        className={[
          styles.container,
          'rounded-full flex items-center justify-center font-medium text-white overflow-hidden',
          showImage ? '' : getColorForName(name),
        ].join(' ')}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className={styles.text}>{getInitials(name)}</span>
        )}
      </div>
      {online !== undefined && (
        <span
          className={[
            'absolute block rounded-full border-2 border-zinc-900',
            styles.dot,
            online ? 'bg-emerald-400' : 'bg-zinc-600',
          ].join(' ')}
        />
      )}
    </div>
  );
}
