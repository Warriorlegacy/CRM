'use client';

import { MessageSquare, Instagram } from 'lucide-react';

interface ChannelBadgeProps {
  channel: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function ChannelBadge({ channel, size = 'sm', showLabel = false }: ChannelBadgeProps) {
  const isInstagram = channel === 'instagram';

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${
          isInstagram
            ? 'bg-pink-500/20 text-pink-400'
            : 'bg-emerald-500/20 text-emerald-400'
        }`}
      >
        {isInstagram ? (
          <Instagram className={iconSize[size]} />
        ) : (
          <MessageSquare className={iconSize[size]} />
        )}
      </div>
      {showLabel && (
        <span
          className={`text-xs font-medium ${
            isInstagram ? 'text-pink-400' : 'text-emerald-400'
          }`}
        >
          {isInstagram ? 'Instagram' : 'WhatsApp'}
        </span>
      )}
    </div>
  );
}

export function ChannelDot({ channel }: { channel: string }) {
  const isInstagram = channel === 'instagram';
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${
        isInstagram ? 'bg-pink-400' : 'bg-emerald-400'
      }`}
    />
  );
}
