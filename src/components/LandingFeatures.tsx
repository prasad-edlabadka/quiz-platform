import React from 'react';
import { BrainCircuit, Timer, Printer, CheckCircle2, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuizStore } from '../store/quizStore';

interface LandingFeaturesProps {
  onOpenHistory: () => void;
}

export const LandingFeatures: React.FC<LandingFeaturesProps> = ({ onOpenHistory }) => {
  const { themeMode, toggleTheme } = useQuizStore();
  const isDark = themeMode === 'dark';
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col justify-center h-full px-4 lg:px-8 py-12 lg:py-0">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Brand lockup */}
        <div className="mb-6">
          <div className="flex items-center gap-5 mb-4">
            <img src="/revise-logo.png" alt="Revise logo" className="w-24 h-24 rounded-3xl object-contain shadow-2xl shadow-indigo-500/10" />
            <div>
              <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 leading-none tracking-tight">
                Revise
              </div>
              <div className="text-base text-glass-secondary/70 font-medium tracking-widest uppercase leading-none mt-2">
                AI-Powered Exam Practice
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98] ${isDark
                ? 'bg-white/5 hover:bg-white/10 text-yellow-300 border border-white/10'
                : 'bg-black/5 hover:bg-black/10 text-indigo-600 border border-black/10'
                }`}
            >
              <div className="relative">
                {isDark ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
              </div>
              <span className={`text-sm font-bold tracking-wide uppercase ${isDark ? 'text-glass-primary' : 'text-indigo-900/70'}`}>
                {isDark ? 'Light' : 'Dark'} Mode
              </span>
            </button>

            <button
              onClick={onOpenHistory}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98] ${isDark
                ? 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}
            >
              <div className="relative">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              </div>
              <span className={`text-sm font-bold tracking-wide uppercase`}>
                Past Results
              </span>
            </button>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-5xl font-extrabold text-glass-primary mb-4 drop-shadow-sm leading-tight">
          Ace Your Exams with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">AI-Powered</span> Practice
        </h1>

        <p className="text-lg md:text-lg text-glass-secondary mb-6 max-w-2xl leading-relaxed">
          Upload any syllabus or topic, and our advanced AI will instantly generate rigorous, curriculum-aligned, IB focused tests tailored to your needs.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        <motion.div variants={item} className={`glass-panel p-4 rounded-2xl transition-colors group ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2 group-hover:scale-110 transition-transform">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-glass-primary mb-1">Smart Generation</h3>
          <p className="text-sm text-glass-secondary">Instantly convert syllabuses into dynamic quizzes with multiple-choice and open-ended questions.</p>
        </motion.div>

        <motion.div variants={item} className={`glass-panel p-4 rounded-2xl transition-colors group ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-2 group-hover:scale-110 transition-transform">
            <Timer className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-glass-primary mb-1">Dynamic Timers</h3>
          <p className="text-sm text-glass-secondary">Practice under pressure with AI-calculated time limits tailored to the difficulty of each question.</p>
        </motion.div>

        <motion.div variants={item} className={`glass-panel p-4 rounded-2xl transition-colors group ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-2 group-hover:scale-110 transition-transform">
            <Printer className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-glass-primary mb-1">Offline Ready</h3>
          <p className="text-sm text-glass-secondary">Minimize screen time by generating beautifully formatted, printable A4 PDF exam papers.</p>
        </motion.div>

        <motion.div variants={item} className={`glass-panel p-4 rounded-2xl transition-colors group ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400 mb-2 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-glass-primary mb-1">Automated Grading</h3>
          <p className="text-sm text-glass-secondary">Get immediate, rich feedback on your text answers aligned with strict curriculum markschemes.</p>
        </motion.div>
        <motion.div variants={item} className={`glass-panel p-4 rounded-2xl transition-colors flex items-center gap-4 ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-pink-500/30 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 font-extrabold text-sm select-none">
            PE
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mb-0.5">Creator</p>
            <h3 className="text-sm font-bold text-glass-primary truncate">Prasad Edlabadkar</h3>
            <p className="text-[11px] text-glass-secondary">Developer · Revise</p>
          </div>
        </motion.div>

        <motion.div variants={item} className={`glass-panel p-4 rounded-2xl transition-colors flex items-center gap-4 ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/30 via-cyan-500/30 to-green-500/30 border border-blue-500/20 flex items-center justify-center shrink-0 font-extrabold text-sm select-none">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">G</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-cyan-400 uppercase tracking-widest mb-0.5">Powered by AI</p>
            <h3 className="text-sm font-bold text-glass-primary truncate">Google Antigravity</h3>
            <p className="text-[11px] text-glass-secondary">Co-creator · AI Coding</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
