import React from 'react';
import type { Question } from '../types/quiz';
import { OptionSelector } from './OptionSelector';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Timer } from './Timer';
import { useQuizStore } from '../store/quizStore';
import { motion } from 'framer-motion';
import { Flag, Star } from 'lucide-react';
import { clsx } from 'clsx';

interface QuestionCardProps {
  question: Question;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const { answers, answerQuestion, questionTimeRemaining, toggleFlag, flaggedQuestions, config } = useQuizStore();
  const selectedOptions = answers[question.id] || [];
  const timeRemaining = questionTimeRemaining[question.id];

  const handleSelectionChange = (ids: string[]) => {
    answerQuestion(question.id, ids);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-3xl mx-auto glass-panel rounded-3xl overflow-hidden"
    >
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
                 <div className="text-xs sm:text-sm font-medium text-glass-secondary uppercase tracking-wider whitespace-nowrap">
                    Question {config?.questions.findIndex(q => q.id === question.id)! + 1}
                 </div>
                 <div className="glass-badge whitespace-nowrap">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{question.points || 1} pts</span>
                 </div>
             <button
                onClick={() => toggleFlag(question.id)}
                className={clsx(
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors focus:outline-none border",
                    flaggedQuestions.includes(question.id)
                        ? "bg-orange-500/20 text-orange-600 dark:text-orange-300 border-orange-500/30 hover:bg-orange-500/30"
                        : "text-glass-secondary border-transparent hover:bg-black/5 dark:hover:bg-white/10 hover:text-glass-primary"
                )}
             >
                <Flag className={clsx("w-3.5 h-3.5", flaggedQuestions.includes(question.id) && "fill-current")} />
                {flaggedQuestions.includes(question.id) ? 'Flagged' : 'Flag'}
             </button>
          </div>
          {question.timeLimit && timeRemaining !== undefined && (
             <Timer seconds={timeRemaining} label="Time Left" variant="urgent" />
          )}
        </div>

        <div className="mb-8">
          <MarkdownRenderer content={question.content} className="text-lg md:text-xl font-medium text-glass-primary" />
          
          {question.imageUrl && (
            <div className="mt-4 rounded-lg overflow-hidden border border-gray-100">
               <img src={question.imageUrl} alt="Question Reference" className="max-w-full h-auto w-auto object-contain max-h-96 rounded-lg" />
            </div>
          )}
        </div>

        <OptionSelector
          options={question.options}
          selectedOptionIds={selectedOptions}
          type={question.type}
          onSelectionChange={handleSelectionChange}
          disabled={question.timeLimit !== undefined && timeRemaining !== undefined && timeRemaining <= 0}
        />
      </div>{/* End of content */}
    </motion.div>
  );
};
