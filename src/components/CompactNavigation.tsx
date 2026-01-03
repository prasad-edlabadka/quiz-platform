import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuizStore } from '../store/quizStore';
import { clsx } from 'clsx';
import { X, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CompactNavigation: React.FC = () => {
    const { config, currentQuestionIndex, answers, flaggedQuestions, jumpToQuestion } = useQuizStore();
    const [isOpen, setIsOpen] = useState(false);

    if (!config) return null;

    return (
        <div className="mb-6 flex justify-between items-center glass-panel p-4 rounded-2xl">
             <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 text-glass-secondary hover:text-glass-primary font-medium transition-colors"
             >
                <Map className="w-5 h-5" />
                <span className="hidden sm:inline">Question Map</span>
             </button>

             {/* Mini Map */}
             <div className="flex gap-1.5 flex-wrap justify-end max-w-[200px] sm:max-w-xs">
                {config.questions.map((q, idx) => {
                    const isFlagged = flaggedQuestions.includes(q.id);
                    const isAttempted = answers[q.id] && answers[q.id].length > 0;
                    const isCurrent = idx === currentQuestionIndex;

                    return (
                        <button
                            key={q.id}
                            onClick={() => jumpToQuestion(idx)}
                            className={clsx(
                                "w-2 h-2 rounded-full transition-all hover:scale-150",
                                isFlagged ? "bg-orange-500" :
                                isAttempted ? "bg-indigo-500" :
                                "bg-black/20 dark:bg-gray-600 hover:bg-glass-primary",
                                isCurrent && "ring-2 ring-offset-2 ring-glass-primary scale-125"
                            )}
                            title={`Q${idx + 1}: ${isFlagged ? 'Flagged' : isAttempted ? 'Attempted' : 'Unattempted'}`}
                        />
                    );
                })}
             </div>

             {createPortal(
                 <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                            />
                            
                            {/* Drawer */}
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
                                className="fixed right-0 top-0 bottom-0 w-80 glass-panel border-l border-white/10 shadow-2xl z-50 p-6 overflow-y-auto"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-glass-primary text-lg">Question Map</h3>
                                    <button 
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5 text-glass-secondary hover:text-glass-primary" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-5 gap-3">
                                    {config.questions.map((q, idx) => {
                                        const isCurrent = idx === currentQuestionIndex;
                                        const isAttempted = answers[q.id] && answers[q.id].length > 0;
                                        const isFlagged = flaggedQuestions.includes(q.id);

                                        return (
                                            <button
                                                key={q.id}
                                                onClick={() => {
                                                    jumpToQuestion(idx);
                                                    setIsOpen(false);
                                                }}
                                                className={clsx(
                                                    "relative w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold transition-all backdrop-blur-sm",
                                                    isCurrent 
                                                        ? "bg-indigo-500 text-white shadow-lg scale-110 ring-2 ring-indigo-400" 
                                                        : isFlagged
                                                            ? "bg-orange-500/80 text-white ring-2 ring-orange-400" 
                                                            : isAttempted
                                                                ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-200 border border-indigo-500/30"
                                                                : "bg-black/5 dark:bg-white/5 text-glass-secondary hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10"
                                                )}
                                            >
                                                {idx + 1}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-8 space-y-3">
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Legend</h4>
                                    <div className="flex items-center gap-2 text-sm text-glass-secondary">
                                        <div className="w-4 h-4 rounded bg-indigo-500"></div> Current
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-glass-secondary">
                                        <div className="w-4 h-4 rounded bg-orange-500/80"></div> Flagged
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-glass-secondary">
                                        <div className="w-4 h-4 rounded bg-indigo-500/20 border border-indigo-500/30"></div> Attempted
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-glass-secondary">
                                        <div className="w-4 h-4 rounded bg-white/5 border border-white/10"></div> Unattempted
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                 </AnimatePresence>,
                 document.body
             )}
        </div>
    );
};
