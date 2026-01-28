import React, { useState } from 'react';
import { useQuizStore } from '../store/quizStore';
import { Timer } from './Timer';
import { Calculator } from './Tools/Calculator';
import { Notepad } from './Tools/Notepad';
import { Calculator as CalcIcon, StickyNote, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { DraggableWrapper } from './DraggableWrapper';

interface AssessprepLayoutProps {
  children: React.ReactNode;
}

export const AssessprepLayout: React.FC<AssessprepLayoutProps> = ({ children }) => {
  const { config, timeRemaining, answers, flaggedQuestions, currentQuestionIndex, jumpToQuestion, status } = useQuizStore();
  const [showCalculator, setShowCalculator] = useState(false);
  const [showNotepad, setShowNotepad] = useState(false);

  if (!config) return <>{children}</>;

  // Only show this layout in active mode
  if (status !== 'active') return <>{children}</>;

  return (
    <div className="h-screen flex flex-col bg-transparent transition-colors overflow-hidden">
      
      {/* Top Header */}
      <header className="h-16 px-6 glass-panel border-b border-white/10 flex items-center justify-between z-40 sticky top-0 backdrop-blur-md">
        <div className="flex items-center gap-4">
            <div className="font-bold text-lg text-glass-primary tracking-tight">AssessPrep</div>
            <div className="h-6 w-px bg-white/10 mx-2"></div>
            <h1 className="text-sm font-medium text-glass-secondary truncate max-w-[200px] md:max-w-md" title={config.title}>
                {config.title}
            </h1>
        </div>

        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
             {config.globalTimeLimit && (
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-glass-secondary tracking-widest">Time Remaining</span>
                    <Timer seconds={timeRemaining} label="" variant={timeRemaining < 300 ? 'urgent' : 'default'} />
                </div>
            )}
        </div>

        <div className="flex items-center gap-2">
            <button
              onClick={() => useQuizStore.getState().toggleTheme()}
              className="p-2 text-glass-secondary hover:text-glass-primary transition-colors rounded-full hover:bg-white/5"
              title="Toggle Theme"
            >
              {/* Simple inline SVG for Moon/Sun dynamic logic is hard without icon import, using text logic via hook or just adding icon imports */}
              {/* Assuming icons imported or using generic logic. Let's import Moon/Sun */}
              <span className="sr-only">Toggle Theme</span>
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            </button>
             
             <button
                onClick={() => {
                    if (window.confirm('Are you sure you want to reset the quiz? All progress will be lost.')) {
                        useQuizStore.getState().resetQuiz();
                    }
                }}
                className="p-2 text-glass-secondary hover:text-red-400 transition-colors rounded-full hover:bg-white/5"
                title="Reset Quiz"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
             </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-10 relative">
             <div className="max-w-5xl mx-auto pb-20">
                 {children}
             </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-72 glass-panel border-l border-white/10 flex flex-col z-30 hidden md:flex">
             {/* Question Palette */}
             <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                <div className="mb-6">
                    <h3 className="text-xs font-bold text-glass-secondary uppercase tracking-widest mb-4">Question Palette</h3>
                    
                    {(() => {
                        // Group questions by section
                        const sectionsMap = new Map<string, typeof config.questions>();
                        const noSectionQuestions: typeof config.questions = [];

                        config.questions.forEach(q => {
                            if (q.sectionId) {
                                if (!sectionsMap.has(q.sectionId)) {
                                    sectionsMap.set(q.sectionId, []);
                                }
                                sectionsMap.get(q.sectionId)!.push(q);
                            } else {
                                noSectionQuestions.push(q);
                            }
                        });

                        // Helper to render a grid of buttons
                        const renderGrid = (questions: typeof config.questions) => (
                            <div className="grid grid-cols-5 gap-2 mb-4">
                                {questions.map((q) => {
                                    // Find original index in the full list
                                    const idx = config.questions.findIndex(oq => oq.id === q.id);
                                    const isCurrent = idx === currentQuestionIndex;
                                    const isAttempted = answers[q.id] && answers[q.id].length > 0;
                                    const isFlagged = flaggedQuestions.includes(q.id);

                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => jumpToQuestion(idx)}
                                            className={clsx(
                                                "relative w-full aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all hover:scale-105 active:scale-95",
                                                isCurrent 
                                                    ? "bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-400/50" 
                                                    : isAttempted
                                                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                                : "bg-white/50 border-gray-300 text-glass-secondary hover:bg-white/80 dark:bg-slate-700/60 dark:border-slate-500 dark:text-white dark:hover:bg-slate-700/80 border"
                                            )}
                                        >
                                            {idx + 1}
                                            {isFlagged && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-orange-500/20" />}
                                        </button>
                                    );
                                })}
                            </div>
                        );

                        return (
                            <div className="space-y-4">
                                {/* Render Section Groups */}
                                {config.sections?.map(section => {
                                    const sectionQuestions = sectionsMap.get(section.id);
                                    if (!sectionQuestions || sectionQuestions.length === 0) return null;

                                    return (
                                        <div key={section.id}>
                                            <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2 truncate" title={section.title}>
                                                {section.title || 'Section'}
                                            </div>
                                            {renderGrid(sectionQuestions)}
                                        </div>
                                    );
                                })}

                                {/* Render General Questions if any exist */}
                                {noSectionQuestions.length > 0 && (
                                    <div>
                                        {config.sections && config.sections.length > 0 && (
                                             <div className="text-[10px] font-bold text-glass-secondary uppercase tracking-wider mb-2">General</div>
                                        )}
                                        {renderGrid(noSectionQuestions)}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>

                <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-xs text-glass-secondary">
                        <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30"></div> 
                        <span>Attempted</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-glass-secondary">
                         <div className="w-3 h-3 rounded bg-white/50 border border-gray-300 dark:bg-slate-700/60 dark:border-slate-500"></div>
                         <span>Unattempted</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-glass-secondary">
                         <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                         <span>Flagged</span>
                    </div>
                </div>
             </div>

             {/* Tools Section */}
             <div className="p-4 border-t border-white/10 bg-black/5 space-y-3 shrink-0">
                 <h3 className="text-xs font-bold text-glass-secondary uppercase tracking-widest mb-2">Tools</h3>
                 <div className="grid grid-cols-2 gap-2">
                     <button 
                        onClick={() => setShowCalculator(!showCalculator)}
                        className={clsx(
                            "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                            showCalculator 
                                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400" 
                                : "bg-white/5 border-white/5 text-glass-secondary hover:bg-white/10 hover:text-glass-primary"
                        )}
                     >
                        <CalcIcon className="w-5 h-5" />
                        <span className="text-xs font-medium">Calculator</span>
                     </button>
                     <button 
                        onClick={() => setShowNotepad(!showNotepad)}
                        className={clsx(
                            "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                            showNotepad
                                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400" 
                                : "bg-white/5 border-white/5 text-glass-secondary hover:bg-white/10 hover:text-glass-primary"
                        )}
                     >
                        <StickyNote className="w-5 h-5" />
                        <span className="text-xs font-medium">Notepad</span>
                     </button>
                 </div>

                 <button 
                    onClick={() => useQuizStore.getState().finishQuiz()}
                    className="w-full mt-4 flex items-center justify-center gap-2 p-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border border-red-500/20 rounded-xl transition-all font-medium text-sm"
                 >
                    <LogOut className="w-4 h-4" />
                    End Test
                 </button>
             </div>
        </aside>
      </div>
      
      {/* Floating Tools Root Context */}
      {showCalculator && (
          <DraggableWrapper className="absolute z-50 top-20 right-20" handle=".glass-panel > div:first-child">
             <Calculator onClose={() => setShowCalculator(false)} />
          </DraggableWrapper>
      )}
      
      {showNotepad && (
          <DraggableWrapper defaultPosition={{ x: 400, y: 100 }} handle=".glass-panel > div:first-child">
             <Notepad onClose={() => setShowNotepad(false)} />
          </DraggableWrapper>
      )}
    </div>
  );
};
