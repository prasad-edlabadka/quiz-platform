import React, { useState, useEffect } from 'react';
import { Button, Tabs, Tag, Tooltip, Alert, Popconfirm } from 'antd';
import {
  Download,
  Upload,
  Play,
  Plus,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  Settings,
  BookOpen,
  Code,
  Eye,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import type { TestConfig, Question } from '../../types/test';
import { useTestStore } from '../../store/testStore';
import {
  createDefaultTestConfig,
  createEmptyQuestion,
  validateTestConfig,
  sanitizeAndCleanTestConfig,
} from './builderUtils';
import { GeneralSettingsEditor } from './GeneralSettingsEditor';
import { SectionsEditor } from './SectionsEditor';
import { QuestionEditor } from './QuestionEditor';
import { JsonModal } from './JsonModal';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { QuestionDiagramRenderer } from '../QuestionDiagramRenderer';

interface ManualTestBuilderProps {
  initialConfig?: TestConfig | null;
  onLaunchTest?: (config: TestConfig) => void;
  onBackToAi?: () => void;
}

export const ManualTestBuilder: React.FC<ManualTestBuilderProps> = ({
  initialConfig,
  onLaunchTest,
  onBackToAi,
}) => {
  const { themeMode, setConfig } = useTestStore();
  const isDark = themeMode === 'dark';

  const [config, setLocalConfig] = useState<TestConfig>(() => {
    if (initialConfig && initialConfig.questions?.length > 0) {
      return sanitizeAndCleanTestConfig(initialConfig);
    }
    return createDefaultTestConfig();
  });

  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [activeMainTab, setActiveMainTab] = useState<'questions' | 'sections' | 'settings' | 'preview' | 'json'>('questions');
  const [jsonModalState, setJsonModalState] = useState<{ isOpen: boolean; mode: 'export' | 'import' }>({
    isOpen: false,
    mode: 'export',
  });
  const [rawJsonText, setRawJsonText] = useState('');
  const [rawJsonError, setRawJsonError] = useState<string | null>(null);

  // Sync initialConfig if changed externally
  useEffect(() => {
    if (initialConfig && initialConfig.questions?.length > 0) {
      setLocalConfig(sanitizeAndCleanTestConfig(initialConfig));
    }
  }, [initialConfig]);

  // Sync rawJsonText when switching to json tab
  useEffect(() => {
    if (activeMainTab === 'json') {
      setRawJsonText(JSON.stringify(sanitizeAndCleanTestConfig(config), null, 2));
      setRawJsonError(null);
    }
  }, [activeMainTab, config]);

  // Validation
  const validationIssues = validateTestConfig(config);
  const hasErrors = validationIssues.some((v) => v.type === 'error');

  // Stats calculation
  const totalPoints = (config.questions || []).reduce((sum, q) => sum + (q.points || 1), 0);
  const timeLimitMinutes = config.globalTimeLimit ? Math.round(config.globalTimeLimit / 60) : null;

  // Question Management Handlers
  const questions = config.questions || [];
  const currentQuestion = questions[selectedQuestionIndex] || questions[0];

  const handleAddQuestion = () => {
    const newQ = createEmptyQuestion(questions.length);
    const updated = [...questions, newQ];
    setLocalConfig({ ...config, questions: updated });
    setSelectedQuestionIndex(updated.length - 1);
  };

  const handleDuplicateQuestion = (index: number) => {
    const target = questions[index];
    if (!target) return;
    const duplicated: Question = {
      ...JSON.parse(JSON.stringify(target)),
      id: `q${Date.now().toString().slice(-4)}`,
      content: target.content + ' (Copy)',
    };
    const updated = [...questions];
    updated.splice(index + 1, 0, duplicated);
    setLocalConfig({ ...config, questions: updated });
    setSelectedQuestionIndex(index + 1);
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) return;
    const updated = questions.filter((_, i) => i !== index);
    setLocalConfig({ ...config, questions: updated });
    setSelectedQuestionIndex((prev) => Math.min(prev, updated.length - 1));
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    const updated = [...questions];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setLocalConfig({ ...config, questions: updated });
    setSelectedQuestionIndex(targetIdx);
  };

  const handleUpdateCurrentQuestion = (updated: Question) => {
    const updatedList = [...questions];
    updatedList[selectedQuestionIndex] = updated;
    setLocalConfig({ ...config, questions: updatedList });
  };

  // Launching the test in Revise
  const handleLaunch = () => {
    const cleaned = sanitizeAndCleanTestConfig(config);
    if (onLaunchTest) {
      onLaunchTest(cleaned);
    } else {
      setConfig(cleaned);
    }
  };

  // Raw JSON sync handler
  const handleApplyRawJson = () => {
    try {
      const parsed = JSON.parse(rawJsonText);
      const cleaned = sanitizeAndCleanTestConfig(parsed as TestConfig);
      setLocalConfig(cleaned);
      setRawJsonError(null);
    } catch (err: any) {
      setRawJsonError(err.message || 'Invalid JSON syntax');
    }
  };

  return (
    <div className="w-full flex flex-col min-h-full animate-in fade-in duration-300">
      {/* 1. Header Toolbar */}
      <div className={`p-4 md:p-5 rounded-2xl border mb-6 flex flex-wrap items-center justify-between gap-4 ${
        isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-extrabold text-glass-primary flex items-center gap-2">
              <span>{config.title || 'Untitled Test'}</span>
              <Tag color="purple" className="font-extrabold text-[10px] tracking-wider rounded-md border-purple-500/30">
                BETA
              </Tag>
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Tag color="blue" className="rounded-full font-semibold text-[11px]">
                {questions.length} Question{questions.length !== 1 ? 's' : ''}
              </Tag>
              <Tag color="gold" className="rounded-full font-semibold text-[11px]">
                {totalPoints} Total Pt{totalPoints !== 1 ? 's' : ''}
              </Tag>
              {timeLimitMinutes && (
                <Tag color="cyan" className="rounded-full font-semibold text-[11px]">
                  ⏱ {timeLimitMinutes} min limit
                </Tag>
              )}
              {config.sections && config.sections.length > 0 && (
                <Tag color="purple" className="rounded-full font-semibold text-[11px]">
                  § {config.sections.length} Passage{config.sections.length !== 1 ? 's' : ''}
                </Tag>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onBackToAi && (
            <Button
              onClick={onBackToAi}
              className="text-xs font-semibold"
            >
              ← Create with AI
            </Button>
          )}

          <Button
            icon={<Upload className="w-3.5 h-3.5" />}
            onClick={() => setJsonModalState({ isOpen: true, mode: 'import' })}
            className="text-xs font-medium"
          >
            Load JSON
          </Button>

          <Button
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={() => setJsonModalState({ isOpen: true, mode: 'export' })}
            className="text-xs font-medium"
            data-testid="export-json-btn"
          >
            Export JSON
          </Button>

          <Popconfirm
            title="Reset to New Blank Test?"
            description="Are you sure? Any unsaved edits will be discarded."
            onConfirm={() => {
              setLocalConfig(createDefaultTestConfig());
              setSelectedQuestionIndex(0);
            }}
            okText="Reset"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-xs font-medium"
              title="Reset to Blank Test"
              data-testid="reset-test-btn"
            />
          </Popconfirm>

          <Button
            type="primary"
            icon={<Play className="w-4 h-4 fill-current" />}
            onClick={handleLaunch}
            disabled={hasErrors}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold px-4 rounded-xl shadow-md hover:shadow-indigo-500/20"
            data-testid="launch-test-btn"
          >
            Launch Test
          </Button>
        </div>
      </div>

      {/* Validation Banner (if issues exist) */}
      {validationIssues.length > 0 && (
        <div className="mb-4">
          <Alert
            type={hasErrors ? 'error' : 'warning'}
            showIcon
            icon={<AlertCircle className="w-4 h-4" />}
            message={
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span>
                  <strong>{hasErrors ? 'Configuration Issues' : 'Suggestions'}:</strong> {validationIssues[0].message}
                </span>
                {validationIssues[0].questionIndex !== undefined && (
                  <button
                    onClick={() => {
                      setActiveMainTab('questions');
                      setSelectedQuestionIndex(validationIssues[0].questionIndex!);
                    }}
                    className="underline text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    Go to Question {validationIssues[0].questionIndex! + 1} →
                  </button>
                )}
              </div>
            }
            className="rounded-xl"
          />
        </div>
      )}

      {/* 2. Main Navigation Tabs */}
      <div className="flex-1 flex flex-col min-w-0">
        <Tabs
          activeKey={activeMainTab}
          onChange={(k) => setActiveMainTab(k as any)}
          items={[
            {
              key: 'questions',
              label: (
                <span className="flex items-center gap-1.5 font-bold">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Questions ({questions.length})
                </span>
              ),
            },
            {
              key: 'sections',
              label: (
                <span className="flex items-center gap-1.5 font-bold">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  Passages / Sections ({config.sections?.length || 0})
                </span>
              ),
            },
            {
              key: 'settings',
              label: (
                <span className="flex items-center gap-1.5 font-bold">
                  <Settings className="w-4 h-4 text-cyan-400" />
                  Test Settings & Theme
                </span>
              ),
            },
            {
              key: 'preview',
              label: (
                <span className="flex items-center gap-1.5 font-bold">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  Live Exam Preview
                </span>
              ),
            },
            {
              key: 'json',
              label: (
                <span className="flex items-center gap-1.5 font-bold">
                  <Code className="w-4 h-4 text-amber-400" />
                  Raw JSON Code
                </span>
              ),
            },
          ]}
        />

        {/* Tab 1: Questions View (Sidebar + Main Editor) */}
        {activeMainTab === 'questions' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 mt-2">
            {/* Left Column: Questions Navigator Sidebar */}
            <div className={`lg:col-span-4 p-4 rounded-2xl border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
            } space-y-3`}>
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-glass-primary uppercase tracking-wider">
                  Questions List ({questions.length})
                </span>
                <Button
                  size="small"
                  type="primary"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleAddQuestion}
                  className="bg-indigo-600 hover:bg-indigo-500 text-xs font-bold"
                  data-testid="add-question-btn"
                >
                  Add Question
                </Button>
              </div>

              {/* Scrollable Questions List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const isSelected = idx === selectedQuestionIndex;
                  const qIssues = validationIssues.filter((v) => v.questionIndex === idx);
                  const hasQError = qIssues.some((v) => v.type === 'error');

                  return (
                    <div
                      key={q.id || idx}
                      onClick={() => setSelectedQuestionIndex(idx)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 group ${
                        isSelected
                          ? isDark
                            ? 'bg-indigo-600/20 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/40'
                            : 'bg-indigo-50 border-indigo-400 shadow-sm ring-1 ring-indigo-300'
                          : isDark
                          ? 'bg-black/20 border-white/5 hover:border-white/20'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : isDark
                            ? 'bg-white/10 text-slate-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {idx + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-glass-primary truncate">
                              {q.type === 'single_choice'
                                ? 'Single Choice'
                                : q.type === 'multiple_choice'
                                ? 'Multiple Choice'
                                : 'Text / Essay'}
                            </span>
                            {hasQError && (
                              <Tooltip title={qIssues[0].message}>
                                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                              </Tooltip>
                            )}
                          </div>
                          <span className="text-[11px] text-glass-secondary truncate block opacity-80">
                            {q.content.replace(/[#*`$\n]/g, ' ').substring(0, 30) || 'Empty prompt...'}
                          </span>
                        </div>
                      </div>

                      {/* Item Quick Actions */}
                      <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                        <Tag color="gold" className="text-[10px] font-semibold m-0 px-1.5 py-0">
                          {q.points || 1}pt
                        </Tag>

                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveQuestion(idx, 'up');
                          }}
                          className={`p-1 rounded transition-colors ${
                            idx === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 text-glass-secondary hover:text-indigo-400'
                          }`}
                          title="Move Question Up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          disabled={idx === questions.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveQuestion(idx, 'down');
                          }}
                          className={`p-1 rounded transition-colors ${
                            idx === questions.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 text-glass-secondary hover:text-indigo-400'
                          }`}
                          title="Move Question Down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateQuestion(idx);
                          }}
                          className="p-1 rounded hover:bg-white/10 text-glass-secondary hover:text-indigo-400 transition-colors"
                          title="Duplicate Question"
                        >
                          <Copy className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          disabled={questions.length <= 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuestion(idx);
                          }}
                          className={`p-1 rounded transition-colors ${
                            questions.length <= 1
                              ? 'opacity-30 cursor-not-allowed'
                              : 'hover:bg-red-500/10 text-glass-secondary hover:text-red-400'
                          }`}
                          title="Delete Question"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                block
                icon={<Plus className="w-4 h-4" />}
                onClick={handleAddQuestion}
                className="font-semibold mt-2 h-10 border-dashed"
              >
                Add Another Question
              </Button>
            </div>

            {/* Right Column: Active Question Editor */}
            <div className="lg:col-span-8">
              {currentQuestion ? (
                <QuestionEditor
                  question={currentQuestion}
                  questionIndex={selectedQuestionIndex}
                  totalQuestions={questions.length}
                  sections={config.sections || []}
                  onChange={handleUpdateCurrentQuestion}
                  isDark={isDark}
                />
              ) : (
                <div className="p-12 text-center text-glass-secondary">No question selected.</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Sections / Passages View */}
        {activeMainTab === 'sections' && (
          <SectionsEditor
            config={config}
            onChange={(sections) => setLocalConfig({ ...config, sections })}
            isDark={isDark}
          />
        )}

        {/* Tab 3: Test Settings & Theme */}
        {activeMainTab === 'settings' && (
          <GeneralSettingsEditor
            config={config}
            onChange={(updated) => setLocalConfig({ ...config, ...updated })}
            isDark={isDark}
          />
        )}

        {/* Tab 4: Live Preview */}
        {activeMainTab === 'preview' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} space-y-2`}>
              <h1 className="text-2xl font-bold text-glass-primary">{config.title || 'Untitled Test'}</h1>
              {config.description && <MarkdownRenderer content={config.description} className="text-sm text-glass-secondary" />}
              <div className="flex flex-wrap gap-2 pt-2">
                <Tag color="blue">{questions.length} Total Questions</Tag>
                <Tag color="gold">{totalPoints} Total Score Points</Tag>
                {timeLimitMinutes && <Tag color="cyan">{timeLimitMinutes} Minutes Duration</Tag>}
              </div>
            </div>

            <div className="space-y-6">
              {questions.map((q, qIndex) => (
                <div
                  key={q.id || qIndex}
                  className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} space-y-4`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                      Question {qIndex + 1} • {q.points || 1} Point{(q.points || 1) !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-glass-secondary uppercase font-semibold">
                      {q.type.replace('_', ' ')}
                    </span>
                  </div>

                  {/* If linked to section */}
                  {q.sectionId && config.sections?.find((s) => s.id === q.sectionId) && (
                    <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                      <strong className="text-xs uppercase tracking-wider text-indigo-300 block">
                        § {config.sections.find((s) => s.id === q.sectionId)?.title}
                      </strong>
                      <MarkdownRenderer
                        content={config.sections.find((s) => s.id === q.sectionId)?.content || ''}
                        className="text-xs text-glass-secondary"
                      />
                    </div>
                  )}

                  {/* Question Prompt */}
                  <MarkdownRenderer content={q.content} className="text-base text-glass-primary font-medium" />

                  {/* Diagram */}
                  {q.diagram && (
                    <div className="p-4 rounded-xl bg-black/20 border border-white/5 flex justify-center">
                      <QuestionDiagramRenderer diagram={q.diagram} />
                    </div>
                  )}

                  {/* Image */}
                  {q.imageUrl && (
                    <div className="flex justify-center my-2">
                      <img src={q.imageUrl} alt="Reference" className="max-h-64 rounded-xl object-contain shadow-sm" />
                    </div>
                  )}

                  {/* Options */}
                  {q.type !== 'text' && q.options && (
                    <div className="space-y-2 pt-2">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={opt.id || oIdx}
                          className={`p-3 rounded-xl border flex items-center gap-3 ${
                            opt.isCorrect
                              ? isDark
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : 'bg-emerald-50 border-emerald-300'
                              : isDark
                              ? 'bg-black/20 border-white/5'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center border ${
                            opt.isCorrect ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white/10 text-slate-400 border-white/10'
                          }`}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <MarkdownRenderer content={opt.content} className="text-sm flex-1 text-glass-primary" />
                          {opt.isCorrect && (
                            <Tag color="success" className="text-[10px] font-bold">
                              Correct Answer
                            </Tag>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Justification */}
                  {q.justification && (
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                      <strong>Solution Explanation:</strong> {q.justification}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Raw JSON Code Editor View */}
        {activeMainTab === 'json' && (
          <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-300 pb-12 w-full">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-glass-secondary">
                Directly view or modify the complete JSON object representing this test. Click <strong>Apply Changes</strong> to update the visual builder.
              </span>
              <Button
                type="primary"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleApplyRawJson}
                className="bg-indigo-600 hover:bg-indigo-500 font-semibold"
              >
                Apply Changes to Builder
              </Button>
            </div>

            {rawJsonError && (
              <Alert
                type="error"
                showIcon
                icon={<AlertCircle className="w-4 h-4" />}
                message={rawJsonError}
                className="text-xs"
              />
            )}

            <textarea
              value={rawJsonText}
              onChange={(e) => {
                setRawJsonText(e.target.value);
                setRawJsonError(null);
              }}
              rows={24}
              className={`w-full p-4 rounded-2xl font-mono text-xs outline-none border transition-all ${
                isDark
                  ? 'bg-black/60 border-white/10 text-indigo-200 focus:border-indigo-500'
                  : 'bg-slate-900 border-slate-800 text-indigo-100 focus:border-indigo-400'
              }`}
            />
          </div>
        )}
      </div>

      {/* JSON Import/Export Modal */}
      <JsonModal
        isOpen={jsonModalState.isOpen}
        mode={jsonModalState.mode}
        onClose={() => setJsonModalState({ ...jsonModalState, isOpen: false })}
        config={config}
        onImport={(importedConfig) => {
          setLocalConfig(importedConfig);
          setSelectedQuestionIndex(0);
        }}
        isDark={isDark}
      />
    </div>
  );
};
