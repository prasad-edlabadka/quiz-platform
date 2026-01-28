import React, { useState, useEffect } from 'react';
import { Delete, X } from 'lucide-react';
import { clsx } from 'clsx';

interface CalculatorProps {
  onClose: () => void;
}

export const Calculator: React.FC<CalculatorProps> = ({ onClose }) => {
  const [mode, setMode] = useState<'basic' | 'scientific'>('basic');

  const handleNumber = (num: string) => {
    if (isNewNumber) {
      setDisplay(num);
      setIsNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(`${display} ${op} `);
    setIsNewNumber(true);
  };

  const handleScientific = (func: string) => {
    if (isNewNumber) {
        setDisplay(func + '(');
        setIsNewNumber(false);
    } else {
        setDisplay(display + func + '(');
    }
  };

  const calculate = () => {
    try {
      let expression = equation + display;
      
      // Sanitization and Math replacements
      expression = expression
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/log/g, 'Math.log10')
        .replace(/ln/g, 'Math.log')
        .replace(/pi/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/\^/g, '**');

      // eslint-disable-next-line no-eval
      const result = eval(expression); 
      
      // Format excessive decimals
      const finalResult = Number.isInteger(result) ? String(result) : String(parseFloat(result.toFixed(8)));
      
      setDisplay(finalResult);
      setEquation('');
      setIsNewNumber(true);
    } catch (e) {
      setDisplay('Error');
      setIsNewNumber(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow default browser refresh/devtools
      if (e.metaKey || e.ctrlKey || e.key === 'F5') return;
      
      e.stopPropagation();

      if (e.key >= '0' && e.key <= '9') handleNumber(e.key);
      else if (e.key === '.') handleNumber('.');
      else if (e.key === '+') handleOperator('+');
      else if (e.key === '-') handleOperator('-');
      else if (e.key === '*') handleOperator('*');
      else if (e.key === '/') handleOperator('/');
      else if (e.key === '^') handleOperator('^');
      else if (e.key === 'Enter' || e.key === '=') calculate();
      else if (e.key === 'Backspace') setDisplay(prev => prev.slice(0, -1) || '0');
      else if (e.key === 'Escape') clear();
      else if (e.key === '(') handleNumber('(');
      else if (e.key === ')') handleNumber(')');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [display, equation, isNewNumber]);

  const clear = () => {
    setDisplay('0');
    setEquation('');
    setIsNewNumber(true);
  };

  const basicButtons = [
    { label: 'C', action: clear, className: 'col-span-2 bg-red-500/10 text-red-500 hover:bg-red-500/20' },
    { label: <Delete className="w-4 h-4" />, action: () => setDisplay(display.slice(0, -1) || '0'), className: 'bg-glass-secondary/10 hover:bg-glass-secondary/20' },
    { label: '/', action: () => handleOperator('/'), className: 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20' },
    { label: '7', action: () => handleNumber('7') },
    { label: '8', action: () => handleNumber('8') },
    { label: '9', action: () => handleNumber('9') },
    { label: '*', action: () => handleOperator('*'), className: 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20' },
    { label: '4', action: () => handleNumber('4') },
    { label: '5', action: () => handleNumber('5') },
    { label: '6', action: () => handleNumber('6') },
    { label: '-', action: () => handleOperator('-'), className: 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20' },
    { label: '1', action: () => handleNumber('1') },
    { label: '2', action: () => handleNumber('2') },
    { label: '3', action: () => handleNumber('3') },
    { label: '+', action: () => handleOperator('+'), className: 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20' },
    { label: '0', action: () => handleNumber('0'), className: 'col-span-2' },
    { label: '.', action: () => handleNumber('.') },
    { label: '=', action: calculate, className: 'bg-indigo-500 text-white hover:bg-indigo-600' },
  ];

  const scientificButtons = [
    { label: 'sin', action: () => handleScientific('sin') },
    { label: 'cos', action: () => handleScientific('cos') },
    { label: 'tan', action: () => handleScientific('tan') },
    { label: 'π', action: () => handleNumber('pi') },
    { label: 'ln', action: () => handleScientific('ln') },
    { label: 'log', action: () => handleScientific('log') },
    { label: '√', action: () => handleScientific('sqrt') },
    { label: '^', action: () => handleOperator('^') },
    { label: '(', action: () => handleNumber('(') },
    { label: ')', action: () => handleNumber(')') },
  ];

  return (
    <div className={clsx("glass-panel p-4 rounded-xl shadow-2xl border border-white/20 transition-all duration-300", mode === 'basic' ? 'w-64' : 'w-96')}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-glass-secondary uppercase tracking-wider">Calculator</h3>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setMode(mode === 'basic' ? 'scientific' : 'basic')} 
                className={clsx("text-xs px-2 py-1 rounded transition-colors border", mode === 'scientific' ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" : "bg-white/5 text-glass-secondary border-white/10 hover:text-glass-primary")}
            >
                {mode === 'basic' ? 'Basic' : 'Sci'}
            </button>
            <button onClick={onClose} className="text-glass-secondary hover:text-glass-primary">
                <X className="w-4 h-4" />
            </button>
        </div>
      </div>
      
      <div className="bg-black/20 rounded-lg p-3 mb-4 text-right">
        <div className="text-xs text-glass-secondary h-4 mb-1 truncate">{equation}</div>
        <div className="text-2xl font-mono text-white truncate">{display}</div>
      </div>

      <div className="flex gap-2">
          {mode === 'scientific' && (
              <div className="grid grid-cols-2 gap-2 w-1/3">
                  {scientificButtons.map((btn, idx) => (
                      <button
                        key={`sci-${idx}`}
                        onClick={btn.action}
                        className="p-2 rounded-lg text-xs font-medium transition-colors active:scale-95 bg-indigo-500/5 text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/10"
                      >
                        {btn.label}
                      </button>
                  ))}
              </div>
          )}

          <div className={clsx("grid gap-2 flex-1", "grid-cols-4")}>
            {basicButtons.map((btn, idx) => (
            <button
                key={idx}
                onClick={btn.action}
                className={clsx(
                "p-2 rounded-lg text-sm font-medium transition-colors active:scale-95",
                btn.className || "bg-white/5 text-glass-primary hover:bg-white/10"
                )}
            >
                {btn.label}
            </button>
            ))}
          </div>
      </div>
    </div>
  );
};
