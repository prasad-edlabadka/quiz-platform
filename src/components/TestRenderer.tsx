import React, { useEffect } from 'react';
import { useTestStore } from '../store/testStore';
import { QuestionCard } from './QuestionCard';
import { ResultsView } from './ResultsView';
import { PrintableView } from './PrintableView';
import { ArrowRight, ArrowLeft, Printer, Download } from 'lucide-react';
import { ReviseLayout } from './ReviseLayout';

export const TestRenderer: React.FC = () => {
  const {
    config,
    status,
    currentQuestionIndex,
    nextQuestion,
    prevQuestion,
    startTest,
    printTest,
    tick,
    finishTest
  } = useTestStore();

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
          <h3 className="font-semibold text-glass-primary mb-4">Test Details:</h3>
          <ul className="space-y-2 text-glass-secondary">
            <li>• {config.questions.length} Questions</li>
            {config.globalTimeLimit && <li>• {Math.floor(config.globalTimeLimit / 60)} Minutes Time Limit</li>}
            <li>• {config.questions.every(q => q.type === 'single_choice') ? 'Single Choice' : 'Multiple Choice'}</li>
          </ul>
        </div>

        <div className="flex justify-center gap-4 flex-wrap">
          <button
            onClick={startTest}
            className="inline-flex items-center px-8 py-4 glass-button-primary rounded-full text-lg font-bold shadow-lg transform hover:scale-105 transition-all w-full md:w-auto justify-center"
          >
            Start Test
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>

          <button
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
            className="inline-flex items-center px-8 py-4 glass-button rounded-full text-lg font-bold shadow-lg transform hover:scale-105 transition-all text-indigo-600 hover:text-indigo-700 w-full md:w-auto justify-center"
          >
            <Download className="mr-2 h-5 w-5" />
            Download Test
          </button>

          <button
            onClick={printTest}
            className="inline-flex items-center px-8 py-4 glass-button rounded-full text-lg font-bold shadow-lg transform hover:scale-105 transition-all text-glass-secondary hover:text-glass-primary w-full md:w-auto justify-center"
          >
            <Printer className="mr-2 h-5 w-5" />
            Print Question Paper
          </button>
        </div>
      </div>
    );
  }

  if (status === 'completed') {
    return <ResultsView />;
  }

  if (status === 'printable') {
    return <PrintableView />;
  }

  const currentQuestion = config.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === config.questions.length - 1;

  return (
    <ReviseLayout>
      <QuestionCard key={currentQuestion.id} question={currentQuestion} />

      <div className="mt-8 flex justify-between items-center max-w-6xl mx-auto">
        <button
          onClick={prevQuestion}
          disabled={currentQuestionIndex === 0}
          className="flex items-center text-glass-secondary hover:text-glass-primary disabled:opacity-30 disabled:hover:text-glass-secondary font-medium transition-colors"
        >
          <ArrowLeft className="mr-2 w-5 h-5" />
          Previous
        </button>

        <button
          onClick={isLastQuestion ? finishTest : nextQuestion}
          className="flex items-center px-6 py-3 glass-button-primary rounded-lg font-medium shadow-md transition-colors"
        >
          {isLastQuestion ? 'Finish Test' : 'Next Question'}
          {!isLastQuestion && <ArrowRight className="ml-2 w-5 h-5" />}
        </button>
      </div>
    </ReviseLayout>
  );
};
