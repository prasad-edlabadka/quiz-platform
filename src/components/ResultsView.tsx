import React, { useEffect, useState } from 'react';
import { useTestStore } from '../store/testStore';
import { MarkdownRenderer } from './MarkdownRenderer';
import { RefreshCw, CheckCircle, XCircle, Clock, Printer, Download, Sparkles, AlertCircle, MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { evaluateBatchAnswers, evaluateTextAnswer } from '../services/aiService';
import { ApiKeyModal } from './ApiKeyModal';
import { ResultPDFExport } from './ResultPDFExport';
import type { PastTestResult } from '../types/test';
import { Button, Card, Input, Typography, Tag } from 'antd';
const { Title } = Typography;

export const ResultsView: React.FC = () => {
    const { config, answers, drawnAnswers, resetTest, clearState, questionTimeTaken, apiKey, evaluations, addBatchEvaluations, addEvaluation, themeMode, isViewingPastResult } = useTestStore();
    const isDark = themeMode === 'dark';
    const [isGrading, setIsGrading] = useState(false);
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [gradingError, setGradingError] = useState('');
    const [pendingGrading, setPendingGrading] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    // Re-evaluation State
    const [reEvalQuestionId, setReEvalQuestionId] = useState<string | null>(null);
    const [reEvalComment, setReEvalComment] = useState('');
    const [isReEvaluating, setIsReEvaluating] = useState(false);

    if (!config) return null;

    // Detect text questions that need grading
    const textQuestions = config.questions.filter(q => q.type === 'text' && ((answers[q.id] && answers[q.id].length > 0) || drawnAnswers[q.id]));
    const ungradedQuestions = textQuestions.filter(q => !evaluations[q.id]);

    useEffect(() => {
        // Trigger grading if we have ungraded questions and pending flag or auto-start
        // Do not trigger grading if we are viewing a past result.
        if (!isViewingPastResult && ungradedQuestions.length > 0 && !isGrading) {
            if (apiKey) {
                runGrading();
            } else if (!pendingGrading) {
                // No key, and haven't asked yet.
                // Show modal to ask for key
                setPendingGrading(true); // Mark that we found work to do
                setShowKeyModal(true);
            }
        }
    }, [apiKey, evaluations, isGrading, isViewingPastResult]);

    const runGrading = async () => {
        if (!apiKey || isGrading || ungradedQuestions.length === 0) return;

        setIsGrading(true);
        setGradingError('');

        try {
            const itemsToGrade = ungradedQuestions.map(q => ({
                question: q,
                userAnswer: answers[q.id]?.[0] || 'No text answer provided',
                drawnAnswer: drawnAnswers[q.id]
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
            const result = await evaluateTextAnswer(apiKey, question, answers[questionId]?.[0] || 'No text answer provided', reEvalComment);
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

        if (evaluations[q.id]) {
            totalScore += evaluations[q.id].score;
            if (evaluations[q.id].score === evaluations[q.id].maxScore) {
                correctCount++;
            }
        } else if (q.type !== 'text' && q.options && q.options.length > 0) {
            const correctOptions = q.options.filter(o => o.isCorrect).map(o => o.id);
            const isCorrect = selected.length === correctOptions.length &&
                selected.every(id => correctOptions.includes(id));

            if (isCorrect) {
                correctCount++;
                totalScore += questionPoints;
            }
        }
    });

    const percentage = Math.round((totalScore / maxScore) * 100);


    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-6xl mx-auto flex flex-col pt-[72px] md:pt-6 px-4 xl:px-0"
        >
            <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-4 mb-4 md:mb-6 md:pr-24 print:hidden">
                <div className="flex justify-center md:justify-start">
                    {isViewingPastResult && (
                        <Button
                            onClick={clearState}
                            icon={<ArrowLeft className="w-4 h-4" />}
                            size="large"
                        >
                            Back to Past Results
                        </Button>
                    )}
                </div>

                <div className="flex flex-wrap justify-center md:justify-end gap-3">
                    <Button
                    onClick={() => {
                        if (!config) return;
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
                        const downloadAnchorNode = document.createElement('a');
                        downloadAnchorNode.setAttribute("href", dataStr);
                        downloadAnchorNode.setAttribute("download", `${config.title || 'test'}.json`);
                        document.body.appendChild(downloadAnchorNode);
                        downloadAnchorNode.click();
                        downloadAnchorNode.remove();
                    }}
                    icon={<Download className="w-4 h-4" />}
                    size="large"
                >
                    Download JSON
                </Button>

                <Button
                    onClick={() => setIsExportingPDF(true)}
                    icon={<Printer className="w-4 h-4" />}
                    size="large"
                >
                    Export Results (PDF)
                </Button>
            </div>
            </div>

            <Card className="rounded-3xl text-center mb-8 border border-white/10" styles={{ body: { padding: '3rem' } }}>
                <div className="mb-8 border-b border-white/10 pb-8">
                    <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full backdrop-blur-sm shadow-inner mb-6 ring-4 ${isDark ? 'bg-indigo-500/20 ring-indigo-500/30' : 'bg-indigo-100 ring-indigo-500/10'}`}>
                        {isGrading && ungradedQuestions.length > 0 ? (
                            <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
                        ) : (
                            <span className={`text-4xl font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>{percentage}%</span>
                        )}
                    </div>
                    <Title level={2} className="mb-2">
                        {isGrading && !isViewingPastResult ? 'Grading in Progress...' : 'Test Completed!'}
                    </Title>

                    {isGrading && !isViewingPastResult && (
                        <p className="text-sm text-indigo-400 mb-4 animate-pulse">
                            AI is evaluating your text/diagram answers...
                        </p>
                    )}

                    {gradingError && (
                        <div className="flex items-center justify-center gap-2 text-red-400 mb-4">
                            <AlertCircle className="w-4 h-4" />
                            <p className="text-sm">{gradingError}</p>
                        </div>
                    )}

                    <p className="text-glass-secondary mb-4">
                        You scored <span className="font-bold text-glass-primary">{totalScore}</span> out of <span className="font-bold text-glass-primary">{maxScore}</span> points
                        <span className="block text-sm mt-1">({correctCount} out of {config.questions.length} correct)</span>
                    </p>

                    <Tag className="px-4 py-1.5 rounded-full text-sm mt-2">
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Total Time: {formatTime(totalTimeSpent)}
                        </span>
                    </Tag>
                </div>

                <div className="space-y-6 text-left">
                    {config.questions.map((q, idx) => {
                        const selected = answers[q.id] || [];
                        let isCorrect = false;
                        let pointsAwarded = 0;

                        if (evaluations[q.id]) {
                            const evaluation = evaluations[q.id];
                            isCorrect = evaluation.score === evaluation.maxScore;
                            pointsAwarded = evaluation.score;
                        } else if (q.type !== 'text' && q.options && q.options.length > 0) {
                            const correctOptions = q.options.filter(o => o.isCorrect).map(o => o.id);
                            isCorrect = selected.length === correctOptions.length &&
                                selected.every(id => correctOptions.includes(id));
                            if (isCorrect) pointsAwarded = q.points || 1;
                        }

                        // Re-evaluation mode check
                        const isThisReEval = reEvalQuestionId === q.id;

                        return (
                            <Card key={q.id} className="rounded-2xl break-inside-avoid backdrop-blur-sm mb-6 border border-white/10" styles={{ body: { padding: '1.25rem' } }}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0">
                                            {evaluations[q.id] ? (
                                                isCorrect ? <CheckCircle className="text-green-500 w-6 h-6" /> : <Sparkles className="text-indigo-500 w-6 h-6" />
                                            ) : q.type === 'text' ? (
                                                <div className="w-6 h-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                                            ) : (
                                                isCorrect ? <CheckCircle className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-500'}`} /> : <XCircle className={`w-6 h-6 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-glass-primary text-base">Question {idx + 1}</p>
                                            <p className="text-xs text-glass-secondary font-medium">
                                                {evaluations[q.id]
                                                    ? `${evaluations[q.id].score} / ${q.points || 1} points`
                                                    : q.type === 'text' 
                                                        ? 'Pending AI Grading...' 
                                                        : `${pointsAwarded} / ${q.points || 1} points`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <Tag className="px-2.5 py-1 rounded">
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatTime(questionTimeTaken[q.id] || 0)}
                                        </span>
                                    </Tag>
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
                                                <div className={`p-3 rounded-lg text-sm text-glass-primary min-h-[50px] ${isDark ? 'bg-white/5' : 'bg-black/10'}`}>
                                                    {drawnAnswers[q.id] && (
                                                        <div className="mb-4">
                                                            <p className="text-xs text-indigo-400 font-bold mb-2">Drawn Diagram:</p>
                                                            <div className="p-2 border border-white/10 rounded-lg inline-block bg-white">
                                                                <img src={drawnAnswers[q.id]} alt="Drawn Answer" className="max-w-full h-auto" style={{ maxHeight: '250px' }} />
                                                            </div>
                                                        </div>
                                                    )}
                                                    {selected[0] ? (
                                                        <div dangerouslySetInnerHTML={{ __html: selected[0] }} />
                                                    ) : evaluations[q.id] && (!drawnAnswers[q.id]) ? (
                                                        <span className="italic font-medium text-emerald-400/80">Answer evaluated from uploaded sheets.</span>
                                                    ) : !drawnAnswers[q.id] ? (
                                                        <span className="italic text-glass-secondary">No answer provided</span>
                                                    ) : null}
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
                                                        <div className="flex gap-2">
                                                            <Input 
                                                                value={reEvalComment}
                                                                onChange={(e) => setReEvalComment(e.target.value)}
                                                                placeholder="Explain why your answer is correct..."
                                                                className="flex-1 bg-black/20"
                                                            />
                                                            <Button
                                                                onClick={() => handleReEvaluation(q.id)}
                                                                disabled={!reEvalComment.trim()}
                                                                loading={isReEvaluating}
                                                                type="primary"
                                                                icon={<Send className="w-4 h-4" />}
                                                            >
                                                                Submit Appeal
                                                            </Button>
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
                                                    ) : evaluations[q.id] ? (
                                                        <span className="italic font-medium text-emerald-400/80">Answer evaluated from uploaded sheets.</span>
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

                                                {evaluations[q.id] && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="mt-3 p-4 bg-indigo-500/10 rounded-md border border-indigo-500/30"
                                                    >
                                                        <div className="flex items-start justify-between gap-4 mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide">AI Feedback:</p>
                                                            </div>
                                                        </div>
                                                        <MarkdownRenderer
                                                            content={evaluations[q.id].feedback}
                                                            className="text-sm text-glass-primary leading-relaxed"
                                                        />
                                                    </motion.div>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </Card>

            <div className="mt-8 flex justify-center">
                <Button
                    onClick={isViewingPastResult ? clearState : resetTest}
                    type="primary"
                    size="large"
                    icon={isViewingPastResult ? <ArrowLeft className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                    className="flex items-center px-6 py-3 print:hidden"
                >
                    {isViewingPastResult ? 'Back to Past Results' : 'Restart Test'}
                </Button>
            </div>

            <ApiKeyModal
                isOpen={showKeyModal}
                onClose={() => setShowKeyModal(false)}
                onSuccess={() => {
                    // Trigger grading immediately
                    setShowKeyModal(false);
                }}
            />

            {isExportingPDF && (
                <ResultPDFExport 
                    result={{
                        attemptId: 'current',
                        date: new Date().toISOString(),
                        config: config as any,
                        answers: answers,
                        drawnAnswers: drawnAnswers,
                        evaluations: evaluations,
                        timeRemaining: 0,
                        questionTimeTaken: questionTimeTaken
                    } as PastTestResult}
                    onClose={() => setIsExportingPDF(false)}
                />
            )}

            <p className="mt-10 text-center text-xs text-glass-secondary/50">Built by Prasad Edlabadkar</p>
        </motion.div>
    );
};
