import { useMemo, useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '@/lib/utils';
import { ChevronRight, List, ChevronDown, ChevronUp } from 'lucide-react';
import { ScrollArea } from '@renderer/components/ui/scroll-area';

interface MarkdownRendererProps {
  content: string;
  filePath: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Generates a slug from heading text for anchor links
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Extracts TOC items from markdown content
 */
function extractTocItems(content: string): TocItem[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = slugify(text);
    items.push({ id, text, level });
  }

  return items;
}

/**
 * Breadcrumb navigation component for file path
 */
function Breadcrumb({ filePath }: { filePath: string }) {
  const parts = filePath.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-1 text-sm text-slate-400 mb-4 overflow-x-auto">
      {parts.map((part, index) => (
        <span key={index} className="flex items-center gap-1 whitespace-nowrap">
          {index > 0 && <ChevronRight className="w-3 h-3 text-slate-600" />}
          <span className={cn(
            index === parts.length - 1
              ? 'text-slate-200 font-medium'
              : 'hover:text-slate-300 cursor-default'
          )}>
            {part}
          </span>
        </span>
      ))}
    </nav>
  );
}

/**
 * Floating Table of Contents component
 */
function FloatingToc({
  items,
  activeId,
  isExpanded,
  onToggle,
  onItemClick
}: {
  items: TocItem[];
  activeId: string;
  isExpanded: boolean;
  onToggle: () => void;
  onItemClick: (id: string) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-6 top-24 z-50">
      <div className="bg-slate-900/95 border border-slate-700 rounded-lg shadow-xl backdrop-blur-sm max-w-xs">
        {/* TOC Header */}
        <button
          onClick={onToggle}
          className="flex items-center justify-between gap-2 w-full px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800/50 rounded-t-lg transition-colors"
        >
          <span className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Contents
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* TOC Items */}
        {isExpanded && (
          <ScrollArea className="max-h-80">
            <ul className="px-2 pb-2 space-y-0.5">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onItemClick(item.id)}
                    className={cn(
                      'w-full text-left text-sm py-1.5 px-2 rounded transition-colors truncate',
                      item.level === 1 && 'pl-2',
                      item.level === 2 && 'pl-4',
                      item.level === 3 && 'pl-6',
                      activeId === item.id
                        ? 'bg-blue-900/50 text-blue-300'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    )}
                    title={item.text}
                  >
                    {item.text}
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

/**
 * MarkdownRenderer component
 *
 * Renders markdown content with:
 * - GitHub Flavored Markdown support (tables, strikethrough, etc.)
 * - Code syntax highlighting
 * - Floating table of contents for h1-h3 headings
 * - Breadcrumb navigation for file path
 * - Dark mode styling
 */
export function MarkdownRenderer({ content, filePath }: MarkdownRendererProps) {
  const [activeHeading, setActiveHeading] = useState<string>('');
  const [tocExpanded, setTocExpanded] = useState(true);

  // Extract TOC items from content
  const tocItems = useMemo(() => extractTocItems(content), [content]);

  // Show TOC only for documents with multiple headings
  const showToc = tocItems.length >= 2;

  // Track active heading on scroll
  useEffect(() => {
    if (!showToc) return;

    const handleScroll = () => {
      const headings = tocItems.map((item) => ({
        id: item.id,
        element: document.getElementById(item.id),
      }));

      // Find the heading that's currently in view
      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i];
        if (heading.element) {
          const rect = heading.element.getBoundingClientRect();
          if (rect.top <= 100) {
            setActiveHeading(heading.id);
            return;
          }
        }
      }

      // Default to first heading if none in view
      if (headings.length > 0 && headings[0].element) {
        setActiveHeading(headings[0].id);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [tocItems, showToc]);

  // Scroll to heading when TOC item is clicked
  const handleTocClick = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveHeading(id);
    }
  }, []);

  // Custom components for react-markdown
  const components = useMemo(() => ({
    // Add IDs to headings for anchor links
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
      const text = String(children);
      const id = slugify(text);
      return (
        <h1
          id={id}
          className="text-3xl font-bold text-slate-100 mt-8 mb-4 pb-2 border-b border-slate-700 scroll-mt-4"
          {...props}
        >
          {children}
        </h1>
      );
    },
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
      const text = String(children);
      const id = slugify(text);
      return (
        <h2
          id={id}
          className="text-2xl font-semibold text-slate-100 mt-6 mb-3 scroll-mt-4"
          {...props}
        >
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
      const text = String(children);
      const id = slugify(text);
      return (
        <h3
          id={id}
          className="text-xl font-semibold text-slate-200 mt-5 mb-2 scroll-mt-4"
          {...props}
        >
          {children}
        </h3>
      );
    },
    h4: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h4 className="text-lg font-medium text-slate-200 mt-4 mb-2" {...props}>
        {children}
      </h4>
    ),
    h5: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h5 className="text-base font-medium text-slate-300 mt-3 mb-1" {...props}>
        {children}
      </h5>
    ),
    h6: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h6 className="text-sm font-medium text-slate-300 mt-3 mb-1" {...props}>
        {children}
      </h6>
    ),
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className="text-slate-300 leading-relaxed mb-4" {...props}>
        {children}
      </p>
    ),
    a: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a
        href={href}
        className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
      </a>
    ),
    ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className="list-disc list-inside text-slate-300 mb-4 space-y-1 ml-2" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className="list-decimal list-inside text-slate-300 mb-4 space-y-1 ml-2" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
      <li className="text-slate-300" {...props}>
        {children}
      </li>
    ),
    blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
      <blockquote
        className="border-l-4 border-slate-600 pl-4 py-1 my-4 text-slate-400 italic bg-slate-800/30 rounded-r"
        {...props}
      >
        {children}
      </blockquote>
    ),
    code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) => {
      const isInline = !className?.includes('language-');
      if (isInline) {
        return (
          <code
            className="bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono"
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <code className={cn(className, 'text-sm')} {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
      <pre
        className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto mb-4 text-sm"
        {...props}
      >
        {children}
      </pre>
    ),
    table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full border-collapse border border-slate-700 rounded-lg" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
      <thead className="bg-slate-800" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
      <tbody className="divide-y divide-slate-700" {...props}>
        {children}
      </tbody>
    ),
    tr: ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
      <tr className="hover:bg-slate-800/50 transition-colors" {...props}>
        {children}
      </tr>
    ),
    th: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
      <th className="px-4 py-2 text-left text-sm font-semibold text-slate-200 border-b border-slate-700" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
      <td className="px-4 py-2 text-sm text-slate-300" {...props}>
        {children}
      </td>
    ),
    hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
      <hr className="border-slate-700 my-6" {...props} />
    ),
    img: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
      <img
        src={src}
        alt={alt}
        className="max-w-full h-auto rounded-lg my-4 border border-slate-700"
        {...props}
      />
    ),
    // GFM specific elements
    del: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <del className="text-slate-500 line-through" {...props}>
        {children}
      </del>
    ),
    input: ({ type, checked, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
      if (type === 'checkbox') {
        return (
          <input
            type="checkbox"
            checked={checked}
            disabled
            className="mr-2 accent-blue-500"
            {...props}
          />
        );
      }
      return <input type={type} {...props} />;
    },
  }), []);

  return (
    <div className="relative">
      {/* Breadcrumb navigation */}
      <Breadcrumb filePath={filePath} />

      {/* Floating TOC */}
      {showToc && (
        <FloatingToc
          items={tocItems}
          activeId={activeHeading}
          isExpanded={tocExpanded}
          onToggle={() => setTocExpanded(!tocExpanded)}
          onItemClick={handleTocClick}
        />
      )}

      {/* Markdown content */}
      <article className={cn(
        'prose prose-invert max-w-none',
        showToc && 'pr-72' // Add padding for TOC
      )}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}

export default MarkdownRenderer;
