import { useState, useCallback, useMemo } from 'react';
import { ConnectorPalette } from '@/components/builder/ConnectorPalette';
import { DagCanvas } from '@/components/builder/DagCanvas';
import { NodeConfigPanel } from '@/components/builder/NodeConfigPanel';
import { YamlEditor } from '@/components/builder/YamlEditor';
import { cn } from '@/lib/utils';
import { createDefaultPipeline, pipelineToYaml, yamlToPipeline, type PipelineConfig, type PipelineNode, type PipelineEdge, type ConnectorTemplate } from '@/lib/pipelineTypes';
import { Code, GitBranch, ChevronLeft, ChevronRight, Download, Upload, RotateCcw } from 'lucide-react';

type ViewMode = 'visual' | 'yaml' | 'split';

export default function BuilderPage() {
  const [pipeline, setPipeline] = useState<PipelineConfig>(createDefaultPipeline);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [yamlText, setYamlText] = useState(() => pipelineToYaml(createDefaultPipeline()));
  const [yamlError, setYamlError] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [pipelineMode, setPipelineMode] = useState(pipeline.mode);

  const selectedNode = useMemo(() => pipeline.nodes.find(n => n.id === selectedNodeId) || null, [pipeline.nodes, selectedNodeId]);

  // Sync DAG → YAML
  const syncYaml = useCallback((p: PipelineConfig) => {
    setYamlText(pipelineToYaml(p));
    setYamlError(null);
  }, []);

  // Sync YAML → DAG
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

  // Node operations
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

  // Edge operations
  const handleStartConnect = useCallback((nodeId: string) => {
    setConnectingFrom(nodeId);
  }, []);

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

  const handleCancelConnect = useCallback(() => {
    setConnectingFrom(null);
  }, []);

  // Mode change
  const handleModeChange = useCallback((mode: string) => {
    const m = mode as PipelineConfig['mode'];
    setPipelineMode(m);
    updatePipeline(p => ({ ...p, mode: m }));
  }, [updatePipeline]);

  // Export / Import
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
      reader.onload = () => {
        const text = reader.result as string;
        handleYamlChange(text);
      };
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
    <div className="h-full flex flex-col gap-2">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Pipeline Builder</h1>
          <p className="text-xs text-muted-foreground">Drag connectors to build your data pipeline • YAML ↔ DAG sync</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode selector */}
          <select
            value={pipelineMode}
            onChange={(e) => handleModeChange(e.target.value)}
            className="text-xs px-2 py-1 rounded-md border border-border/50 bg-secondary/30 text-foreground focus:outline-none"
          >
            <option value="pure_wal">Pure WAL Mode</option>
            <option value="internal_sink">Internal Sink</option>
            <option value="multi_sink">Multi-Sink</option>
          </select>

          {/* View toggle */}
          <div className="flex items-center rounded-md border border-border/50 overflow-hidden">
            <button onClick={() => setViewMode('visual')} className={cn('px-2 py-1 text-xs', viewMode === 'visual' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground')}>
              <GitBranch className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setViewMode('split')} className={cn('px-2 py-1 text-xs border-x border-border/50', viewMode === 'split' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground')}>
              Split
            </button>
            <button onClick={() => setViewMode('yaml')} className={cn('px-2 py-1 text-xs', viewMode === 'yaml' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground')}>
              <Code className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Actions */}
          <button onClick={handleExportYaml} className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors" title="Export YAML">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleImportYaml} className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors" title="Import YAML">
            <Upload className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleReset} className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors" title="Reset">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-0 min-h-0 rounded-xl overflow-hidden border border-border/50">
        {/* Connector palette */}
        <div className={cn(
          'shrink-0 border-r border-border/30 bg-card/30 transition-all duration-200 relative',
          paletteOpen ? 'w-44' : 'w-10'
        )}>
          <ConnectorPalette onDragStart={() => {}} collapsed={!paletteOpen} />
          <button
            onClick={() => setPaletteOpen(!paletteOpen)}
            className="absolute top-2 -right-3 z-10 w-6 h-6 rounded-full bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
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
          />
        )}

        {/* YAML editor */}
        {(viewMode === 'yaml' || viewMode === 'split') && (
          <div className={cn('border-l border-border/30 bg-card/20', viewMode === 'split' ? 'w-80' : 'flex-1')}>
            <YamlEditor
              value={yamlText}
              onChange={handleYamlChange}
              error={yamlError}
            />
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
