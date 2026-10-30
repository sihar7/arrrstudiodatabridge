"use client";

import { cn } from "@/lib/cn";
import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { WarningTriangle, Xmark } from "iconoir-react";
import type { ConnectionStatus } from "@/lib/types";

export { cn };

/* ───────── Button ─────────
   primary   = satu-satunya tombol berisi hijau (CTA utama per layar)
   secondary = utilitas (Obsidian + hairline) — "mundur" secara visual
   ghost     = transparan + hairline, hover border Pewter
   danger    = aksi destruktif (hanya di dialog konfirmasi) */
type Variant = "primary" | "secondary" | "ghost" | "danger" | "plain";
const variants: Record<Variant, string> = {
  primary: "bg-signal text-canvas border border-signal-edge font-semibold hover:bg-signal-hi active:brightness-95",
  secondary: "bg-surface-2 text-fg border border-line hover:bg-surface-3 hover:border-line-hover",
  ghost: "bg-transparent text-fg border border-line hover:border-line-hover hover:bg-surface",
  danger: "bg-danger-bg text-danger border border-danger-edge hover:brightness-125",
  plain: "bg-transparent text-fg-2 border border-transparent hover:text-fg hover:bg-surface-2",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md"; loading?: boolean; icon?: ReactNode };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading, icon, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md text-body-sm font-medium tracking-[0.025em] shadow-inset",
        "transition-[background-color,border-color,filter,transform] duration-150 active:scale-[0.98]",
        "disabled:pointer-events-none disabled:opacity-45",
        size === "md" ? "h-10 px-5" : "h-8 px-3 text-caption",
        variants[variant],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
});

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("size-4 animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ───────── Form fields ───────── */

const fieldBase =
  "w-full rounded-md border border-line bg-surface-3 px-3 text-body-sm text-fg placeholder:text-fg-3 shadow-inset " +
  "transition-colors duration-150 hover:border-line-hover focus:border-link focus:outline-none " +
  "aria-[invalid=true]:border-danger-edge disabled:opacity-50";

type FieldProps = { label: string; hint?: ReactNode; error?: string; optional?: string; children: (id: string, describedBy?: string) => ReactNode };

export function Field({ label, hint, error, optional, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-body-sm font-medium text-fg">
        {label}
        {optional && <span className="ml-1.5 font-normal text-fg-3">({optional})</span>}
      </label>
      {children(id, [hintId, errId].filter(Boolean).join(" ") || undefined)}
      {hint && !error && (
        <p id={hintId} className="text-caption text-fg-3">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="flex items-center gap-1.5 text-caption text-danger">
          <WarningTriangle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }>(function Input(
  { className, mono, ...rest },
  ref,
) {
  return <input ref={ref} className={cn(fieldBase, "h-10", mono && "font-mono tracking-normal", className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn(fieldBase, "min-h-20 py-2.5 leading-[1.43]", className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cn(fieldBase, "h-10 appearance-none bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-9", className)} style={{ backgroundImage: CHEVRON }} {...rest}>
      {children}
    </select>
  );
});
const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23b5b2bc' stroke-width='1.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

/* ───────── Surfaces ───────── */

/** Card ARR: permukaan level 1 + hairline + inset highlight. `interactive` = hover terangkat 1 tingkat. */
export function Card({
  className,
  children,
  highlighted,
  interactive,
  as: Tag = "div",
}: {
  className?: string;
  children: ReactNode;
  highlighted?: boolean;
  interactive?: boolean;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag
      className={cn(
        "rounded-md border bg-surface shadow-inset",
        highlighted ? "border-moss" : "border-line",
        interactive && "transition-colors duration-150 hover:border-line-hover hover:bg-surface-2",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function PanelHeader({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 border-b border-line bg-surface-2 px-4 py-2 first:rounded-t-md">
      <span className="font-mono text-body-sm uppercase tracking-normal text-fg-2">{children}</span>
      {right}
    </div>
  );
}

/** Tag/label: uppercase 12px, radius 2px. green = status/aksen, violet = dekoratif/“segera”, neutral = info. */
export function Tag({ tone = "neutral", children, className }: { tone?: "green" | "violet" | "neutral" | "danger" | "warn"; children: ReactNode; className?: string }) {
  const tones = {
    green: "border-moss bg-fern text-signal",
    violet: "border-plum bg-transparent text-lavender",
    neutral: "border-line bg-surface-2 text-fg-2",
    danger: "border-danger-edge bg-danger-bg text-danger",
    warn: "border-warn-edge bg-warn-bg text-warn",
  };
  return (
    <span className={cn("inline-flex h-5 items-center gap-1 rounded-xs border px-1.5 text-[11px] font-medium uppercase leading-none tracking-[0.3px]", tones[tone], className)}>
      {children}
    </span>
  );
}

const statusTone: Record<ConnectionStatus, string> = {
  active: "bg-signal",
  untested: "bg-fg-3",
  invalid: "bg-danger",
  expired: "bg-warn",
  disabled: "bg-warn",
};

/** Titik status 8px + teks (warna tidak pernah satu-satunya penanda). */
export function StatusDot({ status, label }: { status: ConnectionStatus; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-body-sm tracking-normal text-fg-2">
      <span className={cn("size-2 rounded-full", statusTone[status])} aria-hidden="true" />
      {label}
    </span>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-md border border-dashed border-line px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-md border border-line bg-surface-2 text-fg-2 [&_svg]:size-5" aria-hidden="true">
        {icon}
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <h3 className="text-sub font-semibold">{title}</h3>
        <p className="text-body-sm text-fg-2">{body}</p>
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-2", className)} aria-hidden="true" />;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-2xl flex-col gap-1.5">
        <h1 className="text-[28px] font-bold leading-[1.15] tracking-display">{title}</h1>
        {subtitle && <p className="text-body-sm text-fg-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </header>
  );
}

/* ───────── Dialog (native <dialog>: focus trap + Esc bawaan browser) ───────── */

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[calc(100%-32px)] rounded-lg border border-line bg-surface p-0 text-fg shadow-inset backdrop:bg-black/70 open:animate-pop-in",
        size === "sm" ? "max-w-md" : size === "md" ? "max-w-lg" : "max-w-2xl",
      )}
    >
      {open && (
        <div className="flex max-h-[calc(100dvh-48px)] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
            <div className="flex flex-col gap-1">
              <h2 id={titleId} className="text-h-sm font-semibold">
                {title}
              </h2>
              {description && <div className="text-body-sm text-fg-2">{description}</div>}
            </div>
            <button onClick={onClose} aria-label="Close" className="-mr-2 -mt-1 grid size-9 shrink-0 place-items-center rounded-md text-fg-2 hover:bg-surface-3 hover:text-fg">
              <Xmark className="size-5" aria-hidden="true" />
            </button>
          </div>
          {children && <div className="overflow-y-auto px-6 py-5">{children}</div>}
          {footer && <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-2 px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

/** Kotak galat dengan tombol coba lagi (galat muat data). */
export function ErrorBox({ message, onRetry, retry }: { message: string; onRetry: () => void; retry: string }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-md border border-danger-edge bg-danger-bg p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-body-sm text-danger">
        <WarningTriangle className="size-4 shrink-0" aria-hidden="true" />
        {message}
      </p>
      <Button size="sm" variant="secondary" onClick={onRetry}>
        {retry}
      </Button>
    </div>
  );
}

/* ───────── Brand mark: dua node + jembatan (code-native, satu warna) ───────── */

/** Emblem logo ARRR DataBridge (A chrome + panah lime) + wordmark "Data" lime · "Bridge" silver, seperti logo. */
export function Logo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- aset kecil statis, tanpa optimasi */}
      <img src={size > 40 ? "/brand/mark-128.png" : "/brand/mark-64.png"} alt="" width={size} height={size} className="shrink-0" />
      <span className="font-display text-[17px] font-bold uppercase tracking-[0.06em]">
        <span className="text-signal">Data</span>
        <span className="text-fg-heading">Bridge</span>
      </span>
    </span>
  );
}
