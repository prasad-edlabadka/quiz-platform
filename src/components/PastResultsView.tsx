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
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
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
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-panel p-6 rounded-2xl flex flex-col relative group transition-all hover:shadow-lg"
                            >
                                <button
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this result?')) {
                                            deletePastResult(result.attemptId);
                                        }
                                    }}
                                    className="absolute top-4 right-4 p-2 text-glass-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-red-500/10"
                                    title="Delete Result"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <div className="mb-4">
                                    <h3 className="font-bold text-lg text-glass-primary mb-1 line-clamp-2" title={result.config.title}>
                                        {result.config.title || 'Untitled Quiz'}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-glass-secondary">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(result.date)}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6 mt-auto">
                                    <div className="glass-option p-3 rounded-xl border border-white/5">
                                        <div className="text-2xl font-black text-indigo-500 mb-1">
                                            {scoreInfo.max > 0 ? `${Math.round((scoreInfo.score / scoreInfo.max) * 100)}%` : 'N/A'}
                                        </div>
                                        <div className="text-[10px] font-bold text-glass-secondary uppercase tracking-widest flex items-center gap-1">
                                            <Award className="w-3 h-3" /> Score
                                        </div>
                                    </div>

                                    <div className="glass-option p-3 rounded-xl border border-white/5">
                                        <div className="text-2xl font-black text-glass-primary mb-1">
                                            {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
                                        </div>
                                        <div className="text-[10px] font-bold text-glass-secondary uppercase tracking-widest flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Time
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => loadPastResult(result.attemptId)}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 glass-button rounded-xl font-bold transition-all text-indigo-500 hover:text-indigo-400"
                                >
                                    <Eye className="w-4 h-4" />
                                    View Details & PDF
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
