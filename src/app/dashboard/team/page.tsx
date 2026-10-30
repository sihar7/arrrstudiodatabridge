"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "iconoir-react";
import { useApi, useWorkspace } from "@/components/app/workspace";
import { Button, Card, Dialog, ErrorBox, Field, Input, PageHeader, PanelHeader, Select, Skeleton, Tag } from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { useI18n } from "@/i18n/client";
import { api, errorMessage, fieldErrors } from "@/lib/api";
import type { Member, Role } from "@/lib/types";

const ROLES: Role[] = ["owner", "admin", "developer", "viewer"];

export default function TeamPage() {
  const { t, locale } = useI18n();
  const { workspace, me, can, refreshMe } = useWorkspace();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const members = useApi<Member[]>(`/workspaces/${workspace.id}/members`);
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
      text: self ? tm.leaveBody : `${m.name} · ${m.email} — ${tm.removeBody}`,
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
    } else {
      members.setData((list) => list?.filter((x) => x.userId !== m.userId) ?? null);
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
                    <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-surface-3 font-display text-body-sm font-bold uppercase" aria-hidden="true">
                      {m.name.charAt(0)}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-2 text-body-sm font-medium">
                        <span className="truncate">{m.name}</span>
                        {self && <Tag tone="neutral">{t.common.you}</Tag>}
                      </span>
                      <span className="truncate text-caption text-fg-3">
                        {m.email} · {tm.joined} {new Date(m.joinedAt).toLocaleDateString(locale === "id" ? "id-ID" : "en-US")}
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
          onAdded={(m) => members.setData((list) => [...(list ?? []), m])}
        />
      )}
    </>
  );
}

function InviteDialog({ roles, onClose, onAdded }: { roles: Role[]; onClose: () => void; onAdded: (m: Member) => void }) {
  const { t } = useI18n();
  const { workspace } = useWorkspace();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const tm = t.team;

  async function submit(form: FormData) {
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const m = await api<Omit<Member, "joinedAt">>(`/workspaces/${workspace.id}/members`, { method: "POST", body: { email: form.get("email"), role: form.get("role") } });
      onAdded({ ...m, joinedAt: new Date().toISOString() });
      toast.success(tm.invite, m.email);
      onClose();
    } catch (e) {
      setError(errorMessage(e, t.errors));
      setFields(fieldErrors(e));
      setBusy(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={tm.inviteTitle}
      description={tm.inviteBody}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button variant="primary" type="submit" form="invite-form" loading={busy}>
            {tm.invite}
          </Button>
        </>
      }
    >
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
        <Field label={tm.email} error={fields.email}>
          {(id, d) => <Input id={id} name="email" type="email" autoComplete="off" required autoFocus aria-describedby={d} />}
        </Field>
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
