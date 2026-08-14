import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { MermaidRenderer } from './MermaidRenderer';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  // Split by math delimiters ($ or $$) to process math equations and plain text separately
  const parts = content.split(/(\$\$?)/);
  let isMath = false;

  const processedContent = parts.map((part) => {
    // Delimiters flip the state
    if (part === '$' || part === '$$') {
      isMath = !isMath;
      return part;
    }

    if (isMath) {
      // Inside math equation: normalize double backslashes to single backslashes for KaTeX,
      // and prevent replacing LaTeX commands with unicode characters
      return part.replace(/\\\\/g, '\\');
    } else {
      // Outside math equation: apply standard markdown cleaning and text symbol replacements
      return part
        .replace(/\\newline/g, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n\n')
        .replace(/<b>|<strong>/gi, '**')
        .replace(/<\/b>|<\/strong>/gi, '**')
        .replace(/<i>|<em>/gi, '*')
        .replace(/<\/i>|<\/em>/gi, '*')
        .replace(/\\textbf{([^}]*)}/g, '**$1**')
        .replace(/\\textit{([^}]*)}/g, '*$1*')
        .replace(/\\underline{([^}]*)}/g, '<u>$1</u>')
        .replace(/\\cap\b/g, '∩')
        .replace(/\\cup\b/g, '∪')
        .replace(/\\le\b|\\leq\b/g, '≤')
        .replace(/\\ge\b|\\geq\b/g, '≥')
        .replace(/\\in\b/g, '∈')
        .replace(/\\notin\b/g, '∉')
        .replace(/\\subset\b/g, '⊂')
        .replace(/\\subseteq\b/g, '⊆')
        .replace(/\\emptyset\b/g, '∅')
        .replace(/\\approx\b/g, '≈')
        .replace(/\\neq\b/g, '≠')
        .replace(/\\times\b/g, '×')
        .replace(/\\div\b/g, '÷');
    }
  }).join('');

  return (
    <div className={`prose prose-sm md:prose-base max-w-none dark:prose-invert break-words whitespace-normal ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
            img: ({node, ...props}) => (
                <img 
                    {...props} 
                    className="max-h-96 w-auto mx-auto rounded-lg shadow-md my-4" 
                    draggable={false}
                />
            ),
            code: ({node, inline, className, children, ...props}: any) => {
                const match = /language-(\w+)/.exec(className || '');
                const lang = match ? match[1] : '';
                if (!inline && lang === 'mermaid') {
                    return <MermaidRenderer chart={String(children).replace(/\n$/, '')} />;
                }
                return <code className={className} {...props}>{children}</code>;
            }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};
