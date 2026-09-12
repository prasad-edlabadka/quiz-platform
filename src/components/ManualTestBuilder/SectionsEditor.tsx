import React, { useState } from 'react';
import { Typography, Input, Button, Popconfirm, Tag } from 'antd';
import { Plus, Trash2, ChevronUp, ChevronDown, BookOpen, Eye, EyeOff, FileText, Hash, Sigma, Code } from 'lucide-react';
import type { TestSection, TestConfig } from '../../types/test';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { RichTextEditor } from '../RichTextEditor';
import { createEmptySection } from './builderUtils';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface SectionsEditorProps {
  config: TestConfig;
  onChange: (sections: TestSection[]) => void;
  isDark?: boolean;
}

export const SectionsEditor: React.FC<SectionsEditorProps> = ({
  config,
  onChange,
  isDark = false,
}) => {
  const sections = config.sections || [];
  const [previewingSectionIds, setPreviewingSectionIds] = useState<string[]>([]);
  const [editorModes, setEditorModes] = useState<Record<string, 'richtext' | 'markdown'>>({});

  const togglePreview = (id: string) => {
    setPreviewingSectionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getEditorMode = (id: string) => editorModes[id] || 'markdown';

  const setEditorMode = (id: string, mode: 'richtext' | 'markdown') => {
    setEditorModes((prev) => ({ ...prev, [id]: mode }));
  };

  const handleAddSection = () => {
    const newSection = createEmptySection(sections.length);
    onChange([...sections, newSection]);
  };

  const handleUpdateSection = (index: number, updated: Partial<TestSection>) => {
    const next = [...sections];
    next[index] = { ...next[index], ...updated };
    onChange(next);
  };

  const handleDeleteSection = (index: number) => {
    const next = sections.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    const next = [...sections];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    onChange(next);
  };

  const getQuestionCountForSection = (sectionId: string) => {
    return (config.questions || []).filter((q) => q.sectionId === sectionId).length;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-10">
      {/* Header Info */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <Title level={4} className="!mb-0 text-glass-primary">Reading Passages & Shared Sections</Title>
          </div>
          <Text className="text-xs text-glass-secondary block">
            Group multiple questions under shared background reading passages, case studies, or contextual datasets.
          </Text>
        </div>

        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleAddSection}
          className="bg-indigo-600 hover:bg-indigo-500 font-semibold h-10 px-5 rounded-xl shrink-0"
        >
          Add Passage Section
        </Button>
      </div>

      {/* Sections List */}
      {sections.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border border-dashed ${isDark ? 'border-white/10 bg-white/2' : 'border-slate-200 bg-slate-50/50'}`}>
          <BookOpen className="w-12 h-12 text-indigo-400/50 mx-auto mb-3" />
          <Title level={5} className="text-glass-primary">No Passage Sections Added</Title>
          <Text className="text-xs text-glass-secondary block max-w-md mx-auto mb-4">
            If your exam contains standalone questions only, you don't need any sections. If you have shared reading texts or case studies, add one below!
          </Text>
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={handleAddSection}
            className="font-medium"
          >
            Create First Section
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section, idx) => {
            const isPreview = previewingSectionIds.includes(section.id);
            const questionCount = getQuestionCountForSection(section.id);
            const mode = getEditorMode(section.id);

            return (
              <div
                key={section.id || idx}
                className={`p-6 rounded-2xl border transition-all ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                      §{idx + 1}
                    </span>
                    <strong className="text-base text-glass-primary font-semibold">
                      {section.title || `Section ${idx + 1}`}
                    </strong>
                    <Tag color="purple" className="rounded-full text-[11px] font-medium ml-1">
                      {questionCount} Question{questionCount !== 1 ? 's' : ''} Linked
                    </Tag>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="small"
                      type="text"
                      disabled={idx === 0}
                      onClick={() => handleMoveSection(idx, 'up')}
                      icon={<ChevronUp className="w-4 h-4" />}
                      title="Move Up"
                    />
                    <Button
                      size="small"
                      type="text"
                      disabled={idx === sections.length - 1}
                      onClick={() => handleMoveSection(idx, 'down')}
                      icon={<ChevronDown className="w-4 h-4" />}
                      title="Move Down"
                    />
                    {mode === 'markdown' && (
                      <Button
                        size="small"
                        type="text"
                        onClick={() => togglePreview(section.id)}
                        icon={isPreview ? <EyeOff className="w-4 h-4 text-indigo-400" /> : <Eye className="w-4 h-4" />}
                        className="text-xs font-medium"
                      >
                        {isPreview ? 'Edit' : 'Preview'}
                      </Button>
                    )}
                    <Popconfirm
                      title="Delete Section?"
                      description={
                        questionCount > 0
                          ? `This section is linked to ${questionCount} question(s). Deleting it will unlink those questions.`
                          : 'Are you sure you want to delete this section?'
                      }
                      onConfirm={() => handleDeleteSection(idx)}
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<Trash2 className="w-4 h-4" />}
                        title="Delete Section"
                      />
                    </Popconfirm>
                  </div>
                </div>

                {/* Section Meta Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-glass-secondary uppercase tracking-wider">
                      Section Title
                    </label>
                    <Input
                      value={section.title || ''}
                      onChange={(e) => handleUpdateSection(idx, { title: e.target.value })}
                      placeholder="e.g., Passage 1: Renewable Energy Innovations"
                      className="rounded-xl font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-glass-secondary flex items-center gap-1 uppercase tracking-wider">
                      <Hash className="w-3 h-3 text-indigo-400" />
                      Section ID
                    </label>
                    <Input
                      value={section.id}
                      onChange={(e) => handleUpdateSection(idx, { id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      placeholder="e.g., passage-1"
                      className="font-mono text-xs rounded-xl"
                    />
                  </div>
                </div>

                {/* Section Content with Mode Switcher */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                    <label className="text-xs font-bold text-glass-secondary flex items-center gap-1.5 uppercase tracking-wider">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      Passage / Context Content
                    </label>

                    {/* Mode Switcher Pill */}
                    <div className={`inline-flex p-0.5 rounded-lg border ${isDark ? 'bg-black/40 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
                      <button
                        type="button"
                        onClick={() => setEditorMode(section.id, 'richtext')}
                        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                          mode === 'richtext'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-glass-secondary hover:text-glass-primary'
                        }`}
                      >
                        <Sigma className="w-3 h-3" />
                        <span>Rich Text & MathType</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorMode(section.id, 'markdown')}
                        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                          mode === 'markdown'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-glass-secondary hover:text-glass-primary'
                        }`}
                      >
                        <Code className="w-3 h-3" />
                        <span>Markdown</span>
                      </button>
                    </div>
                  </div>

                  {mode === 'richtext' ? (
                    <div className="rounded-xl overflow-hidden border border-white/10">
                      <RichTextEditor
                        value={section.content || ''}
                        onChange={(val) => handleUpdateSection(idx, { content: val })}
                        placeholder="Write or paste your reading passage, case study narrative, or prompt text here... Use MathType (√) in the toolbar for equations."
                        minHeight="200px"
                      />
                    </div>
                  ) : isPreview ? (
                    <div className={`p-4 rounded-xl min-h-[140px] border ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                      {section.content ? (
                        <MarkdownRenderer content={section.content} />
                      ) : (
                        <Text type="secondary" className="text-xs italic">Empty content.</Text>
                      )}
                    </div>
                  ) : (
                    <TextArea
                      rows={5}
                      value={section.content}
                      onChange={(e) => handleUpdateSection(idx, { content: e.target.value })}
                      placeholder="Write or paste your reading passage, case study narrative, or prompt text here... Markdown and LaTeX equations ($...$) supported."
                      className="rounded-xl font-sans text-sm leading-relaxed"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
