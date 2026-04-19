import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { useSyncStore } from '../store/syncStore';
import { Typography, Card, Button } from 'antd';

const { Title, Text } = Typography;

interface GroupSessionProps {
  onContinueToPersonal: () => void;
}

export const GroupSessionStateView: React.FC<GroupSessionProps> = ({ onContinueToPersonal }) => {
  const { participantsData, peer } = useSyncStore();
  const participants = Object.values(participantsData);
  const allFinished = participants.every(p => p.status === 'finished');
  
  const myPeerId = peer?.id;

  if (!allFinished) {
    // Waiting Room UI
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl mx-auto pt-20 px-4 text-center"
      >
         <div className="mb-10 block">
           <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-6" />
           <Title level={2}>Waiting for everyone to finish...</Title>
           <Text className="text-glass-secondary">Scores and leaderboards will be revealed once all participants have completed the test and their text answers (if any) are graded by AI.</Text>
         </div>

         <Card className="rounded-3xl border border-white/10 bg-black/20 backdrop-blur-md" styles={{ body: { padding: '2rem' } }}>
            <div className="space-y-4 text-left">
              {participants.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-400">
                       {p.name.charAt(0).toUpperCase()}
                     </div>
                     <div>
                       <p className="font-bold text-glass-primary flex items-center gap-2">
                         {p.name}
                         {p.id === myPeerId && <span className="text-xs text-indigo-400 saturate-150">(You)</span>}
                       </p>
                       <p className="text-xs text-glass-secondary">
                         {p.status === 'finished' ? 'Test Completed & Evaluated' : 'Currently solving test...'}
                       </p>
                     </div>
                   </div>
                   
                   <div>
                     {p.status === 'finished' ? (
                       <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                     ) : (
                       <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                     )}
                   </div>
                </div>
              ))}
            </div>
         </Card>
      </motion.div>
    );
  }

  // Leaderboard UI
  const sortedParticipants = [...participants].sort((a, b) => {
    const scoreA = a.score || 0;
    const scoreB = b.score || 0;
    return scoreB - scoreA;
  });

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto pt-10 px-4 text-center"
      >
        <div className="mb-10">
           <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-yellow-500/30">
              <Trophy className="w-10 h-10 text-yellow-500" />
           </div>
           <Title level={1} className="drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">
             Final Leaderboard
           </Title>
        </div>

        <Card className="rounded-3xl border border-yellow-500/20 bg-black/40 backdrop-blur-xl shadow-2xl mb-10 overflow-hidden text-left" styles={{ body: { padding: '0' } }}>
           <div className="p-6 bg-yellow-500/10 border-b border-yellow-500/20 flex justify-between font-bold text-yellow-500 text-sm tracking-widest uppercase">
             <span>Rank & Name</span>
             <span>Score</span>
           </div>
           <div className="divide-y divide-white/10">
             {sortedParticipants.map((p, index) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={p.id} 
                  className={`p-6 flex items-center justify-between transition-colors hover:bg-white/5 ${p.id === myPeerId ? 'bg-indigo-500/10' : ''}`}
                >
                   <div className="flex items-center gap-4">
                     <span className={`text-2xl font-black w-8 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-700' : 'text-glass-secondary'}`}>
                       #{index + 1}
                     </span>
                     <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-xl text-glass-primary shadow-inner border border-white/5">
                        {p.name.charAt(0).toUpperCase()}
                     </div>
                     <span className="font-bold text-xl text-glass-primary">
                       {p.name}
                       {p.id === myPeerId && <span className="ml-2 text-xs uppercase tracking-widest text-indigo-400 bg-indigo-500/20 px-2 py-1 rounded">You</span>}
                     </span>
                   </div>
                   
                   <div className="text-right">
                     <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">
                       {p.score || 0}
                     </span>
                     <span className="text-sm font-bold text-glass-secondary ml-1">/ {p.maxScore || 0}</span>
                   </div>
                </motion.div>
             ))}
           </div>
        </Card>

        <Button 
          type="primary" 
          size="large" 
          onClick={onContinueToPersonal}
          className="px-8 py-6 rounded-full text-lg font-bold shadow-lg transform hover:scale-105 transition-transform"
          icon={<ArrowRight className="w-5 h-5" />}
          iconPosition="end"
        >
          View My Detailed Results
        </Button>
    </motion.div>
  );
};
