import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, ExternalLink, ShieldCheck, CreditCard } from 'lucide-react';

interface ApiKeyHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyHelpModal: React.FC<ApiKeyHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg glass-panel rounded-xl md:rounded-2xl shadow-2xl overflow-hidden z-10 mx-4 md:mx-0"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600/40 to-purple-600/40 backdrop-blur-md p-4 md:p-6 text-white border-b border-white/10">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                  <Key className="w-6 h-6 text-indigo-200" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">What is an API Key?</h3>
                  <p className="text-indigo-200 text-sm mt-1">And how to get one for free</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                aria-label="Close"
                className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-6">
            {/* Explanation */}
            <div className="bg-indigo-500/20 rounded-xl p-4 border border-indigo-500/30">
              <p className="text-sm text-indigo-100 leading-relaxed">
                Think of an API Key like a <strong>digital password</strong> that allows this app to talk to Google's AI brain. You generate it once, and you can reuse it for your quizzes.
              </p>
            </div>

            {/* Features/Reassurance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                <ShieldCheck className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Safe & Secure</h4>
                  <p className="text-xs text-glass-secondary mt-1">Stored only on your device.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                <CreditCard className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Free to Use</h4>
                  <p className="text-xs text-glass-secondary mt-1">Google offers a generous free tier.</p>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div>
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/40 text-white text-xs border border-indigo-400/50">1</span>
                How to get your key:
              </h4>
              <ol className="space-y-3 relative border-l-2 border-white/10 ml-2.5 pl-5 pb-2">
                <li className="text-sm text-glass-secondary">
                   Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-300 font-medium hover:text-indigo-200 hover:underline inline-flex items-center gap-1">
                    Google AI Studio <ExternalLink className="w-3 h-3" />
                   </a> and sign in with Google.
                </li>
                <li className="text-sm text-glass-secondary">
                  Click the blue <strong>"Create API key"</strong> button.
                </li>
                <li className="text-sm text-glass-secondary">
                  Copy the key that starts with <code>AIza...</code> and paste it here!
                </li>
              </ol>
            </div>
            
            <div className="pt-2">
                 <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 glass-button-primary py-3 rounded-xl font-medium hover:bg-indigo-500/40 transition-colors shadow-lg"
                    onClick={onClose}
                >
                    Get my Free API Key
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
