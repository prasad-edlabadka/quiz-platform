import React from 'react';
import { useQuizStore } from '../store/quizStore';
import { ArrowLeft, Clock, Award, Trash2, Eye, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface PastResultsViewProps {
    onBack: () => void;
}

export const PastResultsView: React.FC<PastResultsViewProps> = ({ onBack }) => {
    const { pastResults, loadPastResult, deletePastResult, themeMode } = useQuizStore();
    const isDark = themeMode === 'dark';

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="w-full max-h-[80vh] flex flex-col glass-panel rounded-3xl p-6 md:p-8 relative min-h-[500px]">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className={`p-2 rounded-full transition-colors ${isDark ? 'text-indigo-400 hover:bg-white/10' : 'text-indigo-600 hover:bg-black/5'}`}
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 drop-shadow-sm">
                        Past Results
                    </h1>
                </div>
            </div>

            {pastResults.length === 0 ? (
                <div className="glass-panel p-16 rounded-2xl flex flex-col items-center justify-center text-center flex-1">
                    <Award className="w-16 h-16 mb-4 text-indigo-400/50" />
                    <h2 className="text-2xl font-bold mb-2 text-glass-primary">No Past Results Yet</h2>
                    <p className="text-glass-secondary mb-8">Complete a quiz to see your history here.</p>
                    <button
                        onClick={onBack}
                        className="glass-button-primary px-8 py-3 rounded-xl font-bold transition-all hover:scale-105"
                    >
                        Go Practice
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
                    {pastResults.map((result) => {
                        let totalScore = 0;
                        let maxScore = 0;

                        if (result.config && result.config.questions) {
                            result.config.questions.forEach(q => {
                                const selected = result.answers?.[q.id] || [];
                                const questionPoints = q.points || 1;
                                maxScore += questionPoints;

                                if (q.options) {
                                    const correctOptions = q.options.filter(o => o.isCorrect).map(o => o.id);
                                    if (correctOptions.length > 0) {
                                        const isCorrect = selected.length === correctOptions.length &&
                                            selected.every(id => correctOptions.includes(id));
                                        if (isCorrect) totalScore += questionPoints;
                                    }
                                } else if (q.type === 'text') {
                                    if (result.evaluations?.[q.id]) {
                                        totalScore += result.evaluations[q.id].score;
                                    }
                                }
                            });
                        }

                        const scoreInfo = { score: totalScore, max: maxScore };

                        const timeSpent = Object.values(result.questionTimeTaken || {}).reduce((a, b) => a + b, 0);

                        return (
                            <motion.div
                                key={result.attemptId}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                whileHover={{ scale: 1.01 }}
                                className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between group transition-all hover:bg-white/5 border border-white/5 hover:border-white/10"
                            >
                                <div className="flex-1 min-w-0 pr-4 mb-3 sm:mb-0">
                                    <h3 className="font-bold text-base text-glass-primary mb-1 truncate" title={result.config.title}>
                                        {result.config.title || 'Untitled Quiz'}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-3 md:gap-4 text-[11px] text-glass-secondary font-medium">
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-indigo-400/70" /> {formatDate(result.date)}</span>
                                        <span className="flex items-center gap-1"><Award className="w-3 h-3 text-emerald-400/70" /> <span className={scoreInfo.max > 0 ? "text-emerald-400" : ""}>{scoreInfo.max > 0 ? `${Math.round((scoreInfo.score / scoreInfo.max) * 100)}%` : 'N/A'}</span></span>
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-400/70" /> {Math.floor(timeSpent / 60)}m {timeSpent % 60}s</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-white/5 sm:border-t-0">
                                    <button
                                        onClick={() => loadPastResult(result.attemptId)}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 p-2 px-3 glass-button rounded-lg text-indigo-400 font-medium hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                                        title="View Details & PDF"
                                    >
                                        <Eye className="w-4 h-4" />
                                        <span className="text-xs">Review</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Are you sure you want to delete this result?')) {
                                                deletePastResult(result.attemptId);
                                            }
                                        }}
                                        className="p-2 text-glass-secondary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        title="Delete Result"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
