import React, { useState, useRef } from 'react';
import { Upload, FileText, FileImage, Cpu, CheckCircle2, ChevronRight, X, AlertCircle } from 'lucide-react';
import { useTestStore } from '../store/testStore';
import { evaluateOfflineImages, extractTestConfigFromPDF } from '../services/aiService';
import type { TestConfig } from '../types/test';

interface OfflineUploadProps {
  onSuccess: () => void;
}

export const OfflineUpload: React.FC<OfflineUploadProps> = ({ onSuccess }) => {
  const { apiKey, themeMode, saveOfflineResult } = useTestStore();
  const isDark = themeMode === 'dark';

  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
  const [images, setImages] = useState<string[]>([]); // base64 images
  const [isProcessing, setIsProcessing] = useState(false);
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
        if (!apiKey) {
            setError("Please set your API key in the bottom left settings first to extract from PDF.");
            return;
        }

        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const dataUrl = e.target?.result as string;
                // Extract base64 part
                const match = dataUrl.match(/^data:application\/pdf;base64,(.+)$/);
                if (!match) throw new Error("Could not parse PDF file data.");
                const base64Pdf = match[1];

                const extractedConfig = await extractTestConfigFromPDF(apiKey, base64Pdf);
                setTestConfig(extractedConfig);
            } catch (err: any) {
                setError(err.message || "Failed to extract test from PDF.");
            } finally {
                setIsProcessing(false);
            }
        };
        reader.onerror = () => {
            setError("Failed to read PDF file.");
            setIsProcessing(false);
        };
        reader.readAsDataURL(file);
    } else {
        setError("Please upload a .json or .pdf file.");
    }
    
    event.target.value = '';
  };

  const handleImagesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newImages: string[] = [];
    let loadedCount = 0;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newImages.push(e.target.result as string);
        }
        loadedCount++;
        if (loadedCount === files.length) {
          setImages(prev => [...prev, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleEvaluate = async () => {
    if (!apiKey) {
      setError("Please set your API key in the bottom left settings first.");
      return;
    }
    if (!testConfig) {
      setError("Please upload a Test JSON file.");
      return;
    }
    if (images.length === 0) {
      setError("Please upload at least one image of the handwritten work.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const evaluations = await evaluateOfflineImages(apiKey, testConfig, images);
      saveOfflineResult(testConfig, evaluations, images);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "An error occurred during AI evaluation.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="text-center mb-6">
        <div className={`w-16 h-16 mx-auto bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 border ${isDark ? 'border-white/10' : 'border-black/5'}`}>
          <FileImage className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-lg font-medium text-glass-primary mb-2">Evaluate Offline Work</h3>
        <p className="text-sm text-glass-secondary">Upload a Test JSON or PDF and photos of handwritten student work to get AI-powered grading and feedback.</p>
      </div>

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
          <p className="text-xs text-glass-secondary mb-4">Upload the original Test JSON or PDF file that the student solved.</p>
          
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
                <p className="text-xs text-glass-secondary">{testConfig.questions.length} questions</p>
              </div>
              <button onClick={() => configFileInputRef.current?.click()} className="ml-auto text-xs font-medium text-indigo-400 hover:text-indigo-300">Change</button>
            </div>
          ) : (
            <button
              onClick={() => configFileInputRef.current?.click()}
              disabled={isProcessing}
              className={`w-full flex justify-center items-center py-3 glass-button transition-all text-sm font-medium ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/10' : 'text-indigo-600 border border-indigo-500/20 hover:bg-indigo-500/5'}`}
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
            className={`w-full flex justify-center items-center py-3 mb-4 glass-button transition-all text-sm font-medium ${isDark ? 'text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/10' : 'text-indigo-600 border border-indigo-500/20 hover:bg-indigo-500/5'}`}
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
        disabled={isProcessing || !testConfig || images.length === 0}
        className={`w-full flex justify-center items-center px-4 py-4 rounded-xl font-bold transition-all shadow-lg text-lg
          ${isProcessing || !testConfig || images.length === 0
            ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed border border-white/5'
            : 'bg-emerald-500 hover:bg-emerald-400 text-white hover:scale-[1.02] active:scale-[0.98] border border-emerald-400/50 shadow-emerald-500/25'
          }
        `}
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
            Evaluating...
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
          Gemini is processing your files... This may take up to a minute.
        </p>
      )}
    </div>
  );
};
