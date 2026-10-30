"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Check, NavArrowLeft, InfoCircle } from "iconoir-react";
import { IssueList, Route, SideLabel } from "@/components/app/migration";
import { useApi, useWorkspace } from "@/components/app/workspace";
import { Button, Card, ErrorBox, Field, Input, PageHeader, Select, Skeleton, Tag, Textarea, cn } from "@/components/ui";
import { useToast } from "@/components/ui/feedback";
import { useF, useI18n } from "@/i18n/client";
import { ApiError, api, errorMessage } from "@/lib/api";
import type { Migration, Side, Validation } from "@/lib/types";

// Wizard migrasi 5 langkah (PRD §8): Sumber → Tujuan → Atur → Tinjau → Jalankan (dry run).

type Cfg = Side & { projectId: string; projectName: string; connection: { name: string; status: string } };
type Mode = "full" | "selected" | "prefix";
type Strategy = "skip_existing" | "overwrite" | "fail_on_conflict" | "rename_key";

export default function NewMigrationPage() {
  const { t } = useI18n();
  const f = useF();
  const m = f.mig;
  const router = useRouter();
  const toast = useToast();
  const { workspace } = useWorkspace();
  const configs = useApi<Cfg[]>("/explorer/configs");
  const paid = workspace.plan !== "free";

  const [step, setStep] = useState(0);
  const [projectId, setProjectId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [destId, setDestId] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<Mode>("full");
  const [keys, setKeys] = useState("");
  const [prefix, setPrefix] = useState("");
  const [strategy, setStrategy] = useState<Strategy>("skip_existing");
  const [pattern, setPattern] = useState("v2_{key}");
  const [verify, setVerify] = useState(true);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [issues, setIssues] = useState<Validation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projects = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const c of configs.data ?? []) {
      const p = map.get(c.projectId) ?? { id: c.projectId, name: c.projectName, count: 0 };
      p.count++;
      map.set(c.projectId, p);
    }
    return [...map.values()];
  }, [configs.data]);
  const inProject = (configs.data ?? []).filter((c) => c.projectId === projectId);
  const source = inProject.find((c) => c.id === sourceId);
  const dest = inProject.find((c) => c.id === destId);
  const keyList = keys.split(/\r?\n/).map((k) => k.trim()).filter(Boolean);

  const canNext = [
    !!projectId && !!sourceId,
    !!destId,
    !!name.trim() && (mode !== "selected" || keyList.length > 0) && (mode !== "prefix" || !!prefix.trim()) && (strategy !== "rename_key" || pattern.includes("{key}")),
    true,
  ][step];

  async function createAndDryRun() {
    setBusy(true);
    setError(null);
    setIssues(null);
    const body = {
      name: name.trim(),
      mode,
      selectedKeys: mode === "selected" ? keyList : null,
      prefix: mode === "prefix" ? prefix.trim() : null,
      conflictStrategy: strategy,
      renamePattern: strategy === "rename_key" ? pattern : null,
      verify,
    };
    try {
      let id = draftId;
      if (id) await api(`/migrations/${id}`, { method: "PATCH", body });
      else {
        const created = await api<Migration>("/migrations", { method: "POST", body: { ...body, projectId, sourceConfigId: sourceId, destinationConfigId: destId } });
        id = created.id;
        setDraftId(id);
      }
      await api(`/migrations/${id}/dry-run`, { method: "POST" });
      toast.success(m.dry, name);
      router.push(`/dashboard/migrations/${id}`);
    } catch (e) {
      if (e instanceof ApiError && e.code === "MIGRATION_INVALID" && e.details) setIssues(e.details as unknown as Validation);
      else setError(errorMessage(e, t.errors));
      setBusy(false);
    }
  }

  const PaidTag = () => (!paid ? <Tag tone="violet">{m.paidFeature}</Tag> : null);

  return (
    <>
      <Link href="/dashboard/migrations" className="-mb-4 flex w-fit items-center gap-1 text-body-sm text-fg-2 hover:text-fg">
        <NavArrowLeft className="size-4" aria-hidden="true" />
        {m.back}
      </Link>
      <PageHeader title={m.new} subtitle={m.dryFirst} />

      {/* Indikator langkah */}
      <ol className="grid grid-cols-5 gap-2" aria-label="Steps">
        {m.steps.map((label, i) => (
          <li key={label} className="flex flex-col gap-2">
            <span className={cn("h-1 rounded-xs", i <= step ? "bg-signal" : "bg-surface-3")} aria-hidden="true" />
            <span className={cn("flex items-center gap-1.5 text-caption", i === step ? "font-semibold text-fg" : "text-fg-3")} aria-current={i === step ? "step" : undefined}>
              <span className="hidden font-mono sm:inline">{String(i + 1).padStart(2, "0")}</span>
              {label}
            </span>
          </li>
        ))}
      </ol>

      {configs.loading ? (
        <Skeleton className="h-64" />
      ) : configs.error ? (
        <ErrorBox message={errorMessage(configs.error, t.errors)} onRetry={configs.reload} retry={t.common.retry} />
      ) : (
        <Card className="flex flex-col gap-6 p-6">
          {step === 0 && (
            <>
              <Field label={m.project}>
                {(id) => (
                  <Select
                    id={id}
                    value={projectId}
                    onChange={(e) => {
                      setProjectId(e.target.value);
                      setSourceId("");
                      setDestId("");
                    }}
                  >
                    <option value="" disabled>
                      {m.chooseProject}
                    </option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.count < 2}>
                        {p.name} ({p.count})
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              {!projects.some((p) => p.count >= 2) && (
                <p className="text-body-sm text-fg-2">
                  {m.needTwo}{" "}
                  <Link href="/dashboard/projects" className="text-link hover:underline">
                    {t.app.nav.projects}
                  </Link>
                </p>
              )}
              {projectId && <ConfigPicker label={m.source} configs={inProject} value={sourceId} onChange={setSourceId} />}
            </>
          )}

          {step === 1 && source && (
            <>
              <div className="rounded-md border border-line bg-surface-2 p-4">
                <p className="pb-2 text-caption uppercase tracking-[0.3px] text-fg-3">{m.source}</p>
                <SideLabel side={source} />
              </div>
              <ConfigPicker label={m.destination} configs={inProject.filter((c) => c.id !== sourceId)} value={destId} onChange={setDestId} />
              {dest && dest.universeId === source.universeId && (
                <p className="flex gap-2 rounded-md border border-plum px-4 py-3 text-body-sm text-fg-2">
                  <InfoCircle className="mt-0.5 size-4 shrink-0 text-lilac" aria-hidden="true" />
                  {m.issues.SAME_UNIVERSE}
                </p>
              )}
              {dest && dest.universeId !== source.universeId && !paid && <p className="text-body-sm text-warn">{m.issues.PLAN_FEATURE}: cross-experience</p>}
            </>
          )}

          {step === 2 && (
            <>
              <Field label={m.name}>{(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} placeholder={m.namePh} maxLength={80} autoFocus />}</Field>

              <fieldset className="flex flex-col gap-2">
                <legend className="pb-2 text-body-sm font-medium">{m.mode}</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(["full", "selected", "prefix"] as const).map((k) => (
                    <Choice key={k} checked={mode === k} onChange={() => setMode(k)} label={m.modes[k]!} name="mode" disabled={!paid && k !== "full"} extra={k !== "full" ? <PaidTag /> : null} />
                  ))}
                </div>
              </fieldset>
              {mode === "selected" && (
                <Field label={m.keys} hint={`${keyList.length}`}>
                  {(id, d) => <Textarea id={id} value={keys} onChange={(e) => setKeys(e.target.value)} className="min-h-32 font-mono tracking-normal" aria-describedby={d} />}
                </Field>
              )}
              {mode === "prefix" && <Field label={m.prefix}>{(id) => <Input id={id} mono value={prefix} onChange={(e) => setPrefix(e.target.value)} maxLength={50} placeholder="Player_" />}</Field>}

              <fieldset className="flex flex-col gap-2">
                <legend className="pb-2 text-body-sm font-medium">{m.conflict}</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["skip_existing", "fail_on_conflict", "rename_key", "overwrite"] as const).map((k) => (
                    <Choice
                      key={k}
                      name="strategy"
                      checked={strategy === k}
                      onChange={() => setStrategy(k)}
                      label={m.strategies[k]!}
                      code={k}
                      disabled={!paid && k !== "skip_existing"}
                      extra={k !== "skip_existing" ? <PaidTag /> : null}
                      danger={k === "overwrite"}
                    />
                  ))}
                </div>
              </fieldset>
              {strategy === "rename_key" && (
                <Field label={m.renamePattern} hint={m.renameHint}>
                  {(id, d) => <Input id={id} mono value={pattern} onChange={(e) => setPattern(e.target.value)} maxLength={50} aria-describedby={d} />}
                </Field>
              )}
              <label className="flex cursor-pointer items-center gap-3 text-body-sm">
                <input type="checkbox" checked={verify} onChange={(e) => setVerify(e.target.checked)} className="size-4 accent-[var(--color-signal)]" />
                {m.verify}
              </label>
            </>
          )}

          {step === 3 && source && dest && (
            <>
              <Route source={source} destination={dest} />
              <dl className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2">
                {[
                  [m.name, name],
                  [m.mode, mode === "selected" ? `${m.modes.selected} (${keyList.length})` : mode === "prefix" ? `${m.modes.prefix}: ${prefix}` : m.modes.full],
                  [m.conflict, `${m.strategies[strategy]}${strategy === "rename_key" ? ` — ${pattern}` : ""}`],
                  [m.verify, verify ? "✓" : "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-1 bg-surface p-4">
                    <dt className="text-caption text-fg-3">{k}</dt>
                    <dd className="text-body-sm">{v}</dd>
                  </div>
                ))}
              </dl>
              {issues && <IssueList v={issues} />}
              {error && (
                <p role="alert" className="rounded-md border border-danger-edge bg-danger-bg px-3 py-2 text-body-sm text-danger">
                  {error}
                </p>
              )}
              <p className="flex gap-2 text-body-sm text-fg-2">
                <InfoCircle className="mt-0.5 size-4 shrink-0 text-link" aria-hidden="true" />
                {m.dryFirst}
              </p>
            </>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-between">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              {t.common.back}
            </Button>
            {step < 3 ? (
              <Button variant="primary" onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                {m.steps[step + 1]}
              </Button>
            ) : (
              <Button variant="primary" onClick={createAndDryRun} loading={busy}>
                {m.runDry}
              </Button>
            )}
          </div>
        </Card>
      )}
    </>
  );
}

function ConfigPicker({ label, configs, value, onChange }: { label: string; configs: Cfg[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="pb-2 text-body-sm font-medium">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {configs.map((c) => (
          <label
            key={c.id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors",
              value === c.id ? "border-moss bg-fern" : "border-line bg-surface-2 hover:border-line-hover",
            )}
          >
            <input type="radio" name={label} className="sr-only" checked={value === c.id} onChange={() => onChange(c.id)} />
            <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border", value === c.id ? "border-signal bg-signal" : "border-steel")} aria-hidden="true">
              {value === c.id && <Check className="size-3 text-canvas" strokeWidth={3} />}
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <SideLabel side={c} />
              <span className="text-caption text-fg-3">{c.connection.name}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Choice({ label, checked, onChange, name, disabled, extra, code, danger }: { label: string; checked: boolean; onChange: () => void; name: string; disabled?: boolean; extra?: React.ReactNode; code?: string; danger?: boolean }) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 rounded-md border p-3 transition-colors",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        checked ? (danger ? "border-danger-edge bg-danger-bg" : "border-moss bg-fern") : "border-line bg-surface-2 hover:border-line-hover",
      )}
    >
      <input type="radio" name={name} className="sr-only" checked={checked} onChange={onChange} disabled={disabled} />
      <span className={cn("mt-0.5 size-4 shrink-0 rounded-full border-2", checked ? (danger ? "border-danger" : "border-signal") : "border-steel")} aria-hidden="true" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2 text-body-sm font-medium">
          {label}
          {extra}
        </span>
        {code && <code className="font-mono text-caption text-fg-3">{code}</code>}
      </span>
    </label>
  );
}
