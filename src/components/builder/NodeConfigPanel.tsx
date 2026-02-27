import { X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PipelineNode } from '@/lib/pipelineTypes';
import { useState, useEffect } from 'react';

interface NodeConfigPanelProps {
  node: PipelineNode;
  onUpdate: (node: PipelineNode) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

const colorMap: Record<string, string> = {
  source: 'var(--ws-source)',
  sink: 'var(--ws-sink)',
  sequencer: 'var(--ws-hotpath)',
  wal: 'var(--ws-wal)',
  shard: 'var(--ws-shard)',
  reactive: 'var(--ws-reactive)',
};

export function NodeConfigPanel({ node, onUpdate, onDelete, onClose }: NodeConfigPanelProps) {
  const [config, setConfig] = useState<Record<string, unknown>>({ ...node.config });
  const [label, setLabel] = useState(node.label);

  useEffect(() => {
    setConfig({ ...node.config });
    setLabel(node.label);
  }, [node.id]);

  const color = colorMap[node.type] || 'var(--ws-source)';

  const handleSave = () => {
    onUpdate({ ...node, label, config });
  };

  const handleConfigChange = (key: string, value: string) => {
    const parsed = value === 'true' ? true : value === 'false' ? false : isNaN(Number(value)) ? value : Number(value);
    setConfig(prev => ({ ...prev, [key]: parsed }));
  };

  return (
    <div className="w-72 glass-card flex flex-col animate-slide-in-right overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: `hsl(${color})` }} />
          <span className="text-sm font-semibold text-foreground">{node.type.toUpperCase()}</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-secondary/50 text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Label */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mt-1 w-full px-2 py-1.5 text-xs rounded-md border border-border/50 bg-secondary/30 text-foreground focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* Enabled toggle */}
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Enabled</label>
          <button
            onClick={() => onUpdate({ ...node, enabled: !node.enabled })}
            className={cn(
              'relative w-8 h-4 rounded-full transition-colors',
              node.enabled ? 'bg-primary' : 'bg-secondary'
            )}
          >
            <span className={cn(
              'absolute top-0.5 w-3 h-3 rounded-full bg-foreground transition-transform',
              node.enabled ? 'left-4.5 translate-x-0' : 'left-0.5'
            )} style={{ left: node.enabled ? '18px' : '2px' }} />
          </button>
        </div>

        {/* Type info */}
        {node.sourceType && (
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Source Type</label>
            <p className="text-xs text-foreground mt-0.5 font-mono">{node.sourceType}</p>
          </div>
        )}
        {node.sinkType && (
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Sink Type</label>
            <p className="text-xs text-foreground mt-0.5 font-mono">{node.sinkType}</p>
          </div>
        )}

        {/* Config fields */}
        <div className="pt-1 border-t border-border/30">
          <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Configuration</h4>
          {Object.entries(config).map(([key, value]) => (
            <div key={key} className="mb-2">
              <label className="text-[10px] text-muted-foreground font-mono">{key}</label>
              {Array.isArray(value) ? (
                <input
                  type="text"
                  value={(value as string[]).join(', ')}
                  onChange={(e) => setConfig(prev => ({ ...prev, [key]: e.target.value.split(',').map(s => s.trim()) }))}
                  className="mt-0.5 w-full px-2 py-1 text-xs rounded border border-border/50 bg-secondary/30 text-foreground font-mono focus:outline-none focus:border-primary/50"
                />
              ) : typeof value === 'boolean' ? (
                <button
                  onClick={() => setConfig(prev => ({ ...prev, [key]: !prev[key] }))}
                  className={cn('mt-0.5 text-xs px-2 py-0.5 rounded', value ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground')}
                >
                  {String(value)}
                </button>
              ) : (
                <input
                  type="text"
                  value={String(value)}
                  onChange={(e) => handleConfigChange(key, e.target.value)}
                  className="mt-0.5 w-full px-2 py-1 text-xs rounded border border-border/50 bg-secondary/30 text-foreground font-mono focus:outline-none focus:border-primary/50"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 p-3 border-t border-border/50">
        <button
          onClick={handleSave}
          className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Save
        </button>
        <button
          onClick={() => onDelete(node.id)}
          className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
