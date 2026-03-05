import { cn } from '@/lib/utils';
import { PIPELINE_MODES, type PipelineMode } from '@/lib/pipelineTypes';
import { HardDrive, Database, GitBranch, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

const iconMap: Record<string, React.ElementType> = {
  HardDrive, Database, GitBranch,
};

interface ModeSelectorProps {
  value: PipelineMode;
  onChange: (mode: PipelineMode) => void;
  warnings?: string[];
}

export function ModeSelector({ value, onChange, warnings = [] }: ModeSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
          'hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30',
          warnings.length > 0
            ? 'border-ws-warning/50 bg-ws-warning/5 text-ws-warning'
            : 'border-border/50 bg-secondary/30 text-foreground'
        )}
      >
        {(() => {
          const m = PIPELINE_MODES.find(m => m.mode === value);
          const Icon = iconMap[m?.icon || 'GitBranch'];
          return (
            <>
              <Icon className="h-3.5 w-3.5" />
              <span>{m?.label || value}</span>
              {warnings.length > 0 && <AlertTriangle className="h-3 w-3 text-ws-warning" />}
            </>
          );
        })()}
        <svg className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} viewBox="0 0 12 12" fill="none">
          <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 w-72 rounded-xl border border-border/50 bg-popover/95 backdrop-blur-md shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150">
            <div className="p-1.5 space-y-0.5">
              {PIPELINE_MODES.map(m => {
                const Icon = iconMap[m.icon] || GitBranch;
                const isActive = value === m.mode;
                return (
                  <button
                    key={m.mode}
                    onClick={() => { onChange(m.mode); setOpen(false); }}
                    className={cn(
                      'w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                      isActive
                        ? 'bg-primary/10 border border-primary/30'
                        : 'hover:bg-secondary/50 border border-transparent'
                    )}
                  >
                    <div className={cn(
                      'mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                      isActive ? 'bg-primary/20 text-primary' : 'bg-secondary/60 text-muted-foreground'
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn('text-xs font-semibold', isActive ? 'text-primary' : 'text-foreground')}>
                        {m.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                        {m.description}
                      </div>
                    </div>
                    {isActive && (
                      <div className="mt-1">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {warnings.length > 0 && (
              <div className="border-t border-border/30 px-3 py-2 bg-ws-warning/5">
                {warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px] text-ws-warning leading-snug">
                    <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
