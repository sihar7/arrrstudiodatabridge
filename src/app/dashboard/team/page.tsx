"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { InviteLinkDialog, InviteLinksCard } from "@/components/app/InviteLinks";
import { Plus } from "iconoir-react";
import { Avatar, RobloxMark } from "@/components/app/Roblox";
import { useApi, useWorkspace } from "@/components/app/workspace";
import { Button, Card, ErrorBox, PageHeader, PanelHeader, Select, Skeleton, Tag } from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { useF, useI18n } from "@/i18n/client";
import { api, errorMessage } from "@/lib/api";
import type { Invite, Member, Role } from "@/lib/types";

const ROLES: Role[] = ["owner", "admin", "developer", "viewer"];

export default function TeamPage() {
  const { t, locale } = useI18n();
  const f = useF();
  const { workspace, me, can, refreshMe } = useWorkspace();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const members = useApi<Member[]>(`/workspaces/${workspace.id}/members`);
  const invites = useApi<Invite[]>(`/workspaces/${workspace.id}/invites`);
  const [inviting, setInviting] = useState(false);
  const [linksKey, setLinksKey] = useState(0);
  const manage = can("members.manage");
  const tm = t.team;
  // Hanya owner yang boleh memberi/mengubah role owner
  const assignable = ROLES.filter((r) => r !== "owner" || workspace.role === "owner");

  async function changeRole(m: Member, role: Role) {
    try {
      await api(`/workspaces/${workspace.id}/members/${m.userId}`, { method: "PATCH", body: { role } });
      members.setData((list) => list?.map((x) => (x.userId === m.userId ? { ...x, role } : x)) ?? null);
      toast.success(t.settings.saved, `${m.name} → ${t.app.roles[role]}`);
      if (m.userId === me.user.id) await refreshMe();
    } catch (e) {
      toast.error(errorMessage(e, t.errors));
      members.reload();
    }
  }

  async function remove(m: Member) {
    const self = m.userId === me.user.id;
    const ok = await confirm({
      title: self ? tm.leaveTitle : tm.removeTitle,
      text: self ? tm.leaveBody : `${m.name} — ${tm.removeBody}`,
      tone: "danger",
      confirmText: self ? tm.leave : t.common.remove,
      preConfirm: async () => {
        try {
          await api(`/workspaces/${workspace.id}/members/${m.userId}`, { method: "DELETE" });
        } catch (e) {
          throw new Error(errorMessage(e, t.errors));
        }
      },
    });
    if (!ok) return;
    if (self) {
      document.cookie = "dbr_ws=; path=/; max-age=0";
      router.push("/dashboard");
      router.refresh();
    } else members.setData((list) => list?.filter((x) => x.userId !== m.userId) ?? null);
  }

  async function revoke(inv: Invite) {
    try {
      await api(`/workspaces/${workspace.id}/invites/${inv.id}`, { method: "DELETE" });
      invites.setData((l) => l?.filter((x) => x.id !== inv.id) ?? null);
    } catch (e) {
      toast.error(errorMessage(e, t.errors));
    }
  }

  return (
    <>
      <PageHeader
        title={tm.title}
        subtitle={tm.subtitle}
        actions={
          manage && (
            <Button variant="primary" icon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setInviting(true)}>
              {tm.invite}
            </Button>
          )
        }
      />

      <Card>
        <PanelHeader>{workspace.name}</PanelHeader>
        {members.loading ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : members.error ? (
          <div className="p-4">
            <ErrorBox message={errorMessage(members.error, t.errors)} onRetry={members.reload} retry={t.common.retry} />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {members.data?.map((m) => {
              const self = m.userId === me.user.id;
              const editable = manage && !self && (m.role !== "owner" || workspace.role === "owner");
              return (
                <li key={m.userId} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar src={m.discordAvatarUrl ?? m.robloxAvatarUrl} name={m.name} size={36} />
                    <span className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-2 text-body-sm font-medium">
                        <span className="truncate">{m.name}</span>
                        {self && <Tag tone="neutral">{t.common.you}</Tag>}
                      </span>
                      <span className="flex items-center gap-1.5 truncate text-caption text-fg-3">
                        {m.discordUsername && <>@{m.discordUsername}{(m.robloxUsername || m.email) && " · "}</>}
                        {m.robloxUsername && (
                          <>
                            <RobloxMark className="size-3" />@{m.robloxUsername}
                            {m.email && " · "}
                          </>
                        )}
                        {m.email}
                        {" · "}
                        {tm.joined} {new Date(m.joinedAt).toLocaleDateString(locale === "id" ? "id-ID" : "en-US")}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {editable ? (
                      <Select aria-label={`${tm.role} ${m.name}`} value={m.role} onChange={(e) => changeRole(m, e.target.value as Role)} className="h-9 w-40">
                        {assignable.map((r) => (
                          <option key={r} value={r}>
                            {t.app.roles[r]}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Tag tone={m.role === "owner" ? "green" : "neutral"}>{t.app.roles[m.role]}</Tag>
                    )}
                    {(editable || self) && (
                      <Button size="sm" variant="plain" className="hover:text-danger" onClick={() => remove(m)}>
                        {self ? tm.leave : t.common.remove}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {manage && <InviteLinksCard refreshKey={linksKey} />}

      {!!invites.data?.length && (
        <Card>
          <PanelHeader>{f.invite.pending}</PanelHeader>
          <p className="border-b border-line px-4 py-2.5 text-caption text-fg-3">{f.invite.pendingBody}</p>
          <ul className="divide-y divide-line">
            {invites.data.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar src={inv.avatarUrl} name={inv.username} size={32} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-body-sm font-medium">{inv.displayName ?? inv.username}</span>
                    <span className="flex items-center gap-1 text-caption text-fg-3">
                      <RobloxMark className="size-3" />@{inv.username}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Tag tone="violet">{t.app.roles[inv.role]}</Tag>
                  {manage && (
                    <Button size="sm" variant="plain" className="hover:text-danger" onClick={() => revoke(inv)}>
                      {f.invite.revoke}
                    </Button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sub font-semibold">{tm.role}</h2>
        <dl className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((r) => (
            <div key={r} className="flex flex-col gap-1 bg-surface p-4">
              <dt className="text-body-sm font-medium">{t.app.roles[r]}</dt>
              <dd className="text-caption text-fg-3">{tm.roleHelp[r]}</dd>
            </div>
          ))}
        </dl>
      </section>

      {inviting && <InviteLinkDialog roles={assignable} onClose={() => setInviting(false)} onCreated={() => setLinksKey((k) => k + 1)} />}
    </>
  );
}
