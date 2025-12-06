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
    <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 relative">
      <div className="absolute top-6 right-6">
        <button 
           onClick={onCancel}
           className="text-gray-400 hover:text-gray-600 font-medium text-sm"
        >
          Cancel
        </button>
      </div>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-4">
            <BrainCircuit className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Generate Quiz from Syllabus</h1>
        <p className="text-gray-500 text-sm">Use AI to create a tailored quiz from your study materials.</p>
      </div>

      <div className="space-y-6">
        {/* API Key Input */}
        <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Key className="w-4 h-4 text-gray-400" />
                    Gemini API Key
                </label>
                <button
                    onClick={() => setIsHelpOpen(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 font-medium"
                >
                    <HelpCircle className="w-3 h-3" />
                    How do I get a key?
                </button>
            </div>
            <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API Key"
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-shadow"
            />
            <p className="text-xs text-gray-400">
                Your key is stored locally in your browser and never sent to our servers.
            </p>
        </div>

        {/* Syllabus Textarea */}
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-400" />
                Syllabus / Topics
            </label>
            <textarea
                value={syllabus}
                onChange={(e) => setSyllabus(e.target.value)}
                placeholder="Paste your syllabus, topic list, or notes here...&#10;For example:&#10;- Introduction to React&#10;- Components and Props&#10;- State and Lifecycle"
                className="w-full h-40 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm resize-none transition-shadow"
            />
        </div>

        {/* Question Count Input */}
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-400" />
                Number of Questions
            </label>
            <input
                type="number"
                min={1}
                max={20}
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-shadow"
            />
            <p className="text-xs text-gray-400">
                Choose between 1 and 20 questions.
            </p>
        </div>

        {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
            </div>
        )}

        <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex justify-center items-center px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
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
    </>
  );
};
