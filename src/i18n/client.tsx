"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Dict, Locale } from "./dict";
import type { FeaturesDict } from "./features";

// Kamus dikirim dari server HANYA untuk bahasa aktif (props), bukan di-bundle ke JS klien —
// menghemat ±20 KB gzip di setiap halaman (Lighthouse mobile).
const LOCALE_COOKIE = "dbr_lang";

type Ctx = { locale: Locale; t: Dict; f: FeaturesDict };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ locale, t, f, children }: Ctx & { children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, t, f }}>{children}</I18nContext.Provider>;
}

function useCtx(): Ctx {
  const c = useContext(I18nContext);
  if (!c) throw new Error("useI18n di luar <I18nProvider>");
  return c;
}

export function useI18n() {
  const { locale, t } = useCtx();
  return { locale, t };
}

/** Teks fitur Fase 2 (migrasi, explorer, billing, admin, OAuth). */
export function useF(): FeaturesDict {
  return useCtx().f;
}

/** Isi placeholder {nama} pada string kamus. */
export function fmt(s: string, vars: Record<string, string | number>) {
  return s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}

/** Ganti bahasa: simpan cookie 1 tahun lalu render ulang komponen server. */
export function useSetLocale() {
  const router = useRouter();
  return useCallback(
    (locale: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    },
    [router],
  );
}
