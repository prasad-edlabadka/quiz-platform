import React from 'react';
import { Clock } from 'lucide-react';
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
      "flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-sm font-medium transition-colors backdrop-blur-sm border",
      isUrgent 
        ? "text-red-600 dark:text-red-300 bg-red-500/20 border-red-500/40 shadow-red-900/20 shadow-sm" 
        : "text-glass-primary bg-black/5 dark:bg-white/10 border-black/5 dark:border-white/20"
    )}>
      <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-500 dark:text-red-400' : 'text-glass-secondary'}`} />
      {label && <span className="text-xs text-glass-secondary font-medium hidden sm:inline">{label}:</span>}
      <span className={`font-mono font-bold ${isUrgent ? 'text-red-600 dark:text-red-300' : 'text-glass-primary'}`}>{formatTime(seconds)}</span>
    </div>
  );
};
