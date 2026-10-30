import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell, NoWorkspace } from "@/components/app/AppShell";
import { WorkspaceProvider } from "@/components/app/workspace";
import { getMe, getProviders, getWorkspaceCookie } from "@/lib/server-api";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const [me, providers] = await Promise.all([getMe(), getProviders()]);
  if (!me) redirect("/login?next=/dashboard");
  if (!me.workspaces.length) return <NoWorkspace />;
  const cookieWs = await getWorkspaceCookie();
  // Cookie workspace hanya dipakai bila user memang anggota (tenant isolation juga ditegakkan di API)
  const activeId = me.workspaces.find((w) => w.id === cookieWs)?.id ?? me.workspaces[0]!.id;
  return (
    <WorkspaceProvider initialMe={me} activeId={activeId} providers={providers}>
      <AppShell>{children}</AppShell>
    </WorkspaceProvider>
  );
}
