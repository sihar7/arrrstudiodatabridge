"use client";

import { useState } from "react";
import { Check, Copy, Link as LinkIcon } from "iconoir-react";
import { Button, Card, Dialog, Field, Input, PanelHeader, Select, Tag } from "@/components/ui";
import { useToast } from "@/components/ui/feedback";
import { fmt, useF, useI18n } from "@/i18n/client";
import { api, errorMessage } from "@/lib/api";
import type { InviteLink, Role } from "@/lib/types";
import { useApi, useWorkspace } from "./workspace";

// Link undangan workspace: buat (role · kedaluwarsa · batas pakai) → salin → bagikan; daftar link aktif + cabut.

export function InviteLinkDialog({ roles, onClose, onCreated }: { roles: Role[]; onClose: () => void; onCreated: () => void }) {
  const { t } = useI18n();
  const f = useF();
  const { workspace } = useWorkspace();
  const toast = useToast();
  const [role, setRole] = useState<Role>("developer");
  const [days, setDays] = useState(7);
  const [maxUses, setMaxUses] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function create() {
    setBusy(true);
    try {
      const r = await api<InviteLink & { url: string }>(`/workspaces/${workspace.id}/invite-links`, { method: "POST", body: { role, days, maxUses } });
      setUrl(r.url);
      onCreated();
    } catch (e) {
      toast.error(errorMessage(e, t.errors));
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t.common.copied);
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={f.links.create}
      description={f.links.body}
      footer={
        url ? (
          <Button variant="primary" onClick={onClose}>
            {t.common.close}
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              {t.common.cancel}
            </Button>
            <Button variant="primary" loading={busy} onClick={create} icon={<LinkIcon className="size-4" aria-hidden="true" />}>
              {f.links.create}
            </Button>
          </>
        )
      }
    >
      {url ? (
        <div className="flex flex-col gap-3">
          <p className="text-body-sm text-warn">{f.links.created}</p>
          <div className="flex gap-2">
            <Input value={url} readOnly mono onFocus={(e) => e.currentTarget.select()} aria-label={f.links.copy} />
            <Button variant="secondary" onClick={copy} icon={copied ? <Check className="size-4 text-signal" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}>
              {f.links.copy}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t.team.role}>
            {(id) => (
              <Select id={id} value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {t.app.roles[r]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={f.links.expires}>
            {(id) => (
              <Select id={id} value={days} onChange={(e) => setDays(Number(e.target.value))}>
                {[1, 7, 30].map((d) => (
                  <option key={d} value={d}>
                    {fmt(f.links.days, { n: d })}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={f.links.maxUses}>
            {(id) => (
              <Select id={id} value={maxUses ?? ""} onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : null)}>
                <option value="">{f.links.unlimited}</option>
                {[1, 5, 10, 25].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      )}
    </Dialog>
  );
}

export function InviteLinksCard({ refreshKey }: { refreshKey: number }) {
  const { t, locale } = useI18n();
  const f = useF();
  const { workspace } = useWorkspace();
  const toast = useToast();
  const links = useApi<InviteLink[]>(`/workspaces/${workspace.id}/invite-links?r=${refreshKey}`);

  async function revoke(l: InviteLink) {
    try {
      await api(`/workspaces/${workspace.id}/invite-links/${l.id}`, { method: "DELETE" });
      links.setData((d) => d?.filter((x) => x.id !== l.id) ?? null);
    } catch (e) {
      toast.error(errorMessage(e, t.errors));
    }
  }

  if (!links.data?.length) return null;
  return (
    <Card>
      <PanelHeader>{f.links.title}</PanelHeader>
      <ul className="divide-y divide-line">
        {links.data.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="flex items-center gap-3">
              <LinkIcon className="size-4 text-fg-3" aria-hidden="true" />
              <Tag tone={l.active ? "green" : "neutral"}>{l.active ? t.app.roles[l.role] : f.links.inactive}</Tag>
              <span className="font-mono text-caption tracking-normal text-fg-3">
                {fmt(f.links.uses, { n: l.maxUses ? `${l.uses}/${l.maxUses}` : l.uses })} · {new Date(l.expiresAt).toLocaleDateString(locale === "id" ? "id-ID" : "en-US")}
              </span>
            </span>
            <Button size="sm" variant="plain" className="hover:text-danger" onClick={() => revoke(l)}>
              {f.links.revoke}
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
