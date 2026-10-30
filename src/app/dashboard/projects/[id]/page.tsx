"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Database, EditPencil, InfoCircle, NavArrowLeft, Plus, Trash } from "iconoir-react";
import { useApi, useWorkspace } from "@/components/app/workspace";
import { Button, Card, EmptyState, ErrorBox, PageHeader, PanelHeader, Skeleton, StatusDot, Tag } from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { useI18n } from "@/i18n/client";
import { api, errorMessage } from "@/lib/api";
import type { DatastoreConfig, Project } from "@/lib/types";

const DatastoreDialog = dynamic(() => import("@/components/app/DatastoreDialog"), { ssr: false });
const ProjectDialog = dynamic(() => import("@/components/app/ProjectDialog"), { ssr: false });

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const { can } = useWorkspace();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const project = useApi<Project>(`/projects/${id}`);
  const configs = useApi<DatastoreConfig[]>(`/projects/${id}/datastores`);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const p = t.projects;
  const d = t.datastores;
  const manageProject = can("projects.manage");
  const manageDs = can("datastores.manage");

  // Universe yang dipakai >1 konfigurasi → tandai "experience sama" (PRD 3.2)
  const sharedUniverses = useMemo(() => {
    const count = new Map<string, number>();
    configs.data?.forEach((c) => count.set(c.universeId, (count.get(c.universeId) ?? 0) + 1));
    return new Set([...count].filter(([, n]) => n > 1).map(([u]) => u));
  }, [configs.data]);

  async function deleteProject() {
    if (!project.data) return;
    const name = project.data.name;
    const ok = await confirm({
      title: p.deleteTitle,
      text: p.deleteBody,
      tone: "danger",
      confirmText: t.common.delete,
      typeToConfirm: name,
      preConfirm: async () => {
        try {
          await api(`/projects/${id}`, { method: "DELETE" });
        } catch (e) {
          throw new Error(errorMessage(e, t.errors));
        }
      },
    });
    if (ok) {
      toast.success(t.common.delete, name);
      router.push("/dashboard/projects");
    }
  }

  async function removeConfig(c: DatastoreConfig) {
    const ok = await confirm({
      title: d.deleteTitle,
      text: (
        <>
          {d.deleteBody}
          <code className="mt-2 block font-mono text-caption text-fg">
            {c.universeId} › {c.datastoreName} › {c.scope}
          </code>
        </>
      ),
      tone: "danger",
      confirmText: t.common.delete,
      preConfirm: async () => {
        try {
          await api(`/projects/${id}/datastores/${c.id}`, { method: "DELETE" });
        } catch (e) {
          throw new Error(errorMessage(e, t.errors));
        }
      },
    });
    if (ok) configs.setData((list) => list?.filter((x) => x.id !== c.id) ?? null);
  }

  if (project.error) {
    return (
      <>
        <BackLink label={p.title} />
        <ErrorBox message={errorMessage(project.error, t.errors)} onRetry={project.reload} retry={t.common.retry} />
      </>
    );
  }

  const addBtn = manageDs && (
    <Button variant="primary" icon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setAdding(true)}>
      {d.add}
    </Button>
  );

  return (
    <>
      <BackLink label={p.title} />
      {project.data ? (
        <PageHeader
          title={project.data.name}
          subtitle={project.data.description ?? undefined}
          actions={
            manageProject && (
              <>
                <Button variant="ghost" icon={<EditPencil className="size-4" aria-hidden="true" />} onClick={() => setEditing(true)}>
                  {t.common.edit}
                </Button>
                <Button variant="plain" className="hover:text-danger" icon={<Trash className="size-4" aria-hidden="true" />} onClick={deleteProject}>
                  {t.common.delete}
                </Button>
              </>
            )
          }
        />
      ) : (
        <Skeleton className="h-20" />
      )}

      <Card>
        <PanelHeader right={configs.data?.length ? addBtn && <span className="hidden sm:block">{addBtn}</span> : null}>{d.title}</PanelHeader>
        {configs.loading ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : configs.error ? (
          <div className="p-4">
            <ErrorBox message={errorMessage(configs.error, t.errors)} onRetry={configs.reload} retry={t.common.retry} />
          </div>
        ) : !configs.data?.length ? (
          <div className="p-4">
            <EmptyState icon={<Database />} title={d.emptyTitle} body={d.emptyBody} action={addBtn} />
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[1.3fr_1.2fr_1fr_0.7fr_1fr_40px] gap-4 border-b border-line px-4 py-2.5 text-caption font-medium uppercase tracking-[0.3px] text-fg-3 md:grid">
              <span>{d.label}</span>
              <span>{d.universe}</span>
              <span>{d.datastore}</span>
              <span>{d.scope}</span>
              <span>{d.connection}</span>
              <span className="sr-only">{t.common.delete}</span>
            </div>
            <ul className="divide-y divide-line">
              {configs.data.map((c) => (
                <li key={c.id} className="grid gap-x-4 gap-y-2 px-4 py-3.5 md:grid-cols-[1.3fr_1.2fr_1fr_0.7fr_1fr_40px] md:items-center">
                  <span className="flex flex-col gap-1">
                    <span className="text-body-sm font-medium">{c.label}</span>
                    <span className="flex flex-wrap gap-1.5">
                      <Tag tone="neutral">{d.standard}</Tag>
                      {sharedUniverses.has(c.universeId) && <Tag tone="violet">{d.sameUniverse}</Tag>}
                    </span>
                  </span>
                  <span className="flex flex-col font-mono text-body-sm tracking-normal">
                    {c.universeName && <span className="font-sans text-body-sm tracking-[0.025em] text-fg">{c.universeName}</span>}
                    <span className="text-fg-2">
                      <span className="text-fg-3 md:hidden">{d.universe}: </span>
                      {c.universeId}
                    </span>
                    {c.placeId && (
                      <span className="text-caption text-fg-3">
                        {d.placeId}: {c.placeId}
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-body-sm tracking-normal text-lilac [overflow-wrap:anywhere]">{c.datastoreName}</span>
                  <span className="font-mono text-body-sm tracking-normal text-fg-2">{c.scope}</span>
                  <span className="flex flex-col gap-0.5">
                    <span className="truncate text-body-sm">{c.connection.name}</span>
                    <StatusDot status={c.connection.status} label={t.connections.status[c.connection.status]} />
                  </span>
                  {manageDs && (
                    <button
                      onClick={() => removeConfig(c)}
                      aria-label={`${t.common.delete} ${c.label}`}
                      className="grid size-9 place-items-center justify-self-start rounded-md text-fg-3 hover:bg-danger-bg hover:text-danger md:justify-self-end"
                    >
                      <Trash className="size-4" aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {manageDs && (
              <div className="border-t border-line p-4 sm:hidden">
                <Button variant="primary" className="w-full" icon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setAdding(true)}>
                  {d.add}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {sharedUniverses.size > 0 && (
        <p className="flex gap-2 rounded-md border border-plum bg-surface px-4 py-3 text-body-sm text-fg-2">
          <InfoCircle className="mt-0.5 size-4 shrink-0 text-lilac" aria-hidden="true" />
          {d.sameUniverseNote}
        </p>
      )}

      {adding && <DatastoreDialog projectId={id} onClose={() => setAdding(false)} onSaved={(c) => configs.setData((list) => [...(list ?? []), c])} />}
      {editing && project.data && <ProjectDialog project={project.data} onClose={() => setEditing(false)} onSaved={(np) => project.setData(() => np)} />}
    </>
  );
}

function BackLink({ label }: { label: string }) {
  return (
    <Link href="/dashboard/projects" className="-mb-4 flex w-fit items-center gap-1 text-body-sm text-fg-2 hover:text-fg">
      <NavArrowLeft className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
