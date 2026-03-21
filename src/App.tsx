import React, { useState, useEffect } from 'react';
import { useTestStore } from './store/testStore';
import { TestRenderer } from './components/TestRenderer';
import { ConfirmationModal } from './components/ConfirmationModal';
import { SchemaHelpModal } from './components/SchemaHelpModal';
import { Trash2, Sun, Moon, Download, Plus, Library, CheckCircle2, FileText, Upload, Home, Settings, Key, X, Info, FolderOpen, DatabaseBackup } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TestConfig } from './types/test';

import { TestLoader } from './components/TestLoader';
import { LandingFeatures } from './components/LandingFeatures';
import { ErrorBoundary } from './components/ErrorBoundary';
import { validateApiKey, type ApiKeyStatus } from './services/aiService';
import { ConfigProvider, theme } from 'antd';

function App() {
  const { config, setConfig, clearState, themeMode, toggleTheme, apiKey, setApiKey } = useTestStore();
  const isDark = themeMode === 'dark';
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ai' | 'upload' | 'library' | 'offline' | 'history' | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [keyStatus, setKeyStatus] = useState<ApiKeyStatus>('unknown');
  const [settingsTab, setSettingsTab] = useState<'ai' | 'backup'>('ai');

  const importFileRef = React.useRef<HTMLInputElement>(null);

  // --- Compress/decompress using browser's built-in Compression Streams API ---
  const compressJson = async (obj: unknown): Promise<ArrayBuffer> => {
    const json = new TextEncoder().encode(JSON.stringify(obj));
    const cs = new CompressionStream('deflate-raw');
    const writer = cs.writable.getWriter();
    writer.write(json);
    writer.close();
    return new Response(cs.readable).arrayBuffer();
  };

  const decompressToJson = async (buffer: ArrayBuffer): Promise<unknown> => {
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    writer.write(new Uint8Array(buffer));
    writer.close();
    const ab = await new Response(ds.readable).arrayBuffer();
    return JSON.parse(new TextDecoder().decode(ab));
  };

  const handleExportData = async () => {
    const snapshot: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      try { snapshot[key] = JSON.parse(localStorage.getItem(key)!); }
      catch { snapshot[key] = localStorage.getItem(key); }
    }
    const payload = { _revise_backup: true, v: 2, exportedAt: new Date().toISOString(), data: snapshot };
    const compressed = await compressJson(payload);
    const blob = new Blob([compressed], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revise-backup-${new Date().toISOString().slice(0, 10)}.rvb`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith('.rvb')) {
      if (file) alert('Please select a valid .rvb backup file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = await decompressToJson(ev.target!.result as ArrayBuffer) as Record<string, unknown>;
        if (!parsed._revise_backup) {
          alert('This file does not look like a valid Revise backup.');
          return;
        }
        if (!window.confirm(
          '⚠️ WARNING: Loading this backup will OVERWRITE ALL your current data including past results, test history, and settings.\n\nThis cannot be undone. Continue?'
        )) return;
        const data = parsed.data as Record<string, unknown>;
        Object.keys(data).forEach(key => {
          localStorage.setItem(key, typeof data[key] === 'string' ? data[key] as string : JSON.stringify(data[key]));
        });
        window.location.reload();
      } catch {
        alert('Failed to read backup file. Make sure it is a valid Revise backup (.rvb).');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // Validate API key on mount and whenever the key changes
  useEffect(() => {
    if (!apiKey) {
      setKeyStatus('invalid');
      return;
    }
    setKeyStatus('checking');
    validateApiKey(apiKey).then(setKeyStatus);
  }, [apiKey]);

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
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#6366f1',
        },
      }}
    >
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

                {/* Settings / API Key button */}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className={`relative w-full flex flex-col items-center justify-center py-3 rounded-xl transition-all ${
                    isDark ? 'text-slate-400 hover:bg-white/5 hover:text-slate-50' : 'text-slate-500 hover:bg-slate-100 hover:text-indigo-600'
                  }`}
                  title="AI Engine Settings"
                >
                  <Settings className="w-5 h-5" />
                  {/* Status indicator dot */}
                  {!apiKey ? (
                    <span className="absolute top-2 right-3 w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/60 animate-pulse" />
                  ) : keyStatus === 'checking' ? (
                    <span className="absolute top-2 right-3 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/60 animate-pulse" />
                  ) : keyStatus === 'valid' ? (
                    <span className="absolute top-2 right-3 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                  ) : (
                    <span className="absolute top-2 right-3 w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/60 animate-pulse" />
                  )}
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
                        setActiveTab={setActiveTab}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        onRetake={(config) => { useTestStore.getState().setConfig(config); }}
                      />
                    </motion.div>
                  )}
                </div>
              </main>
            </div>
          </div>
        )}
      </ErrorBoundary>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setIsSettingsOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-lg glass-panel rounded-3xl p-6 border shadow-2xl ${
              isDark ? 'border-white/10 bg-[#0f111a]' : 'border-indigo-100 bg-white'
            }`}
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-glass-primary">Settings</h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 rounded-xl text-glass-secondary hover:text-glass-primary hover:bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pill tabs */}
            <div className={`flex gap-1 p-1 rounded-2xl mb-5 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
              {([
                { id: 'ai', label: 'AI Settings', icon: Key },
                { id: 'backup', label: 'Backup & Data', icon: DatabaseBackup },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setSettingsTab(id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    settingsTab === id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-glass-secondary hover:text-glass-primary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* --- Tab: AI Settings --- */}
            {settingsTab === 'ai' && (
              <div className="space-y-4">
                {/* Status badge */}
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    keyStatus === 'valid' ? 'bg-emerald-500/20 text-emerald-400'
                    : keyStatus === 'invalid' ? 'bg-red-500/20 text-red-400'
                    : keyStatus === 'checking' ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-indigo-500/20 text-indigo-400'
                  }`}>
                    <Key className="w-4 h-4" />
                  </div>
                  {keyStatus === 'valid' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 uppercase tracking-widest font-extrabold">✓ Connected</span>}
                  {keyStatus === 'invalid' && apiKey && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 uppercase tracking-widest font-extrabold">✗ Invalid Key</span>}
                  {keyStatus === 'invalid' && !apiKey && <p className="text-xs text-red-400 font-semibold">No API key set</p>}
                  {keyStatus === 'checking' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 uppercase tracking-widest font-extrabold animate-pulse">Verifying…</span>}
                  {keyStatus === 'unknown' && <p className="text-xs text-glass-secondary">Add your Gemini API key</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-glass-secondary uppercase tracking-widest">Google Gemini API Key</label>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                      <Info className="w-3 h-3" />Get a free key
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      value={apiKey || ''}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Paste your key here (AIza...)"
                      autoFocus
                      className={`w-full rounded-xl px-4 py-3 text-sm outline-none font-mono transition-all border ${
                        isDark
                          ? 'bg-black/40 border-white/10 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 text-white placeholder:text-slate-600'
                          : 'bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 text-slate-900 placeholder:text-slate-400'
                      }`}
                    />
                    {apiKey && (
                      <button onClick={() => setApiKey('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-glass-secondary hover:text-red-400 hover:bg-red-500/10 transition-all" title="Remove key">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-glass-secondary mt-2 italic">Stored only on your device. Never sent to any server.</p>
                </div>

                <div className={`rounded-2xl p-4 border ${isDark ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-indigo-50 border-indigo-100'}`}>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />Why a key?
                  </h4>
                  <p className="text-[11px] text-glass-secondary leading-relaxed">
                    Revise uses <strong>Gemini Flash</strong> to power AI features. Your key ensures data privacy and gives you full control.
                  </p>
                </div>

                <button onClick={() => setIsSettingsOpen(false)}
                  className="w-full py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-all">
                  {apiKey ? 'Save & Close' : 'Close'}
                </button>
              </div>
            )}

            {/* --- Tab: Backup & Data --- */}
            {settingsTab === 'backup' && (
              <div className="space-y-4">
                <div className={`rounded-2xl p-4 border ${isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className="text-xs font-bold text-glass-secondary uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-emerald-400" />Export Backup
                  </h4>
                  <p className="text-[11px] text-glass-secondary mb-3 leading-relaxed">
                    Save all your past results, history, and settings to a compressed <code className="font-mono text-indigo-400">.rvb</code> file. Significantly smaller than plain JSON thanks to deflate compression.
                  </p>
                  <button onClick={handleExportData}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:scale-[1.01] ${
                      isDark ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' : 'border-emerald-500/40 text-emerald-700 hover:bg-emerald-50'
                    }`}>
                    <Download className="w-4 h-4" />Download Backup (.rvb)
                  </button>
                </div>

                <div className={`rounded-2xl p-4 border ${isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className="text-xs font-bold text-glass-secondary uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400" />Load Backup
                  </h4>
                  <p className="text-[11px] text-glass-secondary mb-3 leading-relaxed">
                    Restore from a <code className="font-mono text-indigo-400">.rvb</code> backup file. <strong className="text-amber-400">This will overwrite all current data</strong> and reload the app.
                  </p>
                  <button onClick={() => importFileRef.current?.click()}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:scale-[1.01] ${
                      isDark ? 'border-amber-500/30 text-amber-400 hover:bg-emerald-500/10' : 'border-amber-500/40 text-amber-700 hover:bg-emerald-50'
                    }`}>
                    <FolderOpen className="w-4 h-4" />Choose Backup File (.rvb)
                  </button>
                  <input ref={importFileRef} type="file" accept=".rvb" className="hidden" onChange={handleImportData} />
                </div>

                <button onClick={() => setIsSettingsOpen(false)}
                  className="w-full py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-all">
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}




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
    </ConfigProvider>
  );
}

export default App;
