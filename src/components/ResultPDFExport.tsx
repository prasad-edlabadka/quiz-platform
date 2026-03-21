import React from 'react';
import { createPortal } from 'react-dom';
import type { PastTestResult } from '../types/test';
import { useTestStore } from '../store/testStore';

interface ResultPDFExportProps {
  result: PastTestResult;
  onClose: () => void;
}

const calcScore = (result: PastTestResult) => {
  let total = 0, max = 0;
  result.config.questions.forEach(q => {
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

export const ResultPDFExport: React.FC<ResultPDFExportProps> = ({ result, onClose }) => {
  const { themeMode } = useTestStore();
  const isDark = themeMode === 'dark';
  const { total, max, pct } = calcScore(result);
  const timeSpent = Object.values(result.questionTimeTaken || {}).reduce((a, b) => a + b, 0);

  const formatDate = (d: string) => new Date(d).toLocaleString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const gradeColor = pct >= 70 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';

  const handlePrint = () => window.print();

  // The printable document is injected directly into <body> via a portal
  // so that position: absolute; top: 0 is relative to the document root,
  // and multi-page printing works correctly.
  const printPortal = createPortal(
    <div id="pdf-print-content">
      <div className="print-doc">
        {/* Header */}
        <div className="print-header">
          <div>
            <h1 className="print-title">{result.config.title}</h1>
            {result.config.description && <p className="print-subtitle">{result.config.description}</p>}
            <p className="print-meta">Date: {formatDate(result.date)}</p>
            {result.isOffline && <p className="print-meta">Mode: Offline (Handwritten)</p>}
          </div>
          <div className="print-score-badge" style={{ borderColor: gradeColor }}>
            <div className="print-score-pct" style={{ color: gradeColor }}>{pct}%</div>
            <div className="print-score-raw">{total} / {max} pts</div>
            <div className="print-score-time">{Math.floor(timeSpent / 60)}m {timeSpent % 60}s</div>
          </div>
        </div>

        <hr className="print-divider" />

        {/* Questions */}
        {result.config.questions.map((q, idx) => {
          const selected = result.answers?.[q.id] || [];
          const evalData = result.evaluations?.[q.id];
          const pts = q.points || 1;
          const earned = evalData
            ? evalData.score
            : (() => {
                if (!q.options) return 0;
                const corr = q.options.filter(o => o.isCorrect).map(o => o.id);
                return corr.length > 0 && selected.length === corr.length && selected.every(id => corr.includes(id)) ? pts : 0;
              })();
          const isPass = earned >= pts * 0.5;

          return (
            <div key={q.id} className="print-question">
              <div className="print-q-header">
                <span className="print-q-num">Q{idx + 1}</span>
                <span className="print-q-score" style={{ color: isPass ? '#16a34a' : '#dc2626' }}>{earned}/{pts}</span>
              </div>
              <p className="print-q-content">{q.content.replace(/\*\*|##|###|\*|`/g, '').trim()}</p>

              {q.options && (
                <div className="print-options">
                  {q.options.map(opt => {
                    const isSel = selected.includes(opt.id);
                    return (
                      <div key={opt.id} className="print-option" style={{
                        background: opt.isCorrect ? '#f0fdf4' : isSel && !opt.isCorrect ? '#fef2f2' : '#f8fafc',
                        borderColor: opt.isCorrect ? '#86efac' : isSel && !opt.isCorrect ? '#fca5a5' : '#e2e8f0',
                        fontWeight: isSel ? 600 : 400,
                      }}>
                        <span style={{ marginRight: 6 }}>
                          {isSel && opt.isCorrect ? '✓' : isSel && !opt.isCorrect ? '✗' : opt.isCorrect ? '✓' : '○'}
                        </span>
                        {opt.content.replace(/\*\*|\*/g, '')}
                      </div>
                    );
                  })}
                </div>
              )}

              {q.type === 'text' && selected.length > 0 && (
                <div className="print-text-answer"><strong>Student answer:</strong> {selected[0]}</div>
              )}
              {evalData?.feedback && (
                <div className="print-feedback"><strong>Feedback:</strong> {evalData.feedback}</div>
              )}
              {q.justification && (
                <div className="print-justification"><strong>Model answer:</strong> {q.justification}</div>
              )}
            </div>
          );
        })}

        <div className="print-footer">
          <p>Generated by Revise · AI-Powered Exam Practice · {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      {/* Screen-only overlay (hidden on print via .no-print) */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 no-print">
        <div className={`border rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl ${
          isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Export PDF Report</h3>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            A print-ready report will open. Choose <strong>"Save as PDF"</strong> in your browser's print dialog to share with your teacher.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className={`flex-1 py-2.5 rounded-xl border transition-all text-sm font-medium ${
              isDark ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
              Cancel
            </button>
            <button onClick={handlePrint} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all text-sm border border-indigo-500">
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* Portaled print content — lives directly in <body> */}
      {printPortal}
    </>
  );
};
