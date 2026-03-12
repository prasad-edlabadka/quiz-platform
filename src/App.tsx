import React, { useState, useEffect } from 'react';
import { useTestStore } from './store/testStore';
import { TestRenderer } from './components/TestRenderer';
import { ConfirmationModal } from './components/ConfirmationModal';
import { SchemaHelpModal } from './components/SchemaHelpModal';
import { Trash2, Sun, Moon, Download, Plus, Library, CheckCircle2, FileText, Upload, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TestConfig } from './types/test';

import { TestLoader } from './components/TestLoader';
import { LandingFeatures } from './components/LandingFeatures';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const { config, setConfig, clearState, themeMode, toggleTheme } = useTestStore();
  const isDark = themeMode === 'dark';
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ai' | 'upload' | 'library' | 'offline' | 'history' | null>('ai');

  const tabsConfig = [
    { id: 'ai' as const, icon: Plus, label: 'New Test' },
    { id: 'library' as const, icon: Library, label: 'My Library' },
    { id: 'upload' as const, icon: Upload, label: 'Upload Test File' },
    { id: 'history' as const, icon: CheckCircle2, label: 'Past Results' },
    { id: 'offline' as const, icon: FileText, label: 'Offline Work' },
  ];
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  // Sync theme with HTML element
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  const processTestData = (data: string | any) => {
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
        throw new Error('Test must have at least one question (in sections or top-level)');
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
      const cleanConfig: TestConfig = {
        id: parsed.id || `test-${Date.now()}`,
        title: parsed.title || 'Untitled Test',
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
      console.error('Test processing error:', e);
      setError(e.message || 'Invalid JSON format');
    }
  };

  const handleLoadJson = () => {
    processTestData(jsonInput);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      processTestData(content);
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
              {useTestStore.getState().status === 'active' && (
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
                  className={`p-2 glass-button rounded-full shadow-sm transition-all ${themeMode === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-500 hover:text-indigo-600'}`}
                  title="Export Test JSON"
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
            <TestRenderer />
          </>
        ) : (
          <div className="flex min-h-screen w-full">
            {/* Sidebar Navigation */}
            <div className={`w-20 md:w-24 border-r ${isDark ? 'border-white/5 bg-[#0f111a]' : 'border-indigo-100 bg-white/50'} flex flex-col items-center py-6 shrink-0 z-10 transition-colors`}>
              <div className="mb-8 w-12 h-12 md:w-14 md:h-14">
                {activeTab !== null && (
                  <motion.img
                    layoutId="main-logo"
                    src="/revise-logo.png"
                    alt="Revise logo"
                    className="w-12 h-12 md:w-14 md:h-14 rounded-2xl object-contain shadow-lg shadow-indigo-500/10 hover:scale-105 transition-transform"
                  />
                )}
              </div>

              <nav className="flex flex-col gap-4 w-full px-2 md:px-3">
                <div className="mb-2 w-full">
                  <button
                    onClick={() => setActiveTab(null)}
                    className={`w-full flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all ${activeTab === null
                      ? isDark
                        ? 'bg-indigo-500/20 text-indigo-300 shadow-sm border border-indigo-500/20'
                        : 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100'
                      : isDark ? 'text-slate-400 hover:bg-white/5 hover:text-slate-50 border border-transparent' : 'text-slate-500 hover:bg-slate-100 hover:text-indigo-600 border border-transparent'
                      }`}
                  >
                    <Home className={`w-5 h-5 ${activeTab === null ? 'scale-110' : ''} transition-transform duration-300`} />
                    <span className="text-[10px] font-medium hidden md:block text-center px-1">Home</span>
                  </button>
                </div>

                {tabsConfig.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all ${isActive
                        ? isDark
                          ? 'bg-indigo-500/20 text-indigo-300 shadow-sm border border-indigo-500/20'
                          : 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100'
                        : isDark
                          ? 'text-slate-400 hover:bg-white/5 hover:text-slate-50 border border-transparent'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-indigo-600 border border-transparent'
                        }`}
                    >
                      <tab.icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform duration-300`} />
                      <span className="text-[10px] font-medium hidden md:block text-center px-1">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-auto flex flex-col gap-4 w-full px-2 md:px-3">

                <button
                  onClick={toggleTheme}
                  className={`w-full flex flex-col items-center justify-center py-3 rounded-xl transition-all ${isDark ? 'text-slate-400 hover:bg-white/5 hover:text-slate-50' : 'text-slate-500 hover:bg-slate-100 hover:text-indigo-600'}`}
                  title={`Switch to ${themeMode === 'light' ? 'Dark' : 'Light'} Mode`}
                >
                  {themeMode === 'light' ? <Moon className="w-5 h-5 text-indigo-600" /> : <Sun className="w-5 h-5 text-yellow-300" />}
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
              <main className="flex-1 overflow-y-auto px-6 lg:px-10 pb-10 pt-8">
                <div className={`w-full mx-auto grid grid-cols-1 gap-8 lg:gap-12 items-start h-full transition-all duration-500 max-w-[1280px]`}>
                  {activeTab === null && (<LandingFeatures />)}

                  {activeTab !== null && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                      className="flex flex-col h-full pt-2 lg:pt-0 pb-8 min-h-[500px]"
                    >
                      <motion.div layoutId="app-header-title" className="mb-10 flex flex-col items-start justify-center h-14 md:h-16">
                        <div className="text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 leading-none tracking-tight mb-2">
                          Revise
                        </div>
                        <div className="text-sm font-semibold tracking-[0.2em] text-glass-secondary uppercase">
                          AI-Powered Exam Practice
                        </div>
                      </motion.div>
                      <TestLoader
                        jsonInput={jsonInput}
                        setJsonInput={setJsonInput}
                        error={error}
                        onLoadJson={handleLoadJson}
                        onFileUpload={handleFileUpload}
                        onProcessTestData={processTestData}
                        onOpenSchemaHelp={() => setIsSchemaModalOpen(true)}
                        activeTab={activeTab}
                      />
                    </motion.div>
                  )}
                </div>
              </main>
            </div>
          </div>
        )}
      </ErrorBoundary>



      <ConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={clearState}
        title="Reset Application?"
        description="This will clear all your current test progress, answers, and the loaded test configuration. You will be returned to the loading screen. This action cannot be undone."
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
