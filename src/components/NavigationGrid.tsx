import React from 'react';
import { useQuizStore } from '../store/quizStore';
import { clsx } from 'clsx';
import { Flag } from 'lucide-react';

export const NavigationGrid: React.FC = () => {
    const { config, currentQuestionIndex, answers, flaggedQuestions, jumpToQuestion } = useQuizStore();

    if (!config) return null;

    return (
        <div className="glass-panel p-4 rounded-2xl mb-6">
            <h3 className="text-sm font-semibold text-glass-secondary uppercase tracking-wider mb-3">Question Navigator</h3>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {config.questions.map((q, idx) => {
                    const isCurrent = idx === currentQuestionIndex;
                    const isAttempted = answers[q.id] && answers[q.id].length > 0;
                    const isFlagged = flaggedQuestions.includes(q.id);

                    return (
                        <button
                            key={q.id}
                            onClick={() => jumpToQuestion(idx)}
                            className={clsx(
                                "relative w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-transparent focus:ring-indigo-500 backdrop-blur-sm",
                                isCurrent 
                                    ? "bg-indigo-500 text-white ring-2 ring-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                                    : isAttempted
                                        ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 border border-indigo-500/30"
                                        : "bg-white/5 text-glass-secondary hover:bg-white/10 border border-white/10"
                            )}
                            title={`Go to Question ${idx + 1}`}
                        >
                            {idx + 1}
                            {isFlagged && (
                                <div className="absolute -top-1 -right-1">
                                    <Flag className="w-3 h-3 text-orange-400 fill-orange-400 drop-shadow-sm" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
            
            <div className="mt-4 flex gap-4 text-xs text-glass-secondary justify-center">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-indigo-600"></div> Current
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-indigo-100 border border-indigo-200"></div> Attempted
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-gray-100"></div> Unattempted
                </div>
                <div className="flex items-center gap-1">
                    <Flag className="w-3 h-3 text-orange-500 fill-orange-500" /> Flagged
                </div>
            </div>
        </div>
    );
};
