import React, { useEffect, useState } from 'react';
import { useQuizStore } from '../store/quizStore';
import { MarkdownRenderer } from './MarkdownRenderer';
import { RefreshCw, CheckCircle, XCircle, Clock, Download, Sparkles, AlertCircle, MessageSquare, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { QuizPDF } from './QuizPDF';
import { evaluateBatchAnswers, evaluateTextAnswer } from '../services/aiService';
import { ApiKeyModal } from './ApiKeyModal';

export const ResultsView: React.FC = () => {
    const { config, answers, resetQuiz, questionTimeTaken, apiKey, evaluations, addBatchEvaluations, addEvaluation } = useQuizStore();
    const [isGrading, setIsGrading] = useState(false);
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [gradingError, setGradingError] = useState('');
    const [pendingGrading, setPendingGrading] = useState(false);

    // Re-evaluation State
    const [reEvalQuestionId, setReEvalQuestionId] = useState<string | null>(null);
    const [reEvalComment, setReEvalComment] = useState('');
    const [isReEvaluating, setIsReEvaluating] = useState(false);

    if (!config) return null;

    // Detect text questions that need grading
    const textQuestions = config.questions.filter(q => q.type === 'text' && answers[q.id]?.length > 0);
    const ungradedQuestions = textQuestions.filter(q => !evaluations[q.id]);

    useEffect(() => {
        // Trigger grading if we have ungraded questions and pending flag or auto-start
        if (ungradedQuestions.length > 0 && !isGrading) {
            if (apiKey) {
                runGrading();
            } else if (!pendingGrading) {
                 // No key, and haven't asked yet.
                 // Show modal to ask for key
                 setPendingGrading(true); // Mark that we found work to do
                 setShowKeyModal(true);
            }
        }
    }, [apiKey, evaluations, isGrading]);

    const runGrading = async () => {
        if (!apiKey || isGrading || ungradedQuestions.length === 0) return;

        setIsGrading(true);
        setGradingError('');

        try {
            const itemsToGrade = ungradedQuestions.map(q => ({
                question: q,
                userAnswer: answers[q.id][0]
            }));

            const batchResults = await evaluateBatchAnswers(apiKey, itemsToGrade);
            
            if (Object.keys(batchResults).length > 0) {
                addBatchEvaluations(batchResults);
            } else {
                 setGradingError("Failed to grade questions. Please try again.");
            }

        } catch (err) {
            console.error("Grading failed", err);
            setGradingError("Some questions could not be graded check console.");
        } finally {
            setIsGrading(false);
            setPendingGrading(false);
        }
    };

    const handleReEvaluation = async (questionId: string) => {
        if (!apiKey || !reEvalComment.trim()) return;
        
        const question = config.questions.find(q => q.id === questionId);
        if (!question) return;

        setIsReEvaluating(true);
        try {
            const result = await evaluateTextAnswer(apiKey, question, answers[questionId][0], reEvalComment);
            addEvaluation(questionId, result);
            setReEvalQuestionId(null);
            setReEvalComment('');
        } catch (error) {
            console.error("Re-evaluation failed:", error);
            // Optionally show error toast
        } finally {
            setIsReEvaluating(false);
        }
    };

    let correctCount = 0;
    let totalScore = 0;
    let maxScore = 0;
    let totalTimeSpent = 0;

    // Calculate total time
    Object.values(questionTimeTaken).forEach(t => totalTimeSpent += t);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    config.questions.forEach(q => {
        const selected = answers[q.id] || [];
        const questionPoints = q.points || 1;

        maxScore += questionPoints;

        if (q.options) {
            const correctOptions = q.options.filter(o => o.isCorrect).map(o => o.id);
            const isCorrect = selected.length === correctOptions.length &&
                selected.every(id => correctOptions.includes(id));

            if (isCorrect) {
                correctCount++;
                totalScore += questionPoints;
            }
        } else if (q.type === 'text') {
            // Add evaluation score if available
            if (evaluations[q.id]) {
                totalScore += evaluations[q.id].score;
                if (evaluations[q.id].score === evaluations[q.id].maxScore) {
                    correctCount++;
                }
            }
        }
    });

    const percentage = Math.round((totalScore / maxScore) * 100);

    const scores = {
        correctCount,
        totalScore,
        maxScore,
        percentage,
        totalTimeSpent
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-6xl mx-auto"
        >
            <div className="flex justify-end mb-4">
                <PDFDownloadLink
                    document={
                        <QuizPDF
                            config={config}
                            answers={answers}
                            scores={scores}
                            questionTimeTaken={questionTimeTaken}
                        />
                    }
                    fileName={`quiz-results-${config.title?.toLowerCase().replace(/\s+/g, '-') || 'export'}.pdf`}
                    className="flex items-center gap-2 px-4 py-2 glass-button rounded-lg text-glass-primary hover:text-indigo-600 dark:text-indigo-200 dark:hover:text-indigo-100 font-medium transition-colors border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-300"
                >
                    {({ loading }) => (
                        <>
                            <Download className="w-4 h-4" />
                            {loading ? 'Generating PDF...' : 'Export Results'}
                        </>
                    )}
                </PDFDownloadLink>
            </div>

            <div className="glass-panel rounded-3xl text-center p-8 md:p-12 mb-8">
                <div className="mb-8 border-b border-white/10 pb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-500/20 backdrop-blur-sm shadow-inner mb-6 ring-4 ring-indigo-500/10 dark:ring-indigo-500/30">
                         {isGrading && ungradedQuestions.length > 0 ? (
                             <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
                         ) : (
                             <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-300">{percentage}%</span>
                         )}
                    </div>
                    <h2 className="text-3xl font-bold text-glass-primary mb-2">
                        {isGrading ? 'Grading in Progress...' : 'Quiz Completed!'}
                    </h2>
                    
                    {isGrading && (
                        <p className="text-sm text-indigo-400 mb-4 animate-pulse">
                            AI is evaluating your text answers...
                        </p>
                    )}

                    <p className="text-glass-secondary mb-4">
                        You scored <span className="font-bold text-glass-primary">{totalScore}</span> out of <span className="font-bold text-glass-primary">{maxScore}</span> points
                        <span className="block text-sm mt-1">({correctCount} out of {config.questions.length} correct)</span>
                    </p>

                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/20 rounded-full text-glass-secondary text-sm font-medium backdrop-blur-sm">
                        <Clock className="w-4 h-4" />
                        Total Time: {formatTime(totalTimeSpent)}
                    </div>
                </div>

                <div className="space-y-6 text-left">
                    {config.questions.map((q, idx) => {
                        const selected = answers[q.id] || [];
                        let isCorrect = false;
                        let pointsAwarded = 0;

                        if (q.type === 'text') {
                            const evaluation = evaluations[q.id];
                            if (evaluation) {
                                isCorrect = evaluation.score === evaluation.maxScore;
                                pointsAwarded = evaluation.score;
                            }
                        } else if (q.options) {
                            const correctOptions = q.options.filter(o => o.isCorrect).map(o => o.id);
                            isCorrect = selected.length === correctOptions.length &&
                                selected.every(id => correctOptions.includes(id));
                            if (isCorrect) pointsAwarded = q.points || 1;
                        }

                        // Re-evaluation mode check
                        const isThisReEval = reEvalQuestionId === q.id;

                        return (
                            <div key={q.id} className="p-5 rounded-2xl glass-panel break-inside-avoid backdrop-blur-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0">
                                            {q.type === 'text' ? (
                                                 evaluations[q.id] ? (
                                                    isCorrect ? <CheckCircle className="text-green-500 w-6 h-6" /> : <Sparkles className="text-indigo-500 w-6 h-6" />
                                                 ) : (
                                                    <div className="w-6 h-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                                                 )
                                            ) : (
                                                isCorrect ? <CheckCircle className="text-green-500 dark:text-green-400 w-6 h-6" /> : <XCircle className="text-red-500 dark:text-red-400 w-6 h-6" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-glass-primary text-base">Question {idx + 1}</p>
                                            <p className="text-xs text-glass-secondary font-medium">
                                                {q.type === 'text' && evaluations[q.id] 
                                                  ? `${evaluations[q.id].score} / ${q.points || 1} points`
                                                  : `${pointsAwarded} / ${q.points || 1} points`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-medium text-glass-secondary bg-black/5 dark:bg-white/10 px-2 py-1 rounded border border-black/5 dark:border-white/10">
                                        <Clock className="w-3 h-3" />
                                        {formatTime(questionTimeTaken[q.id] || 0)}
                                    </div>
                                </div>

                                <div className="ml-9">
                                    <div className="text-glass-primary text-sm mb-4">
                                        <MarkdownRenderer content={q.content} />
                                        {q.imageUrl && (
                                            <div className="mt-3 rounded-lg overflow-hidden max-w-sm">
                                                <img src={q.imageUrl} alt={`Question ${idx + 1}`} className="max-w-full h-auto w-auto object-contain" />
                                            </div>
                                        )}
                                    </div>

                                    {q.type === 'text' ? (
                                        <div className="space-y-3">
                                             <div className="p-4 bg-white/5 rounded-md border border-indigo-500/20">
                                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide mb-1">Your Answer:</p>
                                                <div className="p-3 bg-black/10 dark:bg-white/5 rounded-lg text-sm text-glass-primary min-h-[50px]">
                                                    {selected[0] ? (
                                                        <div dangerouslySetInnerHTML={{ __html: selected[0] }} />
                                                    ) : (
                                                        <span className="italic text-glass-secondary">No answer provided</span>
                                                    )}
                                                </div>
                                             </div>
                                             
                                             {evaluations[q.id] && (
                                                 <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="p-4 bg-indigo-500/10 rounded-md border border-indigo-500/30"
                                                 >
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <Sparkles className="w-4 h-4 text-indigo-400" />
                                                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide">AI Feedback:</p>
                                                        </div>
                                                        {!isThisReEval && !isReEvaluating && (
                                                            <button 
                                                                onClick={() => {
                                                                    setReEvalQuestionId(q.id);
                                                                    setReEvalComment('');
                                                                }}
                                                                className="text-xs flex items-center gap-1 text-glass-secondary hover:text-indigo-400 transition-colors"
                                                            >
                                                                <RefreshCw className="w-3 h-3" />
                                                                Appeal / Re-evaluate
                                                            </button>
                                                        )}
                                                    </div>
                                                    <MarkdownRenderer 
                                                        content={evaluations[q.id].feedback} 
                                                        className="text-sm text-glass-primary leading-relaxed"
                                                    />
                                                 </motion.div>
                                             )}

                                             {isThisReEval && (
                                                 <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="pt-2"
                                                 >
                                                     <div className="glass-panel p-4 border border-indigo-500/30 rounded-xl bg-indigo-500/5">
                                                         <div className="flex items-center justify-between mb-2">
                                                             <h4 className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-2">
                                                                 <MessageSquare className="w-3 h-3" />
                                                                 Appeal Reason
                                                             </h4>
                                                             <button 
                                                                onClick={() => setReEvalQuestionId(null)}
                                                                className="text-xs text-glass-secondary hover:text-white"
                                                             >
                                                                 Cancel
                                                             </button>
                                                         </div>
                                                         <textarea
                                                             value={reEvalComment}
                                                             onChange={(e) => setReEvalComment(e.target.value)}
                                                             placeholder="Explain why you think the grade should be higher or clarify your answer..."
                                                             className="w-full h-24 bg-black/20 dark:bg-black/40 rounded-lg border border-white/10 p-3 text-sm text-glass-primary resize-none focus:ring-1 focus:ring-indigo-500/50 outline-none mb-3"
                                                         />
                                                         <div className="flex justify-end">
                                                             <button
                                                                 onClick={() => handleReEvaluation(q.id)}
                                                                 disabled={!reEvalComment.trim() || isReEvaluating}
                                                                 className="flex items-center gap-2 px-4 py-2 glass-button-primary rounded-lg text-xs font-bold shadow-lg shadow-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                                             >
                                                                 {isReEvaluating ? (
                                                                     <>
                                                                         <RefreshCw className="w-3 h-3 animate-spin" />
                                                                         Re-evaluating...
                                                                     </>
                                                                 ) : (
                                                                     <>
                                                                         <Send className="w-3 h-3" />
                                                                         Submit Appeal
                                                                     </>
                                                                 )}
                                                             </button>
                                                         </div>
                                                     </div>
                                                 </motion.div>
                                             )}
                                        </div>
                                    ) : (
                                        !isCorrect && (
                                            <div className="space-y-3 p-4 bg-white/5 rounded-md border border-red-500/20">
                                                {/* Existing Option Rendering Logic - Unchanged for brevity but included in output */}
                                                <div>
                                                    <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-1">Your Answer:</p>
                                                    {selected.length > 0 ? (
                                                        <ul className="list-disc list-inside text-sm text-glass-primary">
                                                            {q.options?.filter(o => selected.includes(o.id)).map(o => {
                                                                const letter = String.fromCharCode(65 + (q.options?.findIndex(opt => opt.id === o.id) || 0));
                                                                return (
                                                                    <li key={o.id} className="mb-2">
                                                                        {o.imageUrl && (
                                                                            <div className="mb-1 ml-5 mt-1 rounded overflow-hidden max-w-[200px]">
                                                                                <img src={o.imageUrl} alt="Option Answer" className="max-w-full h-auto max-h-32 object-contain" />
                                                                            </div>
                                                                        )}
                                                                        <span className="inline-block align-top font-bold mr-1 text-glass-secondary">({letter})</span>
                                                                        <span className="inline-block align-top"><MarkdownRenderer content={o.content} className="inline" /></span>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-sm text-glass-secondary italic">No answer selected</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <p className="text-xs font-bold text-green-400 uppercase tracking-wide mb-1">Correct Answer:</p>
                                                    <ul className="list-disc list-inside text-sm text-glass-primary">
                                                        {q.options?.filter(o => o.isCorrect).map(o => {
                                                            const letter = String.fromCharCode(65 + (q.options?.findIndex(opt => opt.id === o.id) || 0));
                                                            return (
                                                                <li key={o.id} className="mb-2">
                                                                    {o.imageUrl && (
                                                                        <div className="mb-1 ml-5 mt-1 rounded overflow-hidden max-w-[200px]">
                                                                            <img src={o.imageUrl} alt="Correct Option" className="max-w-full h-auto max-h-32 object-contain" />
                                                                        </div>
                                                                    )}
                                                                    <span className="inline-block align-top font-bold mr-1 text-glass-secondary">({letter})</span>
                                                                    <span className="inline-block align-top"><MarkdownRenderer content={o.content} className="inline" /></span>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>

                                                {q.justification && (
                                                    <div className="mt-3 pt-3 border-t border-white/10">
                                                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide mb-1">Explanation:</p>
                                                        <div className="text-sm text-glass-primary">
                                                            <MarkdownRenderer content={q.justification} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="mt-8 flex justify-center">
                <button
                    onClick={resetQuiz}
                    className="inline-flex items-center px-6 py-3 glass-button-primary text-base font-medium rounded-md shadow-sm transition-colors"
                >
                    <RefreshCw className="mr-2 -ml-1 h-5 w-5" />
                    Restart Quiz
                </button>
            </div>

            <ApiKeyModal 
                isOpen={showKeyModal} 
                onClose={() => setShowKeyModal(false)}
                onSuccess={(key) => {
                    // Trigger grading immediately
                    setShowKeyModal(false);
                }}
            />
        </motion.div>
    );
};
