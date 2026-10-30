"use client";

import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/app/Roblox";
import { Button, Card, Dialog, ErrorBox, Field, Input, PageHeader, PanelHeader, Select, Skeleton, Tag, Textarea, cn } from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { fmt, useF, useI18n } from "@/i18n/client";
import { api, errorMessage } from "@/lib/api";
import type { Order } from "@/lib/types";

// Panel admin: ringkasan · order QRIS (bukti, setujui/tolak) · workspace (ubah paket) · user · migrasi · sistem.

type Tab = "overview" | "orders" | "workspaces" | "users" | "migrations" | "system";
const TABS: Tab[] = ["overview", "orders", "workspaces", "users", "migrations", "system"];
const rupiah = (n: number) => `Rp${n.toLocaleString("id-ID")}`;

function useAdmin<T>(path: string) {
  const [state, setState] = useState<{ path: string; nonce: number; data: T | null; error: unknown } | null>(null);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let alive = true;
    api<T>(path, { workspace: null })
      .then((data) => alive && setState({ path, nonce, data, error: null }))
      .catch((error) => alive && setState({ path, nonce, data: null, error }));
    return () => {
      alive = false;
    };
  }, [path, nonce]);
  const current = state?.path === path;
  return { data: current ? state.data : null, error: current ? state.error : null, loading: !current || state?.nonce !== nonce, reload: useCallback(() => setNonce((n) => n + 1), []) };
}

export default function AdminPage() {
  const f = useF();
  const a = f.admin;
  const [tab, setTab] = useState<Tab>("overview");
  return (
    <>
      <PageHeader title={a.title} subtitle={a.subtitle} />
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn("-mb-px h-10 shrink-0 border-b-2 px-3 text-body-sm font-medium", tab === k ? "border-signal text-fg" : "border-transparent text-fg-2 hover:text-fg")}
          >
            {a.tabs[k]}
          </button>
        ))}
      </div>
      {tab === "overview" && <Overview onOrders={() => setTab("orders")} />}
      {tab === "orders" && <Orders />}
      {tab === "workspaces" && <Workspaces />}
      {tab === "users" && <Users />}
      {tab === "migrations" && <Migrations />}
      {tab === "system" && <System />}
    </>
  );
}

function Overview({ onOrders }: { onOrders: () => void }) {
  const { t } = useI18n();
  const f = useF();
  const a = f.admin;
  const s = useAdmin<{ users: number; workspaces: number; plans: Record<string, number>; migrations: Record<string, number>; pendingOrders: number; revenueIdr: number }>("/admin/stats");
  if (s.loading) return <Skeleton className="h-40" />;
  if (s.error || !s.data) return <ErrorBox message={errorMessage(s.error, t.errors)} onRetry={s.reload} retry={t.common.retry} />;
  const d = s.data;
  return (
    <>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-4">
        {[
          [a.users, d.users],
          [a.workspaces, d.workspaces],
          [a.pending, d.pendingOrders],
          [a.revenue, rupiah(d.revenueIdr)],
        ].map(([k, v]) => (
          <div key={String(k)} className="flex flex-col gap-2 bg-surface p-5">
            <span className="text-caption uppercase tracking-[0.3px] text-fg-3">{k}</span>
            <span className="font-display text-[28px] font-bold leading-none tracking-display tabular">{v}</span>
          </div>
        ))}
      </div>
      {d.pendingOrders > 0 && (
        <button onClick={onOrders} className="w-fit rounded-md border border-warn-edge bg-warn-bg px-4 py-2.5 text-body-sm text-warn hover:brightness-125">
          {a.pending}: {d.pendingOrders} →
        </button>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Breakdown title={a.plan} data={d.plans} />
        <Breakdown title={a.migrations} data={d.migrations} labels={f.mig.status} />
      </div>
    </>
  );
}

function Breakdown({ title, data, labels }: { title: string; data: Record<string, number>; labels?: Record<string, string> }) {
  const total = Object.values(data).reduce((x, y) => x + y, 0) || 1;
  return (
    <Card>
      <PanelHeader>{title}</PanelHeader>
      <ul className="flex flex-col gap-3 p-4">
        {Object.entries(data).map(([k, v]) => (
          <li key={k} className="flex flex-col gap-1">
            <span className="flex justify-between text-body-sm">
              <span>{labels?.[k] ?? k}</span>
              <span className="font-mono tabular text-fg-2">{v}</span>
            </span>
            <span className="h-1 overflow-hidden rounded-xs bg-surface-3">
              <span className="block h-full bg-signal" style={{ width: `${(v / total) * 100}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

type AdminOrder = Order & { workspaceName: string; userName: string | null; userEmail: string | null };

function Orders() {
  const { t, locale } = useI18n();
  const f = useF();
  const a = f.admin;
  const toast = useToast();
  const confirm = useConfirm();
  const [status, setStatus] = useState("awaiting_review");
  const list = useAdmin<AdminOrder[]>(`/admin/orders${status ? `?status=${status}` : ""}`);
  const [proof, setProof] = useState<AdminOrder | null>(null);
  const [rejecting, setRejecting] = useState<AdminOrder | null>(null);

  async function approve(o: AdminOrder) {
    const ok = await confirm({
      title: `${a.approve} · ${o.workspaceName}`,
      text: `${o.plan} · ${fmt(f.billing.month, { n: o.months })} · ${rupiah(o.amountIdr)}`,
      tone: "success",
      confirmText: a.approve,
      preConfirm: async () => {
        try {
          await api(`/admin/orders/${o.id}/approve`, { method: "POST", workspace: null });
        } catch (e) {
          throw new Error(errorMessage(e, t.errors));
        }
      },
    });
    if (ok) {
      toast.success(a.approved, o.workspaceName);
      list.reload();
    }
  }

  return (
    <>
      <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-60" aria-label="Status">
        <option value="">{f.mig.filterAll}</option>
        {Object.entries(f.billing.orderStatus).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </Select>
      <Card>
        {list.loading ? (
          <div className="p-4">
            <Skeleton className="h-24" />
          </div>
        ) : !list.data?.length ? (
          <p className="px-4 py-8 text-center text-body-sm text-fg-3">{f.billing.noOrders}</p>
        ) : (
          <ul className="divide-y divide-line">
            {list.data.map((o) => (
              <li key={o.id} className="flex flex-col gap-3 px-4 py-3.5 md:flex-row md:items-center md:justify-between">
                <span className="flex flex-col gap-0.5">
                  <span className="text-body-sm font-medium">
                    {o.workspaceName} · <span className="capitalize">{o.plan}</span> · {fmt(f.billing.month, { n: o.months })}
                  </span>
                  <span className="font-mono text-caption tracking-normal text-fg-3">
                    {rupiah(o.amountIdr)} (kode {o.uniqueCode}) · {o.userName ?? "—"} {o.userEmail ? `· ${o.userEmail}` : ""} · {new Date(o.createdAt).toLocaleString(locale === "id" ? "id-ID" : "en-US")}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  <Tag tone={o.status === "paid" ? "green" : o.status === "awaiting_review" ? "warn" : o.status === "rejected" ? "danger" : "neutral"}>{f.billing.orderStatus[o.status]}</Tag>
                  <Button size="sm" variant="ghost" disabled={!o.hasProof} onClick={() => setProof(o)}>
                    {o.hasProof ? a.proof : a.noProof}
                  </Button>
                  {(o.status === "awaiting_review" || o.status === "pending") && (
                    <>
                      <Button size="sm" variant="primary" onClick={() => approve(o)}>
                        {a.approve}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setRejecting(o)}>
                        {a.reject}
                      </Button>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {proof && (
        <Dialog open onClose={() => setProof(null)} title={`${a.proof} · ${proof.workspaceName}`} description={rupiah(proof.amountIdr)} size="lg">
          {/* eslint-disable-next-line @next/next/no-img-element -- bukti dilayani API admin (privat, no-store) */}
          <img src={`/api/v1/admin/orders/${proof.id}/proof`} alt={a.proof} className="mx-auto max-h-[70dvh] rounded-md border border-line" />
        </Dialog>
      )}
      {rejecting && (
        <RejectDialog
          order={rejecting}
          onClose={() => setRejecting(null)}
          onDone={() => {
            toast.success(a.rejected);
            setRejecting(null);
            list.reload();
          }}
        />
      )}
    </>
  );
}

function RejectDialog({ order, onClose, onDone }: { order: AdminOrder; onClose: () => void; onDone: () => void }) {
  const { t } = useI18n();
  const f = useF();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog
      open
      onClose={onClose}
      title={`${f.admin.reject} · ${order.workspaceName}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button
            variant="danger"
            loading={busy}
            disabled={!note.trim()}
            onClick={async () => {
              setBusy(true);
              try {
                await api(`/admin/orders/${order.id}/reject`, { method: "POST", body: { note }, workspace: null });
                onDone();
              } catch (e) {
                setError(errorMessage(e, t.errors));
                setBusy(false);
              }
            }}
          >
            {f.admin.reject}
          </Button>
        </>
      }
    >
      <Field label={f.admin.rejectNote} error={error ?? undefined}>
        {(id) => <Textarea id={id} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} autoFocus />}
      </Field>
    </Dialog>
  );
}

type AdminWs = { id: string; name: string; slug: string; plan: string; effectivePlan: string; planExpiresAt: string | null; members: number; connections: number; migrations: number; createdAt: string };

function Workspaces() {
  const { t, locale } = useI18n();
  const f = useF();
  const a = f.admin;
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const list = useAdmin<AdminWs[]>(`/admin/workspaces${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  const [editing, setEditing] = useState<AdminWs | null>(null);
  return (
    <>
      <SearchBox value={q} onChange={setQ} onSubmit={() => setQuery(q.trim())} label={a.search} />
      <Card>
        {list.loading ? (
          <div className="p-4">
            <Skeleton className="h-24" />
          </div>
        ) : list.error ? (
          <div className="p-4">
            <ErrorBox message={errorMessage(list.error, t.errors)} onRetry={list.reload} retry={t.common.retry} />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {list.data?.map((w) => (
              <li key={w.id} className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between">
                <span className="flex flex-col">
                  <span className="text-body-sm font-medium">{w.name}</span>
                  <span className="font-mono text-caption tracking-normal text-fg-3">
                    {a.members} {w.members} · {a.connections} {w.connections} · {a.migrations} {w.migrations}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Tag tone={w.effectivePlan === "free" ? "neutral" : "green"}>{w.effectivePlan}</Tag>
                  {w.planExpiresAt && (
                    <span className="text-caption text-fg-3">
                      {a.expires} {new Date(w.planExpiresAt).toLocaleDateString(locale === "id" ? "id-ID" : "en-US")}
                    </span>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setEditing(w)}>
                    {a.setPlan}
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {editing && <PlanDialog ws={editing} onClose={() => setEditing(null)} onDone={() => (setEditing(null), list.reload())} />}
    </>
  );
}

function PlanDialog({ ws, onClose, onDone }: { ws: AdminWs; onClose: () => void; onDone: () => void }) {
  const { t } = useI18n();
  const f = useF();
  const toast = useToast();
  const [plan, setPlan] = useState(ws.plan);
  const [until, setUntil] = useState(ws.planExpiresAt ? ws.planExpiresAt.slice(0, 10) : "");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      open
      onClose={onClose}
      title={`${f.admin.setPlan} · ${ws.name}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button
            variant="primary"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api(`/admin/workspaces/${ws.id}`, { method: "PATCH", body: { plan, planExpiresAt: until ? new Date(`${until}T23:59:59`).toISOString() : null }, workspace: null });
                toast.success(t.settings.saved);
                onDone();
              } catch (e) {
                toast.error(errorMessage(e, t.errors));
                setBusy(false);
              }
            }}
          >
            {t.common.save}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label={f.admin.plan}>
          {(id) => (
            <Select id={id} value={plan} onChange={(e) => setPlan(e.target.value)}>
              {["free", "developer", "studio", "enterprise"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {plan !== "free" && <Field label={f.admin.expires} hint={f.billing.noExpiry}>{(id) => <Input id={id} type="date" value={until} onChange={(e) => setUntil(e.target.value)} />}</Field>}
      </div>
    </Dialog>
  );
}

function Users() {
  const { t, locale } = useI18n();
  const f = useF();
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const list = useAdmin<{ id: string; name: string; email: string | null; robloxUsername: string | null; robloxAvatarUrl: string | null; createdAt: string; workspaces: number }[]>(
    `/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`,
  );
  return (
    <>
      <SearchBox value={q} onChange={setQ} onSubmit={() => setQuery(q.trim())} label={f.admin.search} />
      <Card>
        {list.loading ? (
          <div className="p-4">
            <Skeleton className="h-24" />
          </div>
        ) : list.error ? (
          <div className="p-4">
            <ErrorBox message={errorMessage(list.error, t.errors)} onRetry={list.reload} retry={t.common.retry} />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {list.data?.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar src={u.robloxAvatarUrl} name={u.name} size={32} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-body-sm font-medium">{u.name}</span>
                    <span className="truncate text-caption text-fg-3">
                      {u.email ?? ""}
                      {u.robloxUsername ? `${u.email ? " · " : ""}@${u.robloxUsername}` : ""}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 font-mono text-caption tracking-normal text-fg-3">
                  {u.workspaces} ws · {new Date(u.createdAt).toLocaleDateString(locale === "id" ? "id-ID" : "en-US")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function Migrations() {
  const { t, locale } = useI18n();
  const f = useF();
  const list = useAdmin<{ id: string; name: string; status: string; dryRun: boolean; totalKeys: number; processed: number; failedCount: number; lastError: string | null; createdAt: string; workspaceName: string }[]>("/admin/migrations");
  return (
    <Card>
      {list.loading ? (
        <div className="p-4">
          <Skeleton className="h-24" />
        </div>
      ) : list.error ? (
        <div className="p-4">
          <ErrorBox message={errorMessage(list.error, t.errors)} onRetry={list.reload} retry={t.common.retry} />
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {list.data?.map((m) => (
            <li key={m.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex flex-col">
                <span className="text-body-sm font-medium">
                  {m.name} <span className="text-fg-3">· {m.workspaceName}</span>
                </span>
                {m.lastError && <span className="text-caption text-danger">{m.lastError}</span>}
              </span>
              <span className="flex items-center gap-2 font-mono text-caption tracking-normal text-fg-3">
                {m.dryRun && <Tag tone="violet">{f.mig.dry}</Tag>}
                <Tag tone={m.status === "completed" ? "green" : m.status === "failed" ? "danger" : "neutral"}>{f.mig.status[m.status] ?? m.status}</Tag>
                {m.processed}/{m.totalKeys} · {m.failedCount} ✕ · {new Date(m.createdAt).toLocaleDateString(locale === "id" ? "id-ID" : "en-US")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function System() {
  const { t } = useI18n();
  const f = useF();
  const s = useAdmin<Record<string, string | number | boolean | null>>("/admin/system");
  if (s.loading) return <Skeleton className="h-40" />;
  if (s.error || !s.data) return <ErrorBox message={errorMessage(s.error, t.errors)} onRetry={s.reload} retry={t.common.retry} />;
  return (
    <dl className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(s.data).map(([k, v]) => (
        <div key={k} className="flex flex-col gap-1 bg-surface p-4">
          <dt className="text-caption text-fg-3">{f.admin.system[k] ?? k}</dt>
          <dd className={cn("font-mono text-body-sm tracking-normal", v === false || v === null ? "text-warn" : "text-fg")}>{v === true ? "✓" : v === false ? "✕" : String(v ?? "—")}</dd>
        </div>
      ))}
    </dl>
  );
}

function SearchBox({ value, onChange, onSubmit, label }: { value: string; onChange: (v: string) => void; onSubmit: () => void; label: string }) {
  return (
    <form
      className="flex max-w-md gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={label} aria-label={label} />
      <Button type="submit" variant="secondary">
        {label}
      </Button>
    </form>
  );
}
