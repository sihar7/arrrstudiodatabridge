"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Archive,
  DataTransferBoth,
  Folder,
  Group,
  HomeSimple,
  LogOut,
  Menu,
  NavArrowDown,
  Plus,
  Settings,
  Check,
  Search,
  Xmark,
  CreditCard,
  ShieldCheck,
  CloudSync,
} from "iconoir-react";
import { Button, Dialog, Field, Input, Logo, Select, Tag, cn } from "@/components/ui";
import { useToast } from "@/components/ui/feedback";
import { useF, useI18n } from "@/i18n/client";
import { api, errorMessage } from "@/lib/api";
import type { Workspace } from "@/lib/types";
import { LocaleSwitch } from "./LocaleSwitch";
import { useWorkspace } from "./workspace";

type NavItem = { href: string; label: string; icon: ReactNode; soon?: boolean };

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const f = useF();
  const { me } = useWorkspace();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const mainRef = useRef<HTMLElement>(null);
  // Pindah halaman → drawer mobile ditutup (disesuaikan saat render, bukan di effect)
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawer(false);
  }
  useEffect(() => {
    // Fokus ke konten utama setelah pindah halaman (pembaca layar)
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  const n = t.app.nav;
  const groups: { label?: string; items: NavItem[] }[] = [
    {
      items: [
        { href: "/dashboard", label: n.overview, icon: <HomeSimple /> },
        { href: "/dashboard/projects", label: n.projects, icon: <Folder /> },
        { href: "/dashboard/connections", label: n.connections, icon: <CloudSync /> },
      ],
    },
    {
      label: n.sectionData,
      items: [
        { href: "/dashboard/migrations", label: n.migrations, icon: <DataTransferBoth /> },
        { href: "/dashboard/explorer", label: n.explorer, icon: <Search /> },
        { href: "/dashboard/backups", label: n.backups, icon: <Archive />, soon: true },
      ],
    },
    {
      label: n.sectionWorkspace,
      items: [
        { href: "/dashboard/team", label: n.team, icon: <Group /> },
        { href: "/dashboard/billing", label: f.nav.billing, icon: <CreditCard /> },
        { href: "/dashboard/settings", label: n.settings, icon: <Settings /> },
      ],
    },
    ...(me.user.isAdmin ? [{ label: "Platform", items: [{ href: "/admin", label: f.nav.admin, icon: <ShieldCheck /> }] }] : []),
  ];

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Link href="/dashboard" aria-label="Dashboard">
          <Logo />
        </Link>
      </div>
      <div className="px-3 pb-3">
        <WorkspaceSwitcher />
      </div>
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-2" aria-label="Dashboard">
        {groups.map((g, gi) => (
          <div key={gi} className="flex flex-col gap-0.5">
            {g.label && <p className="px-3 pb-1.5 text-caption font-medium uppercase tracking-[0.3px] text-fg-3">{g.label}</p>}
            {g.items.map((it) => {
              const active = it.href === "/dashboard" ? pathname === it.href : pathname.startsWith(it.href);
              const cls = cn(
                "flex h-9 items-center gap-3 rounded-xs px-3 text-body-sm font-medium transition-colors [&_svg]:size-[18px] [&_svg]:shrink-0",
                active ? "bg-surface-3 text-fg" : "text-fg-2 hover:bg-surface-2 hover:text-fg",
              );
              if (it.soon)
                return (
                  <span key={it.href} className={cn(cls, "cursor-not-allowed text-fg-3 hover:bg-transparent hover:text-fg-3")} aria-disabled="true">
                    <span aria-hidden="true">{it.icon}</span>
                    <span className="flex-1">{it.label}</span>
                    <Tag tone="violet">{t.common.soon}</Tag>
                  </span>
                );
              return (
                <Link key={it.href} href={it.href} className={cls} aria-current={active ? "page" : undefined}>
                  <span aria-hidden="true" className={active ? "text-signal" : undefined}>
                    {it.icon}
                  </span>
                  {it.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <UserFooter />
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 hidden h-dvh border-r border-line bg-surface lg:block">{sidebar}</aside>

      {/* Mobile: top bar + drawer */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur lg:hidden">
        <Link href="/dashboard" aria-label="Dashboard">
          <Logo />
        </Link>
        <button onClick={() => setDrawer(true)} aria-label="Open menu" aria-expanded={drawer} className="grid size-10 place-items-center rounded-md text-fg-2 hover:bg-surface-3">
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </header>
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 animate-fade-in bg-black/70" aria-label="Close menu" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-[min(86vw,300px)] animate-pop-in border-r border-line bg-surface">
            <button onClick={() => setDrawer(false)} aria-label="Close menu" className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-md text-fg-2 hover:bg-surface-3">
              <Xmark className="size-5" aria-hidden="true" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <main ref={mainRef} tabIndex={-1} className="min-w-0 outline-none">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">{children}</div>
      </main>
    </div>
  );
}

function WorkspaceSwitcher() {
  const { t } = useI18n();
  const { me, workspace, switchWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t.app.workspace.switch}
        className="flex w-full items-center gap-3 rounded-md border border-line bg-surface-2 px-3 py-2 text-left shadow-inset transition-colors hover:border-line-hover"
      >
        <WsAvatar ws={workspace} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body-sm font-medium text-fg">{workspace.name}</span>
          <span className="text-caption text-fg-3">{t.app.roles[workspace.role]}</span>
        </span>
        <NavArrowDown className={cn("size-4 shrink-0 text-fg-3 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 animate-pop-in rounded-md border border-line bg-surface-2 p-1 shadow-inset">
          <ul role="listbox" aria-label={t.app.workspace.switch} className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
            {me.workspaces.map((w) => (
              <li key={w.id} role="option" aria-selected={w.id === workspace.id}>
                <button
                  onClick={() => {
                    setOpen(false);
                    if (w.id !== workspace.id) switchWorkspace(w.id);
                  }}
                  className="flex w-full items-center gap-3 rounded-xs px-2 py-2 text-left hover:bg-surface-3"
                >
                  <WsAvatar ws={w} small />
                  <span className="min-w-0 flex-1 truncate text-body-sm">{w.name}</span>
                  {w.id === workspace.id && <Check className="size-4 text-signal" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-1 border-t border-line pt-1">
            <button
              onClick={() => {
                setOpen(false);
                setCreating(true);
              }}
              className="flex w-full items-center gap-3 rounded-xs px-2 py-2 text-body-sm text-fg-2 hover:bg-surface-3 hover:text-fg"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t.app.workspace.create}
            </button>
          </div>
        </div>
      )}
      <CreateWorkspaceDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

function WsAvatar({ ws, small }: { ws: Pick<Workspace, "name">; small?: boolean }) {
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-xs border border-line bg-surface-3 font-display font-bold uppercase text-fg", small ? "size-6 text-[11px]" : "size-8 text-body-sm")}
      aria-hidden="true"
    >
      {ws.name.trim().charAt(0) || "W"}
    </span>
  );
}

export function CreateWorkspaceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const w = t.app.workspace;

  async function submit(form: FormData) {
    setBusy(true);
    setError(null);
    try {
      const ws = await api<Workspace>("/workspaces", { method: "POST", body: { name: form.get("name"), type: form.get("type") }, workspace: null });
      document.cookie = `dbr_ws=${ws.id}; path=/; max-age=31536000; samesite=lax`;
      toast.success(ws.name);
      onClose();
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(errorMessage(e, t.errors));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={w.createTitle}
      description={w.createBody}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button variant="primary" type="submit" form="create-ws" loading={busy}>
            {busy ? t.common.creating : t.common.create}
          </Button>
        </>
      }
    >
      <form
        id="create-ws"
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(new FormData(e.currentTarget));
        }}
      >
        <Field label={w.name} error={error ?? undefined}>
          {(id, d) => <Input id={id} name="name" required maxLength={80} autoFocus aria-describedby={d} />}
        </Field>
        <Field label={w.type}>
          {(id) => (
            <Select id={id} name="type" defaultValue="studio">
              <option value="studio">{w.studio}</option>
              <option value="individual">{w.individual}</option>
            </Select>
          )}
        </Field>
      </form>
    </Dialog>
  );
}

function UserFooter() {
  const { t } = useI18n();
  const { me } = useWorkspace();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-col gap-3 border-t border-line p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line bg-surface-3 font-display text-body-sm font-bold uppercase" aria-hidden="true">
          {me.user.name.charAt(0)}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body-sm font-medium">{me.user.name}</span>
          <span className="truncate text-caption text-fg-3">{me.user.email}</span>
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <LocaleSwitch />
        <Button
          variant="plain"
          size="sm"
          loading={busy}
          icon={<LogOut className="size-4" aria-hidden="true" />}
          onClick={async () => {
            setBusy(true);
            await api("/auth/logout", { method: "POST", workspace: null }).catch(() => {});
            router.replace("/");
            router.refresh();
          }}
        >
          {t.common.signOut}
        </Button>
      </div>
    </div>
  );
}

/** User tanpa workspace (keluar dari semuanya) → wajib membuat satu. */
export function NoWorkspace() {
  const [open, setOpen] = useState(true);
  const { t } = useI18n();
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <Button variant="primary" icon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setOpen(true)}>
        {t.app.workspace.create}
      </Button>
      <CreateWorkspaceDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
