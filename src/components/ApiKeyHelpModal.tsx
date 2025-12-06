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
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Key className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">What is an API Key?</h3>
                  <p className="text-indigo-100 text-sm mt-1">And how to get one for free</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Explanation */}
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <p className="text-sm text-indigo-900 leading-relaxed">
                Think of an API Key like a <strong>digital password</strong> that allows this app to talk to Google's AI brain. You generate it once, and you can reuse it for your quizzes.
              </p>
            </div>

            {/* Features/Reassurance */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                <ShieldCheck className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Safe & Secure</h4>
                  <p className="text-xs text-gray-500 mt-1">Stored only on your device.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                <CreditCard className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Free to Use</h4>
                  <p className="text-xs text-gray-500 mt-1">Google offers a generous free tier.</p>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 text-white text-xs">1</span>
                How to get your key:
              </h4>
              <ol className="space-y-3 relative border-l-2 border-gray-100 ml-2.5 pl-5 pb-2">
                <li className="text-sm text-gray-600">
                   Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-1">
                    Google AI Studio <ExternalLink className="w-3 h-3" />
                   </a> and sign in with Google.
                </li>
                <li className="text-sm text-gray-600">
                  Click the blue <strong>"Create API key"</strong> button.
                </li>
                <li className="text-sm text-gray-600">
                  Copy the key that starts with <code>AIza...</code> and paste it here!
                </li>
              </ol>
            </div>
            
            <div className="pt-2">
                 <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
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
