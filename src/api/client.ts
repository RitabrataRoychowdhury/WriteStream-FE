// WriteStream API Client
// Clean separation for Rust backend pluggability
// Toggle between mock and real API via USE_MOCK flag

const USE_MOCK = true; // Set to false when connecting to real backend
const BASE_URL = import.meta.env.VITE_WS_API_URL || 'http://localhost:9091';
const WS_URL = import.meta.env.VITE_WS_WS_URL || 'ws://localhost:9092';

export interface ApiResponse<T> {
  data: T;
  status: number;
  ok: boolean;
}

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  if (USE_MOCK) {
    // Mock responses are handled by individual modules
    throw new Error('Use mock data generators directly when USE_MOCK is true');
  }

  const res = await fetch(`${BASE_URL}${path}`);
  const data = await res.json();
  return { data, status: res.status, ok: res.ok };
}

export async function apiPost<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  if (USE_MOCK) {
    return { data: {} as T, status: 200, ok: true };
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { data, status: res.status, ok: res.ok };
}

export async function apiPut<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  if (USE_MOCK) {
    return { data: {} as T, status: 200, ok: true };
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { data, status: res.status, ok: res.ok };
}

export async function apiDelete(path: string): Promise<ApiResponse<void>> {
  if (USE_MOCK) {
    return { data: undefined as never, status: 200, ok: true };
  }

  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE' });
  return { data: undefined as never, status: res.status, ok: res.ok };
}

export function createWebSocket(path: string): WebSocket | null {
  if (USE_MOCK) return null;
  return new WebSocket(`${WS_URL}${path}`);
}

export { USE_MOCK, BASE_URL, WS_URL };
