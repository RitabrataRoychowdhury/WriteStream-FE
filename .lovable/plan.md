

## WriteStream Interactive UI - Implementation Plan

### Overview
Build a full-featured WriteStream management dashboard using the existing React + Tailwind setup with **zero additional dependencies**. All visualizations (DAG, charts, gauges) will be built with custom SVG and CSS animations. The API layer will be cleanly separated so you can plug in your Rust backend later.

---

### Phase 1: Foundation & Layout

**Dark Theme & Design System**
- Dark mode by default (#0F172A background, #1E293B surfaces)
- Glassmorphism card effects with backdrop blur
- Inter font for UI, monospace for metrics
- Color palette: Blue (sources), Orange (hot path), Purple (WAL), Teal (shards), Green (sinks), Pink (reactive)

**App Shell**
- Collapsible sidebar with icon navigation (Pipeline, Dashboard, Sources, Sinks, Views, Logs, Operations, Benchmarks)
- Top bar with breadcrumbs, system health indicator, and dark/light mode toggle
- Responsive layout that works on mobile (sidebar becomes bottom nav)

---

### Phase 2: DAG Pipeline Visualization (Primary Feature)

**Custom SVG-based DAG**
- Hand-crafted SVG layout showing the full data flow: Sources → Sequencer → WAL → Shards → Mapping → Sinks + Reactive Views
- Rounded rectangle nodes with Lucide icons and status indicators (green/yellow/red/gray dots)
- Animated dashed lines between nodes showing data flow direction
- CSS keyframe animations for flowing particle effects along edges

**Interactive Features**
- Click a node → slide-out detail panel with full metrics
- Hover a node → tooltip with quick stats (TPS, latency, status)
- Zoom and pan using CSS transforms + mouse/touch handlers
- Auto-fit button to reset view

**Real-Time Metrics on Nodes**
- Each node shows live TPS, latency, and utilization
- Color intensity changes based on load (cool blue → hot orange/red)
- Pulsing animation for active data flow

---

### Phase 3: Metrics Dashboard

**Top KPI Cards (4 large cards)**
- Total Events Ingested: counter with mini sparkline (custom SVG)
- Current TPS: gauge visualization (SVG arc)
- E2E Latency P99: bar histogram (SVG)
- WAL Disk Usage: progress bar with threshold markers

**Component Metrics Grid**
- Sources section: Cards for HTTP API, Kafka, MySQL CDC, PostgreSQL CDC with per-source metrics
- Hot Path section: Sequencer ring buffer utilization, WAL write stats
- Cold Path section: Per-shard metrics with buffer utilization bars
- Sinks section: One card per sink (PostgreSQL, MySQL, ClickHouse, Kafka) showing write TPS, batch size, latency, backpressure
- Reactive Views section: Active views count, WebSocket connections, update rate

**Charts** (all custom SVG)
- Time-series line charts for TPS history
- Bar charts for latency distribution
- Donut charts for resource utilization

---

### Phase 4: Configuration Management

**Sources Configuration**
- Toggle switches to enable/disable each source
- Expandable config forms for CDC sources (host, port, credentials, table filters)
- "Test Connection" button with status feedback
- Kafka consumer settings (topics, group ID, batch size)

**Sinks Configuration**
- Multi-select for enabled sinks
- Per-sink config panels: connection details, batch size, buffer watermarks, pool size
- Save/reset buttons with validation

**YAML Editor** (custom-built)
- Textarea with line numbers and basic syntax coloring via CSS
- Tabs for Mappings and Reactive Views
- List/create/edit/delete operations
- YAML validation with error highlighting
- Preview panel showing parsed structure

---

### Phase 5: Monitoring & Observability

**Logs Viewer**
- Scrolling log display with color-coded levels (DEBUG gray, INFO blue, WARN yellow, ERROR red)
- Filter buttons by level and component
- Search bar with text highlighting
- Auto-scroll toggle and "Export Logs" button
- Mock WebSocket streaming with realistic log entries

**Alerts Panel**
- Active alerts list with severity badges (critical/warning/info)
- Alert history timeline
- Silence/acknowledge actions

**Checkpoint Status**
- Visual display of current sequence numbers
- Per-sink acknowledged sequences
- Safe truncation point indicator

---

### Phase 6: Operations & Admin

**WAL Management**
- Segment list table (ID, size, age, sequence range)
- Compact WAL button with confirmation dialog
- Disk usage over time chart
- Retention policy controls

**Sink Management**
- Start/Stop/Restart buttons per sink with status transitions
- Drain buffer and reset cursor actions
- Health status cards

**CDC Management**
- Start/Stop/Pause/Resume controls
- Replication lag display
- Position tracking (binlog/LSN)
- Dead Letter Queue viewer with replay capability

**Reactive Views Management**
- CRUD operations for views
- Force snapshot button
- Memory usage and entry count stats

---

### Phase 7: Performance Testing

**Benchmark Runner**
- Test type selector (pure WAL, single sink, multi-sink)
- Parameter controls (duration, target TPS, payload size)
- Real-time results display during test run
- Historical results comparison table

**Load Generator**
- Rate slider and payload configuration
- Start/stop controls
- Live system metrics during load test

---

### API Integration Layer

**Clean separation for Rust backend pluggability:**
- `src/api/client.ts` - Base API client with configurable base URL
- `src/api/sources.ts`, `sinks.ts`, `views.ts`, `wal.ts` - Resource-specific API modules
- `src/api/websocket.ts` - WebSocket connection manager with reconnection
- `src/mocks/` - Mock data generators that simulate realistic streaming data
- Toggle between mock and real API via environment variable

**All mock data will simulate realistic WriteStream behavior:**
- Fluctuating TPS values (100k-200k range)
- Occasional degraded states and spikes
- Realistic CDC lag patterns
- Buffer fill/drain cycles

---

### Key Design Details

- **No additional npm packages** - everything built with React, Tailwind, Lucide icons, and Recharts (already installed)
- **Recharts** (already installed) for time-series charts; custom SVG for gauges and the DAG
- **All state in mock services** - easy to swap to real WebSocket/REST calls
- **Smooth animations** using Tailwind's built-in animation utilities + CSS keyframes
- **~15 pages/views** total across sidebar navigation
- **Glassmorphism cards** with `backdrop-blur` and semi-transparent backgrounds

