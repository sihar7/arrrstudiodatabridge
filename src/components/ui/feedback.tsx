"use client";

/*
  Kit feedback global ARR — dipasang sekali di root layout (<FeedbackProvider>):
  • Loading bar  : garis tipis di atas layar; aktif saat navigasi halaman & setiap request API (lib/api.ts).
  • Toast        : toast.success/error/info/warning(judul, deskripsi?) — bar hitung mundur, pause saat hover.
  • Confirm      : await confirm({...}) → boolean; gaya "SweetAlert" versi ARR (ikon beranimasi, tone,
                   ketik-untuk-konfirmasi, preConfirm dengan loading & galat inline). Ganti window.confirm.
  • ProgressBar  : determinate (value 0–100) / indeterminate (value undefined).
  • Lazy         : render anak saat masuk viewport (section di bawah lipatan).
*/

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Check, InfoCircle, WarningTriangle, Xmark } from "iconoir-react";
import { Button, Input, cn } from "./index";

/* ═════════════ Loading bar ═════════════ */

const activeKeys = new Set<string>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
let seq = 0;

export const loading = {
  /** Mulai indikator; kembalikan fungsi selesai (aman dipanggil berkali-kali). */
  start(key = `k${++seq}`) {
    activeKeys.add(key);
    emit();
    let done = false;
    return () => {
      if (done) return;
      done = true;
      activeKeys.delete(key);
      emit();
    };
  },
  stop(key: string) {
    if (activeKeys.delete(key)) emit();
  },
};

function useLoadingActive() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => activeKeys.size > 0,
    () => false,
  );
}

function LoadingBar() {
  const active = useLoadingActive();
  const [phase, setPhase] = useState<"idle" | "run" | "finish">("idle");
  // Hindari kedip untuk request < 120 ms
  useEffect(() => {
    if (active) {
      const t = setTimeout(() => setPhase("run"), 120);
      return () => clearTimeout(t);
    }
    const t1 = setTimeout(() => setPhase((p) => (p === "run" ? "finish" : p)), 0);
    const t2 = setTimeout(() => setPhase("idle"), 420);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5">
      <div
        className={cn(
          "motion-keep h-full origin-left bg-signal",
          phase === "idle" && "w-0 opacity-0",
          phase === "run" && "w-[88%] opacity-100 transition-[width] duration-[8000ms] ease-out",
          phase === "finish" && "w-full opacity-0 transition-[width,opacity] duration-300 [transition-delay:0ms,150ms]",
        )}
      />
    </div>
  );
}

/** Navigasi: klik link internal → mulai; pathname berubah → selesai (maks 10 dtk). */
function NavigationTracker() {
  const pathname = usePathname();
  useEffect(() => {
    loading.stop("nav");
  }, [pathname]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      loading.start("nav");
      clearTimeout(timer);
      timer = setTimeout(() => loading.stop("nav"), 10_000);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimeout(timer);
    };
  }, []);
  return null;
}

/* ═════════════ Toast ═════════════ */

type Tone = "success" | "error" | "info" | "warning";
type ToastItem = { id: number; tone: Tone; title: string; description?: string; duration: number };
type ToastApi = Record<Tone, (title: string, description?: string) => void>;

const toneIcon: Record<Tone, { icon: ReactNode; color: string; bar: string }> = {
  success: { icon: <Check />, color: "text-signal border-moss bg-fern", bar: "bg-signal" },
  error: { icon: <WarningTriangle />, color: "text-danger border-danger-edge bg-danger-bg", bar: "bg-danger" },
  warning: { icon: <WarningTriangle />, color: "text-warn border-warn-edge bg-warn-bg", bar: "bg-warn" },
  info: { icon: <InfoCircle />, color: "text-link border-line bg-surface-3", bar: "bg-link" },
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast harus di dalam <FeedbackProvider>");
  return ctx;
}

function ToastView({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const t = toneIcon[item.tone];
  return (
    <div
      role={item.tone === "error" ? "alert" : "status"}
      className="group pointer-events-auto relative flex w-full animate-pop-in gap-3 overflow-hidden rounded-md border border-line bg-surface-2 py-3 pl-3 pr-10 shadow-inset"
    >
      <span className={cn("grid size-7 shrink-0 place-items-center rounded-xs border [&_svg]:size-4", t.color)} aria-hidden="true">
        {t.icon}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
        <p className="text-body-sm font-medium text-fg">{item.title}</p>
        {item.description && <p className="text-caption text-fg-2 [overflow-wrap:anywhere]">{item.description}</p>}
      </div>
      <button
        onClick={onClose}
        aria-label="Dismiss"
        className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-md text-fg-3 hover:bg-surface-3 hover:text-fg"
      >
        <Xmark className="size-4" aria-hidden="true" />
      </button>
      {/* Bar hitung mundur: animasi CSS → toast hilang di animationend; pause saat hover/fokus */}
      <span
        className={cn("motion-keep absolute bottom-0 left-0 h-0.5 w-full origin-left opacity-70", t.bar, "group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]")}
        style={{ animation: `countdown ${item.duration}ms linear forwards` }}
        onAnimationEnd={onClose}
        aria-hidden="true"
      />
    </div>
  );
}

/* ═════════════ Confirm (ala SweetAlert, versi ARR) ═════════════ */

export type ConfirmOptions = {
  title: string;
  text?: ReactNode;
  tone?: "danger" | "warning" | "info" | "success";
  confirmText?: string;
  cancelText?: string;
  /** Wajib mengetik teks ini persis sebelum tombol konfirmasi aktif (aksi destruktif/berisiko). */
  typeToConfirm?: string;
  typeToConfirmLabel?: string;
  /** Dijalankan saat konfirmasi ditekan; tombol loading; throw Error → pesan tampil di dialog. */
  preConfirm?: () => Promise<unknown>;
  /** Mode alert: tanpa tombol batal. */
  alert?: boolean;
};

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm harus di dalam <FeedbackProvider>");
  return ctx;
}

const confirmTone = {
  danger: { ring: "border-danger-edge bg-danger-bg text-danger", path: "M12 7.5v6M12 16.5v.01" },
  warning: { ring: "border-warn-edge bg-warn-bg text-warn", path: "M12 7.5v6M12 16.5v.01" },
  info: { ring: "border-line bg-surface-3 text-link", path: "M12 11v5.5M12 7.5v.01" },
  success: { ring: "border-moss bg-fern text-signal", path: "M7.5 12.5l3 3 6-6.5" },
} as const;

function ConfirmView({
  opts,
  labels,
  onResolve,
}: {
  opts: ConfirmOptions;
  labels: { confirm: string; cancel: string; typeToConfirm: string };
  onResolve: (v: boolean) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tone = confirmTone[opts.tone ?? "warning"];

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const cancel = () => {
    if (!busy) onResolve(false);
  };
  const confirm = async () => {
    if (opts.typeToConfirm && typed !== opts.typeToConfirm) return;
    if (!opts.preConfirm) return onResolve(true);
    setBusy(true);
    setError(null);
    try {
      await opts.preConfirm();
      onResolve(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        cancel();
      }}
      onClick={(e) => {
        if (e.target === ref.current) cancel();
      }}
      className="m-auto w-[calc(100%-32px)] max-w-[420px] rounded-lg border border-line bg-surface p-0 text-fg shadow-inset backdrop:bg-black/75 open:animate-pop-in"
    >
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          void confirm();
        }}
        className="flex flex-col items-center gap-5 px-6 pb-6 pt-8 text-center"
      >
        <span className={cn("grid size-14 place-items-center rounded-full border", tone.ring)} aria-hidden="true">
          <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={tone.path} pathLength={1} className="animate-draw" style={{ strokeDasharray: 1 }} />
          </svg>
        </span>
        <div className="flex flex-col gap-2">
          <h2 id={titleId} className="text-h-sm font-semibold">
            {opts.title}
          </h2>
          {opts.text && <div className="text-body-sm text-fg-2">{opts.text}</div>}
        </div>
        {opts.typeToConfirm && (
          <label className="flex w-full flex-col gap-1.5 text-left">
            <span className="text-caption text-fg-2">
              {opts.typeToConfirmLabel ?? labels.typeToConfirm}{" "}
              <code className="rounded-xs border border-line bg-surface-2 px-1.5 py-0.5 text-caption text-fg">{opts.typeToConfirm}</code>
            </span>
            <Input autoFocus mono value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} />
          </label>
        )}
        {error && (
          <p role="alert" className="flex w-full items-start gap-2 rounded-md border border-danger-edge bg-danger-bg px-3 py-2 text-left text-caption text-danger">
            <WarningTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row">
          {!opts.alert && (
            <Button type="button" variant="ghost" className="flex-1" onClick={cancel} disabled={busy}>
              {opts.cancelText ?? labels.cancel}
            </Button>
          )}
          <Button
            type="submit"
            variant={opts.tone === "danger" ? "danger" : "primary"}
            className="flex-1"
            loading={busy}
            disabled={!!opts.typeToConfirm && typed !== opts.typeToConfirm}
            autoFocus={!opts.typeToConfirm}
          >
            {opts.confirmText ?? labels.confirm}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

/* ═════════════ Provider ═════════════ */

export function FeedbackProvider({ children, labels }: { children: ReactNode; labels: { confirm: string; cancel: string; typeToConfirm: string } }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pending, setPending] = useState<{ opts: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);

  const push = useCallback((tone: Tone, title: string, description?: string) => {
    const id = Date.now() + Math.random();
    const duration = tone === "error" ? 6500 : 4500;
    setToasts((t) => [...t.slice(-3), { id, tone, title, description, duration }]);
  }, []);
  const [toastApi] = useState<ToastApi>(() => ({
    success: (a, b) => push("success", a, b),
    error: (a, b) => push("error", a, b),
    info: (a, b) => push("info", a, b),
    warning: (a, b) => push("warning", a, b),
  }));

  const confirm = useCallback<ConfirmFn>(
    (opts) =>
      new Promise<boolean>((resolve) => {
        setPending((prev) => {
          prev?.resolve(false); // hanya satu dialog konfirmasi sekaligus
          return { opts, resolve };
        });
      }),
    [],
  );

  return (
    <ToastContext.Provider value={toastApi}>
      <ConfirmContext.Provider value={confirm}>
        <LoadingBar />
        <NavigationTracker />
        {children}
        {pending && (
          <ConfirmView
            key={pending.opts.title}
            opts={pending.opts}
            labels={labels}
            onResolve={(v) => {
              pending.resolve(v);
              setPending(null);
            }}
          />
        )}
        <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[calc(100%-32px)] max-w-sm flex-col gap-2" aria-live="polite">
          {toasts.map((t) => (
            <ToastView key={t.id} item={t} onClose={() => setToasts((all) => all.filter((x) => x.id !== t.id))} />
          ))}
        </div>
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}

/* ═════════════ ProgressBar ═════════════ */

export function ProgressBar({
  value,
  label,
  hideLabel,
  showValue,
  size = "md",
  tone = "signal",
  className,
}: {
  /** 0–100; undefined = indeterminate */
  value?: number;
  label?: string;
  /** Label hanya untuk pembaca layar (judul sudah terlihat di dekatnya) */
  hideLabel?: boolean;
  showValue?: boolean;
  size?: "sm" | "md";
  tone?: "signal" | "neutral" | "danger";
  className?: string;
}) {
  const v = value === undefined ? undefined : Math.max(0, Math.min(100, value));
  const fill = tone === "signal" ? "bg-signal" : tone === "danger" ? "bg-danger" : "bg-fg-2";
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {((label && !hideLabel) || showValue) && (
        <div className="flex items-baseline justify-between gap-3 text-caption">
          {label && !hideLabel && <span className="text-fg-2">{label}</span>}
          {showValue && v !== undefined && <span className="font-mono tabular tracking-normal text-fg">{Math.round(v)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={v}
        className={cn("relative w-full overflow-hidden rounded-xs bg-surface-3", size === "md" ? "h-1.5" : "h-1")}
      >
        {v === undefined ? (
          <span className={cn("motion-keep absolute inset-y-0 w-1/3 animate-indeterminate rounded-xs", fill)} />
        ) : (
          <span className={cn("block h-full rounded-xs transition-[width] duration-500 ease-out", fill)} style={{ width: `${v}%` }} />
        )}
      </div>
    </div>
  );
}

/* ═════════════ Lazy ═════════════ */

/** Render anak saat elemen mendekati viewport (sekali). Ruang dicadangkan lewat minHeight (cegah CLS). */
export function Lazy({ children, minHeight = 240, rootMargin = "200px", className }: { children: ReactNode; minHeight?: number; rootMargin?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, visible]);
  return (
    <div ref={ref} className={className} style={visible ? undefined : { minHeight }}>
      {visible && <div className="animate-fade-in">{children}</div>}
    </div>
  );
}

/** Konten tetap di-render server (SEO), hanya animasi muncul yang menunggu viewport. */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} data-seen={seen || undefined} className={cn("reveal", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
