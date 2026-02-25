// Mock data generators for WriteStream UI
// All data simulates realistic streaming behavior with fluctuations

export type ComponentStatus = 'healthy' | 'degraded' | 'down' | 'disabled';

export interface SourceMetrics {
  name: string;
  type: 'http' | 'kafka' | 'cdc_mysql' | 'cdc_postgres';
  status: ComponentStatus;
  enabled: boolean;
  tps: number;
  latencyP99Ms: number;
  errorRate: number;
  extra: Record<string, string | number>;
}

export interface SinkMetrics {
  name: string;
  type: 'postgresql' | 'mysql' | 'clickhouse' | 'kafka';
  status: ComponentStatus;
  enabled: boolean;
  tps: number;
  batchSize: number;
  latencyP99Ms: number;
  bufferUtilization: number;
  backpressure: boolean;
}

export interface WALMetrics {
  writeTps: number;
  fsyncLatencyMs: number;
  segmentCount: number;
  diskUsageGB: number;
  diskCapacityGB: number;
  oldestSegmentAge: string;
}

export interface SequencerMetrics {
  tps: number;
  ringBufferUtilization: number;
  idempotencyHits: number;
}

export interface ShardMetrics {
  id: number;
  tps: number;
  bufferUtilization: number;
  backpressureEvents: number;
}

export interface ReactiveViewMetrics {
  activeViews: number;
  totalEntries: number;
  memoryUsageMB: number;
  wsConnections: number;
  updatesPerSec: number;
}

export interface SystemMetrics {
  totalEventsIngested: number;
  currentTps: number;
  e2eLatencyP99Ms: number;
  walDiskUsagePercent: number;
  sequencer: SequencerMetrics;
  wal: WALMetrics;
  sources: SourceMetrics[];
  sinks: SinkMetrics[];
  shards: ShardMetrics[];
  reactive: ReactiveViewMetrics;
  tpsHistory: { time: string; tps: number }[];
  latencyHistory: { time: string; p50: number; p99: number }[];
}

function fluctuate(base: number, variance: number): number {
  return Math.max(0, base + (Math.random() - 0.5) * 2 * variance);
}

function randomStatus(): ComponentStatus {
  const r = Math.random();
  if (r > 0.95) return 'degraded';
  if (r > 0.99) return 'down';
  return 'healthy';
}

let eventCounter = 847_293_182;

export function generateMockMetrics(): SystemMetrics {
  const currentTps = fluctuate(145000, 25000);
  eventCounter += Math.floor(currentTps / 10);

  const sources: SourceMetrics[] = [
    {
      name: 'HTTP API',
      type: 'http',
      status: randomStatus(),
      enabled: true,
      tps: fluctuate(52000, 8000),
      latencyP99Ms: fluctuate(2.1, 0.8),
      errorRate: fluctuate(0.001, 0.0005),
      extra: { endpoints: 4, activeConnections: Math.floor(fluctuate(240, 60)) },
    },
    {
      name: 'Kafka Consumer',
      type: 'kafka',
      status: randomStatus(),
      enabled: true,
      tps: fluctuate(38000, 5000),
      latencyP99Ms: fluctuate(5.2, 1.5),
      errorRate: fluctuate(0.0002, 0.0001),
      extra: { partitions: 12, consumerLag: Math.floor(fluctuate(150, 80)), groupId: 'ws-consumer-01' },
    },
    {
      name: 'MySQL CDC',
      type: 'cdc_mysql',
      status: 'healthy',
      enabled: true,
      tps: fluctuate(18000, 3000),
      latencyP99Ms: fluctuate(12, 4),
      errorRate: 0,
      extra: { replicationLagMs: Math.floor(fluctuate(250, 100)), position: 'mysql-bin.000147:892341' },
    },
    {
      name: 'PostgreSQL CDC',
      type: 'cdc_postgres',
      status: 'healthy',
      enabled: true,
      tps: fluctuate(15000, 2500),
      latencyP99Ms: fluctuate(8, 3),
      errorRate: 0,
      extra: { replicationLagMs: Math.floor(fluctuate(180, 70)), lsn: '0/1A2B3C4D' },
    },
  ];

  const sinks: SinkMetrics[] = [
    {
      name: 'PostgreSQL',
      type: 'postgresql',
      status: randomStatus(),
      enabled: true,
      tps: fluctuate(45000, 8000),
      batchSize: 5000,
      latencyP99Ms: fluctuate(15, 5),
      bufferUtilization: fluctuate(0.45, 0.2),
      backpressure: Math.random() > 0.9,
    },
    {
      name: 'MySQL',
      type: 'mysql',
      status: 'healthy',
      enabled: true,
      tps: fluctuate(32000, 5000),
      batchSize: 3000,
      latencyP99Ms: fluctuate(22, 8),
      bufferUtilization: fluctuate(0.35, 0.15),
      backpressure: false,
    },
    {
      name: 'ClickHouse',
      type: 'clickhouse',
      status: randomStatus(),
      enabled: true,
      tps: fluctuate(185000, 30000),
      batchSize: 50000,
      latencyP99Ms: fluctuate(45, 15),
      bufferUtilization: fluctuate(0.6, 0.2),
      backpressure: Math.random() > 0.85,
    },
    {
      name: 'Kafka Producer',
      type: 'kafka',
      status: 'healthy',
      enabled: true,
      tps: fluctuate(120000, 20000),
      batchSize: 10000,
      latencyP99Ms: fluctuate(3, 1),
      bufferUtilization: fluctuate(0.25, 0.1),
      backpressure: false,
    },
  ];

  const shards: ShardMetrics[] = Array.from({ length: 4 }, (_, i) => ({
    id: i + 1,
    tps: fluctuate(36000, 6000),
    bufferUtilization: fluctuate(0.5, 0.25),
    backpressureEvents: Math.floor(fluctuate(2, 3)),
  }));

  const now = new Date();
  const tpsHistory = Array.from({ length: 30 }, (_, i) => {
    const t = new Date(now.getTime() - (29 - i) * 2000);
    return { time: t.toLocaleTimeString(), tps: fluctuate(145000, 30000) };
  });

  const latencyHistory = Array.from({ length: 30 }, (_, i) => {
    const t = new Date(now.getTime() - (29 - i) * 2000);
    return { time: t.toLocaleTimeString(), p50: fluctuate(12, 4), p99: fluctuate(85, 20) };
  });

  return {
    totalEventsIngested: eventCounter,
    currentTps: Math.floor(currentTps),
    e2eLatencyP99Ms: fluctuate(85, 20),
    walDiskUsagePercent: fluctuate(42, 10),
    sequencer: {
      tps: Math.floor(currentTps),
      ringBufferUtilization: fluctuate(0.35, 0.15),
      idempotencyHits: Math.floor(fluctuate(120, 40)),
    },
    wal: {
      writeTps: Math.floor(currentTps),
      fsyncLatencyMs: fluctuate(0.8, 0.3),
      segmentCount: Math.floor(fluctuate(14, 3)),
      diskUsageGB: fluctuate(2.4, 0.5),
      diskCapacityGB: 10,
      oldestSegmentAge: '4m 23s',
    },
    sources,
    sinks,
    shards,
    reactive: {
      activeViews: 5,
      totalEntries: Math.floor(fluctuate(284000, 20000)),
      memoryUsageMB: fluctuate(512, 80),
      wsConnections: Math.floor(fluctuate(23, 8)),
      updatesPerSec: Math.floor(fluctuate(35000, 5000)),
    },
    tpsHistory,
    latencyHistory,
  };
}

// Log entry types
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
}

const logComponents = ['sequencer', 'wal', 'sink.postgresql', 'sink.clickhouse', 'sink.mysql', 'sink.kafka', 'cdc.mysql', 'cdc.postgres', 'reactive', 'http_api'];
const logMessages: Record<LogLevel, string[]> = {
  DEBUG: [
    'Processing batch of {n} events',
    'Ring buffer position: {n}',
    'Checkpoint sequence: {n}',
    'Buffer flush completed in {n}ms',
  ],
  INFO: [
    'Sink connected successfully',
    'WAL segment rotated: segment-{n}',
    'CDC snapshot completed for table users',
    'Reactive view refreshed: account_balances',
    'WebSocket subscriber connected from 10.0.{n}.{n}',
    'Batch committed: {n} events in {n}ms',
  ],
  WARN: [
    'Buffer utilization above 80%: {n}%',
    'Replication lag increasing: {n}ms',
    'Backpressure activated on sink',
    'Slow fsync detected: {n}ms',
    'Consumer lag growing: {n} messages behind',
  ],
  ERROR: [
    'Connection refused: timeout after 5000ms',
    'Batch write failed: deadlock detected, retrying...',
    'WAL corruption detected in segment-{n}, recovering...',
    'CDC position lost, initiating re-snapshot',
  ],
};

let logId = 0;
export function generateLogEntry(): LogEntry {
  const r = Math.random();
  const level: LogLevel = r > 0.95 ? 'ERROR' : r > 0.85 ? 'WARN' : r > 0.4 ? 'INFO' : 'DEBUG';
  const msgs = logMessages[level];
  const msg = msgs[Math.floor(Math.random() * msgs.length)].replace(/\{n\}/g, () => String(Math.floor(Math.random() * 999)));
  return {
    id: String(++logId),
    timestamp: new Date().toISOString(),
    level,
    component: logComponents[Math.floor(Math.random() * logComponents.length)],
    message: msg,
  };
}

// WAL Segments
export interface WALSegment {
  id: string;
  size: string;
  age: string;
  seqStart: number;
  seqEnd: number;
  status: 'active' | 'sealed' | 'compactable';
}

export function generateWALSegments(): WALSegment[] {
  return Array.from({ length: 14 }, (_, i) => ({
    id: `segment-${String(i + 1).padStart(4, '0')}`,
    size: `${(Math.random() * 200 + 50).toFixed(1)} MB`,
    age: i === 13 ? '12s' : `${i + 1}m ${Math.floor(Math.random() * 59)}s`,
    seqStart: i * 100000 + 1,
    seqEnd: (i + 1) * 100000,
    status: i < 2 ? 'compactable' : i === 13 ? 'active' : 'sealed',
  }));
}

// Alert types
export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  component: string;
  timestamp: string;
  acknowledged: boolean;
}

export function generateAlerts(): Alert[] {
  return [
    { id: '1', severity: 'warning', title: 'High Buffer Utilization', message: 'ClickHouse sink buffer at 82%', component: 'sink.clickhouse', timestamp: new Date(Date.now() - 120000).toISOString(), acknowledged: false },
    { id: '2', severity: 'info', title: 'WAL Segment Rotation', message: 'Automatic segment rotation completed', component: 'wal', timestamp: new Date(Date.now() - 300000).toISOString(), acknowledged: true },
    { id: '3', severity: 'critical', title: 'Replication Lag Spike', message: 'MySQL CDC lag exceeded 500ms threshold', component: 'cdc.mysql', timestamp: new Date(Date.now() - 60000).toISOString(), acknowledged: false },
    { id: '4', severity: 'warning', title: 'Backpressure Active', message: 'PostgreSQL sink backpressure engaged', component: 'sink.postgresql', timestamp: new Date(Date.now() - 45000).toISOString(), acknowledged: false },
  ];
}
