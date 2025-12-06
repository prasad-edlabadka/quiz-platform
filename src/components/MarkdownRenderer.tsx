import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  return (
    <div className={`prose prose-sm md:prose-base max-w-none dark:prose-invert break-words whitespace-normal ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
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
        {content}
      </ReactMarkdown>
    </div>
  );
};
