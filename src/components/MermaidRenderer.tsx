import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useTestStore } from '../store/testStore';

// Initialize mermaid once with some safe default configs
mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
  theme: 'default',
});

export const autoRepairMermaid = (code: string): string => {
  let repaired = code;
  // 1. Double parentheses: A((+q1)) -> A(("+q1"))
  repaired = repaired.replace(/\b([a-zA-Z_][a-zA-Z0-9_-]*)\(\(([^"\)]+)\)\)/g, '$1(("$2"))');
  // 2. Single parentheses, brackets, braces: A(+q1) -> A("+q1"), A[+q1] -> A["+q1"], A{+q1} -> A{"+q1"}
  repaired = repaired.replace(/\b([a-zA-Z_][a-zA-Z0-9_-]*)(\(|\[|\{)([^"\]\)\}]+)(\)|\]|\})/g, (match, id, open, label, close) => {
    if (open === '(' && code.includes(`${id}((${label}))`)) return match;
    return `${id}${open}"${label}"${close}`;
  });
  // 3. Trim spaces between shape brackets and quotes
  // Double parentheses: A(( "text" )) -> A(("text"))
  repaired = repaired.replace(/\b([a-zA-Z_][a-zA-Z0-9_-]*)\(\(\s*"(.*?)"\s*\)\)/g, '$1(("$2"))');
  // Stadium shape: A([ "text" ]) -> A(["text"])
  repaired = repaired.replace(/\b([a-zA-Z_][a-zA-Z0-9_-]*)\(\[\s*"(.*?)"\s*\]\)/g, '$1(["$2"])');
  // Single parentheses: A( "text" ) -> A("text")
  repaired = repaired.replace(/\b([a-zA-Z_][a-zA-Z0-9_-]*)\(\s*"(.*?)"\s*\)/g, (match, id, label) => {
    if (match.startsWith(`${id}((`)) return match;
    return `${id}("${label}")`;
  });
  // Square brackets: A[ "text" ] -> A["text"]
  repaired = repaired.replace(/\b([a-zA-Z_][a-zA-Z0-9_-]*)\[\s*"(.*?)"\s*\]/g, '$1["$2"]');
  // Curly braces: A{ "text" } -> A{"text"}
  repaired = repaired.replace(/\b([a-zA-Z_][a-zA-Z0-9_-]*)\{\s*"(.*?)"\s*\}/g, '$1{"$2"}');
  // 4. Strip double quotes from vertical bar link labels: | "Force F" | -> |Force F|
  repaired = repaired.replace(/\|[ \t]*"(.*?)"[ \t]*\|/g, '|$1|');
  // 5. Normalize double backslashes to single backslashes for special symbols (e.g. \\mu -> \mu)
  repaired = repaired.replace(/\\\\/g, '\\');
  // 6. Convert LaTeX/math symbols to unicode characters for Mermaid text labels (e.g. \mu -> μ, \Omega -> Ω)
  repaired = repaired
    .replace(/\\mu\b/g, 'μ')
    .replace(/\\Omega\b/g, 'Ω')
    .replace(/\\pi\b/g, 'π')
    .replace(/\\theta\b/g, 'θ')
    .replace(/\\alpha\b/g, 'α')
    .replace(/\\beta\b/g, 'β')
    .replace(/\\gamma\b/g, 'γ')
    .replace(/\\omega\b/g, 'ω')
    .replace(/\\phi\b/g, 'φ')
    .replace(/\\Delta\b/g, 'Δ')
    .replace(/\\le\b|\\leq\b/g, '≤')
    .replace(/\\ge\b|\\geq\b/g, '≥')
    .replace(/\\neq\b/g, '≠')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\times\b/g, '×')
    .replace(/\\div\b/g, '÷')
    .replace(/\\degree\b/g, '°');
  return repaired;
};

interface MermaidRendererProps {
  chart: string;
  forceLightMode?: boolean;
}

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({ chart, forceLightMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svgHtml, setSvgHtml] = useState<string>('');
  const { themeMode } = useTestStore();
  const isDark = themeMode === 'dark';

  useEffect(() => {
    let active = true;
    setError(null);

    // Determine the theme
    const useDarkTheme = isDark && !forceLightMode;

    // Initialize mermaid dynamically to make sure theme setting matches current state
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: useDarkTheme ? 'dark' : 'default',
      themeVariables: useDarkTheme ? {
        darkMode: true,
        background: 'transparent',
        primaryColor: '#1e293b',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#818cf8',
        lineColor: '#cbd5e1',
        secondaryColor: '#312e81',
        tertiaryColor: '#0f172a',
        textColor: '#f8fafc',
        mainBkg: '#1e293b',
        nodeBorder: '#818cf8',
        nodeTextColor: '#f8fafc',
        clusterBkg: '#0f172a',
        clusterBorder: '#6366f1',
        titleColor: '#f8fafc',
        edgeLabelBackground: '#1e293b',
        actorTextColor: '#f8fafc',
        signalTextColor: '#f8fafc',
        labelTextColor: '#f8fafc'
      } : {
        primaryTextColor: '#0f172a',
        lineColor: '#475569',
        textColor: '#0f172a',
        nodeBorder: '#4f46e5'
      }
    });

    const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

    const renderDiagram = async () => {
      try {
        let cleanedChart = chart.trim();

        // Handle case where code block wraps are present
        if (cleanedChart.startsWith('```mermaid')) {
          cleanedChart = cleanedChart.replace(/^```mermaid\s*\n/, '').replace(/\n```$/, '');
        } else if (cleanedChart.startsWith('```')) {
          cleanedChart = cleanedChart.replace(/^```\s*\n/, '').replace(/\n```$/, '');
        }

        // Apply auto-repair to fix common unquoted node label syntax errors
        cleanedChart = autoRepairMermaid(cleanedChart);

        const { svg } = await mermaid.render(uniqueId, cleanedChart);
        if (active) {
          setSvgHtml(svg);
        }
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        if (active) {
          setError(err.message || 'Syntax error in Mermaid diagram');
        }
      }
    };

    renderDiagram();

    return () => {
      active = false;
      // Clean up Mermaid's temporary created elements in the DOM if any
      const element = document.getElementById(uniqueId);
      if (element) {
        element.remove();
      }
      const bindElement = document.getElementById(`d${uniqueId}`);
      if (bindElement) {
        bindElement.remove();
      }
    };
  }, [chart, isDark, forceLightMode]);

  if (error) {
    return (
      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs font-mono whitespace-pre overflow-x-auto max-w-full">
        <div className="font-bold mb-1">Diagram rendering failed:</div>
        <p className="mb-2 text-xs opacity-90">{error}</p>
        <div className="mt-2 text-slate-400 border-t border-red-500/20 pt-2 font-mono text-[10px]">
          {chart}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-container flex justify-center w-full overflow-x-auto py-2"
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
};
