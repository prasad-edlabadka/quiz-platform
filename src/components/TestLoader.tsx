import React, { useRef } from 'react';
import { Upload, FileText, HelpCircle, Users } from 'lucide-react';
import { TestSelector } from './TestSelector';
import { useTestStore } from '../store/testStore';

interface TestLoaderProps {
  jsonInput: string;
  setJsonInput: (val: string) => void;
  error: string | null;
  onLoadJson: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onProcessTestData: (data: string | any) => void;
  onOpenSchemaHelp?: () => void;
  activeTab: 'ai' | 'upload' | 'library' | 'offline' | 'history' | 'group' | null;
  setActiveTab?: (tab: 'ai' | 'upload' | 'library' | 'offline' | 'history' | 'group' | null) => void;
  onOpenSettings?: () => void;
  onRetake?: (config: import('../types/test').TestConfig) => void;
}

import { PastResultsView } from './PastResultsView';
import { OfflineUpload } from './OfflineUpload';
import { SyllabusInput } from './SyllabusInput';
import { GroupTestLobby } from './GroupTestLobby';
import { useSyncStore } from '../store/syncStore';

export const TestLoader: React.FC<TestLoaderProps> = ({
  jsonInput,
  setJsonInput,
  error,
  onLoadJson,
  onFileUpload,
  onProcessTestData,
  onOpenSchemaHelp,
  activeTab,
  setActiveTab,
  onOpenSettings,
  onRetake
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { themeMode } = useTestStore();
  const isDark = themeMode === 'dark';
  const { role: syncRole } = useSyncStore();

  if (syncRole === 'client' && activeTab !== 'group') {
     return (
       <div className={`w-full glass-panel rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center flex-1 md:min-h-[500px] ${isDark ? 'bg-black/20' : 'bg-white/50'}`}>
          <Users className="w-16 h-16 text-indigo-500 mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-glass-primary mb-2">Waiting for Host</h2>
          <p className="text-glass-secondary text-center max-w-md mb-6 leading-relaxed">
            You are currently connected to a group session. Participants cannot start tests on their own while connected to a room. Please wait for the host to select and start the test!
          </p>
          {setActiveTab && (
            <button 
              onClick={() => setActiveTab('group')}
              className="px-6 py-3 glass-button-primary rounded-xl font-bold"
            >
              Return to Lobby
            </button>
          )}
       </div>
     );
  }

  return (
    <div className={`w-full glass-panel rounded-3xl p-6 md:p-8 flex flex-col flex-1 md:min-h-[500px] ${isDark ? 'bg-black/20' : 'bg-white/50'}`}>
      <div className="flex-1 flex flex-col justify-start min-w-0">
        {/* Tab Content: AI Generation */}
        {activeTab === 'ai' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col items-center justify-center">
            <SyllabusInput 
              onTestGenerated={(config) => useTestStore.getState().setConfig(config)}
              onOpenSettings={onOpenSettings}
            />
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
            <PastResultsView onBack={() => {}} onRetake={onRetake} />
          </div>
        )}

        {/* Tab Content: Offline Upload */}
        {activeTab === 'offline' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col">
            <OfflineUpload onSuccess={() => setActiveTab && setActiveTab('history')} onOpenSettings={onOpenSettings} />
          </div>
        )}

        {/* Tab Content: Group Test */}
        {activeTab === 'group' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col items-center justify-center">
            <GroupTestLobby />
          </div>
        )}
      </div>
    </div>
  );
};
