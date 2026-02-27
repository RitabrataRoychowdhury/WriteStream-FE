import { Globe, Radio, Database, Zap, HardDrive, Layers, Eye } from 'lucide-react';
import { SOURCE_CONNECTORS, SINK_CONNECTORS, CORE_CONNECTORS, type ConnectorTemplate } from '@/lib/pipelineTypes';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  Globe, Radio, Database, Zap, HardDrive, Layers, Eye,
};

interface ConnectorPaletteProps {
  onDragStart: (template: ConnectorTemplate) => void;
  collapsed?: boolean;
}

export function ConnectorPalette({ onDragStart, collapsed }: ConnectorPaletteProps) {
  const Section = ({ title, items, colorVar }: { title: string; items: ConnectorTemplate[]; colorVar: string }) => (
    <div className="mb-4">
      <h3 className="text-[10px] uppercase tracking-wider font-semibold mb-2 px-1" style={{ color: `hsl(${colorVar})` }}>
        {title}
      </h3>
      <div className="space-y-1">
        {items.map(t => {
          const Icon = iconMap[t.icon] || Database;
          return (
            <div
              key={`${t.type}-${t.subType}`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/connector', JSON.stringify(t));
                onDragStart(t);
              }}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-grab active:cursor-grabbing',
                'border border-transparent hover:border-border/50 hover:bg-secondary/30',
                'transition-all duration-150 text-xs text-muted-foreground hover:text-foreground',
                'select-none'
              )}
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                style={{ background: `hsl(${colorVar} / 0.15)` }}
              >
                <Icon className="w-3 h-3" style={{ color: `hsl(${colorVar})` }} />
              </div>
              {!collapsed && <span className="truncate">{t.label}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={cn('flex flex-col h-full overflow-y-auto py-3', collapsed ? 'px-1' : 'px-2')}>
      {!collapsed && (
        <h2 className="text-xs font-semibold text-foreground mb-3 px-1">Connectors</h2>
      )}
      <Section title="Sources" items={SOURCE_CONNECTORS} colorVar="var(--ws-source)" />
      <Section title="Sinks" items={SINK_CONNECTORS} colorVar="var(--ws-sink)" />
      <Section title="Core" items={CORE_CONNECTORS} colorVar="var(--ws-hotpath)" />
    </div>
  );
}
