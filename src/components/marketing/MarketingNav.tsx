"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Menu, Xmark } from "iconoir-react";
import { cn } from "@/lib/cn";

/** Link nav marketing dengan penanda halaman aktif + menu mobile. */
export function MarketingNav({ items, mobileExtra }: { items: { href: string; label: string }[]; mobileExtra?: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  const link = (it: { href: string; label: string }, mobile?: boolean) => {
    const active = pathname === it.href || pathname.startsWith(`${it.href}/`);
    return (
      <Link
        key={it.href}
        href={it.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "rounded-xs text-body-sm font-medium transition-colors",
          mobile ? "flex h-11 items-center px-3" : "px-3 py-2",
          active ? "text-fg" : "text-fg-2 hover:text-fg",
          active && !mobile && "shadow-[inset_0_-1px_0_0_var(--color-signal)]",
          active && mobile && "bg-surface-3",
        )}
      >
        {it.label}
      </Link>
    );
  };
  return (
    <>
      <div className="hidden flex-1 items-center justify-center gap-1 md:flex">{items.map((it) => link(it))}</div>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={open}
        className="order-last grid size-10 place-items-center rounded-md text-fg-2 hover:bg-surface-3 md:hidden"
      >
        {open ? <Xmark className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-16 animate-pop-in border-b border-line bg-surface p-3 md:hidden">
          <div className="flex flex-col gap-0.5">{items.map((it) => link(it, true))}</div>
          {mobileExtra && <div className="mt-2 border-t border-line px-1 pt-3">{mobileExtra}</div>}
        </div>
      )}
    </>
  );
}
