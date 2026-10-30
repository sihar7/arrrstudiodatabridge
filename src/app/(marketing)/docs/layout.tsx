import type { ReactNode } from "react";
import { DocsSidebar } from "@/components/marketing/DocsSidebar";
import { docs, docsUi } from "@/i18n/docs";
import { getDict } from "@/i18n/server";

// Layout dokumentasi: sidebar per grup (sticky di desktop, di atas konten di mobile) + area artikel.
export default async function DocsLayout({ children }: { children: ReactNode }) {
  const { locale } = await getDict();
  const groups: { name: string; pages: { slug: string; title: string }[] }[] = [];
  for (const p of docs[locale]) {
    let g = groups.find((x) => x.name === p.group);
    if (!g) groups.push((g = { name: p.group, pages: [] }));
    g.pages.push({ slug: p.slug, title: p.title });
  }
  return (
    <div className="mx-auto grid max-w-[1200px] gap-10 px-5 pb-20 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[230px_1fr]">
      <aside className="max-lg:rounded-md max-lg:border max-lg:border-line max-lg:bg-surface max-lg:p-5 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-120px)] lg:self-start lg:overflow-y-auto">
        <DocsSidebar groups={groups} label={docsUi[locale].onThisPage} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
