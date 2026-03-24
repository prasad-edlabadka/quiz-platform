import React, { useState, useEffect } from 'react';
import { generateTestFromSyllabus, type QuestionTypeFilter, type StructureMode, type TimeBoundMode } from '../services/aiService';
import type { TestConfig } from '../types/test';
import { BrainCircuit, AlertCircle, BookOpen, Hash, Layout, ListChecks, Timer, Info, Settings } from 'lucide-react';
import { useTestStore } from '../store/testStore';
import { Button, Input, Select, Typography, Alert, Card } from 'antd';
const { Title, Text } = Typography;
const { TextArea } = Input;

const SAMPLE_PROMPTS = [
    { label: 'Math', icon: '➗', text: 'Topic: Quadratic Equations. Cover finding roots, using the quadratic formula, and solving word problems involving parabolic motion. Include mixed MCQ and text answers.' },
    { label: 'Physics', icon: '⚡', text: 'Topic: Electromagnetism. Explain Faraday’s Law, Lenz’s Law, and the concept of magnetic flux. Include 1 numerical problem on induced EMF.' },
    { label: 'Chemistry', icon: '🧪', text: 'Topic: Chemical Bonding. Compare Ionic, Covalent, and Metallic bonding. Explain electronegativity trends and Lewis structures for CO2 and H2O.' },
    { label: 'Biology', icon: '🔬', text: 'Subject: Cellular Biology. Focus on organelle functions (mitochondria, nucleus, ribosomes) and the differences between plant and animal cells.' },
    { label: 'English', icon: '📝', text: 'Reading Comprehension: Focus on a passage about the ethical implications of Artificial Intelligence. Create 3 MCQs on inference and 2 text questions on critical analysis.' }
];

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
            <div className="max-w-5xl w-full mx-auto relative pt-2 pb-4 md:pb-8">
                {onCancel && (
                    <div className="absolute top-0 right-0">
                        <Button
                            type="text"
                            onClick={onCancel}
                            className="text-gray-400 hover:text-white font-medium text-sm transition-colors"
                        >
                            Cancel
                        </Button>
                    </div>
                )}

                <div className="text-center mb-8">
                    <Title level={2} className="mb-2 text-glass-primary">Generate Test from Syllabus</Title>
                    <Text className="text-glass-secondary text-base block">Use AI to create a tailored test from your study materials.</Text>
                </div>

                {/* API key missing banner */}
                {!apiKey && (
                    <div className='mb-6'>
                        <Card
                            hoverable
                            onClick={onOpenSettings}
                            className="w-full mb-8 cursor-pointer bg-red-500/10 border-red-500/30 transition-all group"
                            styles={{ body: { padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' } }}
                        >
                            <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 shrink-0 group-hover:scale-110 transition-transform">
                                <Settings className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <strong className="text-sm font-bold text-red-400 block">Gemini API Key Required</strong>
                                <span className="text-xs text-red-400/70 block">Click here to open Settings and add your key to enable AI generation.</span>
                            </div>
                            <span className="text-xs font-semibold text-red-400 border border-red-400/40 px-3 py-1 rounded-lg shrink-0 group-hover:bg-red-400/10 transition-colors">
                                Open Settings →
                            </span>
                        </Card>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
                    {/* Left Column: Syllabus Textarea (Primary Focus) */}
                    <div className="lg:col-span-7 flex flex-col h-full space-y-3">
                        <label className="text-sm font-bold text-glass-primary flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-indigo-300" />
                            Syllabus / Topics / Notes
                        </label>
                        <TextArea
                            value={syllabus}
                            onChange={(e) => setSyllabus(e.target.value)}
                            placeholder={`Paste your syllabus, topic list, or notes here...\nFor example:\n- Introduction to React\n- Components and Props\n- State and Lifecycle`}
                            className="w-full flex-1 min-h-[300px] lg:min-h-full rounded-xl text-sm md:text-base leading-relaxed bg-black/20"
                        />
                        <div className="flex flex-wrap gap-2 pt-1 lg:pb-0 pb-4">
                            <span className="text-[10px] uppercase font-bold text-glass-secondary mt-1 tracking-wider mr-1">Examples:</span>
                            {SAMPLE_PROMPTS.map((prompt) => (
                                <button
                                    key={prompt.label}
                                    onClick={() => setSyllabus(prompt.text)}
                                    className="px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all text-[11px] font-medium text-glass-secondary hover:text-indigo-300 flex items-center gap-1.5"
                                >
                                    <span>{prompt.icon}</span>
                                    {prompt.label}
                                </button>
                            ))}
                        </div>
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
                                    <Input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={questionCount}
                                        onChange={(e) => setQuestionCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                                        className="w-full rounded-lg text-sm bg-black/20"
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
                                    <Select
                                        value={structureMode}
                                        onChange={(value) => setStructureMode(value as any)}
                                        className="w-full text-sm font-sans [&_.ant-select-selector]:!bg-black/20 [&_.ant-select-selector]:!border-white/10"
                                        options={[
                                            { value: 'flat', label: 'Standard' },
                                            { value: 'sections', label: 'Section-Based' },
                                        ]}
                                    />
                                </div>

                                {/* Time Constraints */}
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-bold text-glass-primary flex items-center gap-1.5 opacity-90">
                                        <Timer className="w-3.5 h-3.5 text-indigo-300" />
                                        Time Constraints
                                    </label>
                                    <Select
                                        value={timeBoundMode}
                                        onChange={(value) => setTimeBoundMode(value as any)}
                                        className="w-full text-sm font-sans [&_.ant-select-selector]:!bg-black/20 [&_.ant-select-selector]:!border-white/10"
                                        options={[
                                            { value: 'none', label: 'No Time Limit' },
                                            { value: 'overall', label: 'Overall Test Time' },
                                            { value: 'per_question', label: 'Per-Question Time' },
                                            { value: 'both', label: 'Both' },
                                        ]}
                                    />
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
                            <Alert
                                message={error}
                                type="error"
                                showIcon
                                icon={<AlertCircle className="w-4 h-4" />}
                                className={`text-left text-sm ${document.documentElement.classList.contains('dark') ? 'bg-red-500/20 text-red-200 border-red-500/30' : 'bg-red-500/20 text-red-800 border-red-500/30'}`}
                            />
                        )}

                        <div className="mt-auto pt-2">
                            <Button
                                type="primary"
                                size="large"
                                onClick={handleGenerate}
                                disabled={!apiKey}
                                loading={loading}
                                icon={!loading && <BrainCircuit className="w-6 h-6 mr-1" />}
                                className="w-full flex justify-center items-center px-4 py-6 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 min-h-[56px] text-lg"
                            >
                                {loading ? 'Generating Questions...' : 'Generate Test'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
