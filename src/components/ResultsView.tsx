import React, { useRef } from 'react';
import { useQuizStore } from '../store/quizStore';
import { MarkdownRenderer } from './MarkdownRenderer';
import { RefreshCw, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';

export const ResultsView: React.FC = () => {
  const { config, answers, resetQuiz, questionTimeTaken } = useQuizStore();
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Quiz Results - ${config?.title}`,
  });

  if (!config) return null;

  let correctCount = 0;
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
     const correctOptions = q.options.filter(o => o.isCorrect).map(o => o.id);
     
     // Check if arrays match (order doesn't matter)
     const isCorrect = selected.length === correctOptions.length && 
                       selected.every(id => correctOptions.includes(id));
     
     if (isCorrect) correctCount++;
  });

  const percentage = Math.round((correctCount / config.questions.length) * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-3xl mx-auto"
    >
      <div className="flex justify-end mb-4">
        <button
            onClick={() => handlePrint()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-indigo-600 font-medium transition-colors shadow-sm"
        >
            <Download className="w-4 h-4" />
            Export Results
        </button>
      </div>

      <div ref={componentRef} className="bg-white rounded-2xl shadow-xl overflow-hidden text-center p-8 md:p-12 print:shadow-none print:p-0">
      <div className="mb-8 border-b pb-8">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-indigo-100 mb-6">
            <span className="text-4xl font-bold text-indigo-600">{percentage}%</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Completed!</h2>
        <p className="text-gray-500 mb-4">You scored {correctCount} out of {config.questions.length}</p>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-gray-600 text-sm font-medium">
            <Clock className="w-4 h-4" />
            Total Time: {formatTime(totalTimeSpent)}
        </div>
      </div>

      <div className="space-y-6 mb-8 text-left">
          {config.questions.map((q, idx) => {
              const selected = answers[q.id] || [];
              const correctOptions = q.options.filter(o => o.isCorrect).map(o => o.id);
              const isCorrect = selected.length === correctOptions.length && 
                                selected.every(id => correctOptions.includes(id));

              return (
                  <div key={q.id} className="p-5 rounded-lg bg-gray-50 border border-gray-100 break-inside-avoid">
                      <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                {isCorrect ? <CheckCircle className="text-green-500 w-6 h-6"/> : <XCircle className="text-red-500 w-6 h-6"/>}
                              </div>
                              <p className="font-medium text-gray-900 text-base">Question {idx + 1}</p>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-medium text-gray-400 bg-white px-2 py-1 rounded border border-gray-100">
                             <Clock className="w-3 h-3" />
                             {formatTime(questionTimeTaken[q.id] || 0)}
                          </div>
                      </div>
                      
                      <div className="ml-9">
                          <div className="text-gray-800 text-sm mb-4">
                            <MarkdownRenderer content={q.content} />
                          </div>

                          {!isCorrect && (
                              <div className="space-y-3 p-4 bg-white rounded-md border border-red-100">
                                  <div>
                                      <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1">Your Answer:</p>
                                      {selected.length > 0 ? (
                                        <ul className="list-disc list-inside text-sm text-gray-700">
                                            {q.options.filter(o => selected.includes(o.id)).map(o => (
                                                <li key={o.id}><span className="inline-block align-top"><MarkdownRenderer content={o.content} className="inline" /></span></li>
                                            ))}
                                        </ul>
                                      ) : (
                                        <p className="text-sm text-gray-400 italic">No answer selected</p>
                                      )}
                                  </div>
                                  
                                  <div>
                                       <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1">Correct Answer:</p>
                                       <ul className="list-disc list-inside text-sm text-gray-700">
                                            {q.options.filter(o => o.isCorrect).map(o => (
                                                <li key={o.id}><span className="inline-block align-top"><MarkdownRenderer content={o.content} className="inline" /></span></li>
                                            ))}
                                        </ul>
                                  </div>

                                  {q.justification && (
                                     <div className="mt-3 pt-3 border-t border-gray-100">
                                         <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-1">Explanation:</p>
                                         <div className="text-sm text-gray-600">
                                            <MarkdownRenderer content={q.justification} />
                                         </div>
                                     </div>
                                  )}
                              </div>
                          )}
                      </div>
                  </div>
              )
          })}
      </div>
      </div>
      
      <div className="mt-8 flex justify-center print:hidden">
        <button
            onClick={resetQuiz}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
            <RefreshCw className="mr-2 -ml-1 h-5 w-5" />
            Restart Quiz
        </button>
      </div>
    </motion.div>
  );
};
