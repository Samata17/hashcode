import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';

// Only load the languages we need (keeps the website fast).
// To support another language, import it above and register it here.
const LANGUAGES = {
  javascript, js: javascript, jsx, typescript, ts: typescript, tsx,
  bash, sh: bash, shell: bash, css, json, html: markup, xml: markup,
  python, py: python, java, sql, yaml, yml: yaml, markdown, md: markdown,
};
Object.entries(LANGUAGES).forEach(([name, lang]) => SyntaxHighlighter.registerLanguage(name, lang));

// A code block with syntax colors, a language label, and a "Copy" button.
function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard not available (e.g. insecure context) - ignore
    }
  }

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span>{language || 'code'}</span>
        <button type="button" onClick={copy}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: '0 0 10px 10px', fontSize: '0.9rem' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// Turns Markdown text into nicely styled HTML.
// Safe by default: react-markdown does NOT run raw HTML or scripts written in a post.
export default function MarkdownRenderer({ content }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]} // tables, ~~strikethrough~~, task lists, auto-links
        components={{
          // Code blocks: let CodeBlock draw its own wrapper instead of a plain <pre>.
          pre: ({ children }) => <>{children}</>,
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className || '');
            const text = String(children).replace(/\n$/, '');
            const isBlock = match || text.includes('\n');
            if (isBlock) return <CodeBlock language={match?.[1]} code={text} />;
            return <code className="inline-code">{children}</code>;
          },
          // Links to other sites open in a new tab.
          a: ({ href, children }) => {
            const external = /^https?:\/\//.test(href || '');
            return (
              <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {children}
              </a>
            );
          },
          // Wide tables scroll sideways on small screens.
          table: ({ children }) => (
            <div className="table-wrap">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
