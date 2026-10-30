"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setApiWorkspace } from "@/lib/api";
import type { Me, Permission, Workspace } from "@/lib/types";
import type { Providers } from "@/lib/server-api";

// Konteks sesi dashboard: user, daftar workspace, workspace aktif (cookie dbr_ws) & cek izin role.

type Ctx = {
  me: Me;
  workspace: Workspace;
  can: (p: Permission) => boolean;
  switchWorkspace: (id: string) => void;
  refreshMe: () => Promise<void>;
  providers: Providers;
};

const WorkspaceContext = createContext<Ctx | null>(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace di luar <WorkspaceProvider>");
  return ctx;
}

export function WorkspaceProvider({ initialMe, activeId, providers, children }: { initialMe: Me; activeId: string; providers: Providers; children: ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState(initialMe);
  const [currentId, setCurrentId] = useState(activeId);
  // Data server baru (router.refresh) → sinkronkan saat render
  const [prev, setPrev] = useState({ initialMe, activeId });
  if (prev.initialMe !== initialMe || prev.activeId !== activeId) {
    setPrev({ initialMe, activeId });
    setMe(initialMe);
    setCurrentId(activeId);
  }
  const workspace = me.workspaces.find((w) => w.id === currentId) ?? me.workspaces[0]!;
  // Diset saat render agar request anak pertama sudah membawa X-Workspace-Id
  setApiWorkspace(workspace.id);

  // Sesi berakhir di tengah jalan (401 dari lib/api) → ke halaman login
  useEffect(() => {
    const onUnauthorized = () => router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    window.addEventListener("dbr:unauthorized", onUnauthorized);
    return () => window.removeEventListener("dbr:unauthorized", onUnauthorized);
  }, [router]);

  const switchWorkspace = useCallback(
    (id: string) => {
      document.cookie = `dbr_ws=${id}; path=/; max-age=31536000; samesite=lax`;
      setCurrentId(id);
      router.push("/dashboard");
      router.refresh();
    },
    [router],
  );

  const refreshMe = useCallback(async () => {
    setMe(await api<Me>("/auth/me", { silent: true }));
  }, []);

  const can = useCallback((p: Permission) => workspace.permissions.includes(p), [workspace]);

  return <WorkspaceContext.Provider value={{ me, workspace, can, switchWorkspace, refreshMe, providers }}>{children}</WorkspaceContext.Provider>;
}

/** Ambil data API; dimuat ulang saat workspace/path berubah. `loading` diturunkan dari kunci request
 *  (bukan setState di effect), jadi data workspace lama tidak pernah tampil di workspace baru. */
export function useApi<T>(path: string | null) {
  const { workspace } = useWorkspace();
  const [nonce, setNonce] = useState(0);
  const key = path ? `${workspace.id}|${path}|${nonce}` : null;
  const [state, setState] = useState<{ key: string | null; data: T | null; error: unknown }>({ key: null, data: null, error: null });
  useEffect(() => {
    if (!key || !path) return;
    let alive = true;
    api<T>(path)
      .then((data) => alive && setState({ key, data, error: null }))
      .catch((error) => alive && setState({ key, data: null, error }));
    return () => {
      alive = false;
    };
  }, [key, path]);
  const current = state.key === key;
  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback((fn: (d: T | null) => T | null) => setState((s) => ({ ...s, data: fn(s.data) })), []);
  return { data: current ? state.data : null, error: current ? state.error : null, loading: !!key && !current, reload, setData };
}
