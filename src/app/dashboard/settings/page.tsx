"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Avatar, RobloxButton, RobloxMark } from "@/components/app/Roblox";
import { useWorkspace } from "@/components/app/workspace";
import { Button, Card, Field, Input, PageHeader, Select, Tag } from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { useF, useI18n, useSetLocale } from "@/i18n/client";
import { api, errorMessage } from "@/lib/api";

export default function SettingsPage() {
  return (
    <Suspense>
      <Settings />
    </Suspense>
  );
}

function Settings() {
  const { t, locale } = useI18n();
  const fx = useF();
  const confirm = useConfirm();
  const params = useSearchParams();
  const { me, workspace, can, refreshMe, providers } = useWorkspace();
  // Hasil kembali dari "Tautkan akun Roblox"
  const shown = useRef(false);
  const router = useRouter();
  const toast = useToast();
  const setLocale = useSetLocale();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingWs, setSavingWs] = useState(false);
  const s = t.settings;

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    const err = params.get("error");
    if (params.get("linked")) {
      const joined = Number(params.get("joined") ?? 0);
      toast.success(fx.roblox.linked, joined ? fx.roblox.joined.replace("{n}", String(joined)) : undefined);
    } else if (err) toast.error(t.errors[err] ?? err);
  }, [params, toast, fx, t.errors]);

  async function unlink() {
    const ok = await confirm({
      title: fx.roblox.unlinkTitle,
      text: fx.roblox.unlinkBody,
      tone: "warning",
      confirmText: fx.roblox.unlink,
      preConfirm: async () => {
        try {
          await api("/auth/roblox", { method: "DELETE" });
        } catch (e) {
          throw new Error(errorMessage(e, t.errors));
        }
      },
    });
    if (ok) await refreshMe();
  }

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const nextLocale = f.get("locale") as "en" | "id";
    setSavingProfile(true);
    try {
      await api("/auth/me", { method: "PATCH", body: { name: f.get("name"), locale: nextLocale } });
      await refreshMe();
      toast.success(s.saved);
      if (nextLocale !== locale) setLocale(nextLocale);
    } catch (err) {
      toast.error(errorMessage(err, t.errors));
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveWorkspace(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSavingWs(true);
    try {
      await api(`/workspaces/${workspace.id}`, { method: "PATCH", body: { name: f.get("name"), type: f.get("type") } });
      await refreshMe();
      router.refresh();
      toast.success(s.saved);
    } catch (err) {
      toast.error(errorMessage(err, t.errors));
    } finally {
      setSavingWs(false);
    }
  }

  const editWs = can("workspace.update");

  return (
    <>
      <PageHeader title={s.title} />
      <Section title={s.profile} body={s.profileBody}>
        <form onSubmit={saveProfile} className="flex flex-col gap-4">
          <Field label={t.auth.name}>{(id) => <Input id={id} name="name" defaultValue={me.user.name} required maxLength={80} />}</Field>
          {me.user.email && <Field label={t.auth.email}>{(id) => <Input id={id} value={me.user.email ?? ""} readOnly disabled />}</Field>}
          <Field label={t.common.language}>
            {(id) => (
              <Select id={id} name="locale" defaultValue={locale}>
                <option value="en">English</option>
                <option value="id">Bahasa Indonesia</option>
              </Select>
            )}
          </Field>
          <div>
            <Button type="submit" variant="primary" loading={savingProfile}>
              {savingProfile ? t.common.saving : t.common.save}
            </Button>
          </div>
        </form>
      </Section>

      <Section title={fx.roblox.linkTitle} body={fx.roblox.linkBody}>
        {me.user.roblox ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={me.user.roblox.avatarUrl} name={me.user.roblox.username ?? "R"} size={44} />
              <div className="flex flex-col">
                <span className="text-caption text-fg-3">{fx.roblox.linkedAs}</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <RobloxMark className="size-3.5 text-fg-2" />@{me.user.roblox.username}
                </span>
                {me.user.roblox.displayName && <span className="text-caption text-fg-2">{me.user.roblox.displayName}</span>}
              </div>
            </div>
            {me.user.hasPassword && (
              <Button variant="ghost" onClick={unlink}>
                {fx.roblox.unlink}
              </Button>
            )}
          </div>
        ) : providers.roblox ? (
          <RobloxButton href="/api/v1/auth/roblox/start?intent=link" label={fx.roblox.link} />
        ) : (
          <p className="text-body-sm text-fg-3">{t.errors.ROBLOX_DISABLED}</p>
        )}
      </Section>

      <Section title={s.workspace} body={s.workspaceBody} aside={<Tag tone="green">{`${s.plan}: ${workspace.plan}`}</Tag>}>
        <form onSubmit={saveWorkspace} className="flex flex-col gap-4">
          <fieldset disabled={!editWs} className="flex flex-col gap-4">
            <Field label={t.app.workspace.name}>{(id) => <Input id={id} name="name" defaultValue={workspace.name} required maxLength={80} key={workspace.id} />}</Field>
            <Field label={t.app.workspace.type}>
              {(id) => (
                <Select id={id} name="type" defaultValue={workspace.type} key={workspace.id}>
                  <option value="individual">{t.app.workspace.individual}</option>
                  <option value="studio">{t.app.workspace.studio}</option>
                </Select>
              )}
            </Field>
          </fieldset>
          {editWs ? (
            <div>
              <Button type="submit" variant="secondary" loading={savingWs}>
                {savingWs ? t.common.saving : t.common.save}
              </Button>
            </div>
          ) : (
            <p className="text-body-sm text-fg-3">{t.app.readOnly}</p>
          )}
        </form>
      </Section>
    </>
  );
}

function Section({ title, body, aside, children }: { title: string; body: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[280px_1fr] lg:gap-10">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sub font-semibold">{title}</h2>
          {aside}
        </div>
        <p className="text-body-sm text-fg-2">{body}</p>
      </div>
      <Card className="p-6">{children}</Card>
    </section>
  );
}
