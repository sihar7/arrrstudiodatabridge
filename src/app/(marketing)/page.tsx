import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "iconoir-react";
import { FeatureGrid, HowSteps, MigrationPreview, PricingGrid, SafetyBlock, Section, btnGhost, btnPrimary } from "@/components/marketing/sections";
import { TutorialVideo } from "@/components/marketing/TutorialVideo";
import { marketing } from "@/i18n/marketing";
import { getDict } from "@/i18n/server";
import { getMe } from "@/lib/server-api";

// Landing: hero + panel job migrasi, lalu ringkasan tiap halaman (fitur, cara kerja, keamanan, harga) dengan link ke halamannya.
export default async function Landing() {
  const [{ t, locale }, me] = await Promise.all([getDict(), getMe()]);
  const l = t.landing;
  const m = marketing[locale];
  return (
    <>
      <section className="mx-auto max-w-[1200px] px-5 pb-16 pt-16 sm:px-8 sm:pt-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_460px]">
        <div className="flex max-w-3xl flex-col gap-6">
          <h1 className="font-display text-[40px] font-bold leading-[1.05] tracking-display sm:text-[60px] sm:leading-none">
            <span className="text-chrome">{l.title1}</span>
            <br />
            <span className="text-signal">{l.title2}</span>
          </h1>
          <p className="max-w-2xl text-sub text-fg-2">{l.subtitle}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href={me ? "/dashboard" : "/register"} className={btnPrimary}>
              {me ? t.nav.dashboard : l.ctaPrimary}
            </Link>
            <Link href="/docs" className={btnGhost}>
              {m.landing.ctaDocs}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="hidden lg:block">
          <Image
            src="/brand/logo-full.webp"
            alt="ARRR Studio DataBridge"
            width={900}
            height={511}
            priority
            sizes="460px"
            className="h-auto w-full drop-shadow-[0_0_48px_rgba(110,230,20,0.12)]"
          />
        </div>
        </div>
        <MigrationPreview l={l} className="mt-14" />
      </section>

      <Section id="tutorial" title={m.landing.videoTitle} note={m.landing.videoBody}>
        <TutorialVideo locale={locale} label={m.landing.videoPlay} duration="1:30" />
      </Section>

      <Section title={l.featuresTitle} more={{ href: "/features", label: m.landing.allFeatures }}>
        <FeatureGrid l={l} soon={t.common.soon} />
      </Section>

      <Section title={l.howTitle} more={{ href: "/how-it-works", label: m.landing.fullHow }}>
        <HowSteps l={l} />
      </Section>

      <Section title={l.safetyTitle}>
        <SafetyBlock l={l} />
      </Section>

      <Section title={l.pricingTitle} note={l.pricingNote} more={{ href: "/pricing#compare", label: m.landing.fullPricing }}>
        <PricingGrid l={l} ctaHref={me ? "/dashboard/settings" : "/register"} />
      </Section>
    </>
  );
}
