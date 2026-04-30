// WriteStream API Client
// Connects to: HTTP API (8080), Admin API (9091), WebSocket (9094)
// Falls back to mock data when backend is unreachable

const ADMIN_URL = import.meta.env.VITE_WS_ADMIN_URL || '/api/admin';
const EVENTS_URL = import.meta.env.VITE_WS_EVENTS_URL || '/api/events';
const METRICS_URL = import.meta.env.VITE_WS_METRICS_URL || '/api/metrics';
const WS_URL = import.meta.env.VITE_WS_WS_URL || `ws://${window.location.hostname}:9094`;

export interface ApiResponse<T> {
  data: T;
  status: number;
  ok: boolean;
}

async function request<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const text = await res.text();
  let data: T;
  try {
    data = JSON.parse(text);
  } catch {
    data = text as unknown as T;
  }
  return { data, status: res.status, ok: res.ok };
}

// Admin API helpers
export const adminGet = <T>(path: string) => request<T>(`${ADMIN_URL}${path}`);
export const adminPost = <T>(path: string, body?: unknown) =>
  request<T>(`${ADMIN_URL}${path}`, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
export const adminPut = <T>(path: string, body: unknown) =>
  request<T>(`${ADMIN_URL}${path}`, { method: 'PUT', body: JSON.stringify(body) });
export const adminDelete = (path: string) =>
  request<void>(`${ADMIN_URL}${path}`, { method: 'DELETE' });

// Events API
export const postEvent = (key: string, payload: Record<string, unknown>) =>
  request<{ event_id: string; status: string }>(`${EVENTS_URL}`, {
    method: 'POST',
    body: JSON.stringify({ key, payload }),
  });

// Prometheus metrics (raw text)
export const fetchPrometheusMetrics = async () => {
  const r = await fetch(`${METRICS_URL}`);
  if (!r.ok) throw new Error(`metrics HTTP ${r.status}`);
  const text = await r.text();
  // A real Prometheus exposition has '# HELP' / '# TYPE' lines.
  // If we got HTML (proxy fallback / SPA index), treat as no backend.
  if (text.startsWith('<') || (!text.includes('# HELP') && !text.includes('# TYPE'))) {
    throw new Error('metrics: invalid response (no backend)');
  }
  return text;
};

// WebSocket
export function createViewWebSocket(viewName: string, key: string | number): WebSocket {
  return new WebSocket(`${WS_URL}/ws/${viewName}/${key}`);
}

export { ADMIN_URL, EVENTS_URL, METRICS_URL, WS_URL };
