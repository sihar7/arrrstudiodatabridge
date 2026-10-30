import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle, InfoCircle, NavArrowLeft, NavArrowRight, WarningTriangle } from "iconoir-react";
import { DOC_SLUGS, docs, docsUi, type Block } from "@/i18n/docs";
import { getDict } from "@/i18n/server";
import { cn } from "@/lib/cn";

export function generateStaticParams() {
  return DOC_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [{ slug }, { locale }] = await Promise.all([params, getDict()]);
  const page = docs[locale].find((p) => p.slug === slug);
  return page ? { title: page.title, description: page.summary } : {};
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, { locale }] = await Promise.all([params, getDict()]);
  const pages = docs[locale];
  const i = pages.findIndex((p) => p.slug === slug);
  if (i < 0) notFound();
  const page = pages[i]!;
  const prev = pages[i - 1];
  const next = pages[i + 1];
  const ui = docsUi[locale];

  return (
    <article className="flex max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-3 border-b border-line pb-8">
        <p className="text-caption font-medium uppercase tracking-[0.3px] text-signal">{page.group}</p>
        <h1 className="font-display text-[32px] font-bold leading-[1.1] tracking-display sm:text-h">{page.title}</h1>
        <p className="text-sub text-fg-2">{page.summary}</p>
      </header>

      <div className="flex flex-col gap-5">
        {page.blocks.map((b, bi) => (
          <DocBlock key={bi} block={b} />
        ))}
      </div>

      <nav aria-label="Pagination" className="mt-6 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
        {prev ? (
          <Link href={`/docs/${prev.slug}`} className="group flex flex-col gap-1 rounded-md border border-line bg-surface p-4 shadow-inset hover:border-line-hover">
            <span className="flex items-center gap-1 text-caption text-fg-3">
              <NavArrowLeft className="size-3.5" aria-hidden="true" />
              {ui.prev}
            </span>
            <span className="text-body-sm font-medium group-hover:text-signal">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/docs/${next.slug}`} className="group flex flex-col items-end gap-1 rounded-md border border-line bg-surface p-4 text-right shadow-inset hover:border-line-hover">
            <span className="flex items-center gap-1 text-caption text-fg-3">
              {ui.next}
              <NavArrowRight className="size-3.5" aria-hidden="true" />
            </span>
            <span className="text-body-sm font-medium group-hover:text-signal">{next.title}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}

function DocBlock({ block: b }: { block: Block }) {
  switch (b.type) {
    case "h":
      return <h2 className="pt-4 text-h-sm font-semibold">{b.text}</h2>;
    case "p":
      return <p className="text-pretty text-body text-fg-2">{b.text}</p>;
    case "list":
      return (
        <ul className="flex flex-col gap-2.5">
          {b.items.map((it) => (
            <li key={it} className="flex gap-3 text-body text-fg-2">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-signal" aria-hidden="true" />
              <span className="text-pretty">{it}</span>
            </li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <ol className="flex flex-col">
          {b.items.map((it, i) => (
            <li key={it} className="relative flex gap-4 pb-5 last:pb-0">
              {i < b.items.length - 1 && <span className="absolute left-[13px] top-8 bottom-1 w-px bg-line" aria-hidden="true" />}
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-moss bg-fern font-mono text-caption text-signal">{i + 1}</span>
              <span className="pt-0.5 text-pretty text-body text-fg-2">{it}</span>
            </li>
          ))}
        </ol>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-md border border-line bg-surface shadow-inset">
          <table className="w-full min-w-[480px] border-collapse text-left text-body-sm">
            <thead className="bg-surface-2">
              <tr>
                {b.head.map((h, i) => (
                  <th key={i} scope="col" className="border-b border-line px-4 py-2.5 text-caption font-medium uppercase tracking-[0.3px] text-fg-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, ri) => (
                <tr key={ri} className="border-b border-line last:border-b-0">
                  {r.map((c, ci) => (
                    <td key={ci} className={cn("px-4 py-3 align-top", ci === 0 ? "text-fg" : "text-fg-2", b.mono?.includes(ci) && "font-mono tracking-normal text-lilac")}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "callout": {
      const tone = {
        info: { cls: "border-line bg-surface", icon: <InfoCircle className="size-4 text-link" aria-hidden="true" /> },
        warn: { cls: "border-warn-edge bg-warn-bg/40", icon: <WarningTriangle className="size-4 text-warn" aria-hidden="true" /> },
        success: { cls: "border-moss bg-fern", icon: <CheckCircle className="size-4 text-signal" aria-hidden="true" /> },
      }[b.tone];
      return (
        <aside className={cn("flex gap-3 rounded-md border px-4 py-3.5", tone.cls)}>
          <span className="mt-0.5 shrink-0">{tone.icon}</span>
          <div className="flex flex-col gap-0.5 text-body-sm">
            {b.title && <p className="font-semibold text-fg">{b.title}</p>}
            <p className="text-fg-2">{b.text}</p>
          </div>
        </aside>
      );
    }
    case "code":
      return <pre className="overflow-x-auto rounded-md border border-line bg-surface-2 p-4 font-mono text-body-sm text-fg">{b.text}</pre>;
  }
}
