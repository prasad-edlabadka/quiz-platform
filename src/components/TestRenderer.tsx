import React, { useEffect } from 'react';
import { useTestStore } from '../store/testStore';
import { QuestionCard } from './QuestionCard';
import { ResultsView } from './ResultsView';
import { PrintableView } from './PrintableView';
import { ArrowRight, ArrowLeft, Printer, Download } from 'lucide-react';
import { ReviseLayout } from './ReviseLayout';
import { Button, Card, Typography } from 'antd';
const { Title, Text } = Typography;

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
        <Title level={1} className="mb-6 drop-shadow-lg">{config.title}</Title>
        {config.description && (
          <Text className="text-xl text-glass-secondary mb-10 block">{config.description}</Text>
        )}

        <Card className="rounded-xl mb-10 inline-block text-left max-w-2xl border-white/10 bg-black/20 backdrop-blur-md" styles={{ body: { padding: '1.5rem' } }}>
          <Title level={4} className="mb-4">Test Details:</Title>
          <ul className="space-y-2 text-glass-secondary">
            <li>• {config.questions.length} Questions</li>
            {config.globalTimeLimit && <li>• {Math.floor(config.globalTimeLimit / 60)} Minutes Time Limit</li>}
            <li>• {config.questions.every(q => q.type === 'single_choice') ? 'Single Choice' : 'Multiple Choice'}</li>
          </ul>
        </Card>

        <div className="flex justify-center gap-4 flex-wrap mt-10">
          <Button
            type="primary"
            size="large"
            onClick={startTest}
            className="px-8 py-6 rounded-full text-lg font-bold shadow-lg transform hover:scale-105 transition-transform w-full md:w-auto flex items-center justify-center"
            icon={<ArrowRight className="h-5 w-5" />}
            iconPosition="end"
          >
            Start Test
          </Button>

          <Button
            size="large"
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
            className="px-8 py-6 rounded-full text-lg font-bold shadow-lg transform hover:scale-105 transition-transform w-full md:w-auto flex items-center justify-center text-indigo-500 border-indigo-200"
            icon={<Download className="h-5 w-5" />}
          >
            Download Test
          </Button>

          <Button
            size="large"
            onClick={printTest}
            className="px-8 py-6 rounded-full text-lg font-bold shadow-lg transform hover:scale-105 transition-transform w-full md:w-auto flex items-center justify-center text-glass-secondary bg-black/10 border-white/10"
            icon={<Printer className="h-5 w-5" />}
          >
            Print Question Paper
          </Button>
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
        <Button
          onClick={prevQuestion}
          disabled={currentQuestionIndex === 0}
          type="text"
          size="large"
          className="flex items-center font-medium"
          icon={<ArrowLeft className="w-5 h-5" />}
        >
          Previous
        </Button>

        <Button
          onClick={isLastQuestion ? finishTest : nextQuestion}
          type="primary"
          size="large"
          className="flex items-center px-6 py-5 rounded-lg font-medium shadow-md transition-colors"
          icon={!isLastQuestion ? <ArrowRight className="w-5 h-5" /> : undefined}
          iconPosition="end"
        >
          {isLastQuestion ? 'Finish Test' : 'Next Question'}
        </Button>
      </div>
    </ReviseLayout>
  );
};
