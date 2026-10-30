"use client";

import { useState } from "react";
import { Button, Dialog, Field, Input, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/feedback";
import { useI18n } from "@/i18n/client";
import { api, errorMessage, fieldErrors } from "@/lib/api";
import type { Project } from "@/lib/types";

export default function ProjectDialog({ project, onClose, onSaved }: { project?: Project; onClose: () => void; onSaved: (p: Project) => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const p = t.projects;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function submit(form: FormData) {
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const body = { name: form.get("name"), description: String(form.get("description") ?? "").trim() || null };
      const saved = await api<Project>(project ? `/projects/${project.id}` : "/projects", { method: project ? "PATCH" : "POST", body });
      toast.success(project ? t.settings.saved : p.newTitle, saved.name);
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
      title={project ? p.edit : p.newTitle}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button variant="primary" type="submit" form="project-form" loading={busy}>
            {project ? (busy ? t.common.saving : t.common.save) : busy ? t.common.creating : t.common.create}
          </Button>
        </>
      }
    >
      <form
        id="project-form"
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
        <Field label={p.name} error={fields.name}>
          {(id, d) => <Input id={id} name="name" required maxLength={80} placeholder={p.namePlaceholder} defaultValue={project?.name} autoFocus aria-describedby={d} />}
        </Field>
        <Field label={p.description} optional={t.common.optional} error={fields.description}>
          {(id, d) => <Textarea id={id} name="description" maxLength={500} placeholder={p.descriptionPlaceholder} defaultValue={project?.description ?? ""} aria-describedby={d} />}
        </Field>
      </form>
    </Dialog>
  );
}
