// Pipeline node & edge types for the visual DAG builder

export type NodeType = 'source' | 'sink' | 'wal' | 'sequencer' | 'shard' | 'reactive' | 'cdc' | 'query';

export type SourceType = 'http' | 'kafka' | 'cdc_mysql' | 'cdc_postgres' | 'cdc_mongodb';
export type SinkType = 'postgresql' | 'mysql' | 'clickhouse' | 'mongodb' | 'kafka' | 'internal';
export type PipelineMode = 'pure_wal' | 'internal_sink' | 'multi_sink';

export interface PipelineNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  config: Record<string, unknown>;
  sourceType?: SourceType;
  sinkType?: SinkType;
  enabled: boolean;
}

export interface PipelineEdge {
  id: string;
  from: string;
  to: string;
}

export interface PipelineConfig {
  name: string;
  mode: PipelineMode;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}

// Connector templates for drag-and-drop
export interface ConnectorTemplate {
  type: NodeType;
  subType: SourceType | SinkType | 'sequencer' | 'wal' | 'shard' | 'reactive';
  label: string;
  icon: string; // lucide icon name
  color: string; // CSS var
  defaultConfig: Record<string, unknown>;
}

export const SOURCE_CONNECTORS: ConnectorTemplate[] = [
  { type: 'source', subType: 'http', label: 'HTTP API', icon: 'Globe', color: 'var(--ws-source)', defaultConfig: { port: 8080, maxConnections: 256 } },
  { type: 'source', subType: 'kafka', label: 'Kafka', icon: 'Radio', color: 'var(--ws-source)', defaultConfig: { brokers: 'localhost:9092', groupId: 'ws-consumer', topics: ['events'], batchSize: 1000 } },
  { type: 'source', subType: 'cdc_mysql', label: 'MySQL CDC', icon: 'Database', color: 'var(--ws-source)', defaultConfig: { host: 'localhost', port: 3306, user: 'replicator', database: 'mydb', tables: ['*'], snapshotMode: 'initial' } },
  { type: 'source', subType: 'cdc_postgres', label: 'PostgreSQL CDC', icon: 'Database', color: 'var(--ws-source)', defaultConfig: { host: 'localhost', port: 5432, user: 'replicator', database: 'mydb', tables: ['*'], slotName: 'ws_slot' } },
  { type: 'source', subType: 'cdc_mongodb', label: 'MongoDB CDC', icon: 'Database', color: 'var(--ws-source)', defaultConfig: { uri: 'mongodb://localhost:27017', database: 'mydb', collections: ['*'] } },
];

export const SINK_CONNECTORS: ConnectorTemplate[] = [
  { type: 'sink', subType: 'postgresql', label: 'PostgreSQL', icon: 'Database', color: 'var(--ws-sink)', defaultConfig: { host: 'localhost', port: 5432, user: 'postgres', database: 'target_db', batchSize: 5000, bufferSize: 10000 } },
  { type: 'sink', subType: 'mysql', label: 'MySQL', icon: 'Database', color: 'var(--ws-sink)', defaultConfig: { host: 'localhost', port: 3306, user: 'root', database: 'target_db', batchSize: 3000, bufferSize: 8000 } },
  { type: 'sink', subType: 'clickhouse', label: 'ClickHouse', icon: 'Database', color: 'var(--ws-sink)', defaultConfig: { host: 'localhost', port: 8123, user: 'default', database: 'analytics', batchSize: 50000, bufferSize: 100000 } },
  { type: 'sink', subType: 'mongodb', label: 'MongoDB', icon: 'Database', color: 'var(--ws-sink)', defaultConfig: { uri: 'mongodb://localhost:27017', database: 'target_db', batchSize: 2000 } },
  { type: 'sink', subType: 'kafka', label: 'Kafka Out', icon: 'Radio', color: 'var(--ws-sink)', defaultConfig: { brokers: 'localhost:9092', topic: 'output-events', batchSize: 10000 } },
  { type: 'sink', subType: 'internal', label: 'Internal (WAL Only)', icon: 'HardDrive', color: 'var(--ws-wal)', defaultConfig: { retention: '7d', compaction: true } },
];

export const CORE_CONNECTORS: ConnectorTemplate[] = [
  { type: 'sequencer', subType: 'sequencer', label: 'Sequencer', icon: 'Zap', color: 'var(--ws-hotpath)', defaultConfig: { ringBufferSize: 65536 } },
  { type: 'wal', subType: 'wal', label: 'WAL', icon: 'HardDrive', color: 'var(--ws-wal)', defaultConfig: { segmentSize: '256MB', fsyncInterval: '1ms', retention: '24h' } },
  { type: 'shard', subType: 'shard', label: 'Shard', icon: 'Layers', color: 'var(--ws-shard)', defaultConfig: { bufferSize: 8192 } },
  { type: 'reactive', subType: 'reactive', label: 'Reactive Views', icon: 'Eye', color: 'var(--ws-reactive)', defaultConfig: { maxViews: 100, persistence: true } },
];

// YAML ↔ DAG conversion
export function pipelineToYaml(pipeline: PipelineConfig): string {
  const lines: string[] = [];
  lines.push(`name: ${pipeline.name}`);
  lines.push(`mode: ${pipeline.mode}`);
  lines.push('');
  
  // Sources
  const sources = pipeline.nodes.filter(n => n.type === 'source');
  if (sources.length > 0) {
    lines.push('sources:');
    for (const s of sources) {
      lines.push(`  - id: ${s.id}`);
      lines.push(`    type: ${s.sourceType || 'http'}`);
      lines.push(`    label: "${s.label}"`);
      lines.push(`    enabled: ${s.enabled}`);
      if (Object.keys(s.config).length > 0) {
        lines.push('    config:');
        for (const [k, v] of Object.entries(s.config)) {
          if (Array.isArray(v)) {
            lines.push(`      ${k}:`);
            for (const item of v) lines.push(`        - "${item}"`);
          } else if (typeof v === 'string') {
            lines.push(`      ${k}: "${v}"`);
          } else {
            lines.push(`      ${k}: ${v}`);
          }
        }
      }
    }
    lines.push('');
  }

  // Core pipeline
  const sequencer = pipeline.nodes.find(n => n.type === 'sequencer');
  const wal = pipeline.nodes.find(n => n.type === 'wal');
  const shards = pipeline.nodes.filter(n => n.type === 'shard');
  
  if (sequencer) {
    lines.push('sequencer:');
    for (const [k, v] of Object.entries(sequencer.config)) {
      lines.push(`  ${k}: ${v}`);
    }
    lines.push('');
  }
  
  if (wal) {
    lines.push('wal:');
    for (const [k, v] of Object.entries(wal.config)) {
      lines.push(`  ${k}: ${typeof v === 'string' ? `"${v}"` : v}`);
    }
    lines.push('');
  }
  
  if (shards.length > 0) {
    lines.push(`shards:`);
    lines.push(`  count: ${shards.length}`);
    if (shards[0] && Object.keys(shards[0].config).length > 0) {
      lines.push('  config:');
      for (const [k, v] of Object.entries(shards[0].config)) {
        lines.push(`    ${k}: ${v}`);
      }
    }
    lines.push('');
  }

  // Sinks
  const sinks = pipeline.nodes.filter(n => n.type === 'sink');
  if (sinks.length > 0) {
    lines.push('sinks:');
    for (const s of sinks) {
      lines.push(`  - id: ${s.id}`);
      lines.push(`    type: ${s.sinkType || 'postgresql'}`);
      lines.push(`    label: "${s.label}"`);
      lines.push(`    enabled: ${s.enabled}`);
      if (Object.keys(s.config).length > 0) {
        lines.push('    config:');
        for (const [k, v] of Object.entries(s.config)) {
          if (Array.isArray(v)) {
            lines.push(`      ${k}:`);
            for (const item of v) lines.push(`        - "${item}"`);
          } else if (typeof v === 'string') {
            lines.push(`      ${k}: "${v}"`);
          } else {
            lines.push(`      ${k}: ${v}`);
          }
        }
      }
    }
    lines.push('');
  }

  // Reactive
  const reactive = pipeline.nodes.find(n => n.type === 'reactive');
  if (reactive) {
    lines.push('reactive:');
    lines.push(`  enabled: ${reactive.enabled}`);
    for (const [k, v] of Object.entries(reactive.config)) {
      lines.push(`  ${k}: ${v}`);
    }
    lines.push('');
  }

  // Edges
  if (pipeline.edges.length > 0) {
    lines.push('edges:');
    for (const e of pipeline.edges) {
      lines.push(`  - from: ${e.from}`);
      lines.push(`    to: ${e.to}`);
    }
  }

  return lines.join('\n');
}

export function yamlToPipeline(yaml: string): PipelineConfig | { error: string } {
  try {
    const pipeline: PipelineConfig = { name: 'Untitled Pipeline', mode: 'multi_sink', nodes: [], edges: [] };
    const lines = yaml.split('\n');
    let currentSection = '';
    let currentItem: Partial<PipelineNode> | null = null;
    let inConfig = false;
    let configKey = '';
    let nodeIndex = 0;

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      if (!line || line.startsWith('#')) continue;

      const indent = line.length - line.trimStart().length;
      const trimmed = line.trim();

      // Top-level keys
      if (indent === 0 && trimmed.includes(':')) {
        const [key, ...valParts] = trimmed.split(':');
        const val = valParts.join(':').trim();
        if (key === 'name') pipeline.name = val;
        else if (key === 'mode') pipeline.mode = val as PipelineMode;
        else if (key === 'sources' || key === 'sinks' || key === 'edges') {
          currentSection = key;
          currentItem = null;
          inConfig = false;
        } else if (key === 'sequencer') {
          currentSection = 'sequencer';
          currentItem = { id: 'sequencer', type: 'sequencer', label: 'Sequencer', x: 400, y: 200, config: {}, enabled: true };
        } else if (key === 'wal') {
          currentSection = 'wal';
          currentItem = { id: 'wal', type: 'wal', label: 'WAL', x: 400, y: 320, config: {}, enabled: true };
        } else if (key === 'shards') {
          currentSection = 'shards';
        } else if (key === 'reactive') {
          currentSection = 'reactive';
          currentItem = { id: 'reactive', type: 'reactive', label: 'Reactive Views', x: 700, y: 560, config: {}, enabled: true };
        }
        continue;
      }

      if (currentSection === 'sources' || currentSection === 'sinks') {
        if (trimmed.startsWith('- id:')) {
          if (currentItem?.id) pipeline.nodes.push(currentItem as PipelineNode);
          const id = trimmed.replace('- id:', '').trim();
          const isSource = currentSection === 'sources';
          const xBase = isSource ? 80 : 80;
          const yBase = isSource ? 60 : 560;
          currentItem = { id, type: isSource ? 'source' : 'sink', label: id, x: xBase + (nodeIndex % 4) * 180, y: yBase, config: {}, enabled: true };
          nodeIndex++;
          inConfig = false;
        } else if (currentItem) {
          if (trimmed.startsWith('type:')) {
            const t = trimmed.replace('type:', '').trim();
            if (currentSection === 'sources') (currentItem as PipelineNode).sourceType = t as SourceType;
            else (currentItem as PipelineNode).sinkType = t as SinkType;
          } else if (trimmed.startsWith('label:')) {
            currentItem.label = trimmed.replace('label:', '').trim().replace(/"/g, '');
          } else if (trimmed.startsWith('enabled:')) {
            currentItem.enabled = trimmed.replace('enabled:', '').trim() === 'true';
          } else if (trimmed === 'config:') {
            inConfig = true;
          } else if (inConfig && indent >= 6) {
            const [ck, ...cv] = trimmed.split(':');
            const val = cv.join(':').trim().replace(/"/g, '');
            if (val && !currentItem.config) currentItem.config = {};
            if (val) (currentItem.config as Record<string, unknown>)[ck.trim()] = isNaN(Number(val)) ? val : Number(val);
          }
        }
      } else if (currentSection === 'sequencer' || currentSection === 'wal') {
        if (currentItem && indent >= 2 && trimmed.includes(':')) {
          const [ck, ...cv] = trimmed.split(':');
          const val = cv.join(':').trim().replace(/"/g, '');
          if (val && !currentItem.config) currentItem.config = {};
          if (val) (currentItem.config as Record<string, unknown>)[ck.trim()] = isNaN(Number(val)) ? val : Number(val);
        }
      } else if (currentSection === 'shards') {
        if (trimmed.startsWith('count:')) {
          const count = parseInt(trimmed.replace('count:', '').trim());
          for (let i = 0; i < count; i++) {
            pipeline.nodes.push({ id: `shard_${i+1}`, type: 'shard', label: `Shard ${i+1}`, x: 150 + i * 200, y: 440, config: { bufferSize: 8192 }, enabled: true });
          }
        }
      } else if (currentSection === 'reactive' && currentItem) {
        if (trimmed.startsWith('enabled:')) {
          currentItem.enabled = trimmed.replace('enabled:', '').trim() === 'true';
        } else if (indent >= 2 && trimmed.includes(':')) {
          const [ck, ...cv] = trimmed.split(':');
          const val = cv.join(':').trim().replace(/"/g, '');
          if (ck.trim() !== 'enabled' && val) {
            if (!currentItem.config) currentItem.config = {};
            (currentItem.config as Record<string, unknown>)[ck.trim()] = isNaN(Number(val)) ? val : Number(val);
          }
        }
      } else if (currentSection === 'edges') {
        if (trimmed.startsWith('- from:')) {
          configKey = trimmed.replace('- from:', '').trim();
        } else if (trimmed.startsWith('to:') && configKey) {
          pipeline.edges.push({ id: `e_${configKey}_${trimmed.replace('to:', '').trim()}`, from: configKey, to: trimmed.replace('to:', '').trim() });
          configKey = '';
        }
      }
    }

    // Push last item
    if (currentItem?.id) pipeline.nodes.push(currentItem as PipelineNode);

    // Push sequencer/wal/reactive if they were parsed
    if (currentSection === 'sequencer' && currentItem) pipeline.nodes.push(currentItem as PipelineNode);
    if (currentSection === 'wal' && currentItem) pipeline.nodes.push(currentItem as PipelineNode);
    if (currentSection === 'reactive' && currentItem) pipeline.nodes.push(currentItem as PipelineNode);

    return pipeline;
  } catch (e) {
    return { error: `YAML parse error: ${(e as Error).message}` };
  }
}

// Default pipeline
export function createDefaultPipeline(): PipelineConfig {
  return {
    name: 'My WriteStream Pipeline',
    mode: 'multi_sink',
    nodes: [
      { id: 'http_source', type: 'source', label: 'HTTP API', x: 100, y: 60, config: { port: 8080 }, sourceType: 'http', enabled: true },
      { id: 'kafka_source', type: 'source', label: 'Kafka', x: 350, y: 60, config: { brokers: 'localhost:9092', topics: ['events'] }, sourceType: 'kafka', enabled: true },
      { id: 'mysql_cdc', type: 'source', label: 'MySQL CDC', x: 600, y: 60, config: { host: 'localhost', port: 3306 }, sourceType: 'cdc_mysql', enabled: true },
      { id: 'sequencer', type: 'sequencer', label: 'Sequencer', x: 350, y: 200, config: { ringBufferSize: 65536 }, enabled: true },
      { id: 'wal', type: 'wal', label: 'WAL', x: 350, y: 320, config: { segmentSize: '256MB', fsyncInterval: '1ms' }, enabled: true },
      { id: 'shard_1', type: 'shard', label: 'Shard 1', x: 150, y: 440, config: { bufferSize: 8192 }, enabled: true },
      { id: 'shard_2', type: 'shard', label: 'Shard 2', x: 400, y: 440, config: { bufferSize: 8192 }, enabled: true },
      { id: 'shard_3', type: 'shard', label: 'Shard 3', x: 650, y: 440, config: { bufferSize: 8192 }, enabled: true },
      { id: 'pg_sink', type: 'sink', label: 'PostgreSQL', x: 60, y: 580, config: { host: 'localhost', port: 5432, batchSize: 5000 }, sinkType: 'postgresql', enabled: true },
      { id: 'mysql_sink', type: 'sink', label: 'MySQL', x: 260, y: 580, config: { host: 'localhost', port: 3306, batchSize: 3000 }, sinkType: 'mysql', enabled: true },
      { id: 'ch_sink', type: 'sink', label: 'ClickHouse', x: 460, y: 580, config: { host: 'localhost', port: 8123, batchSize: 50000 }, sinkType: 'clickhouse', enabled: true },
      { id: 'reactive', type: 'reactive', label: 'Reactive Views', x: 700, y: 520, config: { maxViews: 100, persistence: true }, enabled: true },
    ],
    edges: [
      { id: 'e1', from: 'http_source', to: 'sequencer' },
      { id: 'e2', from: 'kafka_source', to: 'sequencer' },
      { id: 'e3', from: 'mysql_cdc', to: 'sequencer' },
      { id: 'e4', from: 'sequencer', to: 'wal' },
      { id: 'e5', from: 'wal', to: 'shard_1' },
      { id: 'e6', from: 'wal', to: 'shard_2' },
      { id: 'e7', from: 'wal', to: 'shard_3' },
      { id: 'e8', from: 'shard_1', to: 'pg_sink' },
      { id: 'e9', from: 'shard_1', to: 'mysql_sink' },
      { id: 'e10', from: 'shard_2', to: 'ch_sink' },
      { id: 'e11', from: 'shard_3', to: 'reactive' },
    ],
  };
}
