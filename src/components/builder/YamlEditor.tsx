import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';

interface YamlEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  readOnly?: boolean;
}

export function YamlEditor({ value, onChange, error, readOnly }: YamlEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineCountRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const lines = value.split('\n');

  const handleScroll = () => {
    if (textareaRef.current && lineCountRef.current) {
      lineCountRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTab = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newVal);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 2; }, 0);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/30">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">YAML</span>
        <button onClick={handleCopy} className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <Check className="h-3 w-3 text-ws-success" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>

      {/* Editor */}
      <div className={cn('flex-1 flex overflow-hidden font-mono text-xs', error && 'border-l-2 border-destructive')}>
        {/* Line numbers */}
        <div
          ref={lineCountRef}
          className="w-10 shrink-0 overflow-hidden text-right pr-2 py-2 text-muted-foreground/50 select-none bg-secondary/20 leading-[1.6]"
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleTab}
          readOnly={readOnly}
          spellCheck={false}
          className={cn(
            'flex-1 resize-none bg-transparent py-2 px-3 text-foreground focus:outline-none leading-[1.6]',
            'caret-primary selection:bg-primary/20',
            readOnly && 'opacity-60 cursor-default'
          )}
          style={{ tabSize: 2 }}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-1.5 text-[10px] text-destructive bg-destructive/5 border-t border-destructive/20">
          {error}
        </div>
      )}
    </div>
  );
}
