import React, { useState } from 'react';
import { Users, Wifi, LogOut, Copy, CheckCircle2 } from 'lucide-react';
import { useSyncStore } from '../store/syncStore';
import { useTestStore } from '../store/testStore';

// Premium UI considerations incorporated (glassmorphism/animations)
export const GroupTestLobby: React.FC = () => {
  const { status, role, roomId, participantsData, userName, setUserName, hostRoom, joinRoom, leaveRoom, error } = useSyncStore();
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const { themeMode } = useTestStore();
  const isDark = themeMode === 'dark';

  const handleCopy = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'disconnected':
      case 'error':
        return (
          <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
            {/* Name Input */}
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-black/30 border-white/10' : 'bg-white border-slate-200'} backdrop-blur-md`}>
               <label className="block text-sm font-bold text-glass-primary mb-2">Display Name</label>
               <input 
                  type="text" 
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name to join..."
                  className={`w-full px-4 py-3 rounded-xl outline-none transition-all ${isDark ? 'bg-black/40 border border-white/10 text-white focus:border-indigo-500/60' : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-indigo-400'}`}
               />
               {!userName.trim() && (
                 <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                   <Wifi className="w-3 h-3" /> Name is required before joining or hosting
                 </p>
               )}
            </div>

            <div className="flex flex-col md:flex-row gap-6 w-full">
            <div className={`flex-1 flex flex-col p-6 rounded-2xl border ${isDark ? 'bg-black/20 border-indigo-500/20' : 'bg-white/50 border-indigo-100'} backdrop-blur-sm`}>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-500 mb-4">
                <Wifi className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-glass-primary mb-2">Host Session</h3>
              <p className="text-sm text-glass-secondary mb-6 flex-1">
                Create a new room and invite others to join. You will control the test settings.
              </p>
              <button 
                onClick={hostRoom}
                disabled={!userName.trim()}
                className="w-full py-3 px-4 glass-button-primary rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Users className="w-5 h-5" />
                Start Hosting
              </button>
            </div>

            <div className={`flex-1 flex flex-col p-6 rounded-2xl border ${isDark ? 'bg-black/20 border-purple-500/20' : 'bg-white/50 border-purple-100'} backdrop-blur-sm`}>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500 mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-glass-primary mb-2">Join Session</h3>
              <p className="text-sm text-glass-secondary mb-4">
                Enter the room code provided by your host to join their live session.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                <input 
                  type="text" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter Code (e.g. AB12)"
                  maxLength={6}
                  className={`flex-1 px-4 py-3 rounded-xl outline-none font-mono tracking-widest uppercase transition-all ${isDark ? 'bg-black/40 border border-white/10 text-white focus:border-purple-500/60' : 'bg-white border border-slate-200 text-slate-900 focus:border-purple-400'}`}
                />
                <button 
                  onClick={() => joinRoom(joinCode)}
                  disabled={!joinCode.trim() || !userName.trim()}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold transition-all ${isDark ? 'bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50' : 'bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50'}`}
                >
                  Join
                </button>
              </div>
            </div>
            </div>
          </div>
        );

      case 'connecting':
        return (
          <div className="flex flex-col items-center justify-center py-20 text-glass-secondary">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
            <p className="animate-pulse font-medium tracking-widest uppercase text-sm">Connecting to peer network...</p>
          </div>
        );

      case 'connected':
        return (
          <div className="w-full max-w-xl mx-auto text-center">
            <div className={`p-8 rounded-3xl border w-full backdrop-blur-md ${isDark ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
              <div className="flex items-center justify-between mb-4 mt-2">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                  Room Access
                </h2>
                <button 
                  onClick={leaveRoom}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${isDark ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
                >
                  <LogOut className="w-4 h-4" />
                  Leave
                </button>
              </div>
              <p className="text-sm text-glass-secondary mb-6 tracking-wide uppercase font-bold text-left">
                {role === 'host' ? 'Share this code to invite others' : 'You are connected as a guest'}
              </p>
              
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className={`text-5xl font-mono tracking-[0.5em] font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {roomId}
                </div>
                {role === 'host' && (
                  <button 
                    onClick={handleCopy}
                    className={`p-3 rounded-xl transition-all ${copied ? 'bg-emerald-500/20 text-emerald-500' : isDark ? 'bg-white/10 hover:bg-white/20 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-600'}`}
                    title="Copy Code"
                  >
                     {copied ? <CheckCircle2 className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                  </button>
                )}
              </div>

              <div className="w-full mb-6">
               {role === 'host' ? (
                  <div className={`p-5 rounded-2xl border text-left ${isDark ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
                     <div className="flex items-center gap-2 mb-2">
                       <span className="relative flex h-3 w-3">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                       </span>
                       <h3 className="font-extrabold text-indigo-500 uppercase tracking-widest text-sm">Action Required</h3>
                     </div>
                     <p className="text-glass-primary font-medium text-sm leading-relaxed">
                       Once everyone has connected below, navigate to the <strong className="text-indigo-400">New Test</strong>, <strong className="text-indigo-400">Library</strong>, or <strong className="text-indigo-400">Upload</strong> tab and load a test to begin. It will automatically start for everyone!
                     </p>
                  </div>
               ) : (
                  <div className={`p-6 rounded-2xl flex flex-col items-center justify-center border ${isDark ? 'bg-black/30 border-white/5' : 'bg-white/50 border-slate-200'}`}>
                    <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                    <p className="text-glass-primary font-bold animate-pulse text-lg">Waiting for host...</p>
                    <p className="text-sm text-glass-secondary mt-1">The test will begin automatically when the host starts it.</p>
                  </div>
               )}
              </div>

              <div className={`rounded-2xl p-4 transition-all ${isDark ? 'bg-black/30' : 'bg-white'}`}>
                 <div className="flex items-center justify-between mb-4 sticky top-0 bg-inherit z-10 pb-2">
                   <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                     <span className="font-bold text-sm text-glass-primary">
                       {Object.keys(participantsData).length} {Object.keys(participantsData).length === 1 ? 'Person' : 'People'} Connected
                     </span>
                   </div>
                   {role === 'host' && Object.keys(participantsData).length > 1 && (
                      <span className="text-xs uppercase font-bold text-emerald-400 tracking-widest">Ready to Start</span>
                   )}
                 </div>
                 
                 <div className="space-y-2 text-left max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">
                   {Object.values(participantsData).map(p => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/10 border border-white/5 transition-all hover:bg-black/20">
                         <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-glass-secondary" />
                            <span className="text-sm font-medium text-glass-primary truncate max-w-[150px] sm:max-w-[200px]">{p.name || 'Anonymous'}</span>
                            {p.id === useSyncStore.getState().peer?.id && <span className="text-xs text-indigo-400 font-bold ml-1">(You)</span>}
                         </div>
                         <span className="text-xs uppercase px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-md font-bold whitespace-nowrap">Online</span>
                      </div>
                   ))}
                 </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 w-full">
      <div className="text-center mb-10">
         <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-3">
           Group Session
         </h2>
         <p className="text-glass-secondary max-w-lg mx-auto leading-relaxed">
           Work on the same test simultaneously. Perfect for pair-testing or group assignments.
         </p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-sm text-center animate-shake">
          {error}
        </div>
      )}

      {renderContent()}
    </div>
  );
};
