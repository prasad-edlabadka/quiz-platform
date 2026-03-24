import React, { useState, useMemo } from 'react';
import { useTestStore } from '../store/testStore';
import { Clock, Award, Trash2, Eye, Calendar, X, RotateCcw, TrendingUp, TrendingDown, Minus, FileDown, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PastTestResult, TestConfig } from '../types/test';
import { ResultPDFExport } from './ResultPDFExport';

interface PastResultsViewProps {
    onBack: () => void;
    onRetake?: (config: TestConfig) => void;
}

const calcScore = (result: PastTestResult) => {
    let total = 0, max = 0;
    result.config?.questions?.forEach(q => {
        const pts = q.points || 1;
        max += pts;
        if (result.evaluations?.[q.id]) {
            total += result.evaluations[q.id].score;
        } else if (q.options) {
            const correct = q.options.filter(o => o.isCorrect).map(o => o.id);
            const selected = result.answers?.[q.id] || [];
            if (correct.length > 0 && selected.length === correct.length && selected.every(id => correct.includes(id))) {
                total += pts;
            }
        }
    });
    return { total, max, pct: max > 0 ? Math.round((total / max) * 100) : 0 };
};

/** SVG sparkline bar chart */
const SparkChart: React.FC<{ attempts: PastTestResult[] }> = ({ attempts }) => {
    const W = 280, H = 80, PAD = 26;
    const data = attempts.map(r => ({ pct: calcScore(r).pct, date: r.date }));
    const barW = Math.min(36, Math.floor((W - PAD * 2) / data.length) - 6);
    const barGap = Math.floor((W - PAD * 2) / data.length);

    const trend = data.length >= 2
        ? data[data.length - 1].pct > data[data.length - 2].pct ? 'up'
        : data[data.length - 1].pct < data[data.length - 2].pct ? 'down' : 'flat'
        : 'flat';

    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const trendColor = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#94a3b8';

    return (
        <div className="flex items-center gap-4 mb-4">
            <svg width={W} height={H} style={{ overflow: 'visible' }}>
                {[0, 50, 100].map(pct => {
                    const y = PAD + ((100 - pct) / 100) * (H - PAD);
                    return (
                        <g key={pct}>
                            <line x1={PAD} y1={y} x2={W} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                            <text x={PAD - 4} y={y + 4} textAnchor="end" fontSize={8} fill="rgba(255,255,255,0.3)">{pct}%</text>
                        </g>
                    );
                })}
                {data.map((d, i) => {
                    const barH = ((d.pct / 100) * (H - PAD));
                    const x = PAD + i * barGap + (barGap - barW) / 2;
                    const y = H - barH;
                    const color = d.pct >= 70 ? '#6366f1' : d.pct >= 50 ? '#f59e0b' : '#ef4444';
                    const isLast = i === data.length - 1;
                    return (
                        <g key={i}>
                            <rect x={x} y={y} width={barW} height={barH} rx={3}
                                fill={color} opacity={isLast ? 1 : 0.5} />
                            <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize={9}
                                fill={isLast ? color : 'rgba(255,255,255,0.45)'} fontWeight={isLast ? 700 : 400}>
                                {d.pct}%
                            </text>
                        </g>
                    );
                })}
                {data.length > 1 && (() => {
                    const pts = data.map((d, i) => `${PAD + i * barGap + barGap / 2},${H - ((d.pct / 100) * (H - PAD))}`).join(' ');
                    return <polyline points={pts} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={1.5} strokeDasharray="3,3" />;
                })()}
            </svg>
            <div className="flex flex-col items-center gap-1 min-w-[56px]">
                <TrendIcon size={20} color={trendColor} />
                <span className="text-[11px] font-bold" style={{ color: trendColor }}>
                    {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
                </span>
            </div>
        </div>
    );
};

/** A single result row — used both in flat list and inside group drawer */
const ResultRow: React.FC<{
    result: PastTestResult;
    onRetake?: (config: TestConfig) => void;
    onViewSheets: (sheets: string[]) => void;
    onExportPDF: (result: PastTestResult) => void;
    onDelete: (id: string) => void;
    onReview: (id: string) => void;
    compact?: boolean;
}> = ({ result, onRetake, onViewSheets, onExportPDF, onDelete, onReview, compact }) => {
    const { total, max, pct } = calcScore(result);
    const timeSpent = Object.values(result.questionTimeTaken || {}).reduce((a, b) => a + b, 0);
    const scoreColor = pct >= 70 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400';

    const formatDate = (d: string) => new Date(d).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className={`glass-panel rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between group transition-all hover:bg-white/5 border border-white/5 hover:border-white/10 ${compact ? 'p-3' : 'p-4'}`}
        >
            <div className="flex-1 min-w-0 pr-4 mb-2 sm:mb-0">
                {!compact && (
                    <h3 className="font-bold text-base text-glass-primary mb-1 flex items-center gap-2" title={result.config.title}>
                        {result.config.title || 'Untitled'}
                        {result.isOffline && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">OFFLINE</span>
                        )}
                    </h3>
                )}
                <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[11px] text-glass-secondary font-medium">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-indigo-400/70" /> {formatDate(result.date)}</span>
                    <span className="flex items-center gap-1">
                        <Award className="w-3 h-3 text-emerald-400/70" />
                        <span className={max > 0 ? scoreColor : ''}>{max > 0 ? `${pct}% (${total}/${max})` : 'N/A'}</span>
                    </span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-400/70" /> {Math.floor(timeSpent / 60)}m {timeSpent % 60}s</span>
                </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
                {onRetake && !result.isOffline && (
                    <button onClick={() => onRetake(result.config)}
                        className="flex items-center gap-1 p-1.5 px-2.5 glass-button rounded-lg text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-colors text-xs font-medium">
                        <RotateCcw className="w-3.5 h-3.5" /><span>Retake</span>
                    </button>
                )}
                {result.isOffline && result.uploadedSheets && result.uploadedSheets.length > 0 && (
                    <button onClick={() => onViewSheets(result.uploadedSheets!)}
                        className="flex items-center gap-1 p-1.5 px-2.5 glass-button rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors text-xs font-medium">
                        <Eye className="w-3.5 h-3.5" /><span>Sheets</span>
                    </button>
                )}
                <button onClick={() => onReview(result.attemptId)}
                    className="flex items-center gap-1 p-1.5 px-2.5 glass-button rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors text-xs font-medium">
                    <Eye className="w-3.5 h-3.5" /><span>Review</span>
                </button>
                <button onClick={() => onExportPDF(result)}
                    className="flex items-center gap-1 p-1.5 px-2.5 glass-button rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors text-xs font-medium">
                    <FileDown className="w-3.5 h-3.5" /><span>PDF</span>
                </button>
                <button
                    onClick={() => { if (window.confirm('Delete this result?')) onDelete(result.attemptId); }}
                    className="p-1.5 text-glass-secondary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors sm:opacity-0 group-hover:opacity-100 focus:opacity-100">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </motion.div>
    );
};

export const PastResultsView: React.FC<PastResultsViewProps> = ({ onBack, onRetake }) => {
    const { pastResults, loadPastResult, deletePastResult } = useTestStore();
    const [viewingSheets, setViewingSheets] = useState<string[] | null>(null);
    const [exportResult, setExportResult] = useState<PastTestResult | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // Group by test title — newest first
    const { groups, singles } = useMemo(() => {
        const map = new Map<string, PastTestResult[]>();
        [...pastResults].reverse().forEach(r => {
            const key = r.config?.title || 'Untitled';
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(r);
        });
        const groups: Array<{ title: string; attempts: PastTestResult[] }> = [];
        const singles: PastTestResult[] = [];
        map.forEach((attempts, title) => {
            if (attempts.length >= 2) groups.push({ title, attempts });
            else singles.push(attempts[0]);
        });
        return { groups, singles };
    }, [pastResults]);

    const toggleGroup = (title: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            next.has(title) ? next.delete(title) : next.add(title);
            return next;
        });
    };

    const rowProps = {
        onRetake,
        onViewSheets: setViewingSheets,
        onExportPDF: setExportResult,
        onDelete: deletePastResult,
        onReview: loadPastResult,
    };

    return (
        <div className="w-full flex flex-col relative flex-1">
            {pastResults.length === 0 ? (
                <div className="glass-panel p-16 rounded-2xl flex flex-col items-center justify-center text-center flex-1">
                    <Award className="w-16 h-16 mb-4 text-indigo-400/50" />
                    <h2 className="text-2xl font-bold mb-2 text-glass-primary">No Past Results Yet</h2>
                    <p className="text-glass-secondary mb-8">Complete a test to see your history here.</p>
                    <button onClick={onBack} className="glass-button-primary px-8 py-3 rounded-xl font-bold transition-all hover:scale-105">Go Practice</button>
                </div>
            ) : (
                <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">

                    {/* Grouped: tests with 2+ attempts — chart + attempt rows inside drawer */}
                    {groups.map(({ title, attempts }) => {
                        const isOpen = expandedGroups.has(title);
                        const best = Math.max(...attempts.map(a => calcScore(a).pct));
                        const latest = calcScore(attempts[0]).pct;
                        const avg = Math.round(attempts.reduce((s, a) => s + calcScore(a).pct, 0) / attempts.length);
                        const latestColor = latest >= 70 ? 'text-emerald-400' : latest >= 50 ? 'text-amber-400' : 'text-red-400';

                        return (
                            <div key={title} className="glass-panel rounded-2xl border border-indigo-500/20 bg-indigo-500/5 overflow-hidden">
                                {/* Drawer header */}
                                <button
                                    onClick={() => toggleGroup(title)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                                        <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0" />
                                        <span className="text-sm font-bold text-glass-primary truncate">{title}</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold shrink-0">
                                            {attempts.length} attempts
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className={`text-xs font-bold ${latestColor}`}>Latest: {latest}%</span>
                                        {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-indigo-400" />}
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.22 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 pb-4 flex flex-col gap-3">
                                                {/* Chart + stats */}
                                                <SparkChart attempts={[...attempts].reverse()} />
                                                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-1">
                                                    {[
                                                        { label: 'Best', value: best + '%' },
                                                        { label: 'Latest', value: latest + '%' },
                                                        { label: 'Average', value: avg + '%' },
                                                    ].map(s => (
                                                        <div key={s.label} className="bg-white/5 rounded-lg py-2">
                                                            <div className="font-bold text-indigo-300 text-sm">{s.value}</div>
                                                            <div className="text-glass-secondary">{s.label}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Individual attempt rows (compact, no test title re-shown) */}
                                                {attempts.map(r => (
                                                    <ResultRow key={r.attemptId} result={r} compact {...rowProps} />
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}

                    {/* Singles: tests with only 1 attempt — flat card */}
                    {singles.map(result => (
                        <ResultRow key={result.attemptId} result={result} {...rowProps} />
                    ))}
                </div>
            )}

            {/* Uploaded sheets viewer */}
            {viewingSheets && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
                    <button onClick={() => setViewingSheets(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col gap-4 p-4">
                        {viewingSheets.map((sheet, idx) => (
                            <img key={idx} src={sheet} alt={`Sheet ${idx + 1}`} className="w-full h-auto rounded-xl border border-white/10 shadow-2xl" />
                        ))}
                    </div>
                </div>
            )}

            {/* PDF Export modal */}
            {exportResult && (
                <ResultPDFExport result={exportResult} onClose={() => setExportResult(null)} />
            )}
        </div>
    );
};
