import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { LocaleSwitch } from "@/components/app/LocaleSwitch";
import { Logo } from "@/components/ui";
import { getMe } from "@/lib/server-api";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  if (await getMe()) redirect("/dashboard");
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="ARRR DataBridge home">
          <Logo />
        </Link>
        <LocaleSwitch />
      </header>
      <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-10 sm:items-center sm:pt-0">{children}</main>
    </div>
  );
}
