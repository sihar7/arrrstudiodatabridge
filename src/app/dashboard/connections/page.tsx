"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { RobloxButton, RobloxMark } from "@/components/app/Roblox";
import { EditPencil, Key, CloudSync, Plus, RefreshDouble, Trash, WarningTriangle } from "iconoir-react";
import { useApi, useWorkspace } from "@/components/app/workspace";
import { Button, Card, EmptyState, ErrorBox, PageHeader, Skeleton, StatusDot, Tag } from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { useF, useI18n } from "@/i18n/client";
import { api, errorMessage } from "@/lib/api";
import type { Connection } from "@/lib/types";

// Dialog dimuat hanya saat dibuka (lazy chunk)
const ConnectionDialog = dynamic(() => import("@/components/app/ConnectionDialog"), { ssr: false });

type DialogState = { mode: "create" | "rename" | "rotate"; connection?: Connection } | null;

export default function ConnectionsPage() {
  return (
    <Suspense>
      <Connections />
    </Suspense>
  );
}

function Connections() {
  const { t } = useI18n();
  const { can, workspace, providers } = useWorkspace();
  const f = useF();
  const toast = useToast();
  const params = useSearchParams();
  const list = useApi<Connection[]>("/connections");
  // Hasil kembali dari Roblox OAuth (?connected=id / ?error=KODE) → toast sekali
  const shown = useRef(false);
  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    const err = params.get("error");
    if (params.get("connected")) toast.success(f.roblox.connected);
    else if (err) toast.error(t.errors[err] ?? err);
  }, [params, toast, f, t.errors]);
  const connectHref = `/api/v1/auth/roblox/start?intent=connect&workspaceId=${workspace.id}`;
  const manage = can("connections.manage");
  // ?new=1 (dari aksi cepat Overview) → dialog langsung terbuka
  const [dialog, setDialog] = useState<DialogState>(() => (params.get("new") === "1" && manage ? { mode: "create" } : null));
  const c = t.connections;

  const upsert = (conn: Connection) => list.setData((d) => (d?.some((x) => x.id === conn.id) ? d.map((x) => (x.id === conn.id ? conn : x)) : [conn, ...(d ?? [])]));

  return (
    <>
      <PageHeader
        title={c.title}
        subtitle={c.subtitle}
        actions={
          manage &&
          (providers.roblox ? (
            <>
              <Button variant="ghost" icon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setDialog({ mode: "create" })}>
                {f.roblox.apiKeyAlt}
              </Button>
              <RobloxButton href={connectHref} label={f.roblox.connect} variant="primary" />
            </>
          ) : (
            <Button variant="primary" icon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setDialog({ mode: "create" })}>
              {c.add}
            </Button>
          ))
        }
      />
      {!manage && <p className="text-body-sm text-fg-3">{t.app.readOnly}</p>}

      {list.loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : list.error ? (
        <ErrorBox message={errorMessage(list.error, t.errors)} onRetry={list.reload} retry={t.common.retry} />
      ) : !list.data?.length ? (
        <EmptyState
          icon={<CloudSync />}
          title={c.emptyTitle}
          body={c.emptyBody}
          action={
            manage && (
              <div className="flex flex-col items-center gap-3">
                {providers.roblox && (
                  <>
                    <RobloxButton href={connectHref} label={f.roblox.connect} variant="primary" />
                    <p className="max-w-sm text-caption text-fg-3">{f.roblox.connectBody}</p>
                  </>
                )}
                <Button variant={providers.roblox ? "ghost" : "primary"} icon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setDialog({ mode: "create" })}>
                  {providers.roblox ? f.roblox.apiKeyAlt : c.add}
                </Button>
              </div>
            )
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.data.map((conn) => (
            <li key={conn.id}>
              <ConnectionCard
                conn={conn}
                manage={manage}
                onChanged={upsert}
                onRemoved={() => list.setData((d) => d?.filter((x) => x.id !== conn.id) ?? null)}
                onEdit={(mode) => setDialog({ mode, connection: conn })}
                reconnectHref={`${connectHref}&connectionId=${conn.id}`}
              />
            </li>
          ))}
        </ul>
      )}

      {dialog && <ConnectionDialog mode={dialog.mode} connection={dialog.connection} onClose={() => setDialog(null)} onSaved={upsert} />}
    </>
  );
}

function ConnectionCard({
  conn,
  manage,
  onChanged,
  onRemoved,
  onEdit,
  reconnectHref,
}: {
  conn: Connection;
  manage: boolean;
  onChanged: (c: Connection) => void;
  onRemoved: () => void;
  onEdit: (mode: "rename" | "rotate") => void;
  reconnectHref: string;
}) {
  const f = useF();
  const { t, locale } = useI18n();
  const toast = useToast();
  const confirm = useConfirm();
  const [testing, setTesting] = useState(false);
  const c = t.connections;
  const fmt = (d: string) => new Date(d).toLocaleString(locale === "id" ? "id-ID" : "en-US", { dateStyle: "medium", timeStyle: "short" });

  async function test() {
    setTesting(true);
    try {
      const r = await api<Connection>(`/connections/${conn.id}/test`, { method: "POST" });
      onChanged(r);
      if (r.status === "active") toast.success(c.tested, r.name);
      else toast.warning(c.testFailed, r.lastError ? (t.errors[r.lastError] ?? r.lastError) : c.status[r.status]);
    } catch (e) {
      toast.error(c.testFailed, errorMessage(e, t.errors));
    } finally {
      setTesting(false);
    }
  }

  async function remove() {
    const ok = await confirm({
      title: c.deleteTitle,
      text: c.deleteBody,
      tone: "danger",
      confirmText: t.common.delete,
      typeToConfirm: conn.name,
      preConfirm: async () => {
        try {
          await api(`/connections/${conn.id}`, { method: "DELETE" });
        } catch (e) {
          throw new Error(errorMessage(e, t.errors));
        }
      },
    });
    if (ok) {
      onRemoved();
      toast.success(t.common.delete, conn.name);
    }
  }

  const k = conn.key;
  return (
    <Card highlighted={conn.status === "active"}>
      <div className="flex flex-col gap-4 border-b border-line p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-sub font-semibold">{conn.name}</h2>
            <StatusDot status={conn.status} label={c.status[conn.status]} />
          </div>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-caption tracking-normal text-fg-3">
            <span className="flex items-center gap-1.5">
              {conn.authType === "oauth" ? <RobloxMark className="size-3.5" /> : <Key className="size-3.5" aria-hidden="true" />}
              <span className="text-fg-2">{conn.keyHint}</span>
            </span>
            {k?.name && (
              <span>
                {c.keyName}: <span className="text-fg-2">{k.name}</span>
              </span>
            )}
          </p>
        </div>
        {manage && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button size="sm" variant="secondary" loading={testing} icon={<RefreshDouble className="size-3.5" aria-hidden="true" />} onClick={test}>
              {testing ? c.testing : c.test}
            </Button>
            <Button size="sm" variant="plain" icon={<EditPencil className="size-3.5" aria-hidden="true" />} onClick={() => onEdit("rename")}>
              {c.rename}
            </Button>
            {conn.authType === "oauth" ? (
              <a href={reconnectHref} className="inline-flex h-8 items-center gap-2 rounded-md px-3 text-caption font-medium text-fg-2 hover:bg-surface-2 hover:text-fg">
                <RobloxMark className="size-3.5" />
                {f.roblox.reconnect}
              </a>
            ) : (
              <Button size="sm" variant="plain" icon={<Key className="size-3.5" aria-hidden="true" />} onClick={() => onEdit("rotate")}>
                {c.rotate}
              </Button>
            )}
            <Button size="sm" variant="plain" className="hover:text-danger" icon={<Trash className="size-3.5" aria-hidden="true" />} onClick={remove} aria-label={`${t.common.delete} ${conn.name}`}>
              {t.common.delete}
            </Button>
          </div>
        )}
      </div>

      {conn.lastError && (
        <p className="flex items-start gap-2 border-b border-line bg-danger-bg/50 px-5 py-3 text-body-sm text-danger" role="status">
          <WarningTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t.errors[conn.lastError] ?? conn.lastError}
        </p>
      )}

      <dl className="grid gap-px bg-line sm:grid-cols-3 [&>div]:bg-surface [&>div]:p-5 rounded-b-md overflow-hidden">
        <div className="flex flex-col gap-2">
          <dt className="text-caption font-medium uppercase tracking-[0.3px] text-fg-3">{c.capabilities}</dt>
          <dd className="flex flex-wrap gap-1.5">
            {k ? (
              (Object.keys(c.caps) as (keyof typeof c.caps)[]).map((cap) => (
                <Tag key={cap} tone={k.capabilities[cap] ? "green" : "neutral"} className={k.capabilities[cap] ? undefined : "line-through opacity-70"}>
                  {c.caps[cap]}
                </Tag>
              ))
            ) : (
              <span className="text-body-sm text-fg-3">—</span>
            )}
          </dd>
        </div>
        <div className="flex flex-col gap-2">
          <dt className="text-caption font-medium uppercase tracking-[0.3px] text-fg-3">{c.universes}</dt>
          <dd className="font-mono text-body-sm tracking-normal text-fg-2 [overflow-wrap:anywhere]">
            {!k ? "—" : k.universes.all ? c.allUniverses : k.universes.ids.length ? k.universes.ids.join(", ") : c.noUniverses}
          </dd>
        </div>
        <div className="flex flex-col gap-2">
          <dt className="text-caption font-medium uppercase tracking-[0.3px] text-fg-3">{c.lastTested}</dt>
          <dd className="flex flex-col gap-0.5 text-body-sm text-fg-2">
            <span>{conn.lastTestedAt ? fmt(conn.lastTestedAt) : t.common.never}</span>
            {k && (
              <span className="text-caption text-fg-3">
                {c.expires}: {k.expiresAt ? fmt(k.expiresAt) : c.noExpiry}
              </span>
            )}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
