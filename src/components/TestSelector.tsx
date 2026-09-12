import React from 'react';
import { Play, Edit3 } from 'lucide-react';

interface TestSelectorProps {
  onSelect: (data: any) => void;
  onEdit?: (data: any) => void;
}

export const TestSelector: React.FC<TestSelectorProps> = ({ onSelect, onEdit }) => {
  // Eagerly load all JSON and TS files from the data directory
  const modules = import.meta.glob(['../data/*.json', '../data/sampleTest.ts'], { eager: true });
  
  const tests = Object.entries(modules).map(([path, mod]: [string, any]) => {
    // Extract filename from path
    const filename = path.split('/').pop() || '';
    const name = filename.replace(/\.(json|ts)$/, '').replace(/([A-Z])/g, ' $1').trim(); // Basic prettify
    
    // Handle different export types:
    // 1. JSON files (default export or module structure)
    // 2. TS files (look for 'sampleQuiz' or default export)
    const data = mod.sampleTest || mod.default || mod;

    return { name, path, data };
  }).sort((a, b) => b.name.localeCompare(a.name)); 

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'No limit';
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    
    if (hrs > 0) {
        return `${hrs}h ${remainingMins > 0 ? `${remainingMins}m` : ''}`;
    }
    return `${mins}m`;
  };

  if (tests.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-transparent text-glass-secondary">Available Tests</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1 no-scrollbar p-1">
        {tests.map((test) => (
          <div
            key={test.path}
            className="flex flex-col items-start p-4 glass-button rounded-xl text-left transition-all hover:bg-indigo-500/10 hover:border-indigo-500/30 group hover:shadow-md hover:-translate-y-0.5 justify-between"
          >
            <div className="flex items-center justify-between w-full mb-2">
                 <span className="font-semibold text-glass-primary group-hover:text-indigo-400 transition-colors line-clamp-1" title={test.name}>
                    {test.name}
                 </span>
            </div>
            <div className="flex items-center justify-between w-full mt-auto pt-2 border-t border-white/5">
              <div className="flex items-center gap-2 text-xs text-glass-secondary">
                  <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      {test.data.questions?.length || 0} Qs
                  </span>
                  <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      {formatTime(test.data.globalTimeLimit)}
                  </span>
              </div>
              <div className="flex items-center gap-1.5">
                {onEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(test.data);
                    }}
                    className="p-1.5 rounded-lg text-glass-secondary hover:text-indigo-300 hover:bg-indigo-500/20 transition-all text-xs font-semibold flex items-center gap-1"
                    title="Customize & Edit in Test Builder"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelect(test.data)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-xs font-bold flex items-center gap-1 shadow-sm"
                  title="Take Test"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

