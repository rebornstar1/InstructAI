import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const CustomMarkdownRenderer = ({ markdown }) => {
  // Use useMemo to memoize the markdown rendering
  const renderedMarkdown = useMemo(() => {
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
            // Fix for the code component - handle all code elements specifically
            pre: ({node, ...props}) => {
              // This captures fenced code blocks ```code```
              return (
                <div className="my-4">
                  <pre
                    className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto text-sm font-mono"
                    {...props}
                  />
                </div>
              );
            },
            code: ({node, inline, className, children, ...props}) => {
              if (inline) {
                // This handles inline `code` snippets
                return (
                  <code
                    className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-sm font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
              
              // For non-inline code, return just the code element
              // The parent <pre> is handled separately
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
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
            // Completely override how paragraphs are rendered
            p: ({node, children, ...props}) => {
              // Check if any of the children are problematic HTML elements
              const childArray = React.Children.toArray(children);
              
              // If there are any pre or div elements as direct children, we need to handle specially
              const hasInvalidChildren = childArray.some(child => 
                React.isValidElement(child) && (
                  child.type === 'pre' || 
                  child.type === 'div' ||
                  (typeof child.type === 'function' && child.type.name === 'pre')
                )
              );
              
              if (hasInvalidChildren) {
                // Return each child wrapped in its own paragraph or as-is if it's a special element
                return (
                  <>
                    {childArray.map((child, i) => {
                      if (React.isValidElement(child) && (
                        child.type === 'pre' || 
                        child.type === 'div' ||
                        (typeof child.type === 'function' && child.type.name === 'pre')
                      )) {
                        // Return problematic elements as-is without wrapping
                        return <React.Fragment key={i}>{child}</React.Fragment>;
                      } else if (child) {
                        // Wrap text and other valid children in paragraphs
                        return (
                          <p key={i} className="mb-4 leading-relaxed" {...props}>
                            {child}
                          </p>
                        );
                      }
                      return null;
                    })}
                  </>
                );
              }
              
              // Regular paragraph with no problematic children
              return (
                <p className="mb-4 leading-relaxed" {...props}>
                  {children}
                </p>
              );
            }
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    );
  }, [markdown]);

  return renderedMarkdown;
};

export default CustomMarkdownRenderer;