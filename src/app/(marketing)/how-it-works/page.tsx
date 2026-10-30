import type { Metadata } from "next";
import { NavArrowRight } from "iconoir-react";
import { HowSteps, MigrationPreview, PageIntro, SafetyBlock, Section } from "@/components/marketing/sections";
import { marketing } from "@/i18n/marketing";
import { getDict } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getDict();
  return { title: marketing[locale].nav.how, description: marketing[locale].how.subtitle };
}

export default async function HowItWorksPage() {
  const { t, locale } = await getDict();
  const h = marketing[locale].how;
  return (
    <>
      <PageIntro title={h.title} subtitle={h.subtitle} />

      <Section title={t.landing.howTitle} first>
        <HowSteps l={t.landing} />
      </Section>

      <Section title={h.pipelineTitle} note={h.pipelineBody}>
        <ol className="flex flex-wrap items-center gap-2 font-mono text-body-sm tracking-normal" aria-label={h.pipelineTitle}>
          {h.pipeline.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span className={i === h.pipeline.length - 1 ? "rounded-xs border border-moss bg-fern px-3 py-2 text-signal" : "rounded-xs border border-line bg-surface px-3 py-2 text-fg"}>
                {step}
              </span>
              {i < h.pipeline.length - 1 && <NavArrowRight className="size-4 text-fg-3" aria-hidden="true" />}
            </li>
          ))}
        </ol>
        <MigrationPreview l={t.landing} />
      </Section>

      <Section title={t.landing.safetyTitle}>
        <SafetyBlock l={t.landing} />
      </Section>
    </>
  );
}
