import { cn } from "@/lib/cn";

// Komponen Roblox bersama: logo, tombol OAuth (navigasi penuh ke API → Roblox consent) dan avatar.

export function RobloxMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} aria-hidden="true">
      <path fill="currentColor" d="M5.16 2 2 18.08 18.84 22 22 5.92 5.16 2Zm8.64 12.62-3.9-.75.76-3.9 3.9.76-.76 3.89Z" />
    </svg>
  );
}

/** href = /api/v1/auth/roblox/start?... (bukan Link Next: harus navigasi penuh agar cookie & redirect jalan). */
export function RobloxButton({ href, label, variant = "secondary", className }: { href: string; label: string; variant?: "primary" | "secondary"; className?: string }) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2.5 rounded-md border px-5 text-body-sm font-semibold shadow-inset transition-colors",
        variant === "primary" ? "border-signal-edge bg-signal text-canvas hover:bg-signal-hi" : "border-line bg-surface-2 text-fg hover:border-line-hover hover:bg-surface-3",
        className,
      )}
    >
      <RobloxMark />
      {label}
    </a>
  );
}

export function Avatar({ src, name, size = 32, className }: { src?: string | null; name: string; size?: number; className?: string }) {
  const style = { width: size, height: size };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- avatar CDN Roblox, ukuran kecil tetap
    return <img src={src} alt="" width={size} height={size} loading="lazy" style={style} className={cn("shrink-0 rounded-full border border-line bg-surface-3 object-cover", className)} />;
  }
  return (
    <span style={style} className={cn("grid shrink-0 place-items-center rounded-full border border-line bg-surface-3 font-display text-body-sm font-bold uppercase", className)} aria-hidden="true">
      {name.trim().charAt(0) || "?"}
    </span>
  );
}
