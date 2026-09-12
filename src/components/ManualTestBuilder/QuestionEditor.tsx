import React, { useState } from 'react';
import { Typography, Input, Select, Switch, Button } from 'antd';
import {
  HelpCircle,
  Star,
  Clock,
  Image as ImageIcon,
  CheckCircle2,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Code,
  PenTool,
  Award,
  BookOpen,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Layers,
  Sigma,
} from 'lucide-react';
import type { Question, Option, TestSection, IBCriterion } from '../../types/test';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { QuestionDiagramRenderer } from '../QuestionDiagramRenderer';
import { RichTextEditor } from '../RichTextEditor';
import { createEmptyOption, createEmptyIBCriterion } from './builderUtils';

const { Text } = Typography;
const { TextArea } = Input;

interface QuestionEditorProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  sections?: TestSection[];
  onChange: (updated: Question) => void;
  isDark?: boolean;
}

const MERMAID_TEMPLATES = [
  {
    name: 'Flowchart',
    code: `graph TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Result 1]\n    B -->|No| D[Result 2]`,
  },
  {
    name: 'Sequence',
    code: `sequenceDiagram\n    autonumber\n    Client->>Server: HTTP GET Request\n    Server-->>Client: 200 OK Response`,
  },
  {
    name: 'Mindmap',
    code: `mindmap\n    root((Energy Types))\n        Kinetic\n            Motion\n            Thermal\n        Potential\n            Gravitational\n            Chemical`,
  },
  {
    name: 'State Diagram',
    code: `stateDiagram-v2\n    [*] --> Idle\n    Idle --> Active: Start\n    Active --> Idle: Stop\n    Active --> [*]`,
  },
  {
    name: 'Class Diagram',
    code: `classDiagram\n    class Animal {\n        +String name\n        +makeSound()\n    }\n    class Dog {\n        +bark()\n    }\n    Animal <|-- Dog`,
  },
];

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  questionIndex,
  totalQuestions,
  sections = [],
  onChange,
  isDark = false,
}) => {
  const [promptEditorMode, setPromptEditorMode] = useState<'richtext' | 'markdown'>('markdown');
  const [justificationEditorMode, setJustificationEditorMode] = useState<'richtext' | 'markdown'>('markdown');
  const [richOptionIndex, setRichOptionIndex] = useState<number | null>(null);
  const [previewContent, setPreviewContent] = useState(false);
  const [showDiagramEditor, setShowDiagramEditor] = useState(!!question.diagram);
  const [showRubricEditor, setShowRubricEditor] = useState(
    !!(question.ibCriteria && question.ibCriteria.length > 0)
  );

  const handleUpdate = (fields: Partial<Question>) => {
    onChange({ ...question, ...fields });
  };

  // Helper to insert markdown/math snippets into question prompt
  const insertSnippet = (snippet: string) => {
    handleUpdate({ content: (question.content || '') + snippet });
  };

  // Option Handlers
  const options = question.options || [];

  const handleAddOption = () => {
    const newOpt = createEmptyOption(options.length);
    handleUpdate({ options: [...options, newOpt] });
  };

  const handleUpdateOption = (optIndex: number, fields: Partial<Option>) => {
    const next = [...options];
    next[optIndex] = { ...next[optIndex], ...fields };
    handleUpdate({ options: next });
  };

  const handleDeleteOption = (optIndex: number) => {
    const next = options.filter((_, i) => i !== optIndex);
    handleUpdate({ options: next });
    if (richOptionIndex === optIndex) {
      setRichOptionIndex(null);
    }
  };

  const handleSelectCorrectOption = (optIndex: number) => {
    if (question.type === 'single_choice') {
      const next = options.map((opt, i) => ({
        ...opt,
        isCorrect: i === optIndex,
      }));
      handleUpdate({ options: next });
    } else {
      const next = [...options];
      next[optIndex] = { ...next[optIndex], isCorrect: !next[optIndex].isCorrect };
      handleUpdate({ options: next });
    }
  };

  const handleMoveOption = (optIndex: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? optIndex - 1 : optIndex + 1;
    if (targetIdx < 0 || targetIdx >= options.length) return;
    const next = [...options];
    const [moved] = next.splice(optIndex, 1);
    next.splice(targetIdx, 0, moved);
    handleUpdate({ options: next });
  };

  const handleGenerate4Options = () => {
    const default4: Option[] = [
      { id: `opt-${Date.now()}-1`, content: 'Option A', isCorrect: true },
      { id: `opt-${Date.now()}-2`, content: 'Option B', isCorrect: false },
      { id: `opt-${Date.now()}-3`, content: 'Option C', isCorrect: false },
      { id: `opt-${Date.now()}-4`, content: 'Option D', isCorrect: false },
    ];
    handleUpdate({ options: default4 });
  };

  // IB Criteria Handlers
  const criteria = question.ibCriteria || [];

  const handleAddCriterion = (letter: string = 'A') => {
    const newCrit = createEmptyIBCriterion(letter);
    handleUpdate({ ibCriteria: [...criteria, newCrit] });
  };

  const handleUpdateCriterion = (cIdx: number, fields: Partial<IBCriterion>) => {
    const next = [...criteria];
    next[cIdx] = { ...next[cIdx], ...fields };
    handleUpdate({ ibCriteria: next });
  };

  const handleDeleteCriterion = (cIdx: number) => {
    const next = criteria.filter((_, i) => i !== cIdx);
    handleUpdate({ ibCriteria: next.length > 0 ? next : undefined });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Top Meta Bar */}
      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} space-y-4`}>
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <span className="text-sm font-bold text-glass-primary">
            Editing Question {questionIndex + 1} of {totalQuestions}
          </span>
          <span className="text-xs text-glass-secondary font-mono">
            ID: {question.id}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Question Type */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-glass-secondary uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-400" />
              Question Type
            </label>
            <Select
              value={question.type}
              onChange={(val) => {
                if (val === 'text') {
                  handleUpdate({ type: val, options: undefined });
                } else {
                  handleUpdate({
                    type: val,
                    options: question.options && question.options.length > 0 ? question.options : [
                      createEmptyOption(0),
                      createEmptyOption(1),
                    ],
                  });
                }
              }}
              className="w-full font-medium"
              options={[
                { value: 'single_choice', label: '🔘 Single Choice (MCQ)' },
                { value: 'multiple_choice', label: '☑️ Multiple Choice (Multi-Select)' },
                { value: 'text', label: '📝 Open-Ended / Essay' },
              ]}
            />
          </div>

          {/* Section Assignment */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-glass-secondary uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-indigo-400" />
              Assigned Section
            </label>
            <Select
              value={question.sectionId || 'none'}
              onChange={(val) => handleUpdate({ sectionId: val === 'none' ? undefined : val })}
              className="w-full"
              options={[
                { value: 'none', label: 'None (Standalone)' },
                ...sections.map((s) => ({
                  value: s.id,
                  label: `§ ${s.title || s.id}`,
                })),
              ]}
            />
          </div>

          {/* Points */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-glass-secondary uppercase tracking-wider flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400" />
              Points / Score
            </label>
            <Input
              type="number"
              min={0}
              max={100}
              value={question.points ?? 1}
              onChange={(e) => handleUpdate({ points: Math.max(0, parseInt(e.target.value) || 0) })}
              className="font-mono text-sm rounded-xl"
            />
          </div>

          {/* Per-Question Time Limit */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-glass-secondary uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" />
              Time Limit (Seconds)
            </label>
            <Input
              type="number"
              min={0}
              max={3600}
              placeholder="No limit"
              value={question.timeLimit || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                handleUpdate({ timeLimit: isNaN(val) || val <= 0 ? undefined : val });
              }}
              className="font-mono text-sm rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* 2. Question Prompt Editor with Rich Text / MathType vs Markdown Switcher */}
      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-glass-primary uppercase tracking-wider">
              Question Prompt <span className="text-red-400">*</span>
            </span>

            {/* Mode Switcher Pill */}
            <div className={`inline-flex p-0.5 rounded-lg border ${isDark ? 'bg-black/40 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setPromptEditorMode('richtext')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  promptEditorMode === 'richtext'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-glass-secondary hover:text-glass-primary'
                }`}
              >
                <Sigma className="w-3.5 h-3.5" />
                <span>Rich Text & MathType</span>
              </button>
              <button
                type="button"
                onClick={() => setPromptEditorMode('markdown')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  promptEditorMode === 'markdown'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-glass-secondary hover:text-glass-primary'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Markdown</span>
              </button>
            </div>
          </div>

          {promptEditorMode === 'markdown' && (
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => insertSnippet(' $x^2$ ')}
                className="px-2 py-1 rounded-md text-[11px] font-mono font-medium bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-colors"
                title="Insert Inline Math Formula"
              >
                $x^2$
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('\n$$\n\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\n$$\n')}
                className="px-2 py-1 rounded-md text-[11px] font-mono font-medium bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-colors"
                title="Insert LaTeX Quadratic Formula Block"
              >
                $$\dots$$
              </button>
              <button
                type="button"
                onClick={() => insertSnippet(' **bold text** ')}
                className="px-2 py-1 rounded-md text-[11px] font-bold bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-colors"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertSnippet(' *italic text* ')}
                className="px-2 py-1 rounded-md text-[11px] italic font-serif bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-colors"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('\n- Item 1\n- Item 2\n')}
                className="px-2 py-1 rounded-md text-[11px] font-medium bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-colors"
              >
                • List
              </button>

              <Button
                size="small"
                type="text"
                onClick={() => setPreviewContent(!previewContent)}
                icon={previewContent ? <EyeOff className="w-3.5 h-3.5 text-indigo-400" /> : <Eye className="w-3.5 h-3.5" />}
                className="ml-2 text-xs font-semibold"
              >
                {previewContent ? 'Edit' : 'Preview'}
              </Button>
            </div>
          )}
        </div>

        {promptEditorMode === 'richtext' ? (
          <div className="rounded-xl overflow-hidden border border-white/10">
            <RichTextEditor
              value={question.content || ''}
              onChange={(val) => handleUpdate({ content: val })}
              placeholder="Type your question prompt here... Use the MathType (√) icon in the toolbar to visually insert complex math equations."
              minHeight="220px"
            />
          </div>
        ) : previewContent ? (
          <div className={`p-4 rounded-xl min-h-[140px] border ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            {question.content ? (
              <MarkdownRenderer content={question.content} />
            ) : (
              <Text type="secondary" className="text-xs italic">Prompt is currently empty.</Text>
            )}
          </div>
        ) : (
          <TextArea
            rows={5}
            value={question.content}
            onChange={(e) => handleUpdate({ content: e.target.value })}
            placeholder="Type your question prompt here... Markdown and LaTeX equations ($E=mc^2$) are fully supported."
            className="rounded-xl font-sans text-sm leading-relaxed"
          />
        )}
      </div>

      {/* 3. Options Section (For MCQ types) with MathType / Rich Option Support */}
      {question.type !== 'text' && (
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-glass-primary uppercase tracking-wider">
                  Answer Options
                </span>
              </div>
              <span className="text-[11px] text-glass-secondary">
                {question.type === 'single_choice'
                  ? 'Click the radio badge on the left to mark the single correct answer. Click ∑ to use MathType for formula choices.'
                  : 'Check the boxes on the left to mark correct answers. Click ∑ to use MathType for formula choices.'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="small"
                icon={<Sparkles className="w-3 h-3 text-indigo-400" />}
                onClick={handleGenerate4Options}
                className="text-xs font-medium"
              >
                Preset 4 Options (A-D)
              </Button>
              <Button
                size="small"
                type="primary"
                icon={<Plus className="w-3 h-3" />}
                onClick={handleAddOption}
                className="bg-indigo-600 hover:bg-indigo-500 text-xs font-medium"
              >
                Add Option
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {options.map((opt, oIdx) => {
              const isRichOpen = richOptionIndex === oIdx;

              return (
                <div
                  key={opt.id || oIdx}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col gap-2.5 ${
                    opt.isCorrect
                      ? isDark
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-emerald-50/70 border-emerald-300'
                      : isDark
                      ? 'bg-black/20 border-white/5'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Correct Toggle */}
                    <button
                      type="button"
                      onClick={() => handleSelectCorrectOption(oIdx)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-transform hover:scale-105 border shrink-0 ${
                        opt.isCorrect
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                          : isDark
                          ? 'bg-white/5 text-slate-400 border-white/10 hover:border-emerald-500/40'
                          : 'bg-white text-slate-400 border-slate-300 hover:border-emerald-400'
                      }`}
                      title={opt.isCorrect ? 'Correct Answer' : 'Click to mark correct'}
                    >
                      {String.fromCharCode(65 + oIdx)}
                    </button>

                    {/* Option Content Input or Rich/MathType Trigger */}
                    {!isRichOpen ? (
                      <Input
                        value={opt.content}
                        onChange={(e) => handleUpdateOption(oIdx, { content: e.target.value })}
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)} text (Supports LaTeX $...$)`}
                        className="flex-1 font-medium rounded-lg"
                      />
                    ) : (
                      <span className="text-xs font-bold text-indigo-400">
                        Editing Option {String.fromCharCode(65 + oIdx)} with MathType / Rich Text:
                      </span>
                    )}

                    {/* MathType Toggle Button */}
                    <Button
                      size="small"
                      type={isRichOpen ? 'primary' : 'default'}
                      onClick={() => setRichOptionIndex(isRichOpen ? null : oIdx)}
                      icon={<Sigma className="w-3.5 h-3.5" />}
                      className="text-xs font-semibold"
                      title="Toggle MathType & Rich Text Editor for this option"
                    >
                      {isRichOpen ? 'Close MathType' : 'MathType / Rich'}
                    </Button>

                    {/* Move Up / Down / Delete */}
                    <div className="flex items-center gap-0.5">
                      <Button
                        size="small"
                        type="text"
                        disabled={oIdx === 0}
                        onClick={() => handleMoveOption(oIdx, 'up')}
                        icon={<ChevronUp className="w-3.5 h-3.5" />}
                      />
                      <Button
                        size="small"
                        type="text"
                        disabled={oIdx === options.length - 1}
                        onClick={() => handleMoveOption(oIdx, 'down')}
                        icon={<ChevronDown className="w-3.5 h-3.5" />}
                      />
                      <Button
                        size="small"
                        type="text"
                        danger
                        onClick={() => handleDeleteOption(oIdx)}
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                      />
                    </div>
                  </div>

                  {/* If MathType/Rich editor opened for this option */}
                  {isRichOpen && (
                    <div className="rounded-xl overflow-hidden border border-white/10 mt-1">
                      <RichTextEditor
                        value={opt.content || ''}
                        onChange={(val) => handleUpdateOption(oIdx, { content: val })}
                        placeholder={`Type option ${String.fromCharCode(65 + oIdx)} formula with MathType...`}
                        minHeight="100px"
                      />
                    </div>
                  )}

                  {/* Optional Option Image URL */}
                  <div className="flex items-center gap-2 pl-10">
                    <span className="text-[10px] uppercase font-bold text-glass-secondary">Image URL (Optional):</span>
                    <Input
                      size="small"
                      value={opt.imageUrl || ''}
                      onChange={(e) => handleUpdateOption(oIdx, { imageUrl: e.target.value })}
                      placeholder="https://... (Optional image for this option)"
                      className="flex-1 font-mono text-xs rounded-lg"
                    />
                    {opt.imageUrl && (
                      <img
                        src={opt.imageUrl}
                        alt="Option reference"
                        className="w-8 h-8 object-cover rounded border border-white/10 shrink-0"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Visuals & Diagrams Section */}
      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-glass-primary uppercase tracking-wider">
              Diagrams & Visual References
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="small"
              onClick={() => {
                setShowDiagramEditor(!showDiagramEditor);
                if (!showDiagramEditor && !question.diagram) {
                  handleUpdate({
                    diagram: MERMAID_TEMPLATES[0].code,
                    diagramType: 'mermaid',
                  });
                }
              }}
              className="text-xs font-medium"
            >
              {showDiagramEditor ? 'Hide Diagram Builder' : '+ Add Mermaid Diagram'}
            </Button>
          </div>
        </div>

        {/* Reference Image URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-glass-secondary flex items-center gap-1.5 uppercase tracking-wider">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            Question Reference Image URL (Optional)
          </label>
          <div className="flex items-center gap-3">
            <Input
              value={question.imageUrl || ''}
              onChange={(e) => handleUpdate({ imageUrl: e.target.value })}
              placeholder="https://images.unsplash.com/... or hosted image URL"
              className="font-mono text-xs rounded-xl"
            />
            {question.imageUrl && (
              <Button
                size="small"
                danger
                onClick={() => handleUpdate({ imageUrl: undefined })}
              >
                Clear
              </Button>
            )}
          </div>
          {question.imageUrl && (
            <div className="mt-2 p-2 rounded-xl bg-black/20 border border-white/10 flex justify-center">
              <img
                src={question.imageUrl}
                alt="Question Reference"
                className="max-h-48 rounded-lg object-contain"
              />
            </div>
          )}
        </div>

        {/* Interactive Mermaid Diagram Editor */}
        {showDiagramEditor && (
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'} space-y-3`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-indigo-400">Mermaid Diagram Script:</span>
              <div className="flex flex-wrap gap-1">
                <span className="text-[10px] text-glass-secondary uppercase font-bold mr-1 self-center">Templates:</span>
                {MERMAID_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.name}
                    type="button"
                    onClick={() => handleUpdate({ diagram: tmpl.code, diagramType: 'mermaid' })}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 border border-white/10 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </div>

            <TextArea
              rows={4}
              value={question.diagram || ''}
              onChange={(e) => handleUpdate({ diagram: e.target.value, diagramType: 'mermaid' })}
              placeholder="Enter Mermaid diagram code or data URL image..."
              className="font-mono text-xs rounded-xl"
            />

            {question.diagram && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-glass-secondary mb-2">Live Diagram Preview:</span>
                <QuestionDiagramRenderer diagram={question.diagram} />
              </div>
            )}
          </div>
        )}

        {/* Student Drawing Requirement Toggle */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-purple-400" />
              <strong className="text-sm text-glass-primary font-semibold">Student Drawing Response Area</strong>
            </div>
            <span className="text-xs text-glass-secondary">
              When enabled, students get a freehand interactive drawing canvas to sketch diagrams, circuits, or graphs.
            </span>
          </div>
          <Switch
            checked={!!question.requiresDiagram}
            onChange={(checked) => handleUpdate({ requiresDiagram: checked })}
          />
        </div>
      </div>

      {/* 5. IB Criteria Rubric Section */}
      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-glass-primary uppercase tracking-wider">
                IB / Rubric Criteria (Optional)
              </span>
            </div>
            <span className="text-[11px] text-glass-secondary">
              Assign multi-criterion scoring rubrics (e.g., Criterion A, B, C, D) for advanced assessment.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!showRubricEditor ? (
              <Button
                size="small"
                onClick={() => {
                  setShowRubricEditor(true);
                  if (criteria.length === 0) handleAddCriterion('A');
                }}
                className="text-xs font-medium"
              >
                + Enable Rubric Criteria
              </Button>
            ) : (
              <Button
                size="small"
                type="primary"
                icon={<Plus className="w-3 h-3" />}
                onClick={() => handleAddCriterion(String.fromCharCode(65 + criteria.length))}
                className="bg-indigo-600 hover:bg-indigo-500 text-xs font-medium"
              >
                Add Criterion
              </Button>
            )}
          </div>
        </div>

        {showRubricEditor && (
          <div className="space-y-3">
            {criteria.length === 0 ? (
              <div className="p-4 text-center text-xs text-glass-secondary border border-dashed rounded-xl">
                No criteria added. Click "Add Criterion" to add Criterion A, B, C, or D.
              </div>
            ) : (
              criteria.map((crit, cIdx) => (
                <div
                  key={cIdx}
                  className={`p-3.5 rounded-xl border ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'} space-y-2`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={crit.criterion}
                      onChange={(e) => handleUpdateCriterion(cIdx, { criterion: e.target.value })}
                      placeholder="e.g., Criterion A: Knowing and understanding"
                      className="font-semibold text-xs flex-1 rounded-lg"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-glass-secondary">Points:</span>
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        value={crit.points}
                        onChange={(e) => handleUpdateCriterion(cIdx, { points: parseInt(e.target.value) || 1 })}
                        className="w-16 font-mono text-xs rounded-lg"
                      />
                      <Button
                        size="small"
                        type="text"
                        danger
                        onClick={() => handleDeleteCriterion(cIdx)}
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                      />
                    </div>
                  </div>
                  <Input
                    value={crit.expectation}
                    onChange={(e) => handleUpdateCriterion(cIdx, { expectation: e.target.value })}
                    placeholder="Specific expectation / rubric descriptor for this criterion..."
                    className="text-xs rounded-lg"
                  />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 6. Answer Justification / Solution Explanation with Rich Text / MathType Switcher */}
      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-white/10">
          <label className="text-xs font-bold text-glass-secondary flex items-center gap-1.5 uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            Solution Explanation / Justification
          </label>

          {/* Mode Switcher Pill */}
          <div className={`inline-flex p-0.5 rounded-lg border ${isDark ? 'bg-black/40 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
            <button
              type="button"
              onClick={() => setJustificationEditorMode('richtext')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                justificationEditorMode === 'richtext'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-glass-secondary hover:text-glass-primary'
              }`}
            >
              <Sigma className="w-3 h-3" />
              <span>Rich Text & MathType</span>
            </button>
            <button
              type="button"
              onClick={() => setJustificationEditorMode('markdown')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                justificationEditorMode === 'markdown'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-glass-secondary hover:text-glass-primary'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>Markdown</span>
            </button>
          </div>
        </div>

        {justificationEditorMode === 'richtext' ? (
          <div className="rounded-xl overflow-hidden border border-white/10">
            <RichTextEditor
              value={question.justification || ''}
              onChange={(val) => handleUpdate({ justification: val })}
              placeholder="Detailed solution explanation with MathType formulas and tables..."
              minHeight="140px"
            />
          </div>
        ) : (
          <TextArea
            rows={3}
            value={question.justification || ''}
            onChange={(e) => handleUpdate({ justification: e.target.value })}
            placeholder="Detailed explanation of the solution shown to students during results review..."
            className="rounded-xl font-sans text-sm"
          />
        )}
      </div>
    </div>
  );
};
