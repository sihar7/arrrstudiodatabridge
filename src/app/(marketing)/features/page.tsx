import type { Metadata } from "next";
import Link from "next/link";
import { FeatureGrid, PageIntro, Section, btnPrimary } from "@/components/marketing/sections";
import { Tag } from "@/components/ui";
import { marketing } from "@/i18n/marketing";
import { getDict } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getDict();
  return { title: marketing[locale].nav.features, description: marketing[locale].features.subtitle };
}

export default async function FeaturesPage() {
  const { t, locale } = await getDict();
  const f = marketing[locale].features;
  return (
    <>
      <PageIntro title={f.title} subtitle={f.subtitle}>
        <div>
          <Link href="/register" className={btnPrimary}>
            {t.landing.ctaPrimary}
          </Link>
        </div>
      </PageIntro>

      <Section title={t.landing.featuresTitle} first>
        <FeatureGrid l={t.landing} soon={t.common.soon} />
      </Section>

      <Section title={f.modesTitle}>
        <ul className="grid overflow-hidden rounded-md border border-line bg-surface shadow-inset md:grid-cols-3">
          {f.modes.map((mo) => (
            <li key={mo.name} className="flex flex-col gap-2 border-line p-6 max-md:border-b max-md:last:border-b-0 md:border-r md:last:border-r-0">
              <h3 className="text-sub font-semibold">{mo.name}</h3>
              <p className="text-body-sm text-fg-2">{mo.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={f.conflictTitle} note={f.conflictBody}>
        <div className="overflow-hidden rounded-md border border-line bg-surface shadow-inset">
          <div className="border-b border-line bg-surface-2 px-4 py-3 font-mono text-body-sm uppercase tracking-normal text-fg-2">conflict_strategy</div>
          <ul className="divide-y divide-line">
            {f.conflicts.map((c) => (
              <li key={c.code} className="grid gap-2 px-4 py-4 sm:grid-cols-[220px_1fr] sm:items-center">
                <span className="flex items-center gap-2">
                  <code className="font-mono text-body-sm text-lilac">{c.code}</code>
                  {c.tag && <Tag tone="green">{c.tag}</Tag>}
                </span>
                <span className="text-body-sm text-fg-2">{c.body}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}
