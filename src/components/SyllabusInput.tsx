import React, { useState, useEffect } from 'react';
import { generateTestFromSyllabus, type QuestionTypeFilter, type StructureMode, type TimeBoundMode } from '../services/aiService';
import type { TestConfig } from '../types/test';
import { BrainCircuit, Loader2, AlertCircle, BookOpen, Hash, Layout, ListChecks, Timer, Info, Settings } from 'lucide-react';
import { useTestStore } from '../store/testStore';

interface TestInputProps {
    onTestGenerated: (config: TestConfig) => void;
    onCancel?: () => void;
    onOpenSettings?: () => void;
}

export const SyllabusInput: React.FC<TestInputProps> = ({ onTestGenerated, onCancel, onOpenSettings }) => {
    const { apiKey } = useTestStore();
    const [syllabus, setSyllabus] = useState('');
    const [questionCount, setQuestionCount] = useState(5);
    const [structureMode, setStructureMode] = useState<StructureMode>('flat');
    const [questionType, setQuestionType] = useState<QuestionTypeFilter>('mixed');
    const [timeBoundMode, setTimeBoundMode] = useState<TimeBoundMode>('none');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-open settings popup if no API key on mount
    useEffect(() => {
        if (!apiKey && onOpenSettings) {
            onOpenSettings();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleGenerate = async () => {
        if (!apiKey?.trim()) {
            setError('No API key found. Please set your Gemini API key in Settings.');
            onOpenSettings?.();
            return;
        }
        if (!syllabus.trim()) {
            setError('Please enter a syllabus or topic');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const testConfig = await generateTestFromSyllabus(apiKey, syllabus, questionCount, structureMode, questionType, timeBoundMode);
            onTestGenerated(testConfig);
        } catch (err: any) {
            setError(err.message || 'Failed to generate test');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="max-w-5xl w-full mx-auto relative pt-2 pb-8">
                {onCancel && (
                    <div className="absolute top-0 right-0">
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-white font-medium text-sm transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                <div className="text-center mb-8">
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-glass-primary mb-2">Generate Test from Syllabus</h1>
                    <p className="text-glass-secondary text-base">Use AI to create a tailored test from your study materials.</p>
                </div>

                {/* API key missing banner */}
                {!apiKey && (
                    <button
                        onClick={onOpenSettings}
                        className="w-full mb-6 flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-left hover:bg-red-500/20 transition-all group"
                    >
                        <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 shrink-0 group-hover:scale-110 transition-transform">
                            <Settings className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-red-400">Gemini API Key Required</p>
                            <p className="text-xs text-red-400/70">Click here to open Settings and add your key to enable AI generation.</p>
                        </div>
                        <span className="text-xs font-semibold text-red-400 border border-red-400/40 px-3 py-1 rounded-lg shrink-0 group-hover:bg-red-400/10 transition-colors">
                            Open Settings →
                        </span>
                    </button>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
                    {/* Left Column: Syllabus Textarea (Primary Focus) */}
                    <div className="lg:col-span-7 flex flex-col h-full space-y-3">
                        <label className="text-sm font-bold text-glass-primary flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-indigo-300" />
                            Syllabus / Topics / Notes
                        </label>
                        <textarea
                            value={syllabus}
                            onChange={(e) => setSyllabus(e.target.value)}
                            placeholder={`Paste your syllabus, topic list, or notes here...\nFor example:\n- Introduction to React\n- Components and Props\n- State and Lifecycle`}
                            className="w-full flex-1 min-h-[300px] lg:min-h-full p-4 rounded-xl glass-input outline-none resize-none placeholder:text-gray-500 text-sm md:text-base leading-relaxed"
                        />
                    </div>

                    {/* Right Column: Configuration & Actions */}
                    <div className="lg:col-span-5 space-y-6 flex flex-col">
                        {/* Test Settings Background Box */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-5">
                            {/* Configuration Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Question Count */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-glass-primary flex items-center gap-1.5 opacity-90">
                                        <Hash className="w-3.5 h-3.5 text-indigo-300" />
                                        Count
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={questionCount}
                                        onChange={(e) => setQuestionCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                                        className="w-full p-2.5 rounded-lg glass-input outline-none text-sm"
                                    />
                                </div>

                                {/* Structure Mode */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-glass-primary flex items-center gap-1.5 opacity-90">
                                        <Layout className="w-3.5 h-3.5 text-indigo-300" />
                                        Structure
                                        <div className="relative group flex items-center">
                                            <Info className="w-3.5 h-3.5 text-indigo-300/70 cursor-help hover:text-indigo-300 transition-colors" />
                                            <div className="absolute top-full -right-4 mt-2 w-72 md:w-80 p-4 bg-gray-900/95 backdrop-blur-sm border border-gray-700 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                                <div className="space-y-3">
                                                    <div>
                                                        <strong className="text-indigo-300 text-sm block mb-1">Standard (Flat)</strong>
                                                        <p className="text-gray-300 mb-1">A simple, consecutive list of standalone questions.</p>
                                                    </div>
                                                    <div>
                                                        <strong className="text-indigo-300 text-sm block mb-1">Section-Based</strong>
                                                        <p className="text-gray-300 mb-1">Questions are grouped together under shared reading passages, case studies, or unified contexts.</p>
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-full right-6 mb-[-1px] border-4 border-transparent border-b-gray-700/90"></div>
                                            </div>
                                        </div>
                                    </label>
                                    <select
                                        value={structureMode}
                                        onChange={(e) => setStructureMode(e.target.value as any)}
                                        className="w-full p-2.5 rounded-lg glass-input outline-none text-sm appearance-none bg-black/20"
                                    >
                                        <option value="flat">Standard</option>
                                        <option value="sections">Section-Based</option>
                                    </select>
                                </div>

                                {/* Time Constraints */}
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-bold text-glass-primary flex items-center gap-1.5 opacity-90">
                                        <Timer className="w-3.5 h-3.5 text-indigo-300" />
                                        Time Constraints
                                    </label>
                                    <select
                                        value={timeBoundMode}
                                        onChange={(e) => setTimeBoundMode(e.target.value as any)}
                                        className="w-full p-2.5 rounded-lg glass-input outline-none text-sm appearance-none bg-black/20"
                                    >
                                        <option value="none">No Time Limit</option>
                                        <option value="overall">Overall Test Time</option>
                                        <option value="per_question">Per-Question Time</option>
                                        <option value="both">Both</option>
                                    </select>
                                </div>

                                {/* Question Type */}
                                <div className="space-y-2 col-span-2 mt-1">
                                    <label className="text-xs font-bold text-glass-primary flex items-center gap-1.5 opacity-90 mb-2">
                                        <ListChecks className="w-3.5 h-3.5 text-indigo-300" />
                                        Question Type
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['mixed', 'mcq', 'text'] as const).map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setQuestionType(type)}
                                                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all border ${questionType === type
                                                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-sm'
                                                        : 'bg-white/5 text-glass-secondary border-white/10 hover:bg-white/10'
                                                    }`}
                                            >
                                                {type === 'mixed' ? 'Mixed' : type === 'mcq' ? 'MCQ' : 'Text Only'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className={`p-3 rounded-lg flex items-center gap-2 border text-left text-sm ${document.documentElement.classList.contains('dark') ? 'bg-red-500/20 text-red-200 border-red-500/30' : 'bg-red-500/20 text-red-800 border-red-500/30'}`}>
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="mt-auto pt-2">
                            <button
                                onClick={handleGenerate}
                                disabled={loading || !apiKey}
                                className="w-full flex justify-center items-center px-4 py-4 glass-button-primary rounded-xl font-bold transition-colors shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                        Generating Questions...
                                    </>
                                ) : (
                                    <>
                                        <BrainCircuit className="w-6 h-6 mr-3" />
                                        Generate Test
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
