import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface NotepadProps {
  onClose: () => void;
}

export const Notepad: React.FC<NotepadProps> = ({ onClose }) => {
  const [content, setContent] = useState('');

  // Loads saved note on mount
  useEffect(() => {
    const saved = localStorage.getItem('assessprep-notepad');
    if (saved) setContent(saved);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setContent(newVal);
    localStorage.setItem('assessprep-notepad', newVal);
  };

  return (
    <div className="w-80 h-96 glass-panel p-0 rounded-xl shadow-2xl border border-white/20 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-white/5">
        <h3 className="text-sm font-bold text-glass-secondary uppercase tracking-wider">Notepad</h3>
        <button onClick={onClose} className="text-glass-secondary hover:text-glass-primary">
            <X className="w-4 h-4" />
        </button>
      </div>
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Type your notes here..."
        className="flex-1 w-full bg-transparent p-4 resize-none outline-none text-glass-primary placeholder:text-glass-secondary/50 font-mono text-sm leading-relaxed"
        spellCheck={false}
      />
    </div>
  );
};
