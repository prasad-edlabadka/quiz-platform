import React from 'react';
import type { Option } from '../types/quiz';
import { MarkdownRenderer } from './MarkdownRenderer';
import { clsx } from 'clsx';
import { CheckCircle2, Circle } from 'lucide-react';

interface OptionSelectorProps {
  options: Option[];
  selectedOptionIds: string[];
  type: 'single_choice' | 'multiple_choice';
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
}

export const OptionSelector: React.FC<OptionSelectorProps> = ({
  options,
  selectedOptionIds,
  type,
  onSelectionChange,
  disabled
}) => {
  const handleSelect = (optionId: string) => {
    if (disabled) return;

    if (type === 'single_choice') {
      onSelectionChange([optionId]);
    } else {
      const newSelection = selectedOptionIds.includes(optionId)
        ? selectedOptionIds.filter(id => id !== optionId)
        : [...selectedOptionIds, optionId];
      onSelectionChange(newSelection);
    }
  };

  return (
    <div className="space-y-3">
      {options.map((option) => {
        const isSelected = selectedOptionIds.includes(option.id);
        
        return (
          <div
            key={option.id}
            onClick={() => handleSelect(option.id)}
            className={clsx(
              "relative flex items-center p-4 rounded-xl transition-all cursor-pointer group",
              isSelected 
                ? "glass-option-selected" 
                : "glass-option",
              disabled && "opacity-50 cursor-not-allowed hover:bg-white/5"
            )}
          >
            <div className={clsx(
              "flex-shrink-0 mr-4 transition-transform",
              isSelected ? "scale-100 text-indigo-400" : "scale-100 opacity-50 group-hover:opacity-80 text-glass-secondary"
            )}>
              {type === 'single_choice' ? (
                isSelected ? <CheckCircle2 className="w-6 h-6 fill-indigo-500/20" /> : <Circle className="w-6 h-6" />
              ) : (
                <div className={clsx(
                  "w-6 h-6 rounded border-2 flex items-center justify-center transition-colors",
                  isSelected ? "bg-indigo-500 border-indigo-500" : "border-glass-secondary bg-transparent"
                )}>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
              )}
            </div>
            
            <div className="flex-grow min-w-0">
              <MarkdownRenderer content={option.content} className="prose-sm" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
