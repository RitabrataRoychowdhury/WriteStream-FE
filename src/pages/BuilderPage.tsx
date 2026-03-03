import { useState, useCallback, useMemo } from 'react';
import { ConnectorPalette } from '@/components/builder/ConnectorPalette';
import { DagCanvas } from '@/components/builder/DagCanvas';
import { NodeConfigPanel } from '@/components/builder/NodeConfigPanel';
import { YamlEditor } from '@/components/builder/YamlEditor';
import { cn } from '@/lib/utils';
import { createDefaultPipeline, pipelineToYaml, yamlToPipeline, type PipelineConfig, type PipelineNode, type ConnectorTemplate } from '@/lib/pipelineTypes';
import { Code, GitBranch, ChevronLeft, ChevronRight, Download, Upload, RotateCcw, Play, Save } from 'lucide-react';

type ViewMode = 'visual' | 'yaml' | 'split';

export default function BuilderPage() {
  const [pipeline, setPipeline] = useState<PipelineConfig>(createDefaultPipeline);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('visual');
  const [yamlText, setYamlText] = useState(() => pipelineToYaml(createDefaultPipeline()));
  const [yamlError, setYamlError] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [pipelineMode, setPipelineMode] = useState(pipeline.mode);

  const selectedNode = useMemo(() => pipeline.nodes.find(n => n.id === selectedNodeId) || null, [pipeline.nodes, selectedNodeId]);

  const syncYaml = useCallback((p: PipelineConfig) => {
    setYamlText(pipelineToYaml(p));
    setYamlError(null);
  }, []);

  const handleYamlChange = useCallback((text: string) => {
    setYamlText(text);
    const result = yamlToPipeline(text);
    if ('error' in result) {
      setYamlError(result.error);
    } else {
      setYamlError(null);
      setPipeline(result);
      setPipelineMode(result.mode);
    }
  }, []);

  const updatePipeline = useCallback((updater: (p: PipelineConfig) => PipelineConfig) => {
    setPipeline(prev => {
      const next = updater(prev);
      syncYaml(next);
      return next;
    });
  }, [syncYaml]);

  const handleMoveNode = useCallback((id: string, x: number, y: number) => {
    updatePipeline(p => ({
      ...p,
      nodes: p.nodes.map(n => n.id === id ? { ...n, x: Math.round(x), y: Math.round(y) } : n),
    }));
  }, [updatePipeline]);

  const handleDropConnector = useCallback((template: ConnectorTemplate, x: number, y: number) => {
    const id = `${template.subType}_${Date.now().toString(36)}`;
    const newNode: PipelineNode = {
      id,
      type: template.type,
      label: template.label,
      x: Math.round(x),
      y: Math.round(y),
      config: { ...template.defaultConfig },
      sourceType: template.type === 'source' ? template.subType as any : undefined,
      sinkType: template.type === 'sink' ? template.subType as any : undefined,
      enabled: true,
    };
    updatePipeline(p => ({ ...p, nodes: [...p.nodes, newNode] }));
    setSelectedNodeId(id);
  }, [updatePipeline]);

  const handleUpdateNode = useCallback((node: PipelineNode) => {
    updatePipeline(p => ({
      ...p,
      nodes: p.nodes.map(n => n.id === node.id ? node : n),
    }));
  }, [updatePipeline]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    updatePipeline(p => ({
      ...p,
      nodes: p.nodes.filter(n => n.id !== nodeId),
      edges: p.edges.filter(e => e.from !== nodeId && e.to !== nodeId),
    }));
    setSelectedNodeId(null);
  }, [updatePipeline]);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    updatePipeline(p => ({
      ...p,
      edges: p.edges.filter(e => e.id !== edgeId),
    }));
  }, [updatePipeline]);

  const handleStartConnect = useCallback((nodeId: string) => setConnectingFrom(nodeId), []);

  const handleEndConnect = useCallback((targetId: string) => {
    if (connectingFrom && connectingFrom !== targetId) {
      const edgeExists = pipeline.edges.some(e => e.from === connectingFrom && e.to === targetId);
      if (!edgeExists) {
        updatePipeline(p => ({
          ...p,
          edges: [...p.edges, { id: `e_${connectingFrom}_${targetId}`, from: connectingFrom!, to: targetId }],
        }));
      }
    }
    setConnectingFrom(null);
  }, [connectingFrom, pipeline.edges, updatePipeline]);

  const handleCancelConnect = useCallback(() => setConnectingFrom(null), []);

  const handleModeChange = useCallback((mode: string) => {
    const m = mode as PipelineConfig['mode'];
    setPipelineMode(m);
    updatePipeline(p => ({ ...p, mode: m }));
  }, [updatePipeline]);

  const handleExportYaml = useCallback(() => {
    const blob = new Blob([yamlText], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pipeline.name.replace(/\s+/g, '_').toLowerCase()}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  }, [yamlText, pipeline.name]);

  const handleImportYaml = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.yaml,.yml';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => handleYamlChange(reader.result as string);
      reader.readAsText(file);
    };
    input.click();
  }, [handleYamlChange]);

  const handleReset = useCallback(() => {
    const def = createDefaultPipeline();
    setPipeline(def);
    setYamlText(pipelineToYaml(def));
    setYamlError(null);
    setSelectedNodeId(null);
    setPipelineMode(def.mode);
  }, []);

  return (
    <div className="h-full flex flex-col gap-0 -m-4 md:-m-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-foreground hidden md:block">Pipeline Builder</h1>
          <div className="h-4 w-px bg-border/50 hidden md:block" />
          <select
            value={pipelineMode}
            onChange={(e) => handleModeChange(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-border/50 bg-secondary/30 text-foreground focus:outline-none focus:border-primary/50"
          >
            <option value="pure_wal">Pure WAL</option>
            <option value="internal_sink">Internal Sink</option>
            <option value="multi_sink">Multi-Sink</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border/50 overflow-hidden mr-2">
            {(['visual', 'split', 'yaml'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                  viewMode === mode ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30',
                  mode !== 'visual' && 'border-l border-border/50'
                )}
              >
                {mode === 'visual' ? <GitBranch className="h-3.5 w-3.5" /> : mode === 'yaml' ? <Code className="h-3.5 w-3.5" /> : 'Split'}
              </button>
            ))}
          </div>

          <button onClick={handleImportYaml} className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors" title="Import YAML">
            <Upload className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleExportYaml} className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors" title="Export YAML">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleReset} className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors" title="Reset">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <div className="h-4 w-px bg-border/50 mx-1" />
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
            <Play className="h-3 w-3" /> Deploy
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Connector palette */}
        <div className={cn(
          'shrink-0 border-r border-border/30 bg-card/20 transition-all duration-200 relative',
          paletteOpen ? 'w-48' : 'w-11'
        )}>
          <ConnectorPalette onDragStart={() => {}} collapsed={!paletteOpen} />
          <button
            onClick={() => setPaletteOpen(!paletteOpen)}
            className="absolute top-3 -right-3 z-10 w-6 h-6 rounded-full bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm"
          >
            {paletteOpen ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        </div>

        {/* Visual DAG */}
        {(viewMode === 'visual' || viewMode === 'split') && (
          <DagCanvas
            nodes={pipeline.nodes}
            edges={pipeline.edges}
            selectedNodeId={selectedNodeId}
            connectingFrom={connectingFrom}
            onSelectNode={setSelectedNodeId}
            onMoveNode={handleMoveNode}
            onDrop={handleDropConnector}
            onStartConnect={handleStartConnect}
            onEndConnect={handleEndConnect}
            onCancelConnect={handleCancelConnect}
            onDeleteEdge={handleDeleteEdge}
          />
        )}

        {/* YAML editor */}
        {(viewMode === 'yaml' || viewMode === 'split') && (
          <div className={cn('border-l border-border/30 bg-card/10', viewMode === 'split' ? 'w-96' : 'flex-1')}>
            <YamlEditor value={yamlText} onChange={handleYamlChange} error={yamlError} />
          </div>
        )}

        {/* Config panel */}
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onUpdate={handleUpdateNode}
            onDelete={handleDeleteNode}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>
    </div>
  );
}
