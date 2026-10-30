import "server-only";
import { cookies } from "next/headers";
import type { Me } from "./types";

// Panggilan API dari Server Component: langsung ke API_URL dengan meneruskan cookie sesi.
const API = (process.env.API_URL || "http://localhost:8080").replace(/\/$/, "");
export const WORKSPACE_COOKIE = "dbr_ws";

export async function getMe(): Promise<Me | null> {
  const jar = await cookies();
  const session = jar.get("dbr_session")?.value;
  if (!session) return null;
  try {
    const res = await fetch(`${API}/api/v1/auth/me`, { headers: { cookie: `dbr_session=${session}` }, cache: "no-store" });
    if (!res.ok) return null;
    return ((await res.json()) as { data: Me }).data;
  } catch {
    return null;
  }
}

export async function getWorkspaceCookie(): Promise<string | null> {
  return (await cookies()).get(WORKSPACE_COOKIE)?.value ?? null;
}
