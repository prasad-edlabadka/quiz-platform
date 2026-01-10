import React, { useEffect } from 'react';
import { useQuizStore } from '../store/quizStore';
import { QuestionCard } from './QuestionCard';
import { ResultsView } from './ResultsView';
import { Timer } from './Timer';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';

export const QuizRenderer: React.FC = () => {
  const { 
    config, 
    status, 
    currentQuestionIndex, 
    timeRemaining, 
    nextQuestion, 
    prevQuestion, 
    startQuiz, 
    tick,
    answers,
    flaggedQuestions,
    jumpToQuestion
  } = useQuizStore();

  useEffect(() => {
    let interval: any;
    if (status === 'active') {
      interval = setInterval(tick, 1000);
    }
    return () => clearInterval(interval);
  }, [status, tick]);

  if (!config) {
    return <div className="text-center p-10 text-glass-secondary">No Configuration Loaded</div>;
  }

  if (status === 'intro') {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 px-4">
        <h1 className="text-4xl font-extrabold text-glass-primary mb-6 drop-shadow-lg">{config.title}</h1>
        {config.description && (
            <p className="text-xl text-glass-secondary mb-10">{config.description}</p>
        )}
        
        <div className="glass-panel p-6 rounded-xl mb-10 inline-block text-left max-w-2xl">
            <h3 className="font-semibold text-glass-primary mb-4">Quiz Details:</h3>
            <ul className="space-y-2 text-glass-secondary">
                <li>• {config.questions.length} Questions</li>
                {config.globalTimeLimit && <li>• {Math.floor(config.globalTimeLimit / 60)} Minutes Time Limit</li>}
                <li>• {config.questions.every(q => q.type === 'single_choice') ? 'Single Choice' : 'Multiple Choice'}</li>
            </ul>
        </div>

        <div>
            <button
            onClick={startQuiz}
            className="inline-flex items-center px-8 py-4 glass-button-primary rounded-full text-lg font-bold shadow-lg transform hover:scale-105 transition-all"
            >
            Start Quiz
            <ArrowRight className="ml-2 h-5 w-5" />
            </button>
        </div>
      </div>
    );
  }

  if (status === 'completed') {
    return <ResultsView />;
  }

  const currentQuestion = config.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === config.questions.length - 1;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pt-12 md:pt-4 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-8 glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
            <div className="flex flex-col">
                <span className="text-xs font-semibold text-glass-secondary uppercase tracking-widest">Progress</span>
                <span className="text-xl font-bold text-glass-primary">
                    {currentQuestionIndex + 1} <span className="text-glass-secondary font-normal text-base">/ {config.questions.length}</span>
                </span>
            </div>
            
            {config.globalTimeLimit && (
                <div className="md:hidden">
                    <Timer seconds={timeRemaining} label="Time" variant={timeRemaining < 60 ? 'urgent' : 'default'} />
                </div>
            )}
        </div>

        {/* Question Map */}
        <div className="flex-1 flex justify-center px-4 w-full md:w-auto overflow-x-auto no-scrollbar">
            <div className="flex gap-2 flex-wrap justify-center max-w-2xl">
                {config.questions.map((q, idx) => {
                    const isFlagged = flaggedQuestions.includes(q.id);
                    const isAttempted = answers[q.id] && answers[q.id].length > 0;
                    const isCurrent = idx === currentQuestionIndex;

                    return (
                        <button
                            key={q.id}
                            onClick={() => jumpToQuestion(idx)}
                            className={clsx(
                                "relative z-10 transform-gpu w-3 h-3 md:w-3.5 md:h-3.5 rounded-full transition-all duration-300",
                                isCurrent 
                                    ? "bg-indigo-500 scale-125 ring-4 ring-indigo-500/20" 
                                    : isFlagged 
                                        ? "bg-orange-500" 
                                        : isAttempted 
                                            ? "bg-indigo-400/60" 
                                            : "bg-slate-500 border border-slate-600 dark:bg-white/10 dark:border-white/10 hover:bg-glass-primary hover:scale-110"
                            )}
                            title={`Question ${idx + 1}`}
                        />
                    );
                })}
            </div>
        </div>
        
        {config.globalTimeLimit && (
             <div className="hidden md:block">
                 <Timer seconds={timeRemaining} label="Global Timer" variant={timeRemaining < 60 ? 'urgent' : 'default'} />
             </div>
        )}
      </div>



      <QuestionCard key={currentQuestion.id} question={currentQuestion} />

      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={prevQuestion}
          disabled={currentQuestionIndex === 0}
          className="flex items-center text-glass-secondary hover:text-glass-primary disabled:opacity-30 disabled:hover:text-glass-secondary font-medium transition-colors"
        >
          <ArrowLeft className="mr-2 w-5 h-5" />
          Previous
        </button>

        <button
          onClick={nextQuestion}
          className="flex items-center px-6 py-3 glass-button-primary rounded-lg font-medium shadow-md transition-colors"
        >
          {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
          {!isLastQuestion && <ArrowRight className="ml-2 w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};
