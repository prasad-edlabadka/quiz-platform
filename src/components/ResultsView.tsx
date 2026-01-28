import React from 'react';
import { useQuizStore } from '../store/quizStore';
import { MarkdownRenderer } from './MarkdownRenderer';
import { RefreshCw, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { QuizPDF } from './QuizPDF';

export const ResultsView: React.FC = () => {
  const { config, answers, resetQuiz, questionTimeTaken } = useQuizStore();

  if (!config) return null;

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
     } else if (q.type === 'text' && selected.length > 0) {
        // Optional: Award points for simply answering, or leave as 0 until manual grade
        // For now, let's just count as "attempted" but not add to numeric score unless we want to assume auto-correct
        // Let's being conservative: don't add to score.
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

      <div className="glass-panel rounded-3xl text-center p-8 md:p-12">
      <div className="mb-8 border-b border-white/10 pb-8">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-500/20 backdrop-blur-sm shadow-inner mb-6 ring-4 ring-indigo-500/10 dark:ring-indigo-500/30">
            <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-300">{percentage}%</span>
        </div>
        <h2 className="text-3xl font-bold text-glass-primary mb-2">Quiz Completed!</h2>
        <p className="text-glass-secondary mb-4">
            You scored <span className="font-bold text-glass-primary">{totalScore}</span> out of <span className="font-bold text-glass-primary">{maxScore}</span> points
            <span className="block text-sm mt-1">({correctCount} out of {config.questions.length} correct)</span>
        </p>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/20 rounded-full text-glass-secondary text-sm font-medium backdrop-blur-sm">
            <Clock className="w-4 h-4" />
            Total Time: {formatTime(totalTimeSpent)}
        </div>
      </div>

      <div className="space-y-6 mb-8 text-left">
          {config.questions.map((q, idx) => {
              const selected = answers[q.id] || [];
              let isCorrect = false;
              
              if (q.type === 'text') {
                 // For text questions, we assume it's "correct" if answered for now, or just show as submitted
                 // In a real app, this would need manual grading or specific logic.
                 // Let's mark it as neutral/submitted.
                 isCorrect = selected.length > 0 && selected[0].length > 0;
              } else if (q.options) {
                 const correctOptions = q.options.filter(o => o.isCorrect).map(o => o.id);
                 isCorrect = selected.length === correctOptions.length && 
                                selected.every(id => correctOptions.includes(id));
              }

              return (
                  <div key={q.id} className="p-5 rounded-2xl glass-panel break-inside-avoid backdrop-blur-sm">
                      <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                {q.type === 'text' ? (
                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                        <span className="text-xs font-bold text-blue-500">T</span>
                                    </div>
                                ) : (
                                    isCorrect ? <CheckCircle className="text-green-500 dark:text-green-400 w-6 h-6"/> : <XCircle className="text-red-500 dark:text-red-400 w-6 h-6"/>
                                )}
                              </div>
                              <div>
                                  <p className="font-medium text-glass-primary text-base">Question {idx + 1}</p>
                                  <p className="text-xs text-glass-secondary font-medium">{q.points || 1} points</p>
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
                             <div className="space-y-3 p-4 bg-white/5 rounded-md border border-indigo-500/20">
                                <div>
                                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide mb-1">Your Answer:</p>
                                    <div className="p-3 bg-black/10 dark:bg-white/5 rounded-lg text-sm text-glass-primary min-h-[50px]">
                                       {selected[0] ? (
                                           <div dangerouslySetInnerHTML={{ __html: selected[0] }} />
                                       ) : (
                                           <span className="italic text-glass-secondary">No answer provided</span>
                                       )}
                                    </div>
                                </div>
                             </div>
                          ) : (
                              !isCorrect && (
                                  <div className="space-y-3 p-4 bg-white/5 rounded-md border border-red-500/20">
                                      {/* Existing Option Rendering Logic */}
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
    </motion.div>
  );
};
