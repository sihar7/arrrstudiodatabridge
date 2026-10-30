import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/app/AuthForm";
import { getDict } from "@/i18n/server";
import { getProviders } from "@/lib/server-api";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.auth.registerTitle };
}

export default async function Page() {
  const providers = await getProviders();
  return (
    <Suspense>
      <AuthForm mode="register" roblox={providers.roblox} />
    </Suspense>
  );
}
