import React, { useState, useEffect } from 'react';
import { generateQuizFromSyllabus } from '../services/aiService';
import type { QuizConfig } from '../types/quiz';
import { BrainCircuit, Loader2, AlertCircle, Key, BookOpen, Hash, HelpCircle } from 'lucide-react';
import { ApiKeyHelpModal } from './ApiKeyHelpModal';

interface SyllabusInputProps {
  onQuizGenerated: (config: QuizConfig) => void;
  onCancel: () => void;
}

export const SyllabusInput: React.FC<SyllabusInputProps> = ({ onQuizGenerated, onCancel }) => {
  const [apiKey, setApiKey] = useState('');
  const [syllabus, setSyllabus] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setError('Please provide a valid Google Gemini API Key');
      return;
    }
    if (!syllabus.trim()) {
      setError('Please enter a syllabus or topic');
      return;
    }

    setLoading(true);
    setError(null);
    localStorage.setItem('gemini_api_key', apiKey.trim());

    try {
      const quizConfig = await generateQuizFromSyllabus(apiKey, syllabus, questionCount);
      onQuizGenerated(quizConfig);
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="max-w-xl w-full glass-panel rounded-3xl p-6 md:p-12 relative mx-4 md:mx-0">
      <div className="absolute top-4 right-4 md:top-6 md:right-6">
        <button 
           onClick={onCancel}
           className="text-gray-400 hover:text-white font-medium text-sm transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-300 mb-4 backdrop-blur-sm border border-indigo-500/30">
            <BrainCircuit className="w-6 h-6" />
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-glass-primary mb-2">Generate Quiz from Syllabus</h1>
        <p className="text-glass-secondary text-sm">Use AI to create a tailored quiz from your study materials.</p>
      </div>

      <div className="space-y-8">
        {/* API Key Input */}
        <div className="space-y-3">
            <div className="flex justify-between items-end">
                <label className="text-sm font-bold text-glass-primary flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-300" />
                    Gemini API Key
                </label>
                <button
                    onClick={() => setIsHelpOpen(true)}
                    className="text-xs text-indigo-300 hover:text-white hover:underline flex items-center gap-1 font-medium transition-colors"
                >
                    <HelpCircle className="w-3 h-3" />
                    How do I get a key?
                </button>
            </div>
            
            <div>
                <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API Key"
                    className="w-full p-3 rounded-xl glass-input outline-none text-sm placeholder:text-gray-500"
                />
                <p className="text-xs text-glass-secondary mt-2">
                    Your key is stored locally in your browser and never sent to our servers.
                </p>
            </div>
        </div>

        {/* Syllabus Textarea */}
        <div className="space-y-3">
            <label className="text-sm font-bold text-glass-primary flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-300" />
                Syllabus / Topics
            </label>
            <textarea
                value={syllabus}
                onChange={(e) => setSyllabus(e.target.value)}
                placeholder="Paste your syllabus, topic list, or notes here...&#10;For example:&#10;- Introduction to React&#10;- Components and Props&#10;- State and Lifecycle"
                className="w-full h-40 p-3 rounded-xl glass-input outline-none text-sm resize-none placeholder:text-gray-500"
            />
        </div>

        {/* Question Count Input */}
        <div className="space-y-3">
            <label className="text-sm font-bold text-glass-primary flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-300" />
                Number of Questions
            </label>
            <div>
                <input
                    type="number"
                    min={1}
                    max={20}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                    className="w-full p-3 rounded-xl glass-input outline-none text-sm"
                />
                <p className="text-xs text-glass-secondary mt-2">
                    Choose between 1 and 20 questions.
                </p>
            </div>
        </div>

        {error && (
            <div className="p-3 bg-red-500/20 text-red-800 dark:text-red-200 text-sm rounded-lg flex items-center gap-2 border border-red-500/30">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
            </div>
        )}

        <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex justify-center items-center px-4 py-3 glass-button-primary rounded-lg font-medium transition-colors shadow-sm"
        >
            {loading ? (
                <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Questions...
                </>
            ) : (
                <>
                    <BrainCircuit className="w-5 h-5 mr-2" />
                    Generate Quiz
                </>
            )}
        </button>
      
      <ApiKeyHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </div>
      </div>
    </>
  );
};
