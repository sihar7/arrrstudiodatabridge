// Tabel perbandingan paket (hipotesis harga PRD §10). Nilai: true/false, "soon", atau teks/angka per bahasa.
// Satu sumber untuk halaman /pricing; ubah batas paket di sini.

export const PLAN_IDS = ["free", "developer", "studio", "enterprise"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

type Cell = boolean | "soon" | string | { en: string; id: string };
type Row = { label: { en: string; id: string }; hint?: { en: string; id: string }; values: Record<PlanId, Cell> };
type Group = { title: { en: string; id: string }; rows: Row[] };

const unlimited = { en: "Unlimited", id: "Tanpa batas" };
const custom = { en: "Custom", id: "Kustom" };

export const compareGroups: Group[] = [
  {
    title: { en: "Limits", id: "Batas" },
    rows: [
      { label: { en: "Roblox connections", id: "Koneksi Roblox" }, values: { free: "1", developer: "3", studio: "10", enterprise: custom } },
      { label: { en: "Projects", id: "Project" }, values: { free: "1", developer: "5", studio: unlimited, enterprise: unlimited } },
      { label: { en: "Team seats", id: "Anggota tim" }, values: { free: "1", developer: "1", studio: "5", enterprise: custom } },
      { label: { en: "Keys per migration", id: "Key per migrasi" }, hint: { en: "Per job", id: "Per job" }, values: { free: "1,000", developer: "100,000", studio: "1,000,000", enterprise: custom } },
      { label: { en: "Concurrent jobs", id: "Job bersamaan" }, values: { free: "1", developer: "2", studio: "5", enterprise: custom } },
    ],
  },
  {
    title: { en: "Migration", id: "Migrasi" },
    rows: [
      { label: { en: "Dry run", id: "Dry run" }, values: { free: true, developer: true, studio: true, enterprise: true } },
      { label: { en: "Full migration", id: "Migrasi penuh" }, values: { free: true, developer: true, studio: true, enterprise: true } },
      { label: { en: "Selected keys & prefix filter", id: "Key terpilih & filter prefix" }, values: { free: false, developer: true, studio: true, enterprise: true } },
      { label: { en: "Cross-experience transfer", id: "Transfer lintas experience" }, values: { free: false, developer: true, studio: true, enterprise: true } },
      { label: { en: "Read-back verification", id: "Verifikasi baca ulang" }, values: { free: true, developer: true, studio: true, enterprise: true } },
      { label: { en: "Retry failed keys", id: "Ulangi key gagal" }, values: { free: true, developer: true, studio: true, enterprise: true } },
      { label: { en: "All conflict strategies", id: "Semua strategi konflik" }, hint: { en: "Free: skip existing only", id: "Free: hanya skip existing" }, values: { free: false, developer: true, studio: true, enterprise: true } },
      { label: { en: "Schema mapping", id: "Schema mapping" }, values: { free: false, developer: "soon", studio: "soon", enterprise: "soon" } },
      { label: { en: "Priority queue", id: "Antrean prioritas" }, values: { free: false, developer: false, studio: true, enterprise: true } },
    ],
  },
  {
    title: { en: "Data", id: "Data" },
    rows: [
      { label: { en: "Backup & restore", id: "Backup & restore" }, values: { free: false, developer: "soon", studio: "soon", enterprise: "soon" } },
      { label: { en: "Backup storage", id: "Penyimpanan backup" }, values: { free: "—", developer: "5 GB", studio: "50 GB", enterprise: custom } },
      { label: { en: "Backup retention", id: "Retensi backup" }, values: { free: "—", developer: { en: "30 days", id: "30 hari" }, studio: { en: "90 days", id: "90 hari" }, enterprise: custom } },
      { label: { en: "Scheduled backups", id: "Backup terjadwal" }, values: { free: false, developer: false, studio: "soon", enterprise: "soon" } },
      { label: { en: "Data explorer (read-only)", id: "Data explorer (hanya-baca)" }, values: { free: true, developer: true, studio: true, enterprise: true } },
    ],
  },
  {
    title: { en: "Team & security", id: "Tim & keamanan" },
    rows: [
      { label: { en: "Encrypted API keys", id: "API key terenkripsi" }, values: { free: true, developer: true, studio: true, enterprise: true } },
      { label: { en: "Roles (owner, admin, developer, viewer)", id: "Role (owner, admin, developer, viewer)" }, values: { free: false, developer: false, studio: true, enterprise: true } },
      { label: { en: "Audit log retention", id: "Retensi audit log" }, values: { free: "—", developer: { en: "30 days", id: "30 hari" }, studio: { en: "1 year", id: "1 tahun" }, enterprise: custom } },
    ],
  },
  {
    title: { en: "Support", id: "Dukungan" },
    rows: [
      { label: { en: "Community (Discord)", id: "Komunitas (Discord)" }, values: { free: true, developer: true, studio: true, enterprise: true } },
      { label: { en: "Email support", id: "Dukungan email" }, values: { free: false, developer: true, studio: true, enterprise: true } },
      { label: { en: "Cutover assistance", id: "Pendampingan cutover" }, values: { free: false, developer: false, studio: true, enterprise: true } },
      { label: { en: "Dedicated support & SLA", id: "Dukungan khusus & SLA" }, values: { free: false, developer: false, studio: false, enterprise: true } },
    ],
  },
];

export const compareText = {
  en: {
    title: "Compare plans in detail",
    pick: "Plans to compare",
    pickHint: "Pick at least two.",
    diffOnly: "Only show differences",
    feature: "Feature",
    soon: "Soon",
    included: "Included",
    notIncluded: "Not included",
  },
  id: {
    title: "Bandingkan paket secara detail",
    pick: "Paket yang dibandingkan",
    pickHint: "Pilih minimal dua.",
    diffOnly: "Hanya tampilkan yang berbeda",
    feature: "Fitur",
    soon: "Segera",
    included: "Termasuk",
    notIncluded: "Tidak termasuk",
  },
};
