"use client";

import { useRef, useState } from "react";
import { Check, Copy, CloudUpload } from "iconoir-react";
import { useApi, useWorkspace } from "@/components/app/workspace";
import { Button, Card, ErrorBox, PageHeader, PanelHeader, Skeleton, Tag, cn } from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { fmt, useF, useI18n } from "@/i18n/client";
import { api, apiUpload, errorMessage } from "@/lib/api";
import type { Order } from "@/lib/types";

type Billing = {
  plan: string;
  planExpiresAt: string | null;
  qris: { imageUrl: string; merchant: string };
  prices: Record<"developer" | "studio", Record<string, number>>;
  orders: Order[];
};

const MONTHS = [1, 3, 12] as const;
const SAVE: Record<number, number> = { 1: 0, 3: 5, 12: 15 };
const rupiah = (n: number) => `Rp${n.toLocaleString("id-ID")}`;

export default function BillingPage() {
  const { t, locale } = useI18n();
  const f = useF();
  const b = f.billing;
  const { can, refreshMe } = useWorkspace();
  const toast = useToast();
  const confirm = useConfirm();
  const data = useApi<Billing>("/billing");
  const manage = can("workspace.update");
  const [plan, setPlan] = useState<"developer" | "studio">("developer");
  const [months, setMonths] = useState<1 | 3 | 12>(1);
  const [busy, setBusy] = useState(false);

  const open = data.data?.orders.find((o) => o.status === "pending" || o.status === "awaiting_review" || o.status === "rejected");
  const planName = (p: string) => t.landing.plans.find((x) => x.name.toLowerCase() === p)?.name ?? p;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(locale === "id" ? "id-ID" : "en-US", { dateStyle: "long" });

  async function order() {
    setBusy(true);
    try {
      const o = await api<Order>("/billing/orders", { method: "POST", body: { plan, months } });
      data.setData((d) => (d ? { ...d, orders: [o, ...d.orders.map((x) => (x.status === "pending" ? { ...x, status: "cancelled" as const } : x))] } : d));
    } catch (e) {
      toast.error(errorMessage(e, t.errors));
    } finally {
      setBusy(false);
    }
  }

  async function cancelOrder(o: Order) {
    const ok = await confirm({ title: b.cancelOrder, text: `${planName(o.plan)} · ${rupiah(o.amountIdr)}`, tone: "warning", confirmText: b.cancelOrder });
    if (!ok) return;
    try {
      const u = await api<Order>(`/billing/orders/${o.id}/cancel`, { method: "POST" });
      data.setData((d) => (d ? { ...d, orders: d.orders.map((x) => (x.id === u.id ? u : x)) } : d));
    } catch (e) {
      toast.error(errorMessage(e, t.errors));
    }
  }

  if (data.loading) return <Skeleton className="h-96" />;
  if (data.error || !data.data) return <ErrorBox message={errorMessage(data.error, t.errors)} onRetry={data.reload} retry={t.common.retry} />;
  const d = data.data;

  return (
    <>
      <PageHeader title={b.title} subtitle={b.subtitle} />

      <Card highlighted={d.plan !== "free"} className="flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-caption uppercase tracking-[0.3px] text-fg-3">{b.current}</span>
          <span className="font-display text-[28px] font-bold leading-none tracking-display">{planName(d.plan)}</span>
        </div>
        <span className="text-body-sm text-fg-2">
          {d.plan === "free" ? "" : `${b.until}: ${d.planExpiresAt ? fmtDate(d.planExpiresAt) : b.noExpiry}`}
        </span>
      </Card>

      {!manage ? (
        <p className="text-body-sm text-fg-3">{b.ownersOnly}</p>
      ) : open ? (
        <PayPanel
          order={open}
          qris={d.qris}
          planName={planName(open.plan)}
          onUpdated={(o) => {
            data.setData((x) => (x ? { ...x, orders: x.orders.map((y) => (y.id === o.id ? o : y)) } : x));
            void refreshMe();
          }}
          onCancel={() => cancelOrder(open)}
        />
      ) : (
        <Card>
          <PanelHeader>{b.upgrade}</PanelHeader>
          <div className="flex flex-col gap-5 p-5">
            <div role="radiogroup" aria-label={b.months} className="inline-flex w-fit rounded-md border border-line bg-surface-2 p-0.5">
              {MONTHS.map((m) => (
                <button
                  key={m}
                  role="radio"
                  aria-checked={months === m}
                  onClick={() => setMonths(m)}
                  className={cn("flex h-9 items-center gap-2 rounded-xs px-3 text-body-sm font-medium", months === m ? "bg-surface-3 text-fg" : "text-fg-2 hover:text-fg")}
                >
                  {fmt(b.month, { n: m })}
                  {SAVE[m] ? <span className="text-caption text-signal">{fmt(b.save, { p: SAVE[m]! })}</span> : null}
                </button>
              ))}
            </div>
            <div role="radiogroup" aria-label={b.upgrade} className="grid gap-3 sm:grid-cols-2">
              {(["developer", "studio"] as const).map((p) => {
                const meta = t.landing.plans.find((x) => x.name.toLowerCase() === p)!;
                return (
                  <button
                    key={p}
                    role="radio"
                    aria-checked={plan === p}
                    onClick={() => setPlan(p)}
                    className={cn("flex flex-col gap-3 rounded-md border p-5 text-left transition-colors", plan === p ? "border-moss bg-fern" : "border-line bg-surface-2 hover:border-line-hover")}
                  >
                    <span className="flex items-center justify-between">
                      <span className="text-sub font-semibold">{meta.name}</span>
                      {plan === p && <Check className="size-4 text-signal" aria-hidden="true" />}
                    </span>
                    <span className="font-display text-[26px] font-bold leading-none tracking-display">{rupiah(d.prices[p][String(months)]!)}</span>
                    <ul className="flex flex-col gap-1">
                      {meta.features.map((x) => (
                        <li key={x} className="flex items-center gap-2 text-caption text-fg-2">
                          <Check className="size-3.5 text-signal" aria-hidden="true" />
                          {x}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-body-sm text-fg-2">
                {b.total}: <strong className="text-fg">{rupiah(d.prices[plan][String(months)]!)}</strong>
              </span>
              <Button variant="primary" loading={busy} onClick={order}>
                {b.order}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <PanelHeader>{b.history}</PanelHeader>
        {!d.orders.length ? (
          <p className="px-4 py-8 text-center text-body-sm text-fg-3">{b.noOrders}</p>
        ) : (
          <ul className="divide-y divide-line">
            {d.orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span className="flex flex-col">
                  <span className="text-body-sm font-medium">
                    {planName(o.plan)} · {fmt(b.month, { n: o.months })}
                  </span>
                  <span className="font-mono text-caption tracking-normal text-fg-3">
                    {rupiah(o.amountIdr)} · {fmtDate(o.createdAt)}
                  </span>
                  {o.note && <span className="text-caption text-danger">{o.note}</span>}
                </span>
                <Tag tone={o.status === "paid" ? "green" : o.status === "rejected" ? "danger" : o.status === "awaiting_review" ? "warn" : "neutral"}>{b.orderStatus[o.status]}</Tag>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function PayPanel({ order, qris, planName, onUpdated, onCancel }: { order: Order; qris: Billing["qris"]; planName: string; onUpdated: (o: Order) => void; onCancel: () => void }) {
  const { t } = useI18n();
  const f = useF();
  const b = f.billing;
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [qrisBroken, setQrisBroken] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const o = await apiUpload<Order>(`/billing/orders/${order.id}/proof`, fd);
      onUpdated(o);
      toast.success(b.uploaded);
    } catch (e) {
      toast.error(errorMessage(e, t.errors));
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  const amount = order.amountIdr.toLocaleString("id-ID");
  const head = amount.slice(0, -3);
  const tail = amount.slice(-3);

  return (
    <Card highlighted>
      <PanelHeader right={<Tag tone={order.status === "awaiting_review" ? "warn" : order.status === "rejected" ? "danger" : "neutral"}>{b.orderStatus[order.status]}</Tag>}>
        {b.payTitle}
      </PanelHeader>
      <div className="grid gap-6 p-5 md:grid-cols-[240px_1fr]">
        <div className="grid aspect-square w-full max-w-[240px] place-items-center overflow-hidden rounded-md border border-line bg-white">
          {qris.imageUrl && !qrisBroken ? (
            // eslint-disable-next-line @next/next/no-img-element -- QRIS statis dari konfigurasi
            <img src={qris.imageUrl} alt={`QRIS ${qris.merchant}`} width={240} height={240} className="size-full object-contain" onError={() => setQrisBroken(true)} />
          ) : (
            <p className="p-4 text-center text-caption text-canvas">{b.qrisMissing}</p>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <p className="text-body-sm text-fg-2">{b.payBody}</p>
          <div className="flex flex-col gap-1">
            <span className="text-caption uppercase tracking-[0.3px] text-fg-3">{b.amount}</span>
            <span className="flex items-center gap-3">
              <span className="font-display text-[32px] font-bold leading-none tracking-display tabular">
                Rp{head}
                <span className="text-signal">{tail}</span>
              </span>
              <Button
                size="sm"
                variant="ghost"
                aria-label={t.common.copy}
                icon={<Copy className="size-3.5" aria-hidden="true" />}
                onClick={async () => {
                  await navigator.clipboard.writeText(String(order.amountIdr));
                  toast.success(t.common.copied);
                }}
              />
            </span>
            <span className="text-caption text-fg-3">
              {planName} · {fmt(b.month, { n: order.months })} · {qris.merchant}
            </span>
          </div>
          {order.note && <p className="rounded-md border border-danger-edge bg-danger-bg px-3 py-2 text-body-sm text-danger">{order.note}</p>}
          <div className="flex flex-wrap gap-2">
            <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} id="proof" />
            <Button variant="primary" loading={uploading} icon={<CloudUpload className="size-4" aria-hidden="true" />} onClick={() => input.current?.click()}>
              {b.upload}
            </Button>
            <Button variant="ghost" onClick={onCancel}>
              {b.cancelOrder}
            </Button>
          </div>
          <p className="text-caption text-fg-3">{b.uploadHint}</p>
        </div>
      </div>
    </Card>
  );
}
