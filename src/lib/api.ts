"use client";

import { loading } from "@/components/ui/feedback";

// Klien API (browser): same-origin /api/v1 (di-proxy Next ke API Railway) + header CSRF & workspace.
// Setiap request menyalakan loading bar global.

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string[] | undefined>,
  ) {
    super(message);
  }
}

let currentWorkspace: string | null = null;
export function setApiWorkspace(id: string | null) {
  currentWorkspace = id;
}

type Envelope<T, M> = { data?: T; meta?: M; error?: { code: string; message: string; details?: Record<string, string[]> } };

async function request<T, M>(path: string, init: { method?: string; body?: unknown; workspace?: string | null; silent?: boolean }): Promise<{ data: T; meta: M }> {
  const headers: Record<string, string> = { "x-requested-with": "databridge" };
  if (init.body !== undefined) headers["content-type"] = "application/json";
  const ws = init.workspace === undefined ? currentWorkspace : init.workspace;
  if (ws) headers["x-workspace-id"] = ws;
  const done = init.silent ? () => {} : loading.start();
  try {
    let res: Response;
    try {
      res = await fetch(`/api/v1${path}`, {
        method: init.method ?? "GET",
        headers,
        body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
        credentials: "same-origin",
        cache: "no-store",
      });
    } catch {
      throw new ApiError(0, "NETWORK", "Network error");
    }
    const json = (await res.json().catch(() => null)) as Envelope<T, M> | null;
    if (!res.ok || !json || json.error) {
      const e = json?.error;
      // Ditangani WorkspaceProvider (router.replace ke /login)
      if (res.status === 401 && !path.startsWith("/auth/")) window.dispatchEvent(new Event("dbr:unauthorized"));
      throw new ApiError(res.status, e?.code ?? (res.status >= 500 ? "INTERNAL" : "UNKNOWN"), e?.message ?? `HTTP ${res.status}`, e?.details);
    }
    return { data: json.data as T, meta: json.meta as M };
  } finally {
    done();
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; workspace?: string | null; silent?: boolean } = {}): Promise<T> {
  return (await request<T, unknown>(path, init)).data;
}

/** Versi yang juga mengembalikan meta (mis. nextPageToken). */
export function apiWithMeta<T, M>(path: string) {
  return request<T, M>(path, {});
}

/** Pesan galat terlokalisasi: errors[code] → pesan API → fallback. */
export function errorMessage(e: unknown, errors: Record<string, string>): string {
  if (e instanceof ApiError) return errors[e.code] ?? e.message;
  return errors.INTERNAL ?? "Something went wrong";
}

/** Galat per field dari VALIDATION_ERROR (pesan pertama tiap field). */
export function fieldErrors(e: unknown): Record<string, string> {
  if (!(e instanceof ApiError) || !e.details) return {};
  return Object.fromEntries(Object.entries(e.details).map(([k, v]) => [k, v?.[0] ?? ""]));
}
