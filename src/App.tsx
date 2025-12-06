import React, { useState } from 'react';
import { useQuizStore } from './store/quizStore';
import { QuizRenderer } from './components/QuizRenderer';
import { sampleQuiz } from './data/sampleQuiz';
import { Upload, Play } from 'lucide-react';
import type { QuizConfig } from './types/quiz';

function App() {
  const { config, setConfig } = useQuizStore();
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLoadSample = () => {
    setConfig(sampleQuiz);
  };

  const handleLoadJson = () => {
    try {
      const parsed = JSON.parse(jsonInput) as QuizConfig;
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid quiz format: missing questions array');
      }
      setConfig(parsed);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Invalid JSON');
    }
  };

  // Apply basic theme from config if available
  const themeStyles = config?.theme ? {
    '--primary-color': config.theme.primaryColor,
    '--bg-color': config.theme.backgroundColor,
    fontFamily: config.theme.fontFamily || 'inherit',
  } as React.CSSProperties : {};

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors" style={themeStyles}>
      
      {/* Dynamic Background if theme is set */}
      {config?.theme && (
        <div 
            className="fixed inset-0 -z-10 transition-colors pointer-events-none" 
            style={{ backgroundColor: config.theme.backgroundColor }}
        />
      )}

      {config ? (
        <QuizRenderer />
      ) : (
        <div className="min-h-screen flex flex-col justify-center items-center p-4">
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Quiz Platform</h1>
              <p className="text-gray-500">Create and take quizzes from JSON specifications</p>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste your Quiz JSON here..."
                  className="w-full h-40 p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-gray-50 font-mono text-sm resize-none"
                />
                
                {error && (
                    <p className="absolute -bottom-6 left-0 text-red-500 text-sm">{error}</p>
                )}
              </div>

              <button
                onClick={handleLoadJson}
                disabled={!jsonInput.trim()}
                className="w-full flex justify-center items-center px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Upload className="w-5 h-5 mr-2" />
                Load Quiz from JSON
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or start with</span>
                </div>
              </div>

              <button
                onClick={handleLoadSample}
                className="w-full flex justify-center items-center px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <Play className="w-5 h-5 mr-2 text-green-600" />
                Load Sample Math Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
