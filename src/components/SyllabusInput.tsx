import React, { useState, useEffect } from 'react';
import { generateTestFromSyllabus, type QuestionTypeFilter, type StructureMode, type TimeBoundMode } from '../services/aiService';
import type { TestConfig } from '../types/test';
import { BrainCircuit, Loader2, AlertCircle, Key, BookOpen, Hash, HelpCircle, Layout, ListChecks, Timer, Info } from 'lucide-react';
import { ApiKeyHelpModal } from './ApiKeyHelpModal';

interface TestInputProps {
    onTestGenerated: (config: TestConfig) => void;
    onCancel?: () => void;
}

export const SyllabusInput: React.FC<TestInputProps> = ({ onTestGenerated, onCancel }) => {
    const [apiKey, setApiKey] = useState('');
    const [syllabus, setSyllabus] = useState('');
    const [questionCount, setQuestionCount] = useState(5);
    const [structureMode, setStructureMode] = useState<StructureMode>('flat');
    const [questionType, setQuestionType] = useState<QuestionTypeFilter>('mixed');
    const [timeBoundMode, setTimeBoundMode] = useState<TimeBoundMode>('none');
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) {
            setApiKey(storedKey);
        }
    }, []);

    const handleGenerate = async () => {
        if (!apiKey.trim()) {
            setError('Please provide a valid Google Gemini API Key');
            return;
        }
        if (!syllabus.trim()) {
            setError('Please enter a syllabus or topic');
            return;
        }

        setLoading(true);
        setError(null);
        localStorage.setItem('gemini_api_key', apiKey.trim());

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
                            placeholder="Paste your syllabus, topic list, or notes here...&#10;For example:&#10;- Introduction to React&#10;- Components and Props&#10;- State and Lifecycle"
                            className="w-full flex-1 min-h-[300px] lg:min-h-full p-4 rounded-xl glass-input outline-none resize-none placeholder:text-gray-500 text-sm md:text-base leading-relaxed"
                        />
                    </div>

                    {/* Right Column: Configuration & Actions */}
                    <div className="lg:col-span-5 space-y-6 flex flex-col">
                        {/* API Key Input */}
                        <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="flex justify-between items-end mb-1">
                                <label className="text-sm font-bold text-glass-primary flex items-center gap-2">
                                    <Key className="w-4 h-4 text-indigo-300" />
                                    Gemini API Key
                                </label>
                                <button
                                    onClick={() => setIsHelpOpen(true)}
                                    className="text-xs text-indigo-300 hover:text-white hover:underline flex items-center gap-1 font-medium transition-colors"
                                >
                                    <HelpCircle className="w-3 h-3" />
                                    How do I get a key?
                                </button>
                            </div>

                            <div>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your Gemini API Key"
                                    className="w-full p-3 rounded-xl glass-input outline-none text-sm placeholder:text-gray-500"
                                />
                                <p className="text-xs text-glass-secondary mt-2 opacity-80">
                                    Stored locally in your browser, never sent to our servers.
                                </p>
                            </div>
                        </div>

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
                                disabled={loading}
                                className="w-full flex justify-center items-center px-4 py-4 glass-button-primary rounded-xl font-bold transition-colors shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5"
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

                <ApiKeyHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
            </div>
        </>
    );
};
