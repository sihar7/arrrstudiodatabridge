"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { useToast } from "@/components/ui/feedback";
import { useF, useI18n } from "@/i18n/client";
import { api, errorMessage } from "@/lib/api";

/** Terima undangan (user sudah login) → pilih workspace itu → dashboard. */
export function InviteAccept({ token, workspaceName }: { token: string; workspaceName: string }) {
  const { t } = useI18n();
  const f = useF();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function accept() {
    setBusy(true);
    try {
      const r = await api<{ workspaceId: string; alreadyMember: boolean }>(`/invites/${encodeURIComponent(token)}/accept`, { method: "POST", workspace: null });
      document.cookie = `dbr_ws=${r.workspaceId}; path=/; max-age=31536000; samesite=lax`;
      toast.success((r.alreadyMember ? f.links.already : f.links.joined).replace("{ws}", workspaceName));
      router.replace("/dashboard");
      router.refresh();
    } catch (e) {
      toast.error(errorMessage(e, t.errors));
      setBusy(false);
    }
  }

  return (
    <Button variant="primary" className="w-full" loading={busy} onClick={accept}>
      {f.links.accept}
    </Button>
  );
}
