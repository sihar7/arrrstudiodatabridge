import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Check, Database, Lock, ShieldCheck, Timer } from "iconoir-react";
import { Tag } from "@/components/ui";
import { Reveal } from "@/components/ui/feedback";
import type { Dict } from "@/i18n/dict";
import { cn } from "@/lib/cn";

// Section marketing yang dipakai ulang di landing & halaman /features, /how-it-works, /pricing.

const btn = "inline-flex h-10 items-center justify-center gap-2 rounded-md px-5 text-body-sm font-medium shadow-inset transition-[filter,border-color,background-color] duration-150";
export const btnPrimary = `${btn} border border-signal-edge bg-signal font-semibold text-canvas hover:bg-signal-hi`;
export const btnGhost = `${btn} border border-line text-fg hover:border-line-hover hover:bg-surface`;
export const btnUtility = "inline-flex h-9 items-center rounded-md border border-line bg-surface-2 px-4 text-body-sm font-medium text-fg shadow-inset hover:bg-surface-3";

type L = Dict["landing"];

export function Section({ id, title, note, more, children, first }: { id?: string; title?: string; note?: string; more?: { href: string; label: string }; children: ReactNode; first?: boolean }) {
  return (
    <section id={id} className={cn("scroll-mt-16", !first && "border-t border-line")}>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-5 py-16 sm:px-8 sm:py-20">
        {(title || note) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex max-w-3xl flex-col gap-3">
            {title && <h2 className="font-display text-[30px] font-bold leading-[1.11] tracking-display sm:text-h">{title}</h2>}
            {note && <p className="text-body-sm text-fg-3">{note}</p>}
          </div>
          {more && (
            <Link href={more.href} className="flex shrink-0 items-center gap-1.5 text-body-sm font-medium text-link hover:underline">
              {more.label}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          )}
        </div>
        )}
        {children}
      </div>
    </section>
  );
}

/** Kepala halaman marketing (h1, rata kiri seperti hero). */
export function PageIntro({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) {
  return (
    <section className="mx-auto max-w-[1200px] px-5 pb-6 pt-16 sm:px-8 sm:pt-20">
      <div className="flex max-w-3xl flex-col gap-5">
        <h1 className="font-display text-[36px] font-bold leading-[1.08] tracking-display sm:text-h-lg">{title}</h1>
        <p className="text-sub text-fg-2">{subtitle}</p>
        {children}
      </div>
    </section>
  );
}

export function FeatureGrid({ l, soon }: { l: L; soon: string }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {l.features.map((f, i) => (
        <li key={f.title}>
          <Reveal delay={i * 40} className="h-full">
            <article className={cn("flex h-full flex-col gap-3 rounded-md border bg-surface p-6 shadow-inset", i === 0 ? "border-moss" : "border-line")}>
              <div className="flex items-center justify-between gap-2">
                <span className={cn("text-caption font-medium uppercase tracking-[0.3px]", i === 0 ? "text-signal" : "text-fg-3")}>{f.label}</span>
                {f.soon && <Tag tone="violet">{soon}</Tag>}
              </div>
              <h3 className="text-h-sm font-semibold">{f.title}</h3>
              <p className="text-body-sm text-fg-2">{f.body}</p>
            </article>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

export function HowSteps({ l }: { l: L }) {
  return (
    <ol className="grid overflow-hidden rounded-md border border-line bg-surface shadow-inset md:grid-cols-4">
      {l.how.map((s, i) => (
        <li key={s.title} className="flex flex-col gap-3 border-line p-6 max-md:border-b max-md:last:border-b-0 md:border-r md:last:border-r-0">
          <span className="font-mono text-body-sm tracking-normal text-fg-3">{String(i + 1).padStart(2, "0")}</span>
          <h3 className="text-sub font-semibold">{s.title}</h3>
          <p className="text-body-sm text-fg-2">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function SafetyBlock({ l }: { l: L }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <ul className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2">
        {l.safety.map((s, i) => {
          const Icon = [Database, ShieldCheck, Lock, Check][i] ?? Check;
          return (
            <li key={s.title} className="flex gap-4 bg-surface p-6">
              <Icon className="mt-0.5 size-5 shrink-0 text-signal" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <h3 className="text-body font-semibold">{s.title}</h3>
                <p className="text-body-sm text-fg-2">{s.body}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <Reveal>
        <aside className="flex h-full flex-col gap-3 rounded-md border border-warn-edge bg-warn-bg/40 p-6">
          <h3 className="flex items-center gap-2 text-body font-semibold text-warn">
            <Timer className="size-5 shrink-0" aria-hidden="true" />
            {l.cutoverTitle}
          </h3>
          <p className="text-body-sm text-fg-2">{l.cutoverBody}</p>
        </aside>
      </Reveal>
    </div>
  );
}

export function PricingGrid({ l, ctaHref }: { l: L; ctaHref: string }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {l.plans.map((p, i) => (
        <li key={p.name}>
          <Reveal delay={i * 40} className="h-full">
            <article className={cn("flex h-full flex-col gap-5 rounded-md border p-6 shadow-inset", p.featured ? "border-moss bg-forest/40" : "border-line bg-surface")}>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sub font-semibold">{p.name}</h3>
                  {p.featured && <Tag tone="green">Popular</Tag>}
                </div>
                <p className="text-caption text-fg-3">{p.target}</p>
              </div>
              <p className="flex items-baseline gap-1">
                <span className="font-display text-[32px] font-bold leading-none tracking-display text-fg-heading">{p.price}</span>
                <span className="text-body-sm text-fg-3">{p.period}</span>
              </p>
              <ul className="flex flex-1 flex-col gap-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-body-sm text-fg-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={ctaHref} className={btnGhost}>
                {p.cta}
              </Link>
            </article>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

/** Panel job migrasi (bukti visual utama): header mono, dua kolom sumber/tujuan dipisah hairline Iron. */
export function MigrationPreview({ l, className }: { l: L; className?: string }) {
  const rows: { key: string; state: "done" | "skip" | "write" | "pending" }[] = [
    { key: "Player_10482231", state: "done" },
    { key: "Player_10482237", state: "done" },
    { key: "Player_10482290", state: "skip" },
    { key: "Player_10482301", state: "write" },
    { key: "Player_10482318", state: "pending" },
  ];
  const label = { done: l.panelDone, skip: l.panelSkipped, write: l.panelWriting, pending: l.panelPending };
  const dot = { done: "bg-signal", skip: "bg-fg-3", write: "bg-link", pending: "bg-steel" };
  return (
    <figure className={cn("overflow-hidden rounded-md border border-line bg-surface shadow-inset", className)} aria-label="Example migration job">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-2 px-4 py-3 font-mono text-body-sm tracking-normal">
        <span className="text-fg-2">
          {l.panelTitle} <span className="text-fg-3">·</span> <span className="text-fg">job_7f3a</span>
        </span>
        <span className="flex items-center gap-2 text-fg-2">
          <span className="size-2 animate-pulse rounded-full bg-signal" aria-hidden="true" />
          4,512 / 10,000
        </span>
      </div>
      <div className="grid md:grid-cols-2">
        {[
          { head: l.panelSource, uni: "111111", ds: "PlayerData_V1" },
          { head: l.panelDest, uni: "222222", ds: "PlayerData_V2" },
        ].map((side, i) => (
          <div key={side.head} className={cn("flex flex-col", i === 0 && "border-line-2 max-md:border-b md:border-r")}>
            <div className="flex h-9 items-end justify-between gap-3 px-4 font-mono text-caption tracking-normal">
              <span className="shrink-0 text-fg-3">{side.head}</span>
              <span className="truncate text-fg-2">
                universe/{side.uni} <span className="text-fg-3">›</span> <span className="text-lilac">{side.ds}</span> <span className="text-fg-3">› global</span>
              </span>
            </div>
            <ul className="flex flex-col py-2">
              {rows.map((r) => (
                <li key={r.key} className="flex h-8 items-center justify-between gap-4 px-4 font-mono text-body-sm tracking-normal">
                  <span className="truncate text-fg">{r.key}</span>
                  {i === 0 ? (
                    <span className="text-fg-3">read</span>
                  ) : (
                    <span className="flex shrink-0 items-center gap-2 text-fg-2">
                      <span className={cn("size-1.5 rounded-full", dot[r.state])} aria-hidden="true" />
                      {label[r.state]}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line px-4 py-3">
        <div className="h-1 overflow-hidden rounded-xs bg-surface-3">
          <div className="h-full w-[45%] rounded-xs bg-signal" />
        </div>
      </div>
    </figure>
  );
}
