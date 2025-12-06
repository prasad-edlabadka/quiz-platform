import React, { useState } from 'react';
import { useQuizStore } from '../store/quizStore';
import { clsx } from 'clsx';
import { Flag, X, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CompactNavigation: React.FC = () => {
    const { config, currentQuestionIndex, answers, flaggedQuestions, jumpToQuestion } = useQuizStore();
    const [isOpen, setIsOpen] = useState(false);

    if (!config) return null;

    return (
        <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium transition-colors"
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
                        <div
                            key={q.id}
                            className={clsx(
                                "w-2 h-2 rounded-full",
                                isFlagged ? "bg-orange-500" :
                                isAttempted ? "bg-indigo-500" :
                                "bg-gray-200",
                                isCurrent && "ring-1 ring-offset-1 ring-gray-400"
                            )}
                            title={`Q${idx + 1}: ${isFlagged ? 'Flagged' : isAttempted ? 'Attempted' : 'Unattempted'}`}
                        />
                    );
                })}
             </div>

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
                            transition={{ type: 'spring', damping: 20 }}
                            className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 p-6 overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-900 text-lg">Question Map</h3>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
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
                                                "relative w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold transition-all",
                                                isCurrent 
                                                    ? "bg-indigo-600 text-white shadow-lg scale-110 ring-2 ring-indigo-200" 
                                                    : isFlagged
                                                        ? "bg-orange-500 text-white ring-2 ring-orange-200" // Orange for flagged
                                                        : isAttempted
                                                            ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                                                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                            )}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-8 space-y-3">
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Legend</h4>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="w-4 h-4 rounded bg-indigo-600"></div> Current
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="w-4 h-4 rounded bg-orange-500"></div> Flagged
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="w-4 h-4 rounded bg-indigo-100 border border-indigo-200"></div> Attempted
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="w-4 h-4 rounded bg-gray-100"></div> Unattempted
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
             </AnimatePresence>
        </div>
    );
};
