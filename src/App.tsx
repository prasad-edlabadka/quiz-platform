import React, { useState, useEffect } from 'react';
import { useQuizStore } from './store/quizStore';
import { QuizRenderer } from './components/QuizRenderer';
import { ConfirmationModal } from './components/ConfirmationModal';
import { SchemaHelpModal } from './components/SchemaHelpModal';
import { Trash2, Sun, Moon, Download } from 'lucide-react';
import { SyllabusInput } from './components/SyllabusInput';
import type { QuizConfig } from './types/quiz';

import { QuizLoader } from './components/QuizLoader';
import { LandingFeatures } from './components/LandingFeatures';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const { config, setConfig, clearState, themeMode, toggleTheme } = useQuizStore();
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isSyllabusMode, setIsSyllabusMode] = useState(false);

  // Sync theme with HTML element
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  const processQuizData = (data: string | any) => {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;

      // Basic validation
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON: Must be an object');
      }

      // Process Sections and Questions
      let rawQuestions: any[] = [];
      const sections: any[] = [];

      // 1. Handle Sections (New Format)
      if (parsed.sections && Array.isArray(parsed.sections)) {
        parsed.sections.forEach((section: any) => {
          if (!section.id || !section.questions) return;

          // Store section metadata
          sections.push({
            id: section.id,
            title: section.title,
            content: section.content || ''
          });

          // Extract questions and tag them with sectionId
          if (Array.isArray(section.questions)) {
            section.questions.forEach((q: any) => {
              rawQuestions.push({ ...q, sectionId: section.id });
            });
          }
        });
      }



      // 2. Handle Top-Level Questions (Legacy/Mixed Format)
      // FIX: If we successfully extracted questions from sections, we IGNORE top-level questions 
      // to prevents duplicates. The app treats 'sections' as the source of truth if present.
      if (rawQuestions.length === 0 && parsed.questions && Array.isArray(parsed.questions)) {
        // No sections found (or empty), so we trust top-level questions
        rawQuestions = [...parsed.questions];
      } else if (rawQuestions.length > 0 && parsed.questions) {
        console.warn('Ignoring top-level questions because sections were found.');
      }

      // Handle questions array validation
      if (rawQuestions.length === 0) {
        throw new Error('Quiz must have at least one question (in sections or top-level)');
      }

      // Normalize and validate questions
      const normalizedQuestions = rawQuestions.map((q: any, qIndex: number) => {
        // Handle ID mapping: preferred 'id', fallback 'questionId', fallback generated
        const id = q.id || q.questionId || `q-${qIndex + 1}`;

        if (!q.content) {
          throw new Error(`Question ${qIndex + 1} is missing "content"`);
        }

        // Handle options
        if (q.type !== 'text' && (!q.options || !Array.isArray(q.options) || q.options.length === 0)) {
          throw new Error(`Question "${q.content.substring(0, 20)}..." is missing options`);
        }

        const normalizedOptions = (q.options || []).map((opt: any, optIndex: number) => ({
          id: opt.id || `opt-${id}-${optIndex + 1}`,
          content: opt.content || '',
          isCorrect: !!opt.isCorrect,
          imageUrl: opt.imageUrl || opt.imageURL // Support both camelCase and URL suffix
        }));

        return {
          ...q,
          id,
          type: q.type || 'single_choice', // Default to single choice if missing
          options: normalizedOptions,
          // Ensure points is a number if present, default to 1
          points: typeof q.points === 'number' ? q.points : 1,
          imageUrl: q.imageUrl || q.imageURL, // Support both cases for question images too
          sectionId: q.sectionId // Preserve section link
        };
      });

      // Construct final config
      const cleanConfig: QuizConfig = {
        id: parsed.id || `quiz-${Date.now()}`,
        title: parsed.title || 'Untitled Quiz',
        description: parsed.description || '',
        globalTimeLimit: parsed.globalTimeLimit,
        shuffleQuestions: !!parsed.shuffleQuestions,
        theme: parsed.theme,
        sections: sections.length > 0 ? sections : undefined,
        questions: normalizedQuestions
      };

      setConfig(cleanConfig);
      setError(null);
      setJsonInput(JSON.stringify(cleanConfig, null, 2)); // Update input to show cleaned version
    } catch (e: any) {
      console.error('Quiz processing error:', e);
      setError(e.message || 'Invalid JSON format');
    }
  };

  const handleLoadJson = () => {
    processQuizData(jsonInput);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      processQuizData(content);
      // Optional: also populate the text area for visibility
      setJsonInput(content);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);

    // Reset value so same file can be selected again if needed
    event.target.value = '';
  };

  // Apply basic theme from config if available (overrides system theme if specific colors provided)
  const themeStyles = config?.theme ? {
    '--primary-color': config.theme.primaryColor,
    '--bg-color': config.theme.backgroundColor,
    fontFamily: config.theme.fontFamily || 'inherit',
  } as React.CSSProperties : {};

  return (
    <div className="min-h-screen transition-colors duration-500" style={themeStyles}>

      {/* Dynamic Background if theme is set - made semi-transparent to blend with mesh */}
      {config?.theme && (
        <div
          className="fixed inset-0 -z-10 transition-colors pointer-events-none opacity-80"
          style={{ backgroundColor: config.theme.backgroundColor }}
        />
      )}

      <ErrorBoundary onReset={clearState}>
        {config ? (
          <>
            <div className="absolute top-4 right-4 z-50 print:hidden flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 glass-button rounded-full shadow-sm transition-all"
                title={`Switch to ${themeMode === 'light' ? 'Dark' : 'Light'} Mode`}
              >
                {themeMode === 'light' ? <Moon className="w-5 h-5 text-indigo-600" /> : <Sun className="w-5 h-5 text-yellow-300" />}
              </button>

              {/* Only show floating download when NOT in intro or completed (where specialized buttons exist) */}
              {useQuizStore.getState().status === 'active' && (
                <button
                  onClick={() => {
                    if (!config) return;
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href", dataStr);
                    downloadAnchorNode.setAttribute("download", `${config.title || 'quiz'}.json`);
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                  }}
                  className={`p-2 glass-button rounded-full shadow-sm transition-all ${themeMode === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-500 hover:text-indigo-600'}`}
                  title="Export Quiz JSON"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => setIsResetModalOpen(true)}
                className="p-2 glass-button-danger rounded-full shadow-sm transition-all"
                title="Reset App / Clear Data"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <QuizRenderer />
          </>
        ) : (
          <div className="min-h-screen flex flex-col justify-center items-center p-4">
            {/* ... existing loading screen content ... */}
            {isSyllabusMode ? (
              <SyllabusInput
                onQuizGenerated={(config) => {
                  setConfig(config);
                  setIsSyllabusMode(false);
                }}
                onCancel={() => setIsSyllabusMode(false)}
              />
            ) : (
              <div className="w-full max-w-[1440px] mx-auto flex-1 flex flex-col justify-center relative px-4 lg:px-8">

                <div className="grid grid-cols-1 lg:grid-cols-[4fr_5fr] gap-8 lg:gap-16 items-stretch w-full mt-16 md:mt-0">
                  <LandingFeatures />
                  <div className="flex flex-col h-full pt-6 md:pt-[60px]">
                    <QuizLoader
                      jsonInput={jsonInput}
                      setJsonInput={setJsonInput}
                      error={error}
                      onLoadJson={handleLoadJson}
                      onFileUpload={handleFileUpload}
                      onProcessQuizData={processQuizData}
                      onStartSyllabusMode={() => setIsSyllabusMode(true)}
                      onOpenSchemaHelp={() => setIsSchemaModalOpen(true)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ErrorBoundary>



      <ConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={clearState}
        title="Reset Application?"
        description="This will clear all your current quiz progress, answers, and the loaded quiz configuration. You will be returned to the loading screen. This action cannot be undone."
        confirmLabel="Reset Everything"
        variant="danger"
      />

      <SchemaHelpModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />
    </div>
  );
}

export default App;
