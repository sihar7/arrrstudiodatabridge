"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, InfoCircle, NavArrowLeft, Pause, Play, RefreshDouble, Trash, Xmark } from "iconoir-react";
import { ACTIVE, MigrationStatusPill, Route } from "@/components/app/migration";
import { useWorkspace } from "@/components/app/workspace";
import { Button, Card, ErrorBox, PageHeader, PanelHeader, Skeleton, Tag, cn } from "@/components/ui";
import { ProgressBar, useConfirm, useToast } from "@/components/ui/feedback";
import { useF, useI18n } from "@/i18n/client";
import { api, apiWithMeta, errorMessage } from "@/lib/api";
import type { Migration, MigrationItem, MigrationLog } from "@/lib/types";

type Progress = Migration & { recentLogs: MigrationLog[] };
const ITEM_FILTERS = ["", "success", "skipped", "conflict", "failed", "pending"] as const;
const PAGE = 50;

export default function MigrationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useI18n();
  const f = useF();
  const m = f.mig;
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { can } = useWorkspace();
  const manage = can("migrations.run");
  const [data, setData] = useState<Progress | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Polling progres (MVP, PRD §8): 1,5 dtk saat aktif; berhenti saat tab tersembunyi
  useEffect(() => {
    let alive = true;
    api<Progress>(`/migrations/${id}/progress`, { silent: true })
      .then((d) => alive && (setData(d), setLoadError(null)))
      .catch((e) => alive && setLoadError(e));
    return () => {
      alive = false;
    };
  }, [id, tick]);
  const active = !!data && ACTIVE.includes(data.status);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") setTick((n) => n + 1);
    }, 1500);
    return () => clearInterval(timer);
  }, [active]);

  async function act(action: "dry-run" | "start" | "pause" | "resume" | "cancel" | "retry-failed", body?: unknown) {
    setBusy(action);
    try {
      await api(`/migrations/${id}/${action}`, { method: "POST", body });
      setTick((n) => n + 1);
    } catch (e) {
      toast.error(errorMessage(e, t.errors));
    } finally {
      setBusy(null);
    }
  }

  async function start() {
    if (!data) return;
    const overwrite = data.conflictStrategy === "overwrite";
    const ok = await confirm({
      title: overwrite ? m.overwriteTitle : m.startTitle,
      text: (
        <>
          {overwrite ? m.overwriteBody : m.startBody}
          <span className="mt-2 block text-warn">{m.issues.LIVE_DATA}</span>
        </>
      ),
      tone: overwrite ? "danger" : "warning",
      confirmText: m.start,
      typeToConfirm: overwrite ? "OVERWRITE" : undefined,
      typeToConfirmLabel: m.typeOverwrite,
    });
    if (ok) await act("start", overwrite ? { confirm: "OVERWRITE" } : {});
  }

  async function cancel() {
    const ok = await confirm({ title: m.cancelTitle, text: m.cancelBody, tone: "danger", confirmText: m.cancel });
    if (ok) await act("cancel");
  }

  async function remove() {
    const ok = await confirm({
      title: m.deleteTitle,
      text: m.deleteBody,
      tone: "danger",
      confirmText: m.delete,
      preConfirm: async () => {
        try {
          await api(`/migrations/${id}`, { method: "DELETE" });
        } catch (e) {
          throw new Error(errorMessage(e, t.errors));
        }
      },
    });
    if (ok) router.push("/dashboard/migrations");
  }

  if (loadError && !data) {
    return (
      <>
        <BackLink label={m.back} />
        <ErrorBox message={errorMessage(loadError, t.errors)} onRetry={() => setTick((n) => n + 1)} retry={t.common.retry} />
      </>
    );
  }
  if (!data) {
    return (
      <>
        <BackLink label={m.back} />
        <Skeleton className="h-24" />
        <Skeleton className="h-48" />
      </>
    );
  }

  const p = data.progress;
  const finished = ["completed", "completed_with_errors", "cancelled", "failed"].includes(data.status);
  const dryDone = data.dryRun && finished && !!data.lastDryRunAt;
  const fmt = (d: string | null) => (d ? new Date(d).toLocaleString(locale === "id" ? "id-ID" : "en-US", { dateStyle: "medium", timeStyle: "short" }) : "—");

  return (
    <>
      <BackLink label={m.back} />
      <PageHeader
        title={data.name}
        subtitle={data.projectName}
        actions={
          manage && (
            <div className="flex flex-wrap gap-2">
              {(data.status === "running" || data.status === "queued") && (
                <>
                  <Button variant="secondary" icon={<Pause className="size-4" aria-hidden="true" />} loading={busy === "pause"} onClick={() => act("pause")}>
                    {m.pause}
                  </Button>
                  <Button variant="plain" className="hover:text-danger" icon={<Xmark className="size-4" aria-hidden="true" />} onClick={cancel}>
                    {m.cancel}
                  </Button>
                </>
              )}
              {data.status === "paused" && (
                <>
                  <Button variant="primary" icon={<Play className="size-4" aria-hidden="true" />} loading={busy === "resume"} onClick={() => act("resume")}>
                    {m.resume}
                  </Button>
                  <Button variant="plain" className="hover:text-danger" icon={<Xmark className="size-4" aria-hidden="true" />} onClick={cancel}>
                    {m.cancel}
                  </Button>
                </>
              )}
              {(data.status === "draft" || finished) && (
                <>
                  <Button variant={dryDone ? "secondary" : "primary"} loading={busy === "dry-run"} onClick={() => act("dry-run")}>
                    {m.runDry}
                  </Button>
                  {dryDone && (
                    <Button variant="primary" loading={busy === "start"} onClick={start}>
                      {m.start}
                    </Button>
                  )}
                  {!data.dryRun && p.failed > 0 && (
                    <Button variant="secondary" icon={<RefreshDouble className="size-4" aria-hidden="true" />} loading={busy === "retry-failed"} onClick={() => act("retry-failed")}>
                      {m.retry}
                    </Button>
                  )}
                  <Button variant="plain" className="hover:text-danger" icon={<Trash className="size-4" aria-hidden="true" />} onClick={remove} aria-label={m.delete} />
                </>
              )}
            </div>
          )
        }
      />

      <Card className="flex flex-col gap-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <MigrationStatusPill status={data.status} dryRun={data.dryRun} />
          <span className="font-mono text-caption tracking-normal text-fg-3">
            {m.started}: {fmt(data.startedAt)} · {m.finished}: {fmt(data.finishedAt)}
          </span>
        </div>
        <Route source={data.source} destination={data.destination} />
      </Card>

      {data.status === "draft" && (
        <Callout icon={<InfoCircle className="size-4 text-link" />} text={m.dryFirst} />
      )}
      {dryDone && data.status !== "failed" && <Callout icon={<CheckCircle className="size-4 text-signal" />} text={m.dryDone} tone="ok" />}
      {data.lastError && <Callout icon={<Xmark className="size-4 text-danger" />} text={data.lastError} tone="err" />}

      <Card>
        <PanelHeader
          right={
            <span className="font-mono text-caption tracking-normal text-fg-2 tabular">
              {p.keysPerSecond} {m.speed}
            </span>
          }
        >
          {data.dryRun ? m.dry : m.real}
          {data.currentOperation && <span className="ml-2 normal-case text-fg-3">· {m.operation[data.currentOperation] ?? data.currentOperation}</span>}
        </PanelHeader>
        <div className="flex flex-col gap-5 p-5">
          <ProgressBar
            value={p.enumerating && data.status === "running" ? undefined : p.percentage}
            label={p.enumerating && data.status === "running" ? m.enumerating : m.progress}
            showValue
            tone={p.failed ? "danger" : "signal"}
          />
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
            {[
              [m.total, p.total, "text-fg"],
              [m.processed, p.processed, "text-fg"],
              [data.dryRun ? m.wouldWrite : m.success, p.success, "text-signal"],
              [m.skipped, p.skipped, "text-fg-2"],
              [m.conflicts, p.conflicts, "text-warn"],
              [m.failed, p.failed, "text-danger"],
            ].map(([label, value, cls]) => (
              <div key={String(label)} className="flex flex-col gap-1 bg-surface p-4">
                <dt className="text-caption text-fg-3">{label}</dt>
                <dd className={cn("font-display text-[24px] font-bold leading-none tabular", String(cls))} aria-live="polite">
                  {Number(value).toLocaleString()}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <ItemsTable id={id} refreshKey={data.progress.processed + data.status} />
        <Card>
          <PanelHeader>{m.logs}</PanelHeader>
          <ol className="flex max-h-[420px] flex-col divide-y divide-line overflow-y-auto">
            {data.recentLogs.map((l) => (
              <li key={l.id} className="flex gap-3 px-4 py-2.5">
                <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", l.level === "error" ? "bg-danger" : l.level === "warn" ? "bg-warn" : "bg-fg-3")} aria-hidden="true" />
                <span className="flex min-w-0 flex-col">
                  <span className="text-body-sm text-fg-2 [overflow-wrap:anywhere]">{l.message}</span>
                  <time className="font-mono text-caption tracking-normal text-fg-3">{new Date(l.createdAt).toLocaleTimeString(locale === "id" ? "id-ID" : "en-US")}</time>
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}

function ItemsTable({ id, refreshKey }: { id: string; refreshKey: string | number }) {
  const { t } = useI18n();
  const f = useF();
  const m = f.mig;
  const [filter, setFilter] = useState<(typeof ITEM_FILTERS)[number]>("");
  const [offset, setOffset] = useState(0);
  const [state, setState] = useState<{ rows: MigrationItem[]; total: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    apiWithMeta<MigrationItem[], { total: number }>(`/migrations/${id}/items?limit=${PAGE}&offset=${offset}${filter ? `&status=${filter}` : ""}`)
      .then((r) => alive && (setState({ rows: r.data, total: r.meta.total }), setErr(null)))
      .catch((e) => alive && setErr(errorMessage(e, t.errors)));
    return () => {
      alive = false;
    };
  }, [id, filter, offset, refreshKey, t.errors]);

  return (
    <Card className="min-w-0">
      <PanelHeader>{m.items}</PanelHeader>
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2">
        {ITEM_FILTERS.map((k) => (
          <button
            key={k || "all"}
            role="tab"
            aria-selected={filter === k}
            onClick={() => {
              setFilter(k);
              setOffset(0);
            }}
            className={cn("h-8 shrink-0 rounded-xs px-3 text-caption font-medium", filter === k ? "bg-surface-3 text-fg" : "text-fg-2 hover:text-fg")}
          >
            {k ? m.itemStatus[k] : m.filterAll}
          </button>
        ))}
      </div>
      {err ? (
        <p className="p-4 text-body-sm text-danger">{err}</p>
      ) : !state ? (
        <div className="flex flex-col gap-2 p-4">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
      ) : !state.rows.length ? (
        <p className="px-4 py-8 text-center text-body-sm text-fg-3">{m.noItems}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-body-sm">
            <thead className="text-caption uppercase tracking-[0.3px] text-fg-3">
              <tr className="border-b border-line">
                <th scope="col" className="px-4 py-2 font-medium">{m.sourceKey}</th>
                <th scope="col" className="px-4 py-2 font-medium">{m.destKey}</th>
                <th scope="col" className="px-4 py-2 font-medium">Status</th>
                <th scope="col" className="px-4 py-2 font-medium">{m.size}</th>
              </tr>
            </thead>
            <tbody>
              {state.rows.map((it) => (
                <tr key={it.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-2.5 font-mono tracking-normal">{it.sourceKey}</td>
                  <td className="px-4 py-2.5 font-mono tracking-normal text-fg-2">{it.destinationKey}</td>
                  <td className="px-4 py-2.5">
                    <span className="flex flex-col gap-0.5">
                      <Tag tone={it.status === "success" ? "green" : it.status === "failed" ? "danger" : it.status === "conflict" ? "warn" : "neutral"}>{m.itemStatus[it.status] ?? it.status}</Tag>
                      {it.errorCode && (
                        <span className="max-w-56 truncate text-caption text-fg-3" title={it.errorMessage ?? undefined}>
                          {m.errorCodes[it.errorCode] ?? it.errorCode}
                          {it.errorMessage && ` · ${it.errorMessage}`}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-caption tracking-normal text-fg-3 tabular">{it.size != null ? `${(it.size / 1024).toFixed(1)} KB` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {state && state.total > PAGE && (
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-caption text-fg-3">
          <span className="tabular">
            {offset + 1}–{Math.min(offset + PAGE, state.total)} / {state.total}
          </span>
          <span className="flex gap-2">
            <Button size="sm" variant="ghost" disabled={offset === 0} onClick={() => setOffset((o) => Math.max(0, o - PAGE))}>
              ‹
            </Button>
            <Button size="sm" variant="ghost" disabled={offset + PAGE >= state.total} onClick={() => setOffset((o) => o + PAGE)}>
              ›
            </Button>
          </span>
        </div>
      )}
    </Card>
  );
}

function Callout({ icon, text, tone = "info" }: { icon: React.ReactNode; text: string; tone?: "info" | "ok" | "err" }) {
  return (
    <p className={cn("flex items-start gap-2 rounded-md border px-4 py-3 text-body-sm", tone === "ok" ? "border-moss bg-fern text-fg" : tone === "err" ? "border-danger-edge bg-danger-bg text-danger" : "border-line bg-surface text-fg-2")}>
      <span className="mt-0.5 shrink-0" aria-hidden="true">
        {icon}
      </span>
      {text}
    </p>
  );
}

function BackLink({ label }: { label: string }) {
  return (
    <Link href="/dashboard/migrations" className="-mb-4 flex w-fit items-center gap-1 text-body-sm text-fg-2 hover:text-fg">
      <NavArrowLeft className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
