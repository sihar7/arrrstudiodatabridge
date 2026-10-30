"use client";

import { useState } from "react";
import { Eye, EyeClosed, InfoCircle } from "iconoir-react";
import { Button, Dialog, Field, Input } from "@/components/ui";
import { useToast } from "@/components/ui/feedback";
import { useI18n } from "@/i18n/client";
import { api, errorMessage, fieldErrors } from "@/lib/api";
import type { Connection } from "@/lib/types";

// Dialog koneksi: buat baru / ganti nama / ganti key (rotasi). Key tidak pernah diisi ulang dari server.
export default function ConnectionDialog({
  mode,
  connection,
  onClose,
  onSaved,
}: {
  mode: "create" | "rename" | "rotate";
  connection?: Connection;
  onClose: () => void;
  onSaved: (c: Connection) => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const c = t.connections;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [show, setShow] = useState(false);

  const title = mode === "create" ? c.addTitle : mode === "rotate" ? c.rotateTitle : c.rename;
  const desc = mode === "create" ? c.addBody : mode === "rotate" ? c.rotateBody : undefined;

  async function submit(form: FormData) {
    setBusy(true);
    setError(null);
    setFields({});
    const body: Record<string, unknown> = {};
    if (mode !== "rotate") body.name = form.get("name");
    if (mode !== "rename") body.apiKey = String(form.get("apiKey") ?? "").trim();
    try {
      const saved = await api<Connection>(mode === "create" ? "/connections" : `/connections/${connection!.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        body,
      });
      if (saved.status === "active") toast.success(c.tested, saved.name);
      else toast.warning(c.testFailed, saved.lastError ? (t.errors[saved.lastError] ?? saved.lastError) : c.status[saved.status]);
      onSaved(saved);
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
      title={title}
      description={desc}
      size={mode === "rename" ? "sm" : "md"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button variant="primary" type="submit" form="conn-form" loading={busy}>
            {mode === "create" ? (busy ? c.testing : c.add) : busy ? t.common.saving : t.common.save}
          </Button>
        </>
      }
    >
      <form
        id="conn-form"
        className="flex flex-col gap-5"
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
        {mode !== "rotate" && (
          <Field label={c.name} error={fields.name}>
            {(id, d) => (
              <Input id={id} name="name" required maxLength={80} placeholder={c.namePlaceholder} defaultValue={connection?.name} autoFocus aria-describedby={d} aria-invalid={!!fields.name} />
            )}
          </Field>
        )}
        {mode !== "rename" && (
          <>
            <Field label={c.apiKey} hint={c.apiKeyHint} error={fields.apiKey}>
              {(id, d) => (
                <div className="relative">
                  <Input
                    id={id}
                    name="apiKey"
                    type={show ? "text" : "password"}
                    required
                    mono
                    autoComplete="off"
                    spellCheck={false}
                    className="pr-11"
                    autoFocus={mode === "rotate"}
                    aria-describedby={d}
                    aria-invalid={!!fields.apiKey}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    aria-label={show ? t.common.hide : t.common.show}
                    aria-pressed={show}
                    className="absolute right-1 top-1 grid size-8 place-items-center rounded-md text-fg-3 hover:text-fg"
                  >
                    {show ? <EyeClosed className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                  </button>
                </div>
              )}
            </Field>
            <div className="overflow-hidden rounded-md border border-line">
              <p className="border-b border-line bg-surface-2 px-3 py-2 font-mono text-caption uppercase tracking-normal text-fg-2">{c.scopesTitle}</p>
              <ul className="divide-y divide-line">
                {c.scopes.map(([scope, ops, label]) => (
                  <li key={scope + ops} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2">
                    <code className="text-caption text-lilac">
                      {scope} <span className="text-fg-3">·</span> <span className="text-fg">{ops}</span>
                    </code>
                    <span className="text-caption text-fg-3">{label}</span>
                  </li>
                ))}
              </ul>
              <p className="flex gap-2 border-t border-line px-3 py-2.5 text-caption text-fg-2">
                <InfoCircle className="mt-0.5 size-3.5 shrink-0 text-link" aria-hidden="true" />
                {c.ipNote}
              </p>
            </div>
          </>
        )}
      </form>
    </Dialog>
  );
}
