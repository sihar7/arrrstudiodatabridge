import { cn } from "@/lib/cn";

// Tombol "Masuk dengan Discord" — navigasi penuh ke API (bukan Link Next) agar cookie state & redirect OAuth jalan.
export function DiscordMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} aria-hidden="true">
      <path
        fill="currentColor"
        d="M19.6 5.3A17.6 17.6 0 0 0 15.3 4l-.5 1.1a16.3 16.3 0 0 0-4.9 0L9.4 4a17.5 17.5 0 0 0-4.3 1.3C2.4 9.4 1.6 13.4 2 17.3a17.7 17.7 0 0 0 5.4 2.7l1.1-1.8a11.4 11.4 0 0 1-1.7-.8l.4-.3a12.6 12.6 0 0 0 10.8 0l.4.3c-.5.3-1.1.6-1.7.8l1.1 1.8a17.6 17.6 0 0 0 5.4-2.7c.5-4.5-.8-8.5-3.6-12ZM8.7 14.9c-1 0-1.9-1-1.9-2.2s.8-2.2 1.9-2.2 1.9 1 1.9 2.2-.8 2.2-1.9 2.2Zm6.6 0c-1 0-1.9-1-1.9-2.2s.8-2.2 1.9-2.2 1.9 1 1.9 2.2-.8 2.2-1.9 2.2Z"
      />
    </svg>
  );
}

export function DiscordButton({ next, label, className }: { next?: string | null; label: string; className?: string }) {
  const href = `/api/v1/auth/discord/start${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  return (
    <a
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-3 rounded-md border border-[#4752c4] bg-[#5865f2] px-5 text-body-sm font-semibold text-white shadow-inset transition-[filter] hover:brightness-110 active:brightness-95",
        className,
      )}
    >
      <DiscordMark />
      {label}
    </a>
  );
}
