import Link from "next/link";
import type { ReactNode } from "react";
import { LocaleSwitch } from "@/components/app/LocaleSwitch";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { btnPrimary, btnUtility } from "@/components/marketing/sections";
import { Logo } from "@/components/ui";
import { marketing } from "@/i18n/marketing";
import { getDict } from "@/i18n/server";
import { getMe } from "@/lib/server-api";

// Layout halaman publik: header sticky (logo · nav per halaman · bahasa · auth) + footer.
export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const [{ t, locale }, me] = await Promise.all([getDict(), getMe()]);
  const m = marketing[locale];
  const items = [
    { href: "/features", label: m.nav.features },
    { href: "/how-it-works", label: m.nav.how },
    { href: "/pricing", label: m.nav.pricing },
    { href: "/docs", label: m.nav.docs },
  ];
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface-2 focus:px-4 focus:py-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur">
        <nav className="relative mx-auto flex h-16 max-w-[1200px] items-center gap-4 px-5 sm:gap-6 sm:px-8" aria-label="Main">
          <Link href="/" aria-label="ARRR DataBridge home">
            <Logo />
          </Link>
          <MarketingNav items={items} mobileExtra={<LocaleSwitch />} />
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            {/* Wrapper: kelas `hidden` tidak boleh bertabrakan dengan display bawaan komponen */}
            <div className="hidden sm:block">
              <LocaleSwitch />
            </div>
            {me ? (
              <Link href="/dashboard" className={`${btnPrimary} h-9`}>
                {t.nav.dashboard}
              </Link>
            ) : (
              <>
                <Link href="/login" className={btnUtility}>
                  {t.nav.signIn}
                </Link>
                <span className="hidden sm:block">
                  <Link href="/register" className={`${btnPrimary} h-9`}>
                    {t.nav.getStarted}
                  </Link>
                </span>
              </>
            )}
          </div>
        </nav>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-line bg-surface-2">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-5 py-12 sm:px-8 md:grid-cols-[1fr_auto_auto]">
          <div className="flex flex-col gap-2">
            <Logo />
            <p className="text-body-sm text-fg-3">{t.landing.footerTagline}</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2 text-body-sm">
            {items.map((it) => (
              <Link key={it.href} href={it.href} className="text-fg-2 hover:text-fg">
                {it.label}
              </Link>
            ))}
            <Link href="/login" className="text-fg-2 hover:text-fg">
              {t.nav.signIn}
            </Link>
            <Link href="/register" className="text-fg-2 hover:text-fg">
              {t.nav.getStarted}
            </Link>
          </nav>
          <div className="flex flex-col gap-3 md:items-end">
            <LocaleSwitch />
            <p className="text-caption text-fg-3">
              © {new Date().getFullYear()} {t.landing.footerRights}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
