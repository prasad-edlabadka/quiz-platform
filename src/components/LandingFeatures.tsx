import React from 'react';
import { BrainCircuit, Timer, Printer, CheckCircle2, Lightbulb, TrendingUp, Target, LockIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTestStore } from '../store/testStore';
import { Card, Typography } from 'antd';
const { Title, Text } = Typography;

export const LandingFeatures: React.FC = () => {
  const { themeMode } = useTestStore();
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
    <div className="flex flex-col justify-center h-full py-6 lg:py-0">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div layoutId="app-header-title" className="mb-10 flex items-center gap-6">
          <motion.img
            layoutId="main-logo"
            src="/revise-logo.png"
            alt="Revise logo"
            className="w-20 h-20 lg:w-24 lg:h-24 rounded-3xl object-contain shadow-2xl shadow-indigo-500/10"
          />
          <div>
            <div className="text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 leading-none tracking-tight mb-2">
              Revise
            </div>
            <div className="text-sm font-semibold tracking-[0.2em] text-glass-secondary uppercase">
              AI-Powered Exam Practice
            </div>
          </div>
        </motion.div>

        <Title level={1} className="text-4xl md:text-5xl lg:text-5xl font-extrabold text-glass-primary mb-4 drop-shadow-sm leading-tight">
          Ace Your Exams with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">AI-Powered</span> Practice
        </Title>

        <Text className="text-lg md:text-lg text-glass-secondary mb-6 max-w-2xl leading-relaxed block">
          Upload any syllabus or topic, and our advanced AI will instantly generate rigorous, curriculum-aligned, IB focused tests tailored to your needs.
        </Text>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10"
      >
        <motion.div variants={item}>
          <Card hoverable className={`rounded-2xl transition-colors group ${isDark ? 'bg-black/20 border-white/10' : 'bg-black/5 border-transparent'}`} styles={{ body: { padding: '1rem' } }}>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2 group-hover:scale-110 transition-transform">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <Title level={5} className="mb-1 text-glass-primary">Smart Generation</Title>
            <Text className="text-sm text-glass-secondary">Instantly convert syllabuses into dynamic tests with multiple-choice and open-ended questions.</Text>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card hoverable className={`rounded-2xl transition-colors group ${isDark ? 'bg-black/20 border-white/10' : 'bg-black/5 border-transparent'}`} styles={{ body: { padding: '1rem' } }}>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-2 group-hover:scale-110 transition-transform">
              <Timer className="w-5 h-5" />
            </div>
            <Title level={5} className="mb-1 text-glass-primary">Dynamic Timers</Title>
            <Text className="text-sm text-glass-secondary">Practice under pressure with AI-calculated time limits tailored to the difficulty of each question.</Text>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card hoverable className={`rounded-2xl transition-colors group ${isDark ? 'bg-black/20 border-white/10' : 'bg-black/5 border-transparent'}`} styles={{ body: { padding: '1rem' } }}>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-2 group-hover:scale-110 transition-transform">
              <Printer className="w-5 h-5" />
            </div>
            <Title level={5} className="mb-1 text-glass-primary">Offline Ready</Title>
            <Text className="text-sm text-glass-secondary">Minimize screen time by generating beautifully formatted, printable A4 PDF exam papers.</Text>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card hoverable className={`rounded-2xl transition-colors group ${isDark ? 'bg-black/20 border-white/10' : 'bg-black/5 border-transparent'}`} styles={{ body: { padding: '1rem' } }}>
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400 mb-2 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <Title level={5} className="mb-1 text-glass-primary">Automated Grading</Title>
            <Text className="text-sm text-glass-secondary">Get immediate, rich feedback on your text answers aligned with IB assessment criteria.</Text>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card hoverable className={`rounded-2xl transition-colors group ${isDark ? 'bg-black/20 border-white/10' : 'bg-black/5 border-transparent'}`} styles={{ body: { padding: '1.25rem' } }}>
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 mb-3 group-hover:scale-110 transition-transform">
              <Lightbulb className="w-6 h-6" />
            </div>
            <Title level={5} className="mb-1.5 text-glass-primary">Instant Explanations</Title>
            <Text className="text-sm text-glass-secondary leading-relaxed">Detailed, step-by-step AI breakdowns for every answer to help you learn from mistakes.</Text>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card hoverable className={`rounded-2xl transition-colors group ${isDark ? 'bg-black/20 border-white/10' : 'bg-black/5 border-transparent'}`} styles={{ body: { padding: '1.25rem' } }}>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 mb-3 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <Title level={5} className="mb-1.5 text-glass-primary">Progress Sharing</Title>
            <Text className="text-sm text-glass-secondary leading-relaxed">Share your results with teachers or peers to track progress together with easy to export PDF.</Text>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card hoverable className={`rounded-2xl transition-colors group ${isDark ? 'bg-black/20 border-white/10' : 'bg-black/5 border-transparent'}`} styles={{ body: { padding: '1.25rem' } }}>
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-500 mb-3 group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6" />
            </div>
            <Title level={5} className="mb-1.5 text-glass-primary">Targeted Practice</Title>
            <Text className="text-sm text-glass-secondary leading-relaxed">Identify weak areas and let AI generate specific questions to turn weaknesses into strengths.</Text>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card hoverable className={`rounded-2xl transition-colors group ${isDark ? 'bg-black/20 border-white/10' : 'bg-black/5 border-transparent'}`} styles={{ body: { padding: '1.25rem' } }}>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-500 mb-3 group-hover:scale-110 transition-transform">
              <LockIcon className="w-6 h-6" />
            </div>
            <Title level={5} className="mb-1.5 text-glass-primary">Fully Secured</Title>
            <Text className="text-sm text-glass-secondary leading-relaxed">All data stays in your browser and NOTHING is sent to our servers. No Signups. No tracking. 100% private.</Text>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-6"
      >
        <motion.div variants={item}>
          <Card hoverable className={`rounded-2xl transition-colors flex items-center gap-4 ${isDark ? 'bg-black/20 border-white/10' : 'bg-black/5 border-transparent'}`} styles={{ body: { padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' } }}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-pink-500/30 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 font-extrabold text-sm select-none">
              PE
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mb-0.5">Creator</p>
              <h3 className="text-sm font-bold text-glass-primary truncate">Prasad Edlabadkar</h3>
              <p className="text-[11px] text-glass-secondary">Developer · Revise</p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card hoverable className={`rounded-2xl transition-colors flex items-center gap-4 ${isDark ? 'bg-black/20 border-white/10' : 'bg-black/5 border-transparent'}`} styles={{ body: { padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' } }}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/30 via-cyan-500/30 to-green-500/30 border border-blue-500/20 flex items-center justify-center shrink-0 font-extrabold text-sm select-none">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">G</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-cyan-400 uppercase tracking-widest mb-0.5">Powered by AI</p>
              <h3 className="text-sm font-bold text-glass-primary truncate">Google Antigravity</h3>
              <p className="text-[11px] text-glass-secondary">Co-creator · AI Coding</p>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};
