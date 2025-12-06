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
    return <div className="text-center p-10 text-gray-500">No Configuration Loaded</div>;
  }

  if (status === 'intro') {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 px-4">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6">{config.title}</h1>
        {config.description && (
            <p className="text-xl text-gray-600 mb-10">{config.description}</p>
        )}
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-10 inline-block text-left">
            <h3 className="font-semibold text-gray-900 mb-4">Quiz Details:</h3>
            <ul className="space-y-2 text-gray-600">
                <li>• {config.questions.length} Questions</li>
                {config.globalTimeLimit && <li>• {Math.floor(config.globalTimeLimit / 60)} Minutes Time Limit</li>}
                <li>• {config.questions.every(q => q.type === 'single_choice') ? 'Single Choice' : 'Multiple Choice'}</li>
            </ul>
        </div>

        <div>
            <button
            onClick={startQuiz}
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-bold rounded-full shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105 transition-all"
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
    <div className="w-full max-w-4xl mx-auto px-4 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex flex-col">
             <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Progress</span>
             <span className="text-lg font-bold text-gray-800">
                {currentQuestionIndex + 1} <span className="text-gray-400 font-normal">/ {config.questions.length}</span>
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
          className="flex items-center text-gray-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-gray-500 font-medium transition-colors"
        >
          <ArrowLeft className="mr-2 w-5 h-5" />
          Previous
        </button>

        <button
          onClick={nextQuestion}
          className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium shadow-md hover:bg-indigo-700 transition-colors"
        >
          {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
          {!isLastQuestion && <ArrowRight className="ml-2 w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};
