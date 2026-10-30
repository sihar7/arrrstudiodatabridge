"use client";

import Link from "next/link";
import { ArrowRight, Check, DataTransferBoth, Folder, CloudSync } from "iconoir-react";
import { useWorkspace, useApi } from "@/components/app/workspace";
import { Card, PageHeader, PanelHeader, Skeleton, Tag, cn } from "@/components/ui";
import { ProgressBar } from "@/components/ui/feedback";
import { useI18n } from "@/i18n/client";
import type { Overview, Project } from "@/lib/types";

export default function OverviewPage() {
  const { t, locale } = useI18n();
  const { workspace } = useWorkspace();
  const stats = useApi<Overview>("/analytics/overview");
  const projects = useApi<Project[]>("/projects");
  const o = t.overview;
  const s = stats.data;

  const setupDone = s ? [s.activeConnections > 0, s.projects > 0, s.datastores >= 2] : [false, false, false];
  const setupCount = setupDone.filter(Boolean).length;

  const cards = [
    { label: o.stats.projects, value: s?.projects },
    { label: o.stats.connections, value: s?.connections, extra: s ? `${s.activeConnections} ${o.stats.active}` : undefined },
    { label: o.stats.experiences, value: s?.experiences },
    { label: o.stats.datastores, value: s?.datastores },
  ];

  return (
    <>
      <PageHeader title={o.title} subtitle={`${workspace.name} — ${o.subtitle}`} />

      <section aria-label={o.title} className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="flex flex-col gap-2 bg-surface p-5">
            <span className="text-caption font-medium uppercase tracking-[0.3px] text-fg-3">{c.label}</span>
            {c.value === undefined ? (
              <Skeleton className="h-9 w-14" />
            ) : (
              <span className="font-display text-[32px] font-bold leading-none tracking-display text-fg-heading tabular">{c.value}</span>
            )}
            {c.extra && <span className="font-mono text-caption tracking-normal text-fg-2">{c.extra}</span>}
          </div>
        ))}
      </section>

      {s && setupCount < 3 && (
        <Card highlighted className="flex flex-col gap-5 bg-forest/30 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sub font-semibold">{o.setupTitle}</h2>
            <span className="font-mono text-body-sm tracking-normal text-fg-2">{setupCount}/3</span>
          </div>
          <ProgressBar value={(setupCount / 3) * 100} label={o.setupTitle} hideLabel />
          <ol className="grid gap-3 sm:grid-cols-3">
            {o.setup.map((step, i) => (
              <li key={step} className="flex items-start gap-3 text-body-sm">
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full border font-mono text-[11px]",
                    setupDone[i] ? "border-moss bg-fern text-signal" : "border-line text-fg-3",
                  )}
                  aria-hidden="true"
                >
                  {setupDone[i] ? <Check className="size-3" /> : i + 1}
                </span>
                <span className={setupDone[i] ? "text-fg-3 line-through" : "text-fg"}>{step}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sub font-semibold">{o.quick}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <QuickAction href="/dashboard/connections?new=1" icon={<CloudSync />} title={o.connect} body={o.connectBody} />
          <QuickAction href="/dashboard/projects?new=1" icon={<Folder />} title={o.newProject} body={o.newProjectBody} />
          <QuickAction icon={<DataTransferBoth />} title={o.createMigration} body={o.createMigrationBody} soon={t.common.soon} />
        </div>
      </section>

      <Card>
        <PanelHeader
          right={
            <Link href="/dashboard/projects" className="flex items-center gap-1 text-body-sm text-link hover:underline">
              {o.viewAll}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        >
          {o.recentProjects}
        </PanelHeader>
        {projects.loading ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : projects.data?.length ? (
          <ul className="divide-y divide-line">
            {projects.data.slice(0, 5).map((p) => (
              <li key={p.id}>
                <Link href={`/dashboard/projects/${p.id}`} className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface-2">
                  <span className="flex min-w-0 items-center gap-3">
                    <Folder className="size-4 shrink-0 text-fg-3" aria-hidden="true" />
                    <span className="truncate text-body-sm font-medium">{p.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-4 font-mono text-caption tracking-normal text-fg-3">
                    <span>
                      {p.datastoreCount ?? 0} {t.projects.datastores}
                    </span>
                    <span className="hidden sm:inline">{new Date(p.updatedAt).toLocaleDateString(locale === "id" ? "id-ID" : "en-US")}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-8 text-center text-body-sm text-fg-3">{t.projects.emptyTitle}</p>
        )}
      </Card>
    </>
  );
}

function QuickAction({ href, icon, title, body, soon }: { href?: string; icon: React.ReactNode; title: string; body: string; soon?: string }) {
  const inner = (
    <>
      <span className="grid size-9 shrink-0 place-items-center rounded-xs border border-line bg-surface-2 text-fg-2 [&_svg]:size-[18px]" aria-hidden="true">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2 text-body-sm font-medium text-fg">
          {title}
          {soon && <Tag tone="violet">{soon}</Tag>}
        </span>
        <span className="text-caption text-fg-3">{body}</span>
      </span>
    </>
  );
  const cls = "flex items-center gap-3 rounded-md border border-line bg-surface p-4 shadow-inset";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:border-line-hover hover:bg-surface-2")}>
      {inner}
    </Link>
  ) : (
    <div className={cn(cls, "opacity-60")} aria-disabled="true">
      {inner}
    </div>
  );
}
