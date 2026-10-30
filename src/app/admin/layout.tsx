import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { NavArrowLeft } from "iconoir-react";
import { LocaleSwitch } from "@/components/app/LocaleSwitch";
import { Logo, Tag } from "@/components/ui";
import { getMe } from "@/lib/server-api";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

// Panel admin platform — hanya ADMIN_EMAILS / ADMIN_ROBLOX_USERNAMES (API juga menegakkan; non-admin = 404).
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const me = await getMe();
  if (!me) redirect("/login?next=/admin");
  if (!me.user.isAdmin) notFound();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Logo />
            <Tag tone="warn">Admin</Tag>
          </div>
          <div className="flex items-center gap-3">
            <LocaleSwitch className="hidden sm:inline-flex" />
            <Link href="/dashboard" className="flex items-center gap-1 text-body-sm text-fg-2 hover:text-fg">
              <NavArrowLeft className="size-4" aria-hidden="true" />
              Dashboard
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
