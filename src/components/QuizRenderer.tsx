import React, { useEffect } from 'react';
import { useQuizStore } from '../store/quizStore';
import { QuestionCard } from './QuestionCard';
import { ResultsView } from './ResultsView';
import { CompactNavigation } from './CompactNavigation';
import { Timer } from './Timer';
import { ArrowRight, ArrowLeft } from 'lucide-react'; // Added icon for drawer toggle
import { AnimatePresence } from 'framer-motion';

export const QuizRenderer: React.FC = () => {
  const { 
    config, 
    status, 
    currentQuestionIndex, 
    timeRemaining, 
    nextQuestion, 
    prevQuestion, 
    startQuiz, 
    tick 
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
        
        <div className="glass-panel p-6 rounded-xl mb-10 inline-block text-left">
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
    <div className="w-full max-w-4xl mx-auto px-4 pt-12 md:pt-4 pb-20">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-center mb-8 glass-panel p-4 rounded-xl">
        <div className="flex flex-col">
             <span className="text-xs font-semibold text-glass-secondary uppercase tracking-widest">Progress</span>
             <span className="text-lg font-bold text-glass-primary">
                {currentQuestionIndex + 1} <span className="text-glass-secondary font-normal">/ {config.questions.length}</span>
             </span>
        </div>
        
        {config.globalTimeLimit && (
             <Timer seconds={timeRemaining} label="Global Timer" variant={timeRemaining < 60 ? 'urgent' : 'default'} />
        )}
      </div>

      <CompactNavigation />

      <AnimatePresence mode="wait">
        <QuestionCard key={currentQuestion.id} question={currentQuestion} />
      </AnimatePresence>

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
