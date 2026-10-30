import type { Metadata } from "next";
import { NavArrowDown } from "iconoir-react";
import { PlanCompare } from "@/components/marketing/PlanCompare";
import { PageIntro, PricingGrid, Section } from "@/components/marketing/sections";
import { compareText } from "@/i18n/plans";
import { marketing } from "@/i18n/marketing";
import { getDict } from "@/i18n/server";
import { getMe } from "@/lib/server-api";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getDict();
  return { title: marketing[locale].nav.pricing, description: marketing[locale].pricing.subtitle };
}

export default async function PricingPage() {
  const [{ t, locale }, me] = await Promise.all([getDict(), getMe()]);
  const p = marketing[locale].pricing;
  return (
    <>
      <PageIntro title={p.title} subtitle={p.subtitle} />

      <Section note={t.landing.pricingNote} first>
        <PricingGrid l={t.landing} ctaHref={me ? "/dashboard/settings" : "/register"} />
      </Section>

      <Section id="compare" title={compareText[locale].title}>
        <PlanCompare
          featured="developer"
          names={{ free: t.landing.plans[0]!.name, developer: t.landing.plans[1]!.name, studio: t.landing.plans[2]!.name, enterprise: t.landing.plans[3]!.name }}
        />
      </Section>

      <Section title={p.faqTitle}>
        <div className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface shadow-inset">
          {p.faq.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-body font-medium hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
                {f.q}
                <NavArrowDown className="size-4 shrink-0 text-fg-3 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="px-5 pb-5 text-body-sm text-fg-2">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}
