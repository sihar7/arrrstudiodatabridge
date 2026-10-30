"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Database, Folder, NavArrowRight, Plus } from "iconoir-react";
import { useApi, useWorkspace } from "@/components/app/workspace";
import { Button, EmptyState, ErrorBox, PageHeader, Skeleton } from "@/components/ui";
import { Lazy } from "@/components/ui/feedback";
import { useI18n } from "@/i18n/client";
import { errorMessage } from "@/lib/api";
import type { Project } from "@/lib/types";

const ProjectDialog = dynamic(() => import("@/components/app/ProjectDialog"), { ssr: false });

export default function ProjectsPage() {
  return (
    <Suspense>
      <Projects />
    </Suspense>
  );
}

function Projects() {
  const { t, locale } = useI18n();
  const { can } = useWorkspace();
  const router = useRouter();
  const params = useSearchParams();
  const list = useApi<Project[]>("/projects");
  const manage = can("projects.manage");
  const [creating, setCreating] = useState(() => params.get("new") === "1" && manage);
  const p = t.projects;

  const newBtn = manage && (
    <Button variant="primary" icon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setCreating(true)}>
      {p.new}
    </Button>
  );

  return (
    <>
      <PageHeader title={p.title} subtitle={p.subtitle} actions={newBtn} />
      {list.loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : list.error ? (
        <ErrorBox message={errorMessage(list.error, t.errors)} onRetry={list.reload} retry={t.common.retry} />
      ) : !list.data?.length ? (
        <EmptyState icon={<Folder />} title={p.emptyTitle} body={p.emptyBody} action={newBtn} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.data.map((proj, i) => (
            <li key={proj.id}>
              {/* Kartu di luar 9 pertama dirender saat mendekati viewport */}
              <Lazy minHeight={i < 9 ? 0 : 150} rootMargin="300px" className="h-full">
                <Link
                  href={`/dashboard/projects/${proj.id}`}
                  className="group flex h-full flex-col gap-4 rounded-md border border-line bg-surface p-5 shadow-inset transition-colors hover:border-line-hover hover:bg-surface-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-9 place-items-center rounded-xs border border-line bg-surface-2 text-fg-2" aria-hidden="true">
                      <Folder className="size-[18px]" />
                    </span>
                    <NavArrowRight className="size-4 text-fg-3 transition-transform group-hover:translate-x-0.5 group-hover:text-fg" aria-hidden="true" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <h2 className="text-sub font-semibold">{proj.name}</h2>
                    {proj.description && <p className="line-clamp-2 text-body-sm text-fg-2">{proj.description}</p>}
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-line pt-3 font-mono text-caption tracking-normal text-fg-3">
                    <span className="flex items-center gap-1.5">
                      <Database className="size-3.5" aria-hidden="true" />
                      {proj.datastoreCount ?? 0} {p.datastores}
                    </span>
                    <span>
                      {p.updated} {new Date(proj.updatedAt).toLocaleDateString(locale === "id" ? "id-ID" : "en-US")}
                    </span>
                  </div>
                </Link>
              </Lazy>
            </li>
          ))}
        </ul>
      )}
      {creating && <ProjectDialog onClose={() => setCreating(false)} onSaved={(proj) => router.push(`/dashboard/projects/${proj.id}`)} />}
    </>
  );
}
