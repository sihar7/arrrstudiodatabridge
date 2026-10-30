"use client";

import { Fragment, useMemo, useState } from "react";
import { Check, Minus } from "iconoir-react";
import { Tag } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { PLAN_IDS, compareGroups, compareText, type PlanId } from "@/i18n/plans";
import { cn } from "@/lib/cn";

/** Tabel perbandingan paket: pilih paket (min 2) + filter "hanya yang berbeda". */
export function PlanCompare({ names, featured }: { names: Record<PlanId, string>; featured: PlanId }) {
  const { locale } = useI18n();
  const tx = compareText[locale];
  const [selected, setSelected] = useState<PlanId[]>([...PLAN_IDS]);
  const [diffOnly, setDiffOnly] = useState(false);

  const toggle = (id: PlanId) =>
    setSelected((cur) => {
      if (cur.includes(id)) return cur.length <= 2 ? cur : cur.filter((x) => x !== id);
      return PLAN_IDS.filter((p) => p === id || cur.includes(p));
    });

  const text = (v: unknown): string => (typeof v === "object" && v !== null ? (v as Record<string, string>)[locale]! : String(v));

  const groups = useMemo(
    () =>
      compareGroups
        .map((g) => ({
          ...g,
          rows: g.rows.filter((r) => {
            if (!diffOnly) return true;
            const vals = selected.map((p) => JSON.stringify(r.values[p]));
            return new Set(vals).size > 1;
          }),
        }))
        .filter((g) => g.rows.length),
    [diffOnly, selected],
  );

  const cols = `minmax(200px,1.4fr) repeat(${selected.length}, minmax(120px,1fr))`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <fieldset className="flex flex-col gap-2">
          <legend className="pb-2 text-body-sm font-medium">
            {tx.pick} <span className="font-normal text-fg-3">· {tx.pickHint}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {PLAN_IDS.map((id) => {
              const on = selected.includes(id);
              const locked = on && selected.length <= 2;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  aria-disabled={locked || undefined}
                  onClick={() => toggle(id)}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-md border px-3 text-body-sm font-medium transition-colors",
                    on ? "border-moss bg-fern text-fg" : "border-line bg-surface text-fg-2 hover:border-line-hover hover:text-fg",
                    locked && "cursor-not-allowed",
                  )}
                >
                  <span className={cn("grid size-4 place-items-center rounded-xs border", on ? "border-signal bg-signal text-canvas" : "border-steel")} aria-hidden="true">
                    {on && <Check className="size-3" strokeWidth={2.5} />}
                  </span>
                  {names[id]}
                </button>
              );
            })}
          </div>
        </fieldset>
        <label className="flex cursor-pointer items-center gap-2.5 text-body-sm text-fg-2">
          <button
            type="button"
            role="switch"
            aria-checked={diffOnly}
            onClick={() => setDiffOnly((v) => !v)}
            className={cn("relative h-5 w-9 shrink-0 rounded-full border transition-colors", diffOnly ? "border-signal-edge bg-signal" : "border-line bg-surface-3")}
          >
            <span className={cn("absolute top-0.5 size-3.5 rounded-full transition-transform", diffOnly ? "translate-x-[18px] bg-canvas" : "translate-x-0.5 bg-fg-2")} />
          </button>
          {tx.diffOnly}
        </label>
      </div>

      <div className="overflow-x-auto rounded-md border border-line bg-surface shadow-inset">
        <div role="table" aria-label={tx.title} className="min-w-[560px]">
          <div role="row" className="sticky top-0 grid border-b border-line bg-surface-2" style={{ gridTemplateColumns: cols }}>
            <span role="columnheader" className="px-4 py-3 text-caption font-medium uppercase tracking-[0.3px] text-fg-3">
              {tx.feature}
            </span>
            {selected.map((id) => (
              <span key={id} role="columnheader" className={cn("flex items-center gap-2 px-4 py-3 text-body-sm font-semibold", id === featured && "text-signal")}>
                {names[id]}
              </span>
            ))}
          </div>
          {groups.map((g) => (
            <Fragment key={g.title.en}>
              <div role="row" className="border-b border-line bg-canvas/40 px-4 pb-2 pt-5">
                <span role="rowheader" className="font-mono text-caption uppercase tracking-normal text-fg-3">
                  {g.title[locale]}
                </span>
              </div>
              {g.rows.map((r) => (
                <div key={r.label.en} role="row" className="grid border-b border-line last:border-b-0 hover:bg-surface-2" style={{ gridTemplateColumns: cols }}>
                  <span role="rowheader" className="flex flex-col px-4 py-3 text-body-sm text-fg">
                    {r.label[locale]}
                    {r.hint && <span className="text-caption text-fg-3">{r.hint[locale]}</span>}
                  </span>
                  {selected.map((id) => {
                    const v = r.values[id];
                    return (
                      <span key={id} role="cell" className={cn("flex items-center px-4 py-3 text-body-sm", id === featured && "bg-forest/20")}>
                        {v === true ? (
                          <Check className="size-4 text-signal" aria-label={tx.included} />
                        ) : v === false ? (
                          <Minus className="size-4 text-steel" aria-label={tx.notIncluded} />
                        ) : v === "soon" ? (
                          <Tag tone="violet">{tx.soon}</Tag>
                        ) : (
                          <span className="font-mono tracking-normal text-fg-2 tabular">{text(v)}</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
