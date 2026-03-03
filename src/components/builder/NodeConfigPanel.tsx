import { X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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

const descriptions: Record<string, string> = {
  source: 'Ingests data into the pipeline',
  sink: 'Writes processed data to target',
  sequencer: 'Orders events in the hot path',
  wal: 'Durable write-ahead log storage',
  shard: 'Parallel processing partition',
  reactive: 'Materialized views engine',
};

export function NodeConfigPanel({ node, onUpdate, onDelete, onClose }: NodeConfigPanelProps) {
  const [config, setConfig] = useState<Record<string, unknown>>({ ...node.config });
  const [label, setLabel] = useState(node.label);
  const [configOpen, setConfigOpen] = useState(true);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setConfig({ ...node.config });
    setLabel(node.label);
    setDirty(false);
  }, [node.id]);

  const color = colorMap[node.type] || 'var(--ws-source)';

  const handleSave = () => {
    onUpdate({ ...node, label, config });
    setDirty(false);
  };

  const handleConfigChange = (key: string, value: string) => {
    const parsed = value === 'true' ? true : value === 'false' ? false : isNaN(Number(value)) ? value : Number(value);
    setConfig(prev => ({ ...prev, [key]: parsed }));
    setDirty(true);
  };

  const handleLabelChange = (val: string) => {
    setLabel(val);
    setDirty(true);
  };

  return (
    <div className="w-80 border-l border-border/50 bg-card/50 backdrop-blur-sm flex flex-col animate-slide-in-right overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50" style={{ borderLeftColor: `hsl(${color})`, borderLeftWidth: 3 }}>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: `hsl(${color})` }} />
            <span className="text-xs font-semibold text-foreground">{node.type.toUpperCase()}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">{descriptions[node.type] || 'Pipeline component'}</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Label */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block mb-1">Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border/50 bg-secondary/20 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Enabled toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/30">
          <div>
            <label className="text-xs font-medium text-foreground block">Enabled</label>
            <span className="text-[10px] text-muted-foreground">{node.enabled ? 'Component is active' : 'Component is disabled'}</span>
          </div>
          <button
            onClick={() => onUpdate({ ...node, enabled: !node.enabled })}
            className={cn(
              'relative w-10 h-5 rounded-full transition-colors duration-200',
              node.enabled ? 'bg-ws-success' : 'bg-secondary'
            )}
          >
            <span className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform duration-200',
            )} style={{ left: node.enabled ? '22px' : '2px' }} />
          </button>
        </div>

        {/* Type info */}
        {(node.sourceType || node.sinkType) && (
          <div className="p-3 rounded-lg border border-border/30" style={{ background: `hsl(${color} / 0.05)` }}>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {node.sourceType ? 'Source Type' : 'Sink Type'}
            </label>
            <p className="text-sm text-foreground mt-0.5 font-mono" style={{ color: `hsl(${color})` }}>
              {node.sourceType || node.sinkType}
            </p>
          </div>
        )}

        {/* Config fields */}
        <div className="border border-border/30 rounded-lg overflow-hidden">
          <button
            onClick={() => setConfigOpen(!configOpen)}
            className="flex items-center justify-between w-full px-3 py-2.5 text-xs font-medium text-foreground bg-secondary/20 hover:bg-secondary/30 transition-colors"
          >
            <span>Configuration ({Object.keys(config).length})</span>
            {configOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {configOpen && (
            <div className="p-3 space-y-3">
              {Object.entries(config).map(([key, value]) => (
                <div key={key}>
                  <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide block mb-1">{key}</label>
                  {Array.isArray(value) ? (
                    <input
                      type="text"
                      value={(value as string[]).join(', ')}
                      onChange={(e) => { setConfig(prev => ({ ...prev, [key]: e.target.value.split(',').map(s => s.trim()) })); setDirty(true); }}
                      className="w-full px-2.5 py-1.5 text-xs rounded-md border border-border/50 bg-secondary/20 text-foreground font-mono focus:outline-none focus:border-primary/50 transition-all"
                    />
                  ) : typeof value === 'boolean' ? (
                    <button
                      onClick={() => { setConfig(prev => ({ ...prev, [key]: !prev[key] })); setDirty(true); }}
                      className={cn('text-xs px-3 py-1.5 rounded-md font-medium transition-colors', value ? 'bg-ws-success/15 text-ws-success border border-ws-success/30' : 'bg-secondary text-muted-foreground border border-border/50')}
                    >
                      {String(value)}
                    </button>
                  ) : (
                    <input
                      type="text"
                      value={String(value)}
                      onChange={(e) => handleConfigChange(key, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-md border border-border/50 bg-secondary/20 text-foreground font-mono focus:outline-none focus:border-primary/50 transition-all"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Node ID (read-only) */}
        <div className="p-3 rounded-lg bg-secondary/10 border border-border/20">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Node ID</label>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-mono select-all">{node.id}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 p-3 border-t border-border/50">
        <button
          onClick={handleSave}
          disabled={!dirty}
          className={cn(
            'flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all',
            dirty
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
              : 'bg-secondary text-muted-foreground cursor-not-allowed'
          )}
        >
          {dirty ? 'Save Changes' : 'No Changes'}
        </button>
        <button
          onClick={() => onDelete(node.id)}
          className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
          title="Delete node"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
