"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { dictionaries, LOCALE_COOKIE, type Dict, type Locale } from "./dict";

const I18nContext = createContext<{ locale: Locale; t: Dict }>({ locale: "en", t: dictionaries.en });

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, t: dictionaries[locale] }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
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
