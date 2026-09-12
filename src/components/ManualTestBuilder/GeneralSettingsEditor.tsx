import React from 'react';
import { Typography, Input, Switch } from 'antd';
import { Settings, Clock, Palette, Shuffle, Hash, FileText } from 'lucide-react';
import type { TestConfig } from '../../types/test';
import { MarkdownRenderer } from '../MarkdownRenderer';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface GeneralSettingsEditorProps {
  config: TestConfig;
  onChange: (updated: Partial<TestConfig>) => void;
  isDark?: boolean;
}

const THEME_PRIMARY_PRESETS = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#ef4444', // Red
];

const THEME_BG_PRESETS = [
  '#0b0f19', // Dark Slate
  '#0f172a', // Midnight
  '#1e1b4b', // Deep Indigo
  '#180b2c', // Deep Purple
  '#121212', // Pure Dark
  '#f8fafc', // Soft Slate Light
  '#ffffff', // Clean White
];

export const GeneralSettingsEditor: React.FC<GeneralSettingsEditorProps> = ({
  config,
  onChange,
  isDark = false,
}) => {
  const [showDescPreview, setShowDescPreview] = React.useState(false);

  const timeLimitInMinutes = config.globalTimeLimit ? Math.round(config.globalTimeLimit / 60) : 0;

  const handleTimePreset = (minutes: number) => {
    onChange({ globalTimeLimit: minutes > 0 ? minutes * 60 : undefined });
  };

  const handleCustomMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val <= 0) {
      onChange({ globalTimeLimit: undefined });
    } else {
      onChange({ globalTimeLimit: val * 60 });
    }
  };

  const handleThemeColorChange = (key: 'primaryColor' | 'backgroundColor', colorHex: string) => {
    const currentTheme = config.theme || { primaryColor: '#6366f1', backgroundColor: '#0f172a' };
    onChange({
      theme: {
        ...currentTheme,
        [key]: colorHex,
      },
    });
  };

  const handleResetTheme = () => {
    onChange({ theme: undefined });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-10">
      {/* Title & Core Meta */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} space-y-5`}>
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <Settings className="w-5 h-5 text-indigo-400" />
          <Title level={4} className="!mb-0 text-glass-primary">General Exam Details</Title>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-glass-primary flex items-center gap-1.5 uppercase tracking-wider">
              Test Title <span className="text-red-400">*</span>
            </label>
            <Input
              value={config.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="e.g., AP Physics 1: Mechanics Final Exam"
              className="text-base font-semibold py-2 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-glass-secondary flex items-center gap-1.5 uppercase tracking-wider">
              <Hash className="w-3.5 h-3.5 text-indigo-400" />
              Identifier (ID)
            </label>
            <Input
              value={config.id}
              onChange={(e) => onChange({ id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              placeholder="e.g., physics-101"
              className="font-mono text-sm py-2 rounded-xl"
            />
          </div>
        </div>

        {/* Description / Instructions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-glass-secondary flex items-center gap-1.5 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              Description & Instructions (Markdown Supported)
            </label>
            <button
              type="button"
              onClick={() => setShowDescPreview(!showDescPreview)}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {showDescPreview ? 'Edit Markdown' : 'Preview Output'}
            </button>
          </div>

          {showDescPreview ? (
            <div className={`p-4 rounded-xl min-h-[100px] border ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              {config.description ? (
                <MarkdownRenderer content={config.description} />
              ) : (
                <Text type="secondary" className="text-xs italic">No description provided yet.</Text>
              )}
            </div>
          ) : (
            <TextArea
              rows={3}
              value={config.description || ''}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Provide context, instructions, or rules for students taking this test..."
              className="rounded-xl text-sm"
            />
          )}
        </div>
      </div>

      {/* Time Limits & Constraints */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} space-y-5`}>
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <Clock className="w-5 h-5 text-indigo-400" />
          <Title level={4} className="!mb-0 text-glass-primary">Time Limits & Behavior</Title>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-3">
            <label className="text-xs font-bold text-glass-primary flex items-center gap-1.5 uppercase tracking-wider">
              Global Exam Time Limit
            </label>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Unlimited', mins: 0 },
                { label: '10 min', mins: 10 },
                { label: '15 min', mins: 15 },
                { label: '30 min', mins: 30 },
                { label: '45 min', mins: 45 },
                { label: '60 min', mins: 60 },
                { label: '90 min', mins: 90 },
              ].map((p) => {
                const isActive = p.mins === 0 ? !config.globalTimeLimit : timeLimitInMinutes === p.mins;
                return (
                  <button
                    key={p.mins}
                    type="button"
                    onClick={() => handleTimePreset(p.mins)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : isDark
                        ? 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-glass-secondary">Custom minutes:</span>
              <Input
                type="number"
                min={1}
                max={600}
                value={timeLimitInMinutes > 0 ? timeLimitInMinutes : ''}
                onChange={handleCustomMinutesChange}
                placeholder="Custom min"
                className="w-32 rounded-lg font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-glass-primary flex items-center gap-1.5 uppercase tracking-wider">
              <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
              Question Order
            </label>

            <div className={`p-4 rounded-xl border flex items-center justify-between ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <div>
                <strong className="text-sm block text-glass-primary font-semibold">Shuffle Questions</strong>
                <span className="text-xs text-glass-secondary">Randomize question order each time test is taken</span>
              </div>
              <Switch
                checked={!!config.shuffleQuestions}
                onChange={(checked) => onChange({ shuffleQuestions: checked })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Theme & Visuals */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} space-y-5`}>
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-400" />
            <Title level={4} className="!mb-0 text-glass-primary">Custom Theme & Branding (Optional)</Title>
          </div>
          {config.theme && (
            <button
              type="button"
              onClick={handleResetTheme}
              className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              Reset to Default
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Color */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-glass-secondary uppercase tracking-wider">Primary Accent Color</label>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl border border-white/20 shadow-inner shrink-0 transition-transform hover:scale-105"
                style={{ backgroundColor: config.theme?.primaryColor || '#6366f1' }}
              />
              <Input
                value={config.theme?.primaryColor || ''}
                onChange={(e) => handleThemeColorChange('primaryColor', e.target.value)}
                placeholder="#6366f1"
                className="font-mono text-xs w-32 rounded-lg"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {THEME_PRIMARY_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleThemeColorChange('primaryColor', color)}
                  className="w-6 h-6 rounded-md transition-transform hover:scale-110 border border-white/20"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Background Color */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-glass-secondary uppercase tracking-wider">Background Tint Color</label>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl border border-white/20 shadow-inner shrink-0 transition-transform hover:scale-105"
                style={{ backgroundColor: config.theme?.backgroundColor || '#0b0f19' }}
              />
              <Input
                value={config.theme?.backgroundColor || ''}
                onChange={(e) => handleThemeColorChange('backgroundColor', e.target.value)}
                placeholder="#0b0f19"
                className="font-mono text-xs w-32 rounded-lg"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {THEME_BG_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleThemeColorChange('backgroundColor', color)}
                  className="w-6 h-6 rounded-md transition-transform hover:scale-110 border border-white/20"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
