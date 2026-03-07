import { useState, useCallback, useMemo } from 'react';
import { ConnectorPalette } from '@/components/builder/ConnectorPalette';
import { DagCanvas } from '@/components/builder/DagCanvas';
import { NodeConfigPanel } from '@/components/builder/NodeConfigPanel';
import { YamlEditor } from '@/components/builder/YamlEditor';
import { ModeSelector } from '@/components/builder/ModeSelector';
import { cn } from '@/lib/utils';
import { createDefaultPipeline, createPipelineForMode, pipelineToYaml, yamlToPipeline, validatePipelineMode, type PipelineConfig, type PipelineNode, type PipelineMode, type ConnectorTemplate } from '@/lib/pipelineTypes';
import { Code, GitBranch, ChevronLeft, ChevronRight, Download, Upload, RotateCcw, Play } from 'lucide-react';

type ViewMode = 'visual' | 'yaml' | 'split';

export default function BuilderPage() {
  const [pipeline, setPipeline] = useState<PipelineConfig>(createDefaultPipeline);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('visual');
  const [yamlText, setYamlText] = useState(() => pipelineToYaml(createDefaultPipeline()));
  const [yamlError, setYamlError] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(true);

  const modeWarnings = useMemo(() => validatePipelineMode(pipeline), [pipeline]);
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

  const handleModeChange = useCallback((mode: PipelineMode) => {
    const newPipeline = createPipelineForMode(mode);
    setPipeline(newPipeline);
    setYamlText(pipelineToYaml(newPipeline));
    setYamlError(null);
    setSelectedNodeId(null);
  }, []);

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
    const def = createPipelineForMode(pipeline.mode);
    setPipeline(def);
    setYamlText(pipelineToYaml(def));
    setYamlError(null);
    setSelectedNodeId(null);
  }, [pipeline.mode]);

  return (
    <div className="h-full flex flex-col gap-0 -m-5 md:-m-8">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 bg-background/60 backdrop-blur-xl relative z-20">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/8 to-transparent" />
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-semibold text-foreground hidden md:block font-display">Pipeline Builder</h1>
          <div className="h-4 w-px bg-border/40 hidden md:block" />
          <ModeSelector value={pipeline.mode} onChange={handleModeChange} warnings={modeWarnings} />
        </div>

        <div className="flex items-center gap-1.5">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-border/40 overflow-hidden mr-2 bg-secondary/30">
            {(['visual', 'split', 'yaml'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-3 py-2 text-[11px] font-medium transition-all duration-200',
                  viewMode === mode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  mode !== 'visual' && 'border-l border-border/30'
                )}
              >
                {mode === 'visual' ? <GitBranch className="h-3.5 w-3.5" /> : mode === 'yaml' ? <Code className="h-3.5 w-3.5" /> : 'Split'}
              </button>
            ))}
          </div>

          <button onClick={handleImportYaml} className="p-2 rounded-xl hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-all duration-200" title="Import YAML">
            <Upload className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleExportYaml} className="p-2 rounded-xl hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-all duration-200" title="Export YAML">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleReset} className="p-2 rounded-xl hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-all duration-200" title="Reset">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <div className="h-5 w-px bg-border/40 mx-1" />
          <button className="btn-magnetic flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold">
            <Play className="h-3 w-3" /> Deploy
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Connector palette */}
        <div className={cn(
          'shrink-0 border-r border-border/20 bg-surface-2/50 transition-all duration-300 relative',
          paletteOpen ? 'w-52' : 'w-11'
        )}>
          <ConnectorPalette onDragStart={() => {}} collapsed={!paletteOpen} />
          <button
            onClick={() => setPaletteOpen(!paletteOpen)}
            className="absolute top-4 -right-3 z-10 w-6 h-6 rounded-full bg-card border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 shadow-ambient hover:shadow-elevated"
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
          <div className={cn('border-l border-border/20 bg-surface-2/30', viewMode === 'split' ? 'w-96' : 'flex-1')}>
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
