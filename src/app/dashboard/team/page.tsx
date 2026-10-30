"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus } from "iconoir-react";
import { Avatar, RobloxMark } from "@/components/app/Roblox";
import { useApi, useWorkspace } from "@/components/app/workspace";
import { Button, Card, Dialog, ErrorBox, Field, Input, PageHeader, PanelHeader, Select, Skeleton, Spinner, Tag, cn } from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { useF, useI18n } from "@/i18n/client";
import { api, errorMessage, fieldErrors } from "@/lib/api";
import type { Invite, Member, Role, RobloxUser } from "@/lib/types";

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
                    <Avatar src={m.robloxAvatarUrl} name={m.name} size={36} />
                    <span className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-2 text-body-sm font-medium">
                        <span className="truncate">{m.name}</span>
                        {self && <Tag tone="neutral">{t.common.you}</Tag>}
                      </span>
                      <span className="flex items-center gap-1.5 truncate text-caption text-fg-3">
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

      {inviting && (
        <InviteDialog
          roles={assignable}
          onClose={() => setInviting(false)}
          onMember={(m) => members.setData((list) => [...(list ?? []), m])}
          onInvite={(inv) => invites.setData((list) => [...(list ?? []).filter((x) => x.id !== inv.id), inv])}
        />
      )}
    </>
  );
}

/** Tambah anggota: username Roblox (pratinjau avatar, seperti collaborator Roblox) atau email akun DataBridge. */
function InviteDialog({ roles, onClose, onMember, onInvite }: { roles: Role[]; onClose: () => void; onMember: (m: Member) => void; onInvite: (i: Invite) => void }) {
  const { t } = useI18n();
  const f = useF();
  const { workspace } = useWorkspace();
  const toast = useToast();
  const [tab, setTab] = useState<"roblox" | "email">("roblox");
  const [username, setUsername] = useState("");
  const [preview, setPreview] = useState<{ q: string; user: RobloxUser | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const tm = t.team;
  const valid = /^[A-Za-z0-9_]{3,20}$/.test(username);
  const looking = tab === "roblox" && valid && preview?.q !== username;

  // Pratinjau user Roblox (debounce 400 ms) — setState hanya di callback async
  useEffect(() => {
    if (tab !== "roblox" || !valid) return;
    let alive = true;
    const timer = setTimeout(() => {
      api<RobloxUser>(`/roblox/users/lookup?username=${encodeURIComponent(username)}`, { silent: true })
        .then((u) => alive && setPreview({ q: username, user: u }))
        .catch(() => alive && setPreview({ q: username, user: null }));
    }, 400);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [username, tab, valid]);

  async function submit(form: FormData) {
    setBusy(true);
    setError(null);
    setFields({});
    try {
      if (tab === "roblox") {
        const r = await api<{ type: "member" | "invite" } & Record<string, unknown>>(`/workspaces/${workspace.id}/invites`, {
          method: "POST",
          body: { username, role: form.get("role") },
        });
        if (r.type === "member") {
          onMember({ ...(r as unknown as Member), joinedAt: new Date().toISOString() });
          toast.success(f.invite.added, `@${username}`);
        } else {
          onInvite({ ...(r as unknown as Invite), createdAt: new Date().toISOString() });
          toast.success(f.invite.invited, `@${username}`);
        }
      } else {
        const m = await api<Omit<Member, "joinedAt" | "robloxUsername" | "robloxAvatarUrl">>(`/workspaces/${workspace.id}/members`, {
          method: "POST",
          body: { email: form.get("email"), role: form.get("role") },
        });
        onMember({ ...m, joinedAt: new Date().toISOString(), robloxUsername: null, robloxAvatarUrl: null });
        toast.success(f.invite.added, m.email ?? "");
      }
      onClose();
    } catch (e) {
      setError(errorMessage(e, t.errors));
      setFields(fieldErrors(e));
      setBusy(false);
    }
  }

  const user = preview?.q === username ? preview.user : null;

  return (
    <Dialog
      open
      onClose={onClose}
      title={tm.inviteTitle}
      description={tab === "roblox" ? f.invite.usernameHint : tm.inviteBody}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button variant="primary" type="submit" form="invite-form" loading={busy} disabled={tab === "roblox" && !user}>
            {tm.invite}
          </Button>
        </>
      }
    >
      <div role="tablist" className="mb-5 inline-flex rounded-md border border-line bg-surface-2 p-0.5">
        {(["roblox", "email"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn("flex h-8 items-center gap-2 rounded-xs px-3 text-body-sm font-medium", tab === k ? "bg-surface-3 text-fg" : "text-fg-2 hover:text-fg")}
          >
            {k === "roblox" && <RobloxMark className="size-3.5" />}
            {k === "roblox" ? f.invite.tabRoblox : f.invite.tabEmail}
          </button>
        ))}
      </div>
      <form
        id="invite-form"
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(new FormData(e.currentTarget));
        }}
      >
        {error && (
          <p role="alert" className="rounded-md border border-danger-edge bg-danger-bg px-3 py-2 text-body-sm text-danger">
            {error}
          </p>
        )}
        {tab === "roblox" ? (
          <Field label={f.invite.username} error={fields.username}>
            {(id, d) => (
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-body-sm text-fg-3">@</span>
                  <Input id={id} mono value={username} onChange={(e) => setUsername(e.target.value.trim())} autoComplete="off" autoFocus maxLength={20} className="pl-7" aria-describedby={d} />
                </div>
                <div className="flex min-h-12 items-center gap-3 rounded-md border border-line bg-surface-2 px-3 py-2" aria-live="polite">
                  {looking ? (
                    <span className="flex items-center gap-2 text-caption text-fg-3">
                      <Spinner className="size-3.5" /> {f.invite.lookingUp}
                    </span>
                  ) : user ? (
                    <>
                      <Avatar src={user.avatarUrl} name={user.username} size={32} />
                      <span className="flex flex-col">
                        <span className="text-body-sm font-medium">{user.displayName}</span>
                        <span className="font-mono text-caption tracking-normal text-fg-3">@{user.username}</span>
                      </span>
                    </>
                  ) : valid && preview ? (
                    <span className="text-caption text-danger">{f.invite.notFound}</span>
                  ) : (
                    <span className="text-caption text-fg-3">@username</span>
                  )}
                </div>
              </div>
            )}
          </Field>
        ) : (
          <Field label={tm.email} error={fields.email}>
            {(id, d) => <Input id={id} name="email" type="email" autoComplete="off" required autoFocus aria-describedby={d} />}
          </Field>
        )}
        <Field label={tm.role} hint={tm.roleHelp.developer}>
          {(id, d) => (
            <Select id={id} name="role" defaultValue="developer" aria-describedby={d}>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {t.app.roles[r]}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </form>
    </Dialog>
  );
}
