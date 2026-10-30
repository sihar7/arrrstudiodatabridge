"use client";

import Link from "next/link";
import { DataTransferBoth, Plus } from "iconoir-react";
import { MigrationStatusPill, Route } from "@/components/app/migration";
import { useApi, useWorkspace } from "@/components/app/workspace";
import { EmptyState, ErrorBox, PageHeader, Skeleton } from "@/components/ui";
import { ProgressBar } from "@/components/ui/feedback";
import { useF, useI18n } from "@/i18n/client";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { Migration } from "@/lib/types";

const newBtn = "inline-flex h-10 items-center gap-2 rounded-md border border-signal-edge bg-signal px-5 text-body-sm font-semibold text-canvas shadow-inset hover:bg-signal-hi";

export default function MigrationsPage() {
  const { t, locale } = useI18n();
  const f = useF();
  const { can } = useWorkspace();
  const list = useApi<Migration[]>("/migrations");
  const m = f.mig;
  const action = can("migrations.run") && (
    <Link href="/dashboard/migrations/new" className={newBtn}>
      <Plus className="size-4" aria-hidden="true" />
      {m.new}
    </Link>
  );

  return (
    <>
      <PageHeader title={m.title} subtitle={m.subtitle} actions={action} />
      {list.loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : list.error ? (
        <ErrorBox message={errorMessage(list.error, t.errors)} onRetry={list.reload} retry={t.common.retry} />
      ) : !list.data?.length ? (
        <EmptyState icon={<DataTransferBoth />} title={m.emptyTitle} body={m.emptyBody} action={action} />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.data.map((mg) => (
            <li key={mg.id}>
              <Link
                href={`/dashboard/migrations/${mg.id}`}
                className={cn("flex flex-col gap-4 rounded-md border border-line bg-surface p-5 shadow-inset transition-colors hover:border-line-hover hover:bg-surface-2")}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-sub font-semibold">{mg.name}</h2>
                    <span className="text-caption text-fg-3">
                      {mg.projectName} · {new Date(mg.createdAt).toLocaleDateString(locale === "id" ? "id-ID" : "en-US")}
                    </span>
                  </div>
                  <MigrationStatusPill status={mg.status} dryRun={mg.dryRun} />
                </div>
                <Route source={mg.source} destination={mg.destination} />
                {mg.status !== "draft" && (
                  <div className="flex flex-col gap-1.5">
                    <ProgressBar value={mg.progress.enumerating && mg.status === "running" ? undefined : mg.progress.percentage} size="sm" tone={mg.progress.failed ? "danger" : "signal"} label={m.progress} hideLabel />
                    <span className="font-mono text-caption tracking-normal text-fg-3 tabular">
                      {mg.progress.processed.toLocaleString()} / {mg.progress.total.toLocaleString()} · {mg.progress.failed} {m.failed.toLowerCase()}
                    </span>
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
