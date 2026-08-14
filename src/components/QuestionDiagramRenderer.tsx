import React from 'react';
import { MermaidRenderer } from './MermaidRenderer';
import { DrawingCanvas } from './DrawingCanvas';

interface QuestionDiagramRendererProps {
  diagram: string;
  forceLightMode?: boolean;
}

export const QuestionDiagramRenderer: React.FC<QuestionDiagramRendererProps> = ({ diagram, forceLightMode }) => {
  const trimmed = diagram.trim();

  // 1. Check if it's a data URL, base64 image, or standard HTTP image URL
  const isImage = trimmed.startsWith('data:image/') || 
                  trimmed.startsWith('http://') || 
                  trimmed.startsWith('https://');

  if (isImage) {
    return (
      <div className="print-q-diagram flex justify-center w-full my-2">
        <img
          src={trimmed}
          alt="Question Diagram (Freeform)"
          className="max-h-96 w-auto object-contain rounded-lg shadow-sm print:shadow-none"
        />
      </div>
    );
  }

  // 2. Check if it's raw SVG markup
  const isSvg = trimmed.startsWith('<svg') || (trimmed.startsWith('<?xml') && trimmed.includes('<svg')) || trimmed.endsWith('</svg>');

  if (isSvg) {
    return (
      <div className="print-q-diagram svg-diagram-container flex justify-center items-center w-full my-3 max-w-2xl mx-auto rounded-xl p-3 bg-slate-900/30 border border-white/10 print:border-none print:bg-transparent">
        <div 
          className="w-full flex justify-center items-center overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: trimmed }} 
        />
      </div>
    );
  }

  // 2. Check if it's a Fabric.js canvas JSON state
  const isFabricJson = () => {
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return !!(parsed.objects || parsed.state || parsed.backgroundImage);
      } catch {
        return false;
      }
    }
    return false;
  };

  if (isFabricJson()) {
    return (
      <div className="print-q-diagram flex justify-center w-full my-2 max-w-3xl border border-slate-200/10 rounded-xl overflow-hidden print:border-black">
        <div className="w-full relative" style={{ height: '400px' }}>
          <DrawingCanvas
            value={trimmed}
            onChange={() => {}}
            readOnly={true}
          />
        </div>
      </div>
    );
  }

  // 3. Default to Mermaid.js renderer for block diagrams / scripts
  return (
    <div className="print-q-diagram">
      <MermaidRenderer chart={trimmed} forceLightMode={forceLightMode} />
    </div>
  );
};
export default QuestionDiagramRenderer;
