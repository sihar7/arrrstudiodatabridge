"use client";

import { ArrowRight, InfoCircle, WarningTriangle } from "iconoir-react";
import { Tag } from "@/components/ui";
import { useF } from "@/i18n/client";
import { cn } from "@/lib/cn";
import type { MigrationStatus, Side, Validation } from "@/lib/types";

// Komponen bersama halaman migrasi: pil status & ringkasan sumber → tujuan.

const tone: Record<MigrationStatus, { dot: string; text: string; pulse?: boolean }> = {
  draft: { dot: "bg-fg-3", text: "text-fg-2" },
  queued: { dot: "bg-fg-2", text: "text-fg-2", pulse: true },
  running: { dot: "bg-link", text: "text-link", pulse: true },
  paused: { dot: "bg-warn", text: "text-warn" },
  cancelling: { dot: "bg-warn", text: "text-warn", pulse: true },
  cancelled: { dot: "bg-fg-3", text: "text-fg-3" },
  completed: { dot: "bg-signal", text: "text-signal" },
  completed_with_errors: { dot: "bg-warn", text: "text-warn" },
  failed: { dot: "bg-danger", text: "text-danger" },
};

export function MigrationStatusPill({ status, dryRun }: { status: MigrationStatus; dryRun?: boolean }) {
  const f = useF();
  const t = tone[status];
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("inline-flex items-center gap-2 font-mono text-body-sm tracking-normal", t.text)}>
        <span className={cn("size-2 rounded-full", t.dot, t.pulse && "motion-keep animate-pulse")} aria-hidden="true" />
        {f.mig.status[status]}
      </span>
      {dryRun && status !== "draft" && <Tag tone="violet">{f.mig.dry}</Tag>}
    </span>
  );
}

export function SideLabel({ side, className }: { side: Side; className?: string }) {
  return (
    <span className={cn("flex min-w-0 flex-col", className)}>
      <span className="truncate text-body-sm font-medium">{side.label}</span>
      <span className="truncate font-mono text-caption tracking-normal text-fg-3">
        {side.universeName ? `${side.universeName} · ` : ""}
        {side.universeId} › <span className="text-lilac">{side.datastoreName}</span> › {side.scope}
      </span>
    </span>
  );
}

export function Route({ source, destination }: { source: Side; destination: Side }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <SideLabel side={source} />
      <ArrowRight className="size-4 shrink-0 rotate-90 text-signal sm:rotate-0" aria-hidden="true" />
      <SideLabel side={destination} />
    </div>
  );
}

export const ACTIVE: MigrationStatus[] = ["queued", "running", "cancelling"];

/** Daftar galat (merah) & peringatan (kuning) hasil validasi migrasi. */
export function IssueList({ v }: { v: Validation }) {
  const f = useF();
  if (v.ok && !v.warnings.length) return <p className="text-body-sm text-signal">{f.mig.allGood}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {v.errors.map((e, i) => (
        <li key={`e${i}`} className="flex gap-2 rounded-md border border-danger-edge bg-danger-bg px-3 py-2 text-body-sm text-danger">
          <WarningTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {f.mig.issues[e.code] ?? e.code}
          {e.detail && <span className="font-mono text-caption opacity-80">({e.detail})</span>}
        </li>
      ))}
      {v.warnings.map((w, i) => (
        <li key={`w${i}`} className="flex gap-2 rounded-md border border-warn-edge bg-warn-bg/50 px-3 py-2 text-body-sm text-warn">
          <InfoCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {f.mig.issues[w.code] ?? w.code}
        </li>
      ))}
    </ul>
  );
}
