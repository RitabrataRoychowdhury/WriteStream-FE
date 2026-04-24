import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import {
  GitBranch, LayoutDashboard, Hammer, Search, Database,
  ArrowDownToLine, Eye, ScrollText, Settings, BarChart3,
  Play, RotateCcw, Download, Upload, Sun, Moon, Zap,
  Server, Radio, FileCode, BellRing, AlertTriangle, ExternalLink,
} from 'lucide-react';

const pages = [
  { label: 'Pipeline', path: '/', icon: GitBranch, keywords: ['pipeline', 'dag', 'flow', 'overview'] },
  { label: 'Builder', path: '/builder', icon: Hammer, keywords: ['builder', 'create', 'design', 'yaml', 'visual'] },
  { label: 'Query', path: '/query', icon: Search, keywords: ['query', 'sql', 'search', 'data'] },
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, keywords: ['dashboard', 'metrics', 'stats', 'monitor'] },
  { label: 'Sources', path: '/sources', icon: Radio, keywords: ['sources', 'http', 'kafka', 'cdc', 'input'] },
  { label: 'Sinks', path: '/sinks', icon: ArrowDownToLine, keywords: ['sinks', 'output', 'postgresql', 'clickhouse', 'mysql'] },
  { label: 'Reactive Views', path: '/views', icon: Eye, keywords: ['views', 'reactive', 'materialized'] },
  { label: 'Grafana Dashboards', path: '/grafana', icon: BarChart3, keywords: ['grafana', 'dashboards', 'observability', 'metrics', 'visualize'] },
  { label: 'Alerts', path: '/alerts', icon: BellRing, keywords: ['alerts', 'notifications', 'incidents', 'pages', 'firing', 'silenced'] },
  { label: 'Logs', path: '/logs', icon: ScrollText, keywords: ['logs', 'events', 'debug', 'errors'] },
  { label: 'Operations', path: '/operations', icon: Settings, keywords: ['operations', 'ops', 'health', 'system'] },
  { label: 'Benchmarks', path: '/benchmarks', icon: BarChart3, keywords: ['benchmarks', 'performance', 'speed', 'test'] },
];

const pipelineNodes = [
  { label: 'HTTP Source', group: 'source', icon: Server, keywords: ['http', 'api', 'rest', 'webhook'] },
  { label: 'Kafka Source', group: 'source', icon: Zap, keywords: ['kafka', 'stream', 'topic', 'consumer'] },
  { label: 'CDC MySQL', group: 'source', icon: Database, keywords: ['cdc', 'mysql', 'binlog', 'replication'] },
  { label: 'CDC PostgreSQL', group: 'source', icon: Database, keywords: ['cdc', 'postgres', 'wal', 'replication'] },
  { label: 'PostgreSQL Sink', group: 'sink', icon: Database, keywords: ['postgresql', 'postgres', 'database'] },
  { label: 'ClickHouse Sink', group: 'sink', icon: Database, keywords: ['clickhouse', 'analytics', 'olap'] },
  { label: 'MySQL Sink', group: 'sink', icon: Database, keywords: ['mysql', 'database'] },
  { label: 'Kafka Sink', group: 'sink', icon: Zap, keywords: ['kafka', 'producer', 'topic'] },
];

interface CommandPaletteProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function CommandPalette({ theme, onToggleTheme }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const quickActions = useMemo(() => [
    { label: 'Deploy Pipeline', icon: Play, action: () => navigate('/builder'), keywords: ['deploy', 'run', 'start'] },
    { label: 'Reset Pipeline', icon: RotateCcw, action: () => navigate('/builder'), keywords: ['reset', 'clear'] },
    { label: 'Export YAML', icon: Download, action: () => navigate('/builder'), keywords: ['export', 'yaml', 'download'] },
    { label: 'Import YAML', icon: Upload, action: () => navigate('/builder'), keywords: ['import', 'yaml', 'upload'] },
    { label: 'Open Grafana Workspace', icon: BarChart3, action: () => navigate('/grafana'), keywords: ['grafana', 'open', 'dashboards'] },
    { label: 'View Firing Alerts', icon: AlertTriangle, action: () => navigate('/alerts'), keywords: ['alerts', 'firing', 'critical', 'incidents'] },
    { label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`, icon: theme === 'dark' ? Sun : Moon, action: () => { onToggleTheme(); setOpen(false); }, keywords: ['theme', 'dark', 'light', 'mode', 'toggle'] },
  ], [theme, onToggleTheme, navigate]);

  const runAction = useCallback((cb: () => void) => {
    setOpen(false);
    cb();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, nodes, actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Pages">
          {pages.map(p => (
            <CommandItem
              key={p.path}
              value={[p.label, ...p.keywords].join(' ')}
              onSelect={() => runAction(() => navigate(p.path))}
            >
              <p.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{p.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Pipeline Nodes">
          {pipelineNodes.map(n => (
            <CommandItem
              key={n.label}
              value={[n.label, ...n.keywords].join(' ')}
              onSelect={() => runAction(() => navigate('/builder'))}
            >
              <n.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{n.label}</span>
              <span className="ml-auto text-[10px] text-muted-foreground capitalize">{n.group}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          {quickActions.map(a => (
            <CommandItem
              key={a.label}
              value={[a.label, ...a.keywords].join(' ')}
              onSelect={() => runAction(a.action)}
            >
              <a.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{a.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
