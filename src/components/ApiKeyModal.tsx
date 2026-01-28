import React, { useState } from 'react';
import { Key, Lock, AlertCircle } from 'lucide-react';
import { useQuizStore } from '../store/quizStore';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const { setApiKey } = useQuizStore();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
        setError('Please enter a valid API key');
        return;
    }
    
    // Basic validation (Gemini keys usually start with AIza)
    if (!key.startsWith('AIza')) {
        setError('Invalid API key format. Should start with "AIza..."');
        return;
    }

    setApiKey(key);
    onSuccess(key);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md p-6 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-500 mb-4">
                <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-glass-primary">Enter Gemini API Key</h3>
            <p className="text-sm text-glass-secondary mt-2">
                To evaluate text answers with AI, we need your Google Gemini API key. It will be stored locally in your browser.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-glass-secondary uppercase tracking-wider mb-2">
                    API Key
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key className="h-4 w-4 text-glass-secondary" />
                    </div>
                    <input
                        type="password"
                        value={key}
                        onChange={(e) => {
                            setKey(e.target.value);
                            setError('');
                        }}
                        className="glass-input w-full pl-10 py-2.5 rounded-lg text-sm"
                        placeholder="AIza..."
                        autoFocus
                    />
                </div>
                {error && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-red-500">
                        <AlertCircle className="w-3 h-3" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            <div className="flex gap-3 mt-6">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 glass-button rounded-lg text-sm"
                >
                    Skip Grading
                </button>
                <button
                    type="submit"
                    className="flex-1 px-4 py-2 glass-button-primary rounded-lg text-sm shadow-lg shadow-indigo-500/20"
                >
                    Save & Grade
                </button>
            </div>
        </form>
        
        <p className="text-[10px] text-center text-glass-secondary mt-4 opacity-70">
            Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Get one here</a>
        </p>
      </div>
    </div>
  );
};
