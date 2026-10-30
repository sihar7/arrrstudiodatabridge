import type { Metadata, Viewport } from "next";
import { Red_Hat_Display, Red_Hat_Mono, Red_Hat_Text } from "next/font/google";
import type { ReactNode } from "react";
import { FeedbackProvider } from "@/components/ui/feedback";
import { I18nProvider } from "@/i18n/client";
import { features } from "@/i18n/features";
import { getDict } from "@/i18n/server";
import "./globals.css";

// Tiga keluarga Red Hat: Display (judul), Text (body/UI), Mono (kode, ID, status).
// Judul = elemen LCP: "optional" → tidak ada swap terlambat (LCP tidak menunggu font); font ter-cache untuk kunjungan berikutnya
const display = Red_Hat_Display({ subsets: ["latin"], variable: "--font-rh-display", display: "optional" });
// Hanya font judul (elemen LCP) yang di-preload; body & mono menyusul dengan fallback metrik (tanpa CLS)
const text = Red_Hat_Text({ subsets: ["latin"], variable: "--font-rh-text", display: "swap", preload: false });
const mono = Red_Hat_Mono({ subsets: ["latin"], variable: "--font-rh-mono", display: "swap", preload: false });

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getDict();
  return {
    // URL absolut untuk og:image/twitter:image (preview link di Discord, WhatsApp, X)
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://databridge.arrrstudio.com"),
    title: { default: t.meta.title, template: "%s · ARRR DataBridge" },
    description: t.meta.description,
    applicationName: "ARRR DataBridge",
    openGraph: {
      type: "website",
      siteName: "ARRR DataBridge",
      title: t.meta.title,
      description: t.meta.description,
      locale: locale === "id" ? "id_ID" : "en_US",
    },
    twitter: { card: "summary_large_image", title: t.meta.title, description: t.meta.description },
  };
}

export const viewport: Viewport = { themeColor: "#04040b", colorScheme: "dark" };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { locale, t } = await getDict();
  return (
    <html lang={locale} className={`${display.variable} ${text.variable} ${mono.variable}`}>
      <body className="min-h-dvh">
        <I18nProvider locale={locale} t={t} f={features[locale]}>
          <FeedbackProvider labels={{ confirm: t.common.confirm, cancel: t.common.cancel, typeToConfirm: t.common.typeToConfirm }}>
            {children}
          </FeedbackProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
