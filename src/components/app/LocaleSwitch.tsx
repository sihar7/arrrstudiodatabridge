"use client";

import { Language } from "iconoir-react";
import { useI18n, useSetLocale } from "@/i18n/client";
import { cn } from "@/components/ui";

/** Tombol EN / ID (segmented, radius 2px seperti item nav). */
export function LocaleSwitch({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const setLocale = useSetLocale();
  return (
    <div role="group" aria-label={t.common.language} className={cn("inline-flex items-center gap-1 rounded-md border border-line bg-surface p-0.5", className)}>
      <Language className="ml-1.5 size-3.5 text-fg-3" aria-hidden="true" />
      {(["en", "id"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            "h-7 min-w-8 rounded-xs px-2 font-mono text-caption uppercase tracking-normal transition-colors",
            locale === l ? "bg-surface-3 text-fg" : "text-fg-3 hover:text-fg",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
