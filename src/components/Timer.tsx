import React from 'react';
import { Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { useQuizStore } from '../store/quizStore';

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

  const { themeMode } = useQuizStore();
  const isDark = themeMode === 'dark';

  const isUrgent = seconds < 10 || variant === 'urgent';

  return (
    <div className={clsx(
      "flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-sm font-medium transition-colors backdrop-blur-sm border",
      isUrgent
        ? (isDark ? "text-red-300 bg-red-500/20 border-red-500/40 shadow-red-900/20 shadow-sm" : "text-red-600 bg-red-500/20 border-red-500/40 shadow-red-900/20 shadow-sm")
        : (isDark ? "text-white bg-white/10 border-white/20" : "text-glass-primary bg-black/5 border-black/5")
    )}>
      <Clock className={`w-4 h-4 ${isUrgent ? (isDark ? 'text-red-400' : 'text-red-500') : 'text-glass-secondary'}`} />
      {label && <span className="text-xs text-glass-secondary font-medium hidden sm:inline">{label}:</span>}
      <span className={`font-mono font-bold ${isUrgent ? (isDark ? 'text-red-300' : 'text-red-600') : 'text-glass-primary'}`}>{formatTime(seconds)}</span>
    </div>
  );
};
