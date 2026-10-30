import type { Metadata } from "next";
import Link from "next/link";
import { NavArrowRight } from "iconoir-react";
import { docs, docsUi } from "@/i18n/docs";
import { getDict } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getDict();
  return { title: docsUi[locale].title, description: docsUi[locale].subtitle };
}

// Indeks dokumentasi: kartu per topik, dikelompokkan.
export default async function DocsIndex() {
  const { locale } = await getDict();
  const ui = docsUi[locale];
  const pages = docs[locale];
  const groups = [...new Set(pages.map((p) => p.group))];
  return (
    <article className="flex flex-col gap-12">
      <header className="flex max-w-3xl flex-col gap-4 border-b border-line pb-8">
        <h1 className="font-display text-[36px] font-bold leading-[1.08] tracking-display sm:text-h-lg">{ui.title}</h1>
        <p className="text-sub text-fg-2">{ui.subtitle}</p>
      </header>
      {groups.map((g) => (
        <section key={g} className="flex flex-col gap-4">
          <h2 className="text-caption font-medium uppercase tracking-[0.3px] text-fg-3">{g}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {pages
              .filter((p) => p.group === g)
              .map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/docs/${p.slug}`}
                    className="group flex h-full items-start justify-between gap-4 rounded-md border border-line bg-surface p-5 shadow-inset transition-colors hover:border-line-hover hover:bg-surface-2"
                  >
                    <span className="flex flex-col gap-1">
                      <span className="text-body font-semibold">{p.title}</span>
                      <span className="text-body-sm text-fg-2">{p.summary}</span>
                    </span>
                    <NavArrowRight className="mt-1 size-4 shrink-0 text-fg-3 transition-transform group-hover:translate-x-0.5 group-hover:text-signal" aria-hidden="true" />
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </article>
  );
}
