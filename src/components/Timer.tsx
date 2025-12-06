import React from 'react';
import { Timer as TimerIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface TimerProps {
  seconds: number;
  label?: string;
  variant?: 'default' | 'urgent';
}

export const Timer: React.FC<TimerProps> = ({ seconds, label, variant = 'default' }) => {
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const isUrgent = seconds < 10 || variant === 'urgent';

  return (
    <div className={clsx(
      "flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-sm font-medium transition-colors",
      isUrgent ? "text-red-600 bg-red-50 border border-red-200" : "text-gray-700 bg-white border border-gray-200"
    )}>
      <TimerIcon size={16} />
      {label && <span className="mr-1">{label}:</span>}
      <span>{formatTime(seconds)}</span>
    </div>
  );
};
