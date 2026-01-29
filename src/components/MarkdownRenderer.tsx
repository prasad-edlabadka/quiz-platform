import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  return (
    <div className={`prose prose-sm md:prose-base max-w-none dark:prose-invert break-words whitespace-normal ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
            img: ({node, ...props}) => (
                <img 
                    {...props} 
                    className="max-h-96 w-auto mx-auto rounded-lg shadow-md my-4" 
                    draggable={false}
                />
            )
        }}
      >
        {content
            .replace(/\\newline/g, '\n\n')
            .replace(/<br\s*\/?>/gi, '\n\n')
            .replace(/<b>|<strong>/gi, '**')
            .replace(/<\/b>|<\/strong>/gi, '**')
            .replace(/<i>|<em>/gi, '*')
            .replace(/<\/i>|<\/em>/gi, '*')
            .replace(/\\textbf{([^}]*)}/g, '**$1**')
            .replace(/\\textit{([^}]*)}/g, '*$1*')
            .replace(/\\underline{([^}]*)}/g, '<u>$1</u>')
            // Common Math Symbols (Auto-replace if not inside $)
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
            .replace(/\\div\b/g, '÷')
        }
      </ReactMarkdown>
    </div>
  );
};
