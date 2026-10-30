import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/app/AuthForm";
import { getDict } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.auth.registerTitle };
}

export default function Page() {
  return (
    <Suspense>
      <AuthForm mode="register" />
    </Suspense>
  );
}
