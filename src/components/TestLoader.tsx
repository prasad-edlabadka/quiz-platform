import React, { useState, useRef } from 'react';
import { Upload, FileText, BrainCircuit, Library, HelpCircle, CheckCircle2 } from 'lucide-react';
import { TestSelector } from './TestSelector';
import { useTestStore } from '../store/testStore';

interface TestLoaderProps {
  jsonInput: string;
  setJsonInput: (val: string) => void;
  error: string | null;
  onLoadJson: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onProcessTestData: (data: string | any) => void;
  onStartSyllabusMode: () => void;
  onOpenSchemaHelp?: () => void;
}

import { PastResultsView } from './PastResultsView';

export const TestLoader: React.FC<TestLoaderProps> = ({
  jsonInput,
  setJsonInput,
  error,
  onLoadJson,
  onFileUpload,
  onProcessTestData,
  onStartSyllabusMode,
  onOpenSchemaHelp
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'ai' | 'upload' | 'library' | 'history'>('ai');
  const { themeMode } = useTestStore();
  const isDark = themeMode === 'dark';

  const tabsConfig = [
    {
      id: 'ai' as const,
      icon: BrainCircuit,
      label: 'AI Generation',
      shortLabel: 'AI',
    },
    {
      id: 'library' as const,
      icon: Library,
      label: 'Library',
      shortLabel: 'Sample',
    },
    {
      id: 'upload' as const,
      icon: Upload,
      label: 'Upload',
      shortLabel: 'Custom',
    },
    {
      id: 'history' as const,
      icon: CheckCircle2,
      label: 'Past Results',
      shortLabel: 'History',
    },
  ];

  return (
    <div className="w-full glass-panel rounded-3xl p-8 md:p-12 relative transition-all duration-500 flex flex-col flex-1 min-h-[500px]">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-glass-primary mb-2">Get Started</h2>
        <p className="text-glass-secondary text-sm">Choose how you want to begin</p>
      </div>

      {/* Tabs */}
      <div className={`grid grid-cols-4 gap-1 ${isDark ? 'bg-black/20' : 'bg-slate-200/50'} rounded-xl p-1 mb-6`}>
        {tabsConfig.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 py-2.5 px-2 sm:px-4 rounded-lg text-sm font-medium transition-all ${isActive
                ? isDark
                  ? 'bg-indigo-500/20 text-indigo-300 shadow-sm border border-indigo-500/20'
                  : 'bg-white text-indigo-600 shadow-sm border border-indigo-100'
                : isDark
                  ? 'text-slate-400 hover:text-slate-50 hover:bg-white/5 border border-transparent'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-white/50 border border-transparent'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col justify-start">
        {/* Tab Content: AI Generation */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4 border ${isDark ? 'border-white/10' : 'border-black/5'}`}>
                <BrainCircuit className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-lg font-medium text-glass-primary mb-2">Build from Syllabus</h3>
              <p className="text-sm text-glass-secondary">Paste any topic or syllabus, and our AI will generate a tailored test for you instantly.</p>
            </div>

            <button
              onClick={onStartSyllabusMode}
              className="w-full flex justify-center items-center px-4 py-4 bg-gradient-to-r from-indigo-500/80 via-purple-500/80 to-pink-500/80 backdrop-blur-md border border-white/20 text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5"
            >
              <BrainCircuit className="w-5 h-5 mr-2" />
              Generate Test with AI
            </button>
          </div>
        )}

        {/* Tab Content: Library */}
        {activeTab === 'library' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-glass-primary mb-2">Sample Tests</h3>
              <p className="text-sm text-glass-secondary">Try out our platform using one of the pre-made sample tests below.</p>
            </div>

            <div className={`rounded-xl p-4 border ${isDark ? 'bg-black/10 border-white/5' : 'bg-black/5 border-black/5'}`}>
              <TestSelector onSelect={onProcessTestData} />
            </div>
          </div>
        )}

        {/* Tab Content: Upload/Raw JSON */}
        {activeTab === 'upload' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-glass-primary mb-2">Custom JSON</h3>
              <p className="text-sm text-glass-secondary">Have an existing test JSON? Upload the file directly or paste the raw contents.</p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileUpload}
              accept=".json"
              className="hidden"
              data-testid="file-upload"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className={`w-full flex justify-center items-center px-4 py-3 glass-button rounded-xl font-medium transition-all ${isDark ? 'border-blue-500/30 hover:bg-blue-500/10 text-blue-300' : 'border-blue-500/20 hover:bg-blue-500/5 text-blue-600'}`}
            >
              <FileText className="w-5 h-5 mr-2" />
              Upload .json File
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-glass-secondary">Or paste raw JSON</span>
              </div>
            </div>

            <div className="relative group">
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste your Test JSON here..."
                className="w-full h-32 p-4 rounded-xl glass-input outline-none font-mono text-xs resize-none focus:h-48 transition-all duration-300"
              />
              {error && (
                <p className="absolute -bottom-6 left-0 text-red-500 text-xs">{error}</p>
              )}
            </div>

            <button
              onClick={onLoadJson}
              disabled={!jsonInput.trim()}
              className="w-full flex justify-center items-center px-4 py-3 glass-button-primary rounded-xl font-medium transition-all"
            >
              <Upload className="w-5 h-5 mr-2" />
              Load from Text
            </button>

            {onOpenSchemaHelp && (
              <button
                onClick={onOpenSchemaHelp}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 glass-button rounded-xl text-sm font-medium transition-all ${isDark ? 'text-glass-secondary hover:text-indigo-300' : 'text-glass-secondary hover:text-indigo-600'}`}
              >
                <HelpCircle className="w-4 h-4" />
                View JSON Schema Help
              </button>
            )}
          </div>
        )}

        {/* Tab Content: Past Results */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col">
            <PastResultsView onBack={() => setActiveTab('ai')} />
          </div>
        )}
      </div>
    </div>
  );
};
