import "server-only";
import { cookies, headers } from "next/headers";
import { dictionaries, LOCALE_COOKIE, type Locale } from "./dict";

/** Bahasa aktif: cookie pilihan user → header Accept-Language (id*) → en. */
export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (c === "en" || c === "id") return c;
  const accept = (await headers()).get("accept-language") ?? "";
  return /^id\b|,\s*id\b/i.test(accept) ? "id" : "en";
}

export async function getDict() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
