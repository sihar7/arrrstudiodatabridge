// Bentuk respons API DataBridge (lihat api/src/routes).
export type Role = "owner" | "admin" | "developer" | "viewer";
export type Permission = "workspace.update" | "members.manage" | "connections.manage" | "projects.manage" | "datastores.manage" | "migrations.run";

export type User = {
  id: string;
  name: string;
  email: string | null;
  locale: string;
  hasPassword: boolean;
  isAdmin: boolean;
  roblox: { userId: string; username: string | null; displayName: string | null; avatarUrl: string | null } | null;
  discord: { userId: string; username: string | null; avatarUrl: string | null } | null;
};
export type Workspace = { id: string; name: string; slug: string; type: "individual" | "studio"; plan: string; planExpiresAt: string | null; role: Role; permissions: Permission[] };
export type Me = { user: User; workspaces: Workspace[] };

export type ConnectionStatus = "untested" | "active" | "invalid" | "expired" | "disabled";
export type Connection = {
  id: string;
  name: string;
  authType: "api_key" | "oauth";
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

export type Member = {
  userId: string;
  name: string;
  email: string | null;
  role: Role;
  joinedAt: string;
  robloxUsername: string | null;
  robloxAvatarUrl: string | null;
  discordUsername?: string | null;
  discordAvatarUrl?: string | null;
};
export type InviteLink = { id: string; role: Role; expiresAt: string; maxUses: number | null; uses: number; active: boolean; createdAt: string; url?: string };
export type Invite = { id: string; robloxUserId: string; username: string; displayName: string | null; avatarUrl: string | null; role: Role; createdAt: string };
export type RobloxUser = { userId: string; username: string; displayName: string; avatarUrl: string | null };

export type MigrationStatus = "draft" | "queued" | "running" | "paused" | "cancelling" | "cancelled" | "completed" | "completed_with_errors" | "failed";
export type Side = { id: string; label: string; universeId: string; universeName: string | null; datastoreName: string; scope: string };
export type Migration = {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  status: MigrationStatus;
  mode: "full" | "selected" | "prefix";
  selectedKeys: string[] | null;
  prefix: string | null;
  conflictStrategy: "skip_existing" | "overwrite" | "fail_on_conflict" | "rename_key";
  renamePattern: string | null;
  verify: boolean;
  dryRun: boolean;
  currentOperation: string | null;
  lastError: string | null;
  lastDryRunAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  source: Side;
  destination: Side;
  progress: { total: number; processed: number; success: number; skipped: number; conflicts: number; failed: number; percentage: number; keysPerSecond: number; enumerating: boolean };
};
export type MigrationLog = { id: string; level: "info" | "warn" | "error"; message: string; createdAt: string };
export type MigrationItem = { id: string; sourceKey: string; destinationKey: string; status: string; errorCode: string | null; errorMessage: string | null; size: number | null; attempts: number; updatedAt: string };
export type Validation = { ok: boolean; errors: { code: string; detail?: string }[]; warnings: { code: string; detail?: string }[] };
export type Order = { id: string; plan: "developer" | "studio"; months: number; amountIdr: number; uniqueCode: number; status: "pending" | "awaiting_review" | "paid" | "rejected" | "cancelled"; note: string | null; hasProof: boolean; createdAt: string };
export type Overview = { projects: number; connections: number; activeConnections: number; datastores: number; experiences: number };
