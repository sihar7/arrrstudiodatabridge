// Bentuk respons API DataBridge (lihat api/src/routes).
export type Role = "owner" | "admin" | "developer" | "viewer";
export type Permission = "workspace.update" | "members.manage" | "connections.manage" | "projects.manage" | "datastores.manage" | "migrations.run";

export type User = { id: string; name: string; email: string; locale: string };
export type Workspace = { id: string; name: string; slug: string; type: "individual" | "studio"; plan: string; role: Role; permissions: Permission[] };
export type Me = { user: User; workspaces: Workspace[] };

export type ConnectionStatus = "untested" | "active" | "invalid" | "expired" | "disabled";
export type Connection = {
  id: string;
  name: string;
  keyHint: string;
  keyFingerprint: string;
  status: ConnectionStatus;
  lastTestedAt: string | null;
  lastError: string | null;
  createdAt: string;
  key: null | {
    name: string;
    enabled: boolean;
    expired: boolean;
    expiresAt: string | null;
    capabilities: Record<"listStores" | "listKeys" | "read" | "create" | "update", boolean>;
    universes: { ids: string[]; all: boolean };
  };
};

export type Project = { id: string; name: string; description: string | null; createdAt: string; updatedAt: string; datastoreCount?: number };

export type DatastoreConfig = {
  id: string;
  label: string;
  universeId: string;
  universeName: string | null;
  placeId: string | null;
  datastoreName: string;
  scope: string;
  datastoreType: "standard";
  createdAt: string;
  connection: { id: string; name: string; status: ConnectionStatus };
};

export type Member = { userId: string; name: string; email: string; role: Role; joinedAt: string };
export type Overview = { projects: number; connections: number; activeConnections: number; datastores: number; experiences: number };
