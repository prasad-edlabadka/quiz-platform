import React, { useState, useRef, useEffect } from 'react';
import { useQuizStore } from './store/quizStore';
import { QuizRenderer } from './components/QuizRenderer';
import { ConfirmationModal } from './components/ConfirmationModal';
import { SchemaHelpModal } from './components/SchemaHelpModal';
import { sampleQuiz } from './data/sampleQuiz';
import { Upload, Play, Trash2, FileText, HelpCircle, BrainCircuit, Sun, Moon } from 'lucide-react';
import { SyllabusInput } from './components/SyllabusInput';
import type { QuizConfig } from './types/quiz';

function App() {
  const { config, setConfig, clearState, themeMode, toggleTheme } = useQuizStore();
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isSyllabusMode, setIsSyllabusMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync theme with HTML element
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  const handleLoadSample = () => {
    setConfig(sampleQuiz);
  };

  const processQuizData = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      
      // Basic validation
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON: Must be an object');
      }

      // Handle questions array
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid quiz format: missing "questions" array');
      }

      if (parsed.questions.length === 0) {
        throw new Error('Quiz must have at least one question');
      }

      // Normalize and validate questions
      const normalizedQuestions = parsed.questions.map((q: any, qIndex: number) => {
        // Handle ID mapping: preferred 'id', fallback 'questionId', fallback generated
        const id = q.id || q.questionId || `q-${qIndex + 1}`;
        
        if (!q.content) {
          throw new Error(`Question ${qIndex + 1} is missing "content"`);
        }

        // Handle options
        if (!q.options || !Array.isArray(q.options) || q.options.length === 0) {
          throw new Error(`Question "${q.content.substring(0, 20)}..." is missing options`);
        }

        const normalizedOptions = q.options.map((opt: any, optIndex: number) => ({
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
          imageUrl: q.imageUrl || q.imageURL // Support both cases for question images too
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

      {config ? (
        <>
          <div className="absolute top-4 right-4 z-10 print:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 glass-button rounded-full shadow-sm transition-all"
              title={`Switch to ${themeMode === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {themeMode === 'light' ? <Moon className="w-5 h-5 text-indigo-600" /> : <Sun className="w-5 h-5 text-yellow-300" />}
            </button>
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
          <div className="max-w-xl w-full glass-panel rounded-3xl p-8 md:p-12 relative transition-all duration-500">
            <div className="absolute top-6 right-6 flex items-center gap-2">
                <button
                    onClick={toggleTheme}
                    className="text-glass-secondary hover:text-indigo-500 transition-colors p-1"
                    title={`Switch to ${themeMode === 'light' ? 'Dark' : 'Light'} Mode`}
                >
                    {themeMode === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                </button>
                <button 
                    onClick={() => setIsSchemaModalOpen(true)}
                    className="text-glass-secondary hover:text-indigo-500 transition-colors p-1"
                    title="View JSON Schema"
                >
                    <HelpCircle className="w-6 h-6" />
                </button>
            </div>

            <div className="text-center mb-10">
              <h1 className="text-3xl font-extrabold text-glass-primary mb-2">Quiz Platform</h1>
              <p className="text-glass-secondary">Create and take quizzes from JSON specifications</p>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste your Quiz JSON here..."
                  className="w-full h-40 p-4 rounded-xl glass-input outline-none font-mono text-sm resize-none"
                />
                
                {error && (
                    <p className="absolute -bottom-6 left-0 text-red-500 text-sm">{error}</p>
                )}
              </div>

              <button
                onClick={handleLoadJson}
                disabled={!jsonInput.trim()}
                className="w-full flex justify-center items-center px-4 py-3 glass-button-primary rounded-xl font-medium transition-all"
              >
                <Upload className="w-5 h-5 mr-2" />
                Load from Text
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-glass-secondary">Or upload file</span>
                </div>
              </div>

              <input
                 type="file"
                 ref={fileInputRef}
                 onChange={handleFileUpload}
                 accept=".json"
                 className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex justify-center items-center px-4 py-3 glass-button rounded-xl font-medium transition-all"
              >
                <FileText className="w-5 h-5 mr-2 text-indigo-300" />
                Upload JSON File
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-glass-secondary">Or start with</span>
                </div>
              </div>

              <button
                onClick={handleLoadSample}
                className="w-full flex justify-center items-center px-4 py-3 glass-button rounded-xl font-medium transition-all"
              >
                <Play className="w-5 h-5 mr-2 text-green-400" />
                Load Sample Math Quiz
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-glass-secondary">Or generate with AI</span>
                </div>
              </div>

              <button
                onClick={() => setIsSyllabusMode(true)}
                className="w-full flex justify-center items-center px-4 py-3 bg-gradient-to-r from-indigo-500/80 via-purple-500/80 to-pink-500/80 backdrop-blur-md border border-white/20 text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg"
              >
                <BrainCircuit className="w-5 h-5 mr-2" />
                Generate from Syllabus
              </button>
            </div>
          </div>
          )}
        </div>
      )}

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
