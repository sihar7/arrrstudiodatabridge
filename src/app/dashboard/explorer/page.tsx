"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Copy, Database, Download, Search } from "iconoir-react";
import { useApi } from "@/components/app/workspace";
import { Button, Card, EmptyState, ErrorBox, Input, PageHeader, PanelHeader, Skeleton, Spinner, cn } from "@/components/ui";
import { useToast } from "@/components/ui/feedback";
import { useF, useI18n } from "@/i18n/client";
import { api, apiWithMeta, errorMessage } from "@/lib/api";
import type { Side } from "@/lib/types";

// Data Explorer read-only (PRD §8): sidebar DataStore · daftar key + filter prefix · pratinjau JSON & metadata.

type Cfg = Side & { projectName: string };
type Entry = {
  key: string;
  value: unknown;
  users: string[];
  attributes: Record<string, unknown> | null;
  revisionId: string | null;
  createTime: string | null;
  revisionCreateTime: string | null;
  size: number;
  checksum: string;
};

export default function ExplorerPage() {
  const { t } = useI18n();
  const f = useF();
  const x = f.explorer;
  const configs = useApi<Cfg[]>("/explorer/configs");
  const [cfgId, setCfgId] = useState<string | null>(null);
  const active = cfgId ?? configs.data?.[0]?.id ?? null;

  const groups = useMemo(() => {
    const g = new Map<string, Cfg[]>();
    for (const c of configs.data ?? []) g.set(c.projectName, [...(g.get(c.projectName) ?? []), c]);
    return [...g];
  }, [configs.data]);

  return (
    <>
      <PageHeader title={x.title} subtitle={x.subtitle} />
      {configs.loading ? (
        <Skeleton className="h-96" />
      ) : configs.error ? (
        <ErrorBox message={errorMessage(configs.error, t.errors)} onRetry={configs.reload} retry={t.common.retry} />
      ) : !configs.data?.length ? (
        <EmptyState
          icon={<Database />}
          title={x.noConfigs}
          body={t.datastores.emptyBody}
          action={
            <Link href="/dashboard/projects" className="text-body-sm text-link hover:underline">
              {t.app.nav.projects}
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[220px_280px_1fr]">
          <Card className="lg:max-h-[640px] lg:overflow-y-auto">
            <PanelHeader>{x.datastores}</PanelHeader>
            <nav className="flex flex-col gap-3 p-2" aria-label={x.datastores}>
              {groups.map(([project, list]) => (
                <div key={project} className="flex flex-col gap-0.5">
                  <p className="px-2 pt-1 text-caption uppercase tracking-[0.3px] text-fg-3">{project}</p>
                  {list.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCfgId(c.id)}
                      aria-current={active === c.id ? "true" : undefined}
                      className={cn("flex flex-col rounded-xs px-2 py-1.5 text-left", active === c.id ? "bg-surface-3" : "hover:bg-surface-2")}
                    >
                      <span className="truncate text-body-sm font-medium">{c.label}</span>
                      <span className="truncate font-mono text-caption tracking-normal text-lilac">
                        {c.datastoreName}
                        <span className="text-fg-3"> › {c.scope}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </nav>
          </Card>
          {active && <KeysAndEntry key={active} configId={active} />}
        </div>
      )}
    </>
  );
}

function KeysAndEntry({ configId }: { configId: string }) {
  const { t, locale } = useI18n();
  const f = useF();
  const x = f.explorer;
  const toast = useToast();
  const [prefix, setPrefix] = useState("");
  const [query, setQuery] = useState("");
  const [keys, setKeys] = useState<{ q: string; items: string[]; next: string | null } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [entry, setEntry] = useState<{ key: string; data: Entry | null; error: string | null } | null>(null);

  // Muat key saat filter prefix diterapkan (setState di callback async)
  useEffect(() => {
    let alive = true;
    apiWithMeta<string[], { nextPageToken: string | null }>(`/explorer/${configId}/keys${query ? `?prefix=${encodeURIComponent(query)}` : ""}`)
      .then((r) => alive && (setKeys({ q: query, items: r.data, next: r.meta.nextPageToken }), setErr(null)))
      .catch((e) => alive && setErr(errorMessage(e, t.errors)));
    return () => {
      alive = false;
    };
  }, [configId, query, t.errors]);

  useEffect(() => {
    if (!selected) return;
    let alive = true;
    api<Entry>(`/explorer/${configId}/entry?key=${encodeURIComponent(selected)}`)
      .then((d) => alive && setEntry({ key: selected, data: d, error: null }))
      .catch((e) => alive && setEntry({ key: selected, data: null, error: errorMessage(e, t.errors) }));
    return () => {
      alive = false;
    };
  }, [configId, selected, t.errors]);

  async function more() {
    if (!keys?.next) return;
    setLoadingMore(true);
    try {
      const r = await apiWithMeta<string[], { nextPageToken: string | null }>(`/explorer/${configId}/keys?pageToken=${encodeURIComponent(keys.next)}${query ? `&prefix=${encodeURIComponent(query)}` : ""}`);
      setKeys((k) => (k ? { ...k, items: [...k.items, ...r.data], next: r.meta.nextPageToken } : k));
    } catch (e) {
      toast.error(errorMessage(e, t.errors));
    } finally {
      setLoadingMore(false);
    }
  }

  const json = entry?.data ? JSON.stringify(entry.data.value, null, 2) : "";
  const loadingKeys = !keys || keys.q !== query;
  const loadingEntry = !!selected && entry?.key !== selected;

  function exportJson() {
    if (!entry?.data) return;
    const blob = new Blob([JSON.stringify({ key: entry.data.key, value: entry.data.value, users: entry.data.users, attributes: entry.data.attributes }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${entry.data.key}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <Card className="flex min-h-[320px] flex-col lg:max-h-[640px]">
        <PanelHeader>{x.keys}</PanelHeader>
        <form
          className="flex gap-2 border-b border-line p-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(prefix.trim());
          }}
        >
          <Input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder={x.search} mono className="h-9" aria-label={x.search} />
          <Button type="submit" size="sm" variant="secondary" className="h-9" aria-label={t.common.search} icon={<Search className="size-4" aria-hidden="true" />} />
        </form>
        <div className="flex-1 overflow-y-auto">
          {err ? (
            <p className="p-3 text-body-sm text-danger">{err}</p>
          ) : loadingKeys ? (
            <div className="flex flex-col gap-1.5 p-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-7" />
              ))}
            </div>
          ) : !keys.items.length ? (
            <p className="p-4 text-center text-body-sm text-fg-3">{x.empty}</p>
          ) : (
            <ul className="flex flex-col p-1">
              {keys.items.map((k) => (
                <li key={k}>
                  <button
                    onClick={() => setSelected(k)}
                    aria-current={selected === k ? "true" : undefined}
                    className={cn("w-full truncate rounded-xs px-2 py-1.5 text-left font-mono text-body-sm tracking-normal", selected === k ? "bg-fern text-signal" : "text-fg hover:bg-surface-2")}
                  >
                    {k}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {keys?.next && (
          <button onClick={more} disabled={loadingMore} className="flex items-center justify-center gap-2 border-t border-line px-3 py-2 text-body-sm text-link hover:bg-surface-2">
            {loadingMore && <Spinner className="size-3.5" />}
            {t.common.loadMore}
          </button>
        )}
      </Card>

      <Card className="flex min-w-0 flex-col lg:max-h-[640px]">
        <PanelHeader
          right={
            entry?.data && (
              <span className="flex gap-1">
                <Button
                  size="sm"
                  variant="plain"
                  icon={<Copy className="size-3.5" aria-hidden="true" />}
                  onClick={async () => {
                    await navigator.clipboard.writeText(json);
                    toast.success(t.common.copied);
                  }}
                >
                  {x.copy}
                </Button>
                <Button size="sm" variant="plain" icon={<Download className="size-3.5" aria-hidden="true" />} onClick={exportJson}>
                  {x.export}
                </Button>
              </span>
            )
          }
        >
          {selected ?? x.value}
        </PanelHeader>
        {!selected ? (
          <p className="p-6 text-center text-body-sm text-fg-3">{x.pick}</p>
        ) : loadingEntry ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-16" />
          </div>
        ) : entry?.error ? (
          <p className="p-4 text-body-sm text-danger">{entry.error}</p>
        ) : entry?.data ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <pre className="min-h-40 flex-1 overflow-auto border-b border-line bg-canvas p-4 font-mono text-body-sm leading-relaxed text-fg">{json}</pre>
            <dl className="grid gap-px bg-line sm:grid-cols-2 [&>div]:bg-surface [&>div]:px-4 [&>div]:py-3">
              {[
                [x.size, `${(entry.data.size / 1024).toFixed(2)} KB`],
                [x.revision, entry.data.revisionId ?? "—"],
                [x.created, entry.data.createTime ? new Date(entry.data.createTime).toLocaleString(locale === "id" ? "id-ID" : "en-US") : "—"],
                [x.updated, entry.data.revisionCreateTime ? new Date(entry.data.revisionCreateTime).toLocaleString(locale === "id" ? "id-ID" : "en-US") : "—"],
                [x.users, entry.data.users.length ? entry.data.users.join(", ") : "—"],
                [x.attributes, entry.data.attributes ? JSON.stringify(entry.data.attributes) : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <dt className="text-caption text-fg-3">{k}</dt>
                  <dd className="font-mono text-caption tracking-normal text-fg-2 [overflow-wrap:anywhere]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </Card>
    </>
  );
}
