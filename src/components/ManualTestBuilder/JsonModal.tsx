import React, { useState, useRef } from 'react';
import { Modal, Button, Typography, Alert, Tabs, Space } from 'antd';
import { Download, Copy, Check, Upload, FileText, Code, AlertCircle, FileJson } from 'lucide-react';
import type { TestConfig } from '../../types/test';
import { sanitizeAndCleanTestConfig, validateTestConfig } from './builderUtils';
import { sampleTest } from '../../data/sampleTest';

const { Text } = Typography;

interface JsonModalProps {
  isOpen: boolean;
  mode: 'export' | 'import';
  onClose: () => void;
  config: TestConfig;
  onImport: (newConfig: TestConfig) => void;
  isDark?: boolean;
}

export const JsonModal: React.FC<JsonModalProps> = ({
  isOpen,
  mode: initialMode,
  onClose,
  config,
  onImport,
  isDark = false,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>(initialMode);
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep activeTab in sync with initialMode when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setImportError(null);
      setCopied(false);
    }
  }, [isOpen, initialMode]);

  const cleanConfig = sanitizeAndCleanTestConfig(config);
  const jsonString = JSON.stringify(cleanConfig, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = (cleanConfig.title || 'test').toLowerCase().replace(/[^a-z0-9]/gi, '-');
    a.download = `${filename || 'test'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const processImportContent = (content: string) => {
    setImportError(null);
    try {
      const parsed = JSON.parse(content);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Parsed JSON is not a valid object');
      }
      const cleaned = sanitizeAndCleanTestConfig(parsed as TestConfig);
      const errors = validateTestConfig(cleaned);
      const criticalErrors = errors.filter(e => e.type === 'error');
      if (criticalErrors.length > 0) {
        throw new Error(`Validation failed: ${criticalErrors[0].message}`);
      }
      onImport(cleaned);
      onClose();
    } catch (err: any) {
      setImportError(err.message || 'Invalid JSON format');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
      processImportContent(content);
    };
    reader.onerror = () => {
      setImportError('Failed to read file');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={780}
      centered
      title={
        <Space className="text-base font-bold">
          <FileJson className="w-5 h-5 text-indigo-500" />
          <span>{activeTab === 'export' ? 'Export Test as JSON' : 'Load / Import Test JSON'}</span>
        </Space>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as 'export' | 'import')}
        items={[
          {
            key: 'export',
            label: (
              <span className="flex items-center gap-1.5 font-medium">
                <Download className="w-4 h-4" />
                Export JSON
              </span>
            ),
            children: (
              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <div className="text-xs text-glass-secondary">
                    <strong className="text-indigo-400 block text-sm font-semibold">{cleanConfig.title || 'Untitled Test'}</strong>
                    <span>{cleanConfig.questions.length} Question{cleanConfig.questions.length !== 1 ? 's' : ''} • {cleanConfig.sections?.length || 0} Sections</span>
                  </div>
                  <Space>
                    <Button
                      icon={copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      onClick={handleCopy}
                      className="font-medium"
                    >
                      {copied ? 'Copied!' : 'Copy to Clipboard'}
                    </Button>
                    <Button
                      type="primary"
                      icon={<Download className="w-4 h-4" />}
                      onClick={handleDownload}
                      className="font-medium bg-indigo-600 hover:bg-indigo-500"
                    >
                      Download .json
                    </Button>
                  </Space>
                </div>

                <div className="relative">
                  <pre
                    className={`w-full max-h-96 overflow-y-auto p-4 rounded-xl font-mono text-xs leading-relaxed border ${
                      isDark
                        ? 'bg-black/60 text-indigo-200 border-white/10'
                        : 'bg-slate-900 text-indigo-100 border-slate-800'
                    }`}
                  >
                    {jsonString}
                  </pre>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={onClose}>Close</Button>
                </div>
              </div>
            ),
          },
          {
            key: 'import',
            label: (
              <span className="flex items-center gap-1.5 font-medium">
                <Upload className="w-4 h-4" />
                Load / Import JSON
              </span>
            ),
            children: (
              <div className="space-y-4 pt-2">
                <Text className="text-xs text-glass-secondary block">
                  Upload an existing test <code className="font-mono text-indigo-400">.json</code> file or paste the JSON text below to load it into the builder.
                </Text>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    icon={<FileText className="w-4 h-4 text-indigo-400" />}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-11 flex items-center justify-center font-medium border-dashed border-indigo-500/40 hover:border-indigo-500"
                  >
                    Upload .json File
                  </Button>

                  <Button
                    icon={<Code className="w-4 h-4 text-purple-400" />}
                    onClick={() => {
                      setImportText(JSON.stringify(sampleTest, null, 2));
                      processImportContent(JSON.stringify(sampleTest));
                    }}
                    className="h-11 flex items-center justify-center font-medium"
                  >
                    Load Sample Math & Algebra Test
                  </Button>
                </div>

                <div className="relative">
                  <textarea
                    value={importText}
                    onChange={(e) => {
                      setImportText(e.target.value);
                      setImportError(null);
                    }}
                    placeholder="Paste valid Revise test JSON here..."
                    className={`w-full h-44 p-3 rounded-xl font-mono text-xs outline-none border resize-none transition-all ${
                      isDark
                        ? 'bg-black/40 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400'
                    }`}
                  />
                </div>

                {importError && (
                  <Alert
                    type="error"
                    showIcon
                    icon={<AlertCircle className="w-4 h-4" />}
                    message={importError}
                    className="text-xs"
                  />
                )}

                <div className="flex justify-between items-center pt-2">
                  <Button onClick={onClose}>Cancel</Button>
                  <Button
                    type="primary"
                    icon={<Upload className="w-4 h-4" />}
                    disabled={!importText.trim()}
                    onClick={() => processImportContent(importText)}
                    className="bg-indigo-600 hover:bg-indigo-500 font-medium"
                  >
                    Load into Builder
                  </Button>
                </div>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
};
