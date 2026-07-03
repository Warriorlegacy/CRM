type SkeletonVariant = 'text' | 'circle' | 'rect' | 'card';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

const variantDefaults: Record<SkeletonVariant, { width: string; height: string }> = {
  text: { width: '100%', height: '1rem' },
  circle: { width: '2.5rem', height: '2.5rem' },
  rect: { width: '100%', height: '8rem' },
  card: { width: '100%', height: '12rem' },
};

const roundedStyles: Record<SkeletonVariant, string> = {
  text: 'rounded',
  circle: 'rounded-full',
  rect: 'rounded-lg',
  card: 'rounded-xl',
};

export default function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
}: SkeletonProps) {
  const defaults = variantDefaults[variant];

  return (
    <div
      className={`bg-zinc-800 animate-pulse ${roundedStyles[variant]} ${className}`}
      style={{
        width: width ?? defaults.width,
        height: height ?? defaults.height,
      }}
    />
  );
}
