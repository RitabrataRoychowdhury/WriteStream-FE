import { Globe, Radio, Database, Zap, HardDrive, Layers, Eye, Search } from 'lucide-react';
import { SOURCE_CONNECTORS, SINK_CONNECTORS, CORE_CONNECTORS, type ConnectorTemplate } from '@/lib/pipelineTypes';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const iconMap: Record<string, React.ElementType> = {
  Globe, Radio, Database, Zap, HardDrive, Layers, Eye,
};

interface ConnectorPaletteProps {
  onDragStart: (template: ConnectorTemplate) => void;
  collapsed?: boolean;
}

export function ConnectorPalette({ onDragStart, collapsed }: ConnectorPaletteProps) {
  const [search, setSearch] = useState('');
  const filter = (items: ConnectorTemplate[]) =>
    search ? items.filter(t => t.label.toLowerCase().includes(search.toLowerCase())) : items;

  const Section = ({ title, items, colorVar }: { title: string; items: ConnectorTemplate[]; colorVar: string }) => {
    const filtered = filter(items);
    if (filtered.length === 0) return null;
    return (
      <div className="mb-3">
        {!collapsed && (
          <h3 className="text-[9px] uppercase tracking-widest font-semibold mb-1.5 px-1" style={{ color: `hsl(${colorVar})` }}>
            {title}
          </h3>
        )}
        <div className="space-y-0.5">
          {filtered.map(t => {
            const Icon = iconMap[t.icon] || Database;
            return (
              <div
                key={`${t.type}-${t.subType}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/connector', JSON.stringify(t));
                  e.dataTransfer.effectAllowed = 'copy';
                  onDragStart(t);
                }}
                className={cn(
                  'flex items-center gap-2 px-2 py-2 rounded-lg cursor-grab active:cursor-grabbing',
                  'border border-transparent hover:border-border/50 hover:bg-secondary/40',
                  'transition-all duration-150 text-xs text-muted-foreground hover:text-foreground',
                  'select-none group active:scale-95'
                )}
                title={t.label}
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                  style={{ background: `hsl(${colorVar} / 0.12)` }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: `hsl(${colorVar})` }} />
                </div>
                {!collapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-xs font-medium">{t.label}</span>
                    <span className="truncate text-[9px] text-muted-foreground/60">{t.subType}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col h-full overflow-y-auto py-2', collapsed ? 'px-1' : 'px-2')}>
      {!collapsed && (
        <>
          <h2 className="text-xs font-semibold text-foreground mb-2 px-1">Components</h2>
          <div className="relative mb-3 px-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-[11px] rounded-md border border-border/50 bg-secondary/30 text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/50"
            />
          </div>
        </>
      )}
      <Section title="Sources" items={SOURCE_CONNECTORS} colorVar="var(--ws-source)" />
      <Section title="Sinks" items={SINK_CONNECTORS} colorVar="var(--ws-sink)" />
      <Section title="Core" items={CORE_CONNECTORS} colorVar="var(--ws-hotpath)" />
    </div>
  );
}
