import React from 'react';
import { useTestStore } from '../store/testStore';
import { ArrowLeft, Printer } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

export const PrintableView: React.FC = () => {
  const { config, resetTest } = useTestStore();

  if (!config) return null;

  return (
    // Add standard A4 print styles and margins to the wrapper
    <div className="bg-white min-h-screen text-black w-full print:w-[210mm] print:mx-auto" style={{ fontFamily: 'sans-serif' }}>
      {/* Action Bar - Hidden when printing */}
      <div className="print:hidden sticky top-0 bg-white border-b border-gray-200 z-50 p-4 shadow-sm mb-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={resetTest}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="mr-2 w-5 h-5" />
            Back to Test Select
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Printer className="mr-2 w-5 h-5" />
            Print PDF
          </button>
        </div>
      </div>

      {/* Main Print Container - Enforce A4 dimensions and avoid clipping */}
      <div className="max-w-4xl mx-auto p-4 md:p-8 print:p-8 print:col-span-1 print:block print:max-w-[210mm] print:bg-white overflow-hidden">

        {/* Header */}
        <div className="mb-12 border-b-2 border-black pb-6 text-center">
          <h1 className="text-3xl font-bold mb-4">{config.title}</h1>
          {config.description && <p className="text-gray-700 mb-6">{config.description}</p>}

          <div className="flex justify-between text-sm text-gray-600 mt-8 text-left">
            <div><strong>Total Questions:</strong> {config.questions.length}</div>
            {config.globalTimeLimit && (
              <div><strong>Time Limit:</strong> {Math.floor(config.globalTimeLimit / 60)} Minutes</div>
            )}
            <div><strong>Question Types:</strong> {(() => {
              const types = new Set(config.questions.map(q => q.type));
              if (types.size === 1) {
                const type = Array.from(types)[0];
                return type === 'single_choice' ? 'Single Choice' : type === 'multiple_choice' ? 'Multiple Choice' : 'Text Based';
              }
              const hasMCQ = types.has('single_choice') || types.has('multiple_choice');
              const hasText = types.has('text');
              if (hasMCQ && hasText) return 'Mixed (MCQ/Text)';
              if (hasMCQ) return 'Mixed (MCQ Only)';
              return 'Mixed';
            })()}</div>
            <div className="w-64 border-b border-gray-400"><strong>Name:</strong> </div>
            <div className="w-48 border-b border-gray-400"><strong>Date:</strong> </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-12">
          {config.sections ? (
            // Render with sections
            config.sections.map((section, sectionIndex) => (
              <div key={section.id} className="mb-12 print:break-inside-avoid">
                <div className="mb-6 bg-gray-100 p-4 border border-gray-300 rounded-lg print:bg-transparent print:border-black">
                  <h2 className="text-xl font-bold mb-2">Section {sectionIndex + 1}: {section.title}</h2>
                  <div className="prose prose-sm max-w-none print:prose-p:text-black">
                    <MarkdownRenderer content={section.content} />
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Ensure QuestionBlock has page break handling */}
                  {config.questions
                    .filter((q) => q.sectionId === section.id)
                    .map((question, qIndex) => (
                      <QuestionBlock key={question.id} question={question} index={qIndex + 1} />
                    ))}
                </div>
              </div>
            ))
          ) : (
            // Render without sections (flat questions)
            <div className="space-y-8 w-full">
              {config.questions.map((question, qIndex) => (
                <QuestionBlock key={question.id} question={question} index={qIndex + 1} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-300 text-center text-sm text-gray-500 print:text-black">
          <div>End of Question Paper</div>
          <div className="mt-2 text-xs text-gray-400 print:text-gray-500">Created with Revise · Built by Prasad Edlabadkar</div>
        </div>
      </div>
    </div>
  );
};

// Helper component for rendering physical questions
const QuestionBlock = ({ question, index }: { question: any; index: number }) => {
  return (
    <div className="print:break-inside-avoid print:w-full print:max-w-full">
      <div className="flex gap-4">
        <span className="font-bold text-lg min-w-[24px]">{index}.</span>
        <div className="flex-1 min-w-0 pr-4">
          <div className="prose prose-sm max-w-none mb-4 print:prose-p:text-black">
            <MarkdownRenderer content={question.content} />
            {question.imageUrl && (
              <img
                src={question.imageUrl}
                alt="Question reference"
                className="mt-4 max-w-full h-auto rounded-lg border border-gray-200"
              />
            )}
          </div>

          {question.type === 'text' ? (
            <div className="mt-8 space-y-8 print:w-full">
              <div className="border-b border-gray-300 w-full print:w-[95%]"></div>
              <div className="border-b border-gray-300 w-full print:w-[95%]"></div>
              <div className="border-b border-gray-300 w-full print:w-[95%]"></div>
              <div className="border-b border-gray-300 w-full print:w-[95%]"></div>
            </div>
          ) : (
            <div className="grid gap-4 mt-6">
              {question.options?.map((option: any, optIndex: number) => {
                const label = String.fromCharCode(65 + optIndex); // A, B, C...
                return (
                  <div key={option.id} className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs text-gray-400">{label}</span>
                    </div>
                    <div className="prose prose-sm print:prose-p:text-black">
                      <MarkdownRenderer content={option.content} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
