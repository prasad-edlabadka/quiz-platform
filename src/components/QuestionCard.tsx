import React from 'react';
import type { Question } from '../types/test';
import { OptionSelector } from './OptionSelector';
import { MarkdownRenderer } from './MarkdownRenderer';
import { RichTextEditor } from './RichTextEditor';
import { DrawingCanvas } from './DrawingCanvas';
import { Timer } from './Timer';
import { useTestStore } from '../store/testStore';
import { Flag, Star } from 'lucide-react';
import { clsx } from 'clsx';
import { Card, Button, Typography, Tag, Tooltip } from 'antd';

interface QuestionCardProps {
  question: Question;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const { answers, drawnAnswers, answerQuestion, answerDrawing, questionTimeRemaining, toggleFlag, flaggedQuestions, config, themeMode } = useTestStore();
  const isDark = themeMode === 'dark';
  const selectedOptions = answers[question.id] || [];
  const drawnData = drawnAnswers[question.id] || undefined;
  const timeRemaining = questionTimeRemaining[question.id];
  const disabled = question.timeLimit !== undefined && timeRemaining !== undefined && timeRemaining <= 0;

  const handleSelectionChange = (ids: string[]) => {
    answerQuestion(question.id, ids);
  };

  const handleDrawingChange = (base64: string) => {
    answerDrawing(question.id, base64);
  };

  return (
    <Card 
      className="w-full max-w-6xl mx-auto rounded-3xl overflow-hidden shadow-lg border-none"
      styles={{ body: { padding: '32px' } }}
      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Typography.Text className="text-xs sm:text-sm font-medium uppercase tracking-wider" type="secondary">
            Question {config?.questions.findIndex(q => q.id === question.id)! + 1}
          </Typography.Text>
          
          {question.ibCriteria && question.ibCriteria.length > 0 ? (
            <>
              <Tag icon={<Star className="w-3 h-3 inline pb-0.5" />} color={isDark ? "blue-inverse" : "blue"} className="font-semibold">
                Total {question.points} pts
              </Tag>
              {[...question.ibCriteria].sort((a, b) => a.criterion.localeCompare(b.criterion)).map((c, i) => (
                <Tooltip key={i} title={c.expectation}>
                  <Tag color={isDark ? "cyan-inverse" : "cyan"} className="cursor-help font-medium">
                    {c.criterion.replace('Criterion ', '').split(':')[0]}: {c.points} pt{c.points !== 1 ? 's' : ''}
                  </Tag>
                </Tooltip>
              ))}
            </>
          ) : (
            <Tag icon={<Star className="w-3 h-3 inline pb-0.5" />} color={isDark ? "blue-inverse" : "blue"} className="font-semibold">
              {question.points || 1} pts
            </Tag>
          )}
          <Button
            size="small"
            type={flaggedQuestions.includes(question.id) ? 'primary' : 'default'}
            danger={flaggedQuestions.includes(question.id)}
            icon={<Flag className={clsx("w-3.5 h-3.5", flaggedQuestions.includes(question.id) && "fill-current")} />}
            onClick={() => toggleFlag(question.id)}
            style={{ borderRadius: '16px', fontSize: '12px' }}
          >
            {flaggedQuestions.includes(question.id) ? 'Flagged' : 'Flag'}
          </Button>
        </div>
        {question.timeLimit && timeRemaining !== undefined && (
          <Timer seconds={timeRemaining} label="Time Left" variant="urgent" />
        )}
      </div>

      <div className="mb-8">
        {/* Section Background Info */}
        {question.sectionId && config?.sections?.find(s => s.id === question.sectionId) && (
          (() => {
            const section = config.sections!.find(s => s.id === question.sectionId)!;
            return (
              <div className={`mb-6 p-5 rounded-2xl ${isDark ? 'bg-indigo-900/10 border border-indigo-500/20' : 'bg-indigo-50/50 border border-indigo-100'}`}>
                <Typography.Title level={5} className="uppercase tracking-widest flex items-center gap-2 mb-3" style={{ fontSize: '12px', color: isDark ? '#818cf8' : '#6366f1' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  {section.title || 'Background Information'}
                </Typography.Title>
                <MarkdownRenderer content={section.content} className="text-base text-glass-secondary" />
              </div>
            );
          })()
        )}

        <MarkdownRenderer content={question.content} className="text-lg md:text-xl font-medium text-glass-primary" />

        {question.imageUrl && (
          <div className="mt-4 rounded-lg overflow-hidden">
            <img src={question.imageUrl} alt="Question Reference" className="max-w-full h-auto w-auto object-contain max-h-96 rounded-lg" />
          </div>
        )}
      </div>

      {question.requiresDiagram && (
        <div className="mb-6">
          <Typography.Text strong style={{ color: isDark ? '#a5b4fc' : '#6366f1', display: 'block', marginBottom: '8px' }}>
            Draw your answer here:
          </Typography.Text>
          <DrawingCanvas 
            value={drawnData} 
            onChange={handleDrawingChange} 
            readOnly={disabled} 
          />
        </div>
      )}

      {question.type === 'text' ? (
        <div className="mt-4">
           {question.requiresDiagram && (
             <Typography.Text strong style={{ color: isDark ? '#a5b4fc' : '#6366f1', display: 'block', marginBottom: '8px' }}>
               Written explanation (optional):
             </Typography.Text>
           )}
          <RichTextEditor
            value={selectedOptions[0] || ''}
            onChange={(val) => handleSelectionChange([val])}
            placeholder={question.requiresDiagram ? "Add any supplementary text explanation..." : "Type your answer here..."}
          />
        </div>
      ) : (
        <OptionSelector
          options={question.options || []}
          selectedOptionIds={selectedOptions}
          type={question.type}
          onSelectionChange={handleSelectionChange}
          disabled={disabled}
        />
      )}
    </Card>
  );
};
