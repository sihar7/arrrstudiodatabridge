import type { Metadata } from "next";
import Link from "next/link";
import { Group } from "iconoir-react";
import { InviteAccept } from "@/components/app/InviteAccept";
import { DiscordButton } from "@/components/app/Discord";
import { Card, Logo } from "@/components/ui";
import { features } from "@/i18n/features";
import { getDict } from "@/i18n/server";
import { getInvite, getMe } from "@/lib/server-api";

export const metadata: Metadata = { title: "Invite", robots: { index: false } };

// Halaman link undangan: pratinjau workspace → (login Discord) → gabung.
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const [{ token }, { t, locale }, me] = await Promise.all([params, getDict(), getMe()]);
  const f = features[locale];
  const inv = await getInvite(token);
  const fill = (s: string, ws: string, role?: string) => s.replace("{ws}", ws).replace("{role}", role ?? "");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-5 py-12">
      <Link href="/" aria-label="ARRR DataBridge">
        <Logo />
      </Link>
      <Card className="flex w-full max-w-[420px] flex-col items-center gap-5 p-8 text-center">
        <span className="grid size-12 place-items-center rounded-md border border-line bg-surface-2 text-fg-2" aria-hidden="true">
          <Group className="size-6" />
        </span>
        {inv.data ? (
          <>
            <div className="flex flex-col gap-2">
              <h1 className="text-h-sm font-semibold">{fill(f.links.joinTitle, inv.data.workspaceName)}</h1>
              <p className="text-body-sm text-fg-2">{fill(f.links.joinBody, inv.data.workspaceName, t.app.roles[inv.data.role as keyof typeof t.app.roles] ?? inv.data.role)}</p>
            </div>
            {me ? (
              <InviteAccept token={token} workspaceName={inv.data.workspaceName} />
            ) : (
              <DiscordButton next={`/invite/${token}`} label={f.discord.signIn} className="w-full" />
            )}
          </>
        ) : (
          <>
            <p role="alert" className="text-body-sm text-danger">
              {t.errors[inv.error?.code ?? "INVITE_INVALID"] ?? t.errors.INVITE_INVALID}
            </p>
            <Link href="/" className="text-body-sm text-link hover:underline">
              DataBridge
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
