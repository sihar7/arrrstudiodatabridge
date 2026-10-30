"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/** Navigasi docs per grup dengan penanda halaman aktif. */
export function DocsSidebar({ groups, label }: { groups: { name: string; pages: { slug: string; title: string }[] }[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="flex flex-col gap-6">
      {groups.map((g) => (
        <div key={g.name} className="flex flex-col gap-1">
          <p className="pb-1.5 text-caption font-medium uppercase tracking-[0.3px] text-fg-3">{g.name}</p>
          <ul className="flex flex-col border-l border-line">
            {g.pages.map((p) => {
              const href = `/docs/${p.slug}`;
              const active = pathname === href;
              return (
                <li key={p.slug}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "-ml-px block border-l py-1.5 pl-4 text-body-sm transition-colors",
                      active ? "border-signal font-medium text-fg" : "border-transparent text-fg-2 hover:border-fg-3 hover:text-fg",
                    )}
                  >
                    {p.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
