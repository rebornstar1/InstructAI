import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const CustomMarkdownRenderer = ({ markdown }) => {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({node, ...props}) => (
            <h1 
              className="text-3xl font-bold mb-4 pb-2 border-b-2 border-primary/20" 
              {...props} 
            />
          ),
          h2: ({node, ...props}) => (
            <h2 
              className="text-2xl font-semibold mt-6 mb-4 pb-2 border-b border-primary/10" 
              {...props} 
            />
          ),
          h3: ({node, ...props}) => (
            <h3 
              className="text-xl font-semibold mt-4 mb-3" 
              {...props} 
            />
          ),
          a: ({node, ...props}) => (
            <a 
              className="text-primary hover:underline" 
              target="_blank" 
              rel="noopener noreferrer" 
              {...props} 
            />
          ),
          table: ({node, ...props}) => (
            <div className="overflow-x-auto my-6">
              <table 
                className="w-full border-collapse border border-slate-300 dark:border-slate-700" 
                {...props} 
              />
            </div>
          ),
          th: ({node, ...props}) => (
            <th 
              className="border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 text-left font-semibold" 
              {...props} 
            />
          ),
          td: ({node, ...props}) => (
            <td 
              className="border border-slate-300 dark:border-slate-700 p-2" 
              {...props} 
            />
          ),
          code: ({node, inline, ...props}) => (
            inline ? (
              <code 
                className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-sm font-mono" 
                {...props} 
              />
            ) : (
              <pre 
                className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto text-sm font-mono my-4" 
              >
                <code {...props} />
              </pre>
            )
          ),
          blockquote: ({node, ...props}) => (
            <blockquote 
              className="border-l-4 border-primary pl-4 py-2 my-4 bg-slate-50 dark:bg-slate-800/50 italic" 
              {...props} 
            />
          ),
          ul: ({node, ...props}) => (
            <ul 
              className="list-disc pl-6 my-4 space-y-2" 
              {...props} 
            />
          ),
          ol: ({node, ...props}) => (
            <ol 
              className="list-decimal pl-6 my-4 space-y-2" 
              {...props} 
            />
          ),
          p: ({node, ...props}) => (
            <p 
              className="mb-4 leading-relaxed" 
              {...props} 
            />
          )
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};

export default CustomMarkdownRenderer;
