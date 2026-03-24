import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, FileImage, Cpu, CheckCircle2, X, AlertCircle, Settings } from 'lucide-react';
import { useTestStore } from '../store/testStore';
import { evaluateOfflineImages, extractTestConfigFromPDF } from '../services/aiService';
import type { TestConfig } from '../types/test';

interface OfflineUploadProps {
  onSuccess: () => void;
  onOpenSettings?: () => void;
}

export const OfflineUpload: React.FC<OfflineUploadProps> = ({ onSuccess, onOpenSettings }) => {
  const { apiKey, themeMode, saveOfflineResult } = useTestStore();
  const isDark = themeMode === 'dark';

  // Auto-open settings if no API key on mount
  useEffect(() => {
    if (!apiKey && onOpenSettings) {
      onOpenSettings();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
  const [stagedPdf, setStagedPdf] = useState<{ base64: string; name: string } | null>(null);
  const [images, setImages] = useState<string[]>([]); // base64 images
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const configFileInputRef = useRef<HTMLInputElement>(null);
  const imageFilesInputRef = useRef<HTMLInputElement>(null);

  const handleConfigUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // If it's a JSON file
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content) as TestConfig;
          if (!parsed.questions || !Array.isArray(parsed.questions)) {
            throw new Error("Invalid Test JSON: Missing questions array.");
          }
          setTestConfig(parsed);
        } catch (err: any) {
          setError(err.message || "Failed to parse Test JSON file.");
        }
      };
      reader.onerror = () => setError("Failed to read file.");
      reader.readAsText(file);
    }
    // If it's a PDF file
    else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const dataUrl = e.target?.result as string;
          const match = dataUrl.match(/^data:application\/pdf;base64,(.+)$/);
          if (!match) throw new Error("Could not parse PDF file data.");
          
          setStagedPdf({ base64: match[1], name: file.name });
          setTestConfig(null); // Clear any existing config if swapping
        } catch (err: any) {
          setError(err.message || "Failed to read PDF file.");
        }
      };
      reader.onerror = () => setError("Failed to read PDF file.");
      reader.readAsDataURL(file);
    } else {
      setError("Please upload a .json or .pdf file.");
    }

    event.target.value = '';
  };

  const handleImagesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setIsProcessing(true);

    try {
      const filePromises = Array.from(files).map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              resolve(e.target.result as string);
            } else {
              reject(new Error(`Failed to read file: ${file.name}`));
            }
          };
          reader.onerror = () => reject(new Error(`Error reading file: ${file.name}`));
          reader.readAsDataURL(file);
        });
      });

      const newImages = await Promise.all(filePromises);
      setImages(prev => [...prev, ...newImages]);
    } catch (err: any) {
      setError(err.message || "Failed to upload one or more images.");
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleEvaluate = async () => {
    if (isProcessing) return;
    
    if (!apiKey) {
      onOpenSettings?.();
      return;
    }
    if (!testConfig && !stagedPdf) {
      setError("Please upload a Test JSON file or a PDF worksheet.");
      return;
    }
    if (images.length === 0) {
      setError("Please upload at least one image of the handwritten work.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    let finalConfig = testConfig;

    try {
      if (!apiKey) {
        throw new Error("API Key is missing. Please set it in settings.");
      }

      // Step 1: Extract PDF if staged
      if (stagedPdf && !testConfig) {
        setStatusMessage(`Extracting test from ${stagedPdf.name}...`);
        finalConfig = await extractTestConfigFromPDF(apiKey, stagedPdf.base64);
        setTestConfig(finalConfig); // Update state so it's "officially" loaded
      }

      if (!finalConfig) throw new Error("No test definition found.");

      // Step 2: Evaluate Images
      setStatusMessage("Grading student sheets with Gemini...");
      const evaluations = await evaluateOfflineImages(apiKey, finalConfig, images);
      
      saveOfflineResult(finalConfig, evaluations, images);
      onSuccess();
    } catch (err: any) {
      console.error("[OfflineUpload] Evaluation failed:", err);
      setError(err.message || "An error occurred during AI evaluation. Please try again or check your API key.");
    } finally {
      setIsProcessing(false);
      setStatusMessage(null);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="text-center mb-6">
        <div className={`w-16 h-16 mx-auto bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 border ${isDark ? 'border-white/10' : 'border-black/5'}`}>
          <FileImage className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-lg font-medium text-glass-primary mb-2">Evaluate Offline Work</h3>
        <p className="text-sm text-glass-secondary">Upload a Test JSON or PDF and photos of handwritten student work to get AI-powered grading and feedback.</p>
      </div>

      {/* API key missing banner */}
      {!apiKey && (
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-left hover:bg-red-500/20 transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 shrink-0 group-hover:scale-110 transition-transform">
            <Settings className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-400">Gemini API Key Required</p>
            <p className="text-xs text-red-400/70">Click here to open Settings and add your key to enable AI grading.</p>
          </div>
          <span className="text-xs font-semibold text-red-400 border border-red-400/40 px-3 py-1 rounded-lg shrink-0 group-hover:bg-red-400/10 transition-colors">
            Open Settings →
          </span>
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Upload JSON */}
        <div className={`glass-panel p-6 rounded-2xl border ${testConfig ? 'border-emerald-500/50 relative overflow-hidden' : isDark ? 'border-white/10' : 'border-black/5'}`}>
          {testConfig && (
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full flex items-start justify-end p-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
          )}
          <h4 className="font-bold text-glass-primary mb-2 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold">1</span>
            Test Definition
          </h4>
          <p className="text-xs text-glass-secondary mb-4">Upload the original Test JSON or a PDF worksheet.</p>

          <input
            type="file"
            ref={configFileInputRef}
            onChange={handleConfigUpload}
            accept=".json,.pdf"
            className="hidden"
          />

          {testConfig ? (
            <div className={`p-3 rounded-lg flex items-center gap-3 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
              <FileText className="w-8 h-8 text-emerald-400 shrink-0" />
              <div className="min-w-0 pr-4">
                <p className="text-sm font-bold text-glass-primary truncate" title={testConfig.title}>{testConfig.title}</p>
                <p className="text-xs text-glass-secondary">{testConfig.questions.length} questions (JSON)</p>
              </div>
              <button disabled={isProcessing || !apiKey} onClick={() => configFileInputRef.current?.click()} className="ml-auto text-xs font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed">Change</button>
            </div>
          ) : stagedPdf ? (
            <div className={`p-3 rounded-lg flex items-center gap-3 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
              <FileText className="w-8 h-8 text-amber-400 shrink-0" />
              <div className="min-w-0 pr-4">
                <p className="text-sm font-bold text-glass-primary truncate" title={stagedPdf.name}>{stagedPdf.name}</p>
                <p className="text-xs text-glass-secondary">PDF (AI extraction queued)</p>
              </div>
              <button disabled={isProcessing || !apiKey} onClick={() => configFileInputRef.current?.click()} className="ml-auto text-xs font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed">Change</button>
            </div>
          ) : (
            <button
              onClick={() => configFileInputRef.current?.click()}
              disabled={isProcessing || !apiKey}
              className={`w-full flex justify-center items-center py-3 glass-button transition-all text-sm font-medium ${isProcessing || !apiKey ? 'opacity-40 cursor-not-allowed' : ''} ${isDark ? 'text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/10' : 'text-indigo-600 border border-indigo-500/20 hover:bg-indigo-500/5'}`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Upload Test JSON or PDF
            </button>
          )}
        </div>

        {/* Step 2: Upload Images */}
        <div className={`glass-panel p-6 rounded-2xl border ${images.length > 0 ? 'border-emerald-500/50 relative overflow-hidden' : isDark ? 'border-white/10' : 'border-black/5'}`}>
          {images.length > 0 && (
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full flex items-start justify-end p-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
          )}
          <h4 className="font-bold text-glass-primary mb-2 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold">2</span>
            Handwritten Work
          </h4>
          <p className="text-xs text-glass-secondary mb-4">Upload one or more photos of the student's answered sheets.</p>

          <input
            type="file"
            ref={imageFilesInputRef}
            onChange={handleImagesUpload}
            accept="image/*"
            multiple
            className="hidden"
          />

          <button
            onClick={() => imageFilesInputRef.current?.click()}
            disabled={!apiKey}
            className={`w-full flex justify-center items-center py-3 mb-4 glass-button transition-all text-sm font-medium ${!apiKey ? 'opacity-40 cursor-not-allowed' : ''} ${isDark ? 'text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/10' : 'text-indigo-600 border border-indigo-500/20 hover:bg-indigo-500/5'}`}
          >
            <Upload className="w-4 h-4 mr-2" />
            Add Images
          </button>

          {images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {images.map((img, idx) => (
                <div key={idx} className="relative shrink-0 w-16 h-16 rounded-md border border-white/10 overflow-hidden group">
                  <img src={img} alt={`Sheet ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className={`p-4 rounded-xl flex items-start gap-3 ${isDark ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'}`}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleEvaluate}
        disabled={isProcessing || !apiKey || (!testConfig && !stagedPdf) || images.length === 0}
        className={`w-full flex justify-center items-center px-4 py-4 rounded-xl font-bold transition-all shadow-lg text-lg
          ${isProcessing || !apiKey || (!testConfig && !stagedPdf) || images.length === 0
            ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed border border-white/5'
            : 'bg-emerald-500 hover:bg-emerald-400 text-white hover:scale-[1.02] active:scale-[0.98] border border-emerald-400/50 shadow-emerald-500/25'
          }
        `}
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
            {stagedPdf && !testConfig ? 'Parsing & Grading...' : 'Evaluating...'}
          </>
        ) : (
          <>
            <Cpu className="w-5 h-5 mr-2" />
            Grade Uploaded Sheets
          </>
        )}
      </button>

      {isProcessing && (
        <p className="text-center text-xs font-mono text-emerald-400 animate-pulse">
          {statusMessage || 'Gemini is processing your files... This may take up to a minute.'}
        </p>
      )}
    </div>
  );
};
