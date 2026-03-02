/**
 * Standalone API client for app-ui when running outside the shell (local dev).
 * In production (inside beacon-tenant shell), beaconApiAliasPlugin redirects this
 * import to shell's api.ts, which handles auth, tenant gating, and URL routing.
 *
 * Usage: import api from '../api';
 *        const res = await api.get<MyType>('/api/my-resource');
 *        // res.data is typed as MyType
 */

const BASE = (import.meta.env?.VITE_APP_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

const api = {
  async get<T>(url: string): Promise<{ data: T }> {
    const res = await fetch(BASE + url, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { data: (await res.json()) as T };
  },
  async post<T>(url: string, body?: unknown): Promise<{ data: T }> {
    const res = await fetch(BASE + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { data: (await res.json()) as T };
  },
  async put<T>(url: string, body?: unknown): Promise<{ data: T }> {
    const res = await fetch(BASE + url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { data: (await res.json()) as T };
  },
  async delete<T = void>(url: string): Promise<{ data: T }> {
    const res = await fetch(BASE + url, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return { data: (text ? JSON.parse(text) : undefined) as T };
  },
};

export default api;
