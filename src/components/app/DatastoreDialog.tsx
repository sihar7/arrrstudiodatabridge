"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Search } from "iconoir-react";
import { Button, Dialog, Field, Input, Select, Spinner, cn } from "@/components/ui";
import { ProgressBar, useToast } from "@/components/ui/feedback";
import { useI18n } from "@/i18n/client";
import { api, apiWithMeta, errorMessage, fieldErrors } from "@/lib/api";
import type { Connection, DatastoreConfig } from "@/lib/types";

type Universes = { universes: { id: string; name: string | null }[]; allUniverses: boolean };
type Store = { id: string; createTime: string | null };

/** Tambah konfigurasi DataStore: koneksi → universe (pilih / Place ID → Universe ID) → DataStore (telusuri) → scope. */
export default function DatastoreDialog({ projectId, onClose, onSaved }: { projectId: string; onClose: () => void; onSaved: (c: DatastoreConfig) => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const d = t.datastores;

  const [connections, setConnections] = useState<Connection[] | null>(null);
  const [connectionId, setConnectionId] = useState("");
  const [universes, setUniverses] = useState<Universes | null>(null);
  const [universeId, setUniverseId] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [resolving, setResolving] = useState(false);
  const [datastoreName, setDatastoreName] = useState("");
  const [stores, setStores] = useState<{ items: Store[]; next: string | null; loading: boolean; error: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    api<Connection[]>("/connections", { silent: true })
      .then((list) => {
        setConnections(list);
        const first = list.find((c) => c.status === "active");
        if (first) setConnectionId(first.id);
      })
      .catch((e) => setError(errorMessage(e, t.errors)));
  }, [t.errors]);

  useEffect(() => {
    setUniverses(null);
    setStores(null);
    if (!connectionId) return;
    let alive = true;
    api<Universes>(`/connections/${connectionId}/universes`, { silent: true })
      .then((u) => {
        if (!alive) return;
        setUniverses(u);
        if (u.universes.length === 1) setUniverseId(u.universes[0]!.id);
      })
      .catch(() => alive && setUniverses({ universes: [], allUniverses: true }));
    return () => {
      alive = false;
    };
  }, [connectionId]);

  async function resolvePlace() {
    if (!/^\d+$/.test(placeId)) return setFields((f) => ({ ...f, placeId: t.errors.VALIDATION_ERROR }));
    setResolving(true);
    try {
      const r = await api<{ universeId: string }>(`/roblox/places/${placeId}/universe`);
      setUniverseId(r.universeId);
      setStores(null);
      toast.info(d.resolved, `${placeId} → ${r.universeId}`);
    } catch (e) {
      toast.error(errorMessage(e, t.errors));
    } finally {
      setResolving(false);
    }
  }

  async function browse(next?: string) {
    if (!connectionId || !/^\d+$/.test(universeId)) return;
    setStores((s) => ({ items: next ? (s?.items ?? []) : [], next: null, loading: true, error: null }));
    try {
      const q = new URLSearchParams();
      if (next) q.set("pageToken", next);
      if (datastoreName && !next) q.set("prefix", datastoreName);
      const r = await apiWithMeta<Store[], { nextPageToken: string | null }>(`/connections/${connectionId}/universes/${universeId}/datastores?${q}`);
      setStores((s) => ({ items: [...(next ? (s?.items ?? []) : []), ...r.data], next: r.meta.nextPageToken, loading: false, error: null }));
    } catch (e) {
      setStores((s) => ({ items: s?.items ?? [], next: null, loading: false, error: errorMessage(e, t.errors) }));
    }
  }

  async function submit(form: FormData) {
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const saved = await api<DatastoreConfig>(`/projects/${projectId}/datastores`, {
        method: "POST",
        body: {
          label: form.get("label"),
          connectionId,
          universeId,
          placeId: placeId || null,
          datastoreName,
          scope: String(form.get("scope") || "global"),
          datastoreType: "standard",
        },
      });
      const conn = connections?.find((c) => c.id === connectionId);
      onSaved({ ...saved, connection: { id: connectionId, name: conn?.name ?? "", status: conn?.status ?? "active" } });
      toast.success(d.addTitle, `${saved.datastoreName} · ${saved.scope}`);
      onClose();
    } catch (e) {
      setError(errorMessage(e, t.errors));
      setFields(fieldErrors(e));
      setBusy(false);
    }
  }

  const noConnections = connections !== null && !connections.length;

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={d.addTitle}
      description={d.subtitle}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button variant="primary" type="submit" form="ds-form" loading={busy} disabled={!connectionId || !universeId || !datastoreName}>
            {busy ? t.common.creating : d.add}
          </Button>
        </>
      }
    >
      {connections === null ? (
        <ProgressBar label={t.common.loading} />
      ) : noConnections ? (
        <p className="text-body-sm text-fg-2">
          {d.noConnection}{" "}
          <Link href="/dashboard/connections?new=1" className="text-link hover:underline">
            {t.connections.add}
          </Link>
        </p>
      ) : (
        <form
          id="ds-form"
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
          <Field label={d.label} error={fields.label}>
            {(id, desc) => <Input id={id} name="label" required maxLength={80} placeholder={d.labelPlaceholder} autoFocus aria-describedby={desc} />}
          </Field>

          <Field label={d.connection} error={fields.connectionId}>
            {(id) => (
              <Select id={id} value={connectionId} onChange={(e) => setConnectionId(e.target.value)} required>
                <option value="" disabled>
                  {d.chooseConnection}
                </option>
                {connections.map((c) => (
                  <option key={c.id} value={c.id} disabled={c.status !== "active"}>
                    {c.name} — {t.connections.status[c.status]}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          {/* Universe: pilihan dari scope key, atau manual / dari Place ID */}
          <fieldset className="flex flex-col gap-3 rounded-md border border-line p-4">
            <legend className="px-1 text-body-sm font-medium">{t.connections.universes}</legend>
            {universes === null && connectionId ? (
              <ProgressBar size="sm" />
            ) : universes?.universes.length ? (
              <div className="flex flex-col gap-2">
                <p className="text-caption text-fg-3">{d.pickUniverse}</p>
                <div className="flex flex-wrap gap-2">
                  {universes.universes.map((u) => (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => {
                        setUniverseId(u.id);
                        setStores(null);
                      }}
                      aria-pressed={universeId === u.id}
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-body-sm transition-colors",
                        universeId === u.id ? "border-moss bg-fern" : "border-line bg-surface-2 hover:border-line-hover",
                      )}
                    >
                      {universeId === u.id && <Check className="size-3.5 text-signal" aria-hidden="true" />}
                      <span className="flex flex-col">
                        {u.name && <span className="text-fg">{u.name}</span>}
                        <span className="font-mono text-caption tracking-normal text-fg-2">{u.id}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={d.universe} hint={d.universeHint} error={fields.universeId}>
                {(id, desc) => (
                  <Input
                    id={id}
                    mono
                    inputMode="numeric"
                    required
                    value={universeId}
                    onChange={(e) => {
                      setUniverseId(e.target.value.replace(/\D/g, ""));
                      setStores(null);
                    }}
                    aria-describedby={desc}
                    aria-invalid={!!fields.universeId}
                  />
                )}
              </Field>
              <Field label={d.placeId} optional={t.common.optional} hint={d.placeHint} error={fields.placeId}>
                {(id, desc) => (
                  <div className="flex gap-2">
                    <Input id={id} mono inputMode="numeric" value={placeId} onChange={(e) => setPlaceId(e.target.value.replace(/\D/g, ""))} aria-describedby={desc} />
                    <Button type="button" variant="secondary" onClick={resolvePlace} loading={resolving} disabled={!placeId}>
                      {resolving ? d.resolving : d.resolve}
                    </Button>
                  </div>
                )}
              </Field>
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <Field label={d.datastore} error={fields.datastoreName}>
              {(id, desc) => (
                <div className="flex gap-2">
                  <Input id={id} mono required maxLength={50} value={datastoreName} onChange={(e) => setDatastoreName(e.target.value)} aria-describedby={desc} />
                  <Button type="button" variant="secondary" icon={<Search className="size-4" aria-hidden="true" />} onClick={() => browse()} disabled={!universeId || !connectionId}>
                    {d.browse}
                  </Button>
                </div>
              )}
            </Field>
            {stores && (
              <div className="overflow-hidden rounded-md border border-line">
                {stores.error ? (
                  <p className="px-3 py-3 text-body-sm text-danger">{stores.error}</p>
                ) : !stores.items.length && !stores.loading ? (
                  <p className="px-3 py-3 text-body-sm text-fg-3">{d.noStores}</p>
                ) : (
                  <ul className="max-h-48 divide-y divide-line overflow-y-auto" aria-label={d.browse}>
                    {stores.items.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => setDatastoreName(s.id)}
                          aria-pressed={datastoreName === s.id}
                          className={cn("flex w-full items-center justify-between gap-3 px-3 py-2 text-left font-mono text-body-sm tracking-normal hover:bg-surface-2", datastoreName === s.id && "bg-fern")}
                        >
                          <span className="truncate">{s.id}</span>
                          {datastoreName === s.id && <Check className="size-3.5 shrink-0 text-signal" aria-hidden="true" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {stores.loading && (
                  <p className="flex items-center gap-2 border-t border-line px-3 py-2 text-caption text-fg-3">
                    <Spinner className="size-3.5" /> {d.browsing}
                  </p>
                )}
                {stores.next && !stores.loading && (
                  <button type="button" onClick={() => browse(stores.next!)} className="w-full border-t border-line px-3 py-2 text-body-sm text-link hover:bg-surface-2">
                    {t.common.loadMore}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={d.scope} hint={d.scopeHint} error={fields.scope}>
              {(id, desc) => <Input id={id} name="scope" mono defaultValue="global" maxLength={50} aria-describedby={desc} />}
            </Field>
            <Field label={d.type}>
              {(id) => (
                <Select id={id} defaultValue="standard">
                  <option value="standard">{d.standard}</option>
                  <option value="ordered" disabled>
                    {d.ordered}
                  </option>
                </Select>
              )}
            </Field>
          </div>
        </form>
      )}
    </Dialog>
  );
}
