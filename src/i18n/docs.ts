// Konten dokumentasi per halaman (/docs/[slug]) — EN + ID. Blok: p, steps, list, table, callout, code.

export type Block =
  | { type: "p"; text: string }
  | { type: "steps"; items: string[] }
  | { type: "list"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][]; mono?: number[] }
  | { type: "callout"; tone: "info" | "warn" | "success"; title?: string; text: string }
  | { type: "code"; text: string }
  | { type: "h"; text: string };

export type DocPage = { slug: string; group: string; title: string; summary: string; blocks: Block[] };

const en: DocPage[] = [
  {
    slug: "getting-started",
    group: "Start here",
    title: "Quickstart",
    summary: "Your first dry run in about ten minutes.",
    blocks: [
      { type: "p", text: "DataBridge copies Roblox DataStore entries from a source to a destination over the official Open Cloud API. Nothing runs inside your game and nothing is installed in Studio." },
      { type: "h", text: "What you need" },
      { type: "list", items: ["Owner or group permission to create Open Cloud API keys for the experiences involved.", "The Universe ID of the source and destination experiences (or a Place ID — we look it up).", "The DataStore name and scope you migrate from and to."] },
      { type: "h", text: "Steps" },
      { type: "steps", items: ["Create an Open Cloud API key with DataStore permissions.", "In DataBridge → Connections, paste the key. It is tested immediately.", "Create a project and add the source DataStore, then the destination DataStore.", "Create a migration, keep the default “skip existing” rule and run a dry run.", "Review the dry-run report, schedule a maintenance window, then run the migration and wait for every key to be verified."] },
      { type: "callout", tone: "info", text: "Migrations are available in the next release. Connections, projects and DataStore configuration are ready today, so you can prepare everything now." },
    ],
  },
  {
    slug: "api-key",
    group: "Start here",
    title: "Create an Open Cloud API key",
    summary: "Generate a key Roblox will accept for DataStore access.",
    blocks: [
      { type: "steps", items: ["Open Creator Dashboard → Credentials → API Keys and click “Create API Key”.", "Name it after its purpose, e.g. “DataBridge — Obby migration”.", "Under Access Permissions choose “Data Stores”, then select each experience the key may touch.", "Add the operations listed in Permissions (read for source, plus write for destination).", "Leave “Accepted IP addresses” empty or enter 0.0.0.0/0 — DataBridge workers don’t have a fixed IP.", "Optionally set an expiration date, save, and copy the key."] },
      { type: "callout", tone: "warn", title: "Copy it once", text: "Roblox shows the key only once. Paste it straight into DataBridge; we encrypt it at rest and never display it again." },
      { type: "h", text: "Expiry and rotation" },
      { type: "p", text: "Roblox automatically expires keys that are not used or updated for 60 days. When a key expires or you rotate it, create a new key and use “Replace key” on the connection — existing DataStore configs keep working." },
      { type: "p", text: "Deleting a connection in DataBridge does not revoke the key in Roblox. Revoke it in Creator Dashboard if it is no longer needed." },
    ],
  },
  {
    slug: "permissions",
    group: "Start here",
    title: "Permissions",
    summary: "Exactly which operations each side of a migration needs.",
    blocks: [
      { type: "p", text: "Give the key the smallest set of operations the job needs. DataBridge reads the key’s permissions when you test the connection and shows them on the Connections page." },
      { type: "table", head: ["Scope", "Operations", "Needed for"], rows: [["universe-datastores.control", "list", "Browsing DataStores in an experience"], ["universe-datastores.objects", "list, read", "Reading keys and values from the source"], ["universe-datastores.objects", "create, update", "Writing to the destination"], ["universe-datastores.versions", "list, read", "Revision history (Data Explorer, later)"]], mono: [0, 1] },
      { type: "h", text: "Separate keys for separate experiences" },
      { type: "p", text: "For cross-experience transfers you can use one key granted to both experiences, or one connection per experience. DataBridge validates source and destination access separately — one key is never assumed to cover both." },
    ],
  },
  {
    slug: "universe-vs-place",
    group: "Concepts",
    title: "Universe ID vs Place ID",
    summary: "Why DataStores belong to experiences, not places.",
    blocks: [
      { type: "p", text: "A universe is the experience. It contains one or more places, and every place in the same universe reads and writes the same DataStores." },
      { type: "table", head: ["", "Universe ID", "Place ID"], rows: [["Identifies", "The experience", "One place inside it"], ["Owns DataStores", "Yes", "No"], ["Where to find it", "Creator Dashboard → experience → ⋯ → Copy Universe ID", "The number in the game URL"]] },
      { type: "callout", tone: "info", text: "Only have a Place ID? Paste it in the “Add DataStore” dialog and press “Find universe”." },
      { type: "h", text: "Same experience, different places" },
      { type: "p", text: "Place A and Place B in the same universe already share data. Copying is only useful when you rename the DataStore, change scope, or restructure the data." },
    ],
  },
  {
    slug: "projects-datastores",
    group: "Concepts",
    title: "Projects & DataStore configs",
    summary: "How DataBridge describes what moves where.",
    blocks: [
      { type: "p", text: "A project groups the DataStores involved in one game or one migration effort. Each DataStore config points at a connection, a universe, a DataStore name and a scope." },
      { type: "table", head: ["Field", "Example", "Notes"], rows: [["Label", "Source — PlayerData v1", "Shown in migration wizards"], ["Universe ID", "111111", "Required"], ["DataStore", "PlayerData_V1", "Max 50 characters"], ["Scope", "global", "Default scope"], ["Type", "Standard", "Ordered DataStores come later"]], mono: [1] },
      { type: "p", text: "Use “Browse DataStores” to pick an existing name instead of typing it — typos create a brand new, empty DataStore on write." },
    ],
  },
  {
    slug: "safe-defaults",
    group: "Migrations",
    title: "Safe defaults & conflicts",
    summary: "What DataBridge will and won’t do unless you say so.",
    blocks: [
      { type: "list", items: ["The source DataStore is only read — never edited or deleted.", "Every migration starts as a dry run that reads everything and writes nothing.", "Each written key is read back and compared before it counts as success.", "Failed keys can be retried without repeating successful ones."] },
      { type: "h", text: "Conflict strategies" },
      { type: "table", head: ["Strategy", "When the destination key exists"], rows: [["skip_existing", "Leave it and mark the key skipped (default)."], ["overwrite", "Replace it — requires typing a confirmation."], ["fail_on_conflict", "Mark a conflict and write nothing."], ["rename_key", "Write to a new key name using your mapping rule."]], mono: [0] },
      { type: "callout", tone: "warn", text: "Overwrite cannot be undone by DataBridge. Take a backup first when it becomes available, or test on a copy of the DataStore." },
    ],
  },
  {
    slug: "cutover",
    group: "Migrations",
    title: "Live players & cutover",
    summary: "A checklist for migrating while your game is live.",
    blocks: [
      { type: "callout", tone: "warn", title: "Not atomic", text: "If a player saves after their key was read, the destination receives the older value. Plan a short window where saving is paused." },
      { type: "steps", items: ["Run a dry run during normal traffic to measure duration and spot conflicts.", "Announce maintenance and pick a low-traffic time.", "Shut down servers or disable saving to the affected DataStore.", "Run the migration and wait until every key is verified.", "Publish the game update that reads the new DataStore.", "Keep the old DataStore untouched for at least a week as a rollback path."] },
      { type: "h", text: "Rollback" },
      { type: "p", text: "Because the source is never modified, rolling back means publishing the previous game version that reads the old DataStore. Data saved to the new store after cutover is not copied back automatically." },
    ],
  },
  {
    slug: "limits",
    group: "Reference",
    title: "Roblox limits",
    summary: "Platform limits that shape how long a job takes.",
    blocks: [
      { type: "table", head: ["Limit", "Value"], rows: [["Entry size", "4 MB serialized"], ["DataStore name, key, scope", "50 characters each"], ["Attributes", "300 characters total"], ["Standard read budget", "300 + 40 × concurrent players / min"], ["Standard write budget", "300 + 20 × concurrent players / min"]], mono: [1] },
      { type: "p", text: "Open Cloud shares the experience’s budget with your live servers. DataBridge rate-limits itself per universe and backs off on 429 responses, so jobs slow down — rather than fail — when your game is busy." },
      { type: "callout", tone: "info", text: "Roblox can change these limits. DataBridge always follows the latest official documentation." },
    ],
  },
  {
    slug: "troubleshooting",
    group: "Reference",
    title: "Troubleshooting",
    summary: "What each error means and how to fix it.",
    blocks: [
      { type: "table", head: ["Message", "Likely cause", "Fix"], rows: [["Rejected", "Key is wrong, revoked or IP-restricted", "Create a new key without IP restrictions and use “Replace key”"], ["Expired", "Unused for 60 days or past its expiration", "Create a new key and replace it"], ["No DataStore read permission", "Data Stores API not added to the key", "Add list/read operations, then test again"], ["Missing permission for this experience", "Key isn’t granted to that universe", "Add the experience to the key’s permissions"], ["Rate limited", "Roblox throttling", "Wait — DataBridge retries automatically"], ["Experience or place not found", "Wrong Universe/Place ID", "Copy the Universe ID from Creator Dashboard"]] },
    ],
  },
  {
    slug: "security",
    group: "Reference",
    title: "Security & privacy",
    summary: "What we store, and what we never touch.",
    blocks: [
      { type: "list", items: ["API keys are encrypted with AES-256-GCM, shown only as the last four characters, and never written to logs.", "We never ask for your Roblox password or cookie and never scrape the website.", "Every request is scoped to a workspace you belong to; other workspaces can’t see your connections or projects.", "Roles control who can manage connections, projects and members.", "Migrations copy data between your DataStores; we keep job metadata, not player payloads."] },
      { type: "table", head: ["Role", "Can do"], rows: [["Owner", "Everything, including managing owners"], ["Admin", "Members, connections, projects"], ["Developer", "Projects, DataStores, migrations"], ["Viewer", "Read-only"]] },
    ],
  },
];

const id: DocPage[] = [
  {
    slug: "getting-started",
    group: "Mulai di sini",
    title: "Mulai cepat",
    summary: "Dry run pertamamu dalam sekitar sepuluh menit.",
    blocks: [
      { type: "p", text: "DataBridge menyalin entry DataStore Roblox dari sumber ke tujuan lewat Open Cloud API resmi. Tidak ada yang berjalan di dalam game dan tidak ada yang dipasang di Studio." },
      { type: "h", text: "Yang kamu perlukan" },
      { type: "list", items: ["Izin owner atau grup untuk membuat API key Open Cloud bagi experience terkait.", "Universe ID experience sumber dan tujuan (atau Place ID — kami carikan).", "Nama DataStore dan scope asal dan tujuan."] },
      { type: "h", text: "Langkah" },
      { type: "steps", items: ["Buat API key Open Cloud dengan izin DataStore.", "Di DataBridge → Koneksi, tempel key-nya. Langsung dites.", "Buat project lalu tambahkan DataStore sumber, kemudian DataStore tujuan.", "Buat migrasi, biarkan aturan default “skip existing”, lalu jalankan dry run.", "Tinjau laporan dry run, jadwalkan maintenance, lalu jalankan migrasi sampai semua key terverifikasi."] },
      { type: "callout", tone: "info", text: "Migrasi tersedia di rilis berikutnya. Koneksi, project, dan konfigurasi DataStore sudah siap, jadi kamu bisa menyiapkan semuanya sekarang." },
    ],
  },
  {
    slug: "api-key",
    group: "Mulai di sini",
    title: "Membuat API key Open Cloud",
    summary: "Buat key yang diterima Roblox untuk akses DataStore.",
    blocks: [
      { type: "steps", items: ["Buka Creator Dashboard → Credentials → API Keys lalu klik “Create API Key”.", "Beri nama sesuai tujuan, mis. “DataBridge — migrasi Obby”.", "Di Access Permissions pilih “Data Stores”, lalu pilih setiap experience yang boleh diakses.", "Tambahkan operasi di halaman Izin (baca untuk sumber, plus tulis untuk tujuan).", "Kosongkan “Accepted IP addresses” atau isi 0.0.0.0/0 — worker DataBridge tidak punya IP tetap.", "Opsional atur tanggal kedaluwarsa, simpan, lalu salin key-nya."] },
      { type: "callout", tone: "warn", title: "Salin sekali", text: "Roblox hanya menampilkan key sekali. Langsung tempel ke DataBridge; kami mengenkripsinya dan tidak pernah menampilkannya lagi." },
      { type: "h", text: "Kedaluwarsa dan rotasi" },
      { type: "p", text: "Roblox otomatis menonaktifkan key yang tidak dipakai atau diubah selama 60 hari. Saat key kedaluwarsa atau dirotasi, buat key baru lalu pakai “Ganti key” di koneksi — konfigurasi DataStore tetap jalan." },
      { type: "p", text: "Menghapus koneksi di DataBridge tidak mencabut key di Roblox. Cabut di Creator Dashboard bila tidak diperlukan lagi." },
    ],
  },
  {
    slug: "permissions",
    group: "Mulai di sini",
    title: "Izin",
    summary: "Operasi yang dibutuhkan tiap sisi migrasi.",
    blocks: [
      { type: "p", text: "Berikan operasi seminimal mungkin. DataBridge membaca izin key saat koneksi dites dan menampilkannya di halaman Koneksi." },
      { type: "table", head: ["Scope", "Operasi", "Dibutuhkan untuk"], rows: [["universe-datastores.control", "list", "Menelusuri DataStore di experience"], ["universe-datastores.objects", "list, read", "Membaca key dan nilai dari sumber"], ["universe-datastores.objects", "create, update", "Menulis ke tujuan"], ["universe-datastores.versions", "list, read", "Riwayat revisi (Data Explorer, menyusul)"]], mono: [0, 1] },
      { type: "h", text: "Key terpisah untuk experience berbeda" },
      { type: "p", text: "Untuk transfer lintas experience, kamu bisa memakai satu key yang diizinkan ke kedua experience, atau satu koneksi per experience. DataBridge memvalidasi akses sumber dan tujuan secara terpisah — satu key tidak dianggap otomatis mencakup keduanya." },
    ],
  },
  {
    slug: "universe-vs-place",
    group: "Konsep",
    title: "Universe ID vs Place ID",
    summary: "Kenapa DataStore milik experience, bukan place.",
    blocks: [
      { type: "p", text: "Universe adalah experience. Di dalamnya ada satu atau lebih place, dan semua place dalam universe yang sama membaca dan menulis DataStore yang sama." },
      { type: "table", head: ["", "Universe ID", "Place ID"], rows: [["Mengidentifikasi", "Experience", "Satu place di dalamnya"], ["Memiliki DataStore", "Ya", "Tidak"], ["Cara menemukan", "Creator Dashboard → experience → ⋯ → Copy Universe ID", "Angka di URL game"]] },
      { type: "callout", tone: "info", text: "Hanya punya Place ID? Tempel di dialog “Tambah DataStore” lalu tekan “Cari universe”." },
      { type: "h", text: "Experience sama, place berbeda" },
      { type: "p", text: "Place A dan Place B dalam universe yang sama sudah berbagi data. Penyalinan hanya berguna saat nama DataStore, scope, atau struktur datanya berubah." },
    ],
  },
  {
    slug: "projects-datastores",
    group: "Konsep",
    title: "Project & konfigurasi DataStore",
    summary: "Cara DataBridge mendeskripsikan apa pindah ke mana.",
    blocks: [
      { type: "p", text: "Project mengelompokkan DataStore yang terlibat dalam satu game atau satu upaya migrasi. Setiap konfigurasi DataStore menunjuk ke koneksi, universe, nama DataStore, dan scope." },
      { type: "table", head: ["Kolom", "Contoh", "Catatan"], rows: [["Label", "Sumber — PlayerData v1", "Tampil di wizard migrasi"], ["Universe ID", "111111", "Wajib"], ["DataStore", "PlayerData_V1", "Maks 50 karakter"], ["Scope", "global", "Scope default"], ["Tipe", "Standard", "Ordered DataStore menyusul"]], mono: [1] },
      { type: "p", text: "Pakai “Telusuri DataStore” untuk memilih nama yang sudah ada — salah ketik akan membuat DataStore baru yang kosong saat ditulis." },
    ],
  },
  {
    slug: "safe-defaults",
    group: "Migrasi",
    title: "Default aman & konflik",
    summary: "Yang dilakukan dan tidak dilakukan DataBridge tanpa perintahmu.",
    blocks: [
      { type: "list", items: ["DataStore sumber hanya dibaca — tidak pernah diubah atau dihapus.", "Setiap migrasi diawali dry run: semua dibaca, tidak ada yang ditulis.", "Setiap key yang ditulis dibaca ulang dan dibandingkan sebelum dihitung sukses.", "Key yang gagal bisa diulang tanpa mengulang yang sudah sukses."] },
      { type: "h", text: "Strategi konflik" },
      { type: "table", head: ["Strategi", "Saat key tujuan sudah ada"], rows: [["skip_existing", "Dibiarkan dan ditandai dilewati (default)."], ["overwrite", "Ditimpa — wajib mengetik konfirmasi."], ["fail_on_conflict", "Ditandai konflik dan tidak ditulis."], ["rename_key", "Ditulis ke nama key baru sesuai aturan mapping."]], mono: [0] },
      { type: "callout", tone: "warn", text: "Overwrite tidak bisa dibatalkan oleh DataBridge. Buat backup dulu saat fiturnya tersedia, atau uji pada salinan DataStore." },
    ],
  },
  {
    slug: "cutover",
    group: "Migrasi",
    title: "Pemain online & cutover",
    summary: "Checklist migrasi saat game masih live.",
    blocks: [
      { type: "callout", tone: "warn", title: "Tidak atomik", text: "Jika pemain menyimpan setelah key-nya terbaca, tujuan menerima nilai lama. Rencanakan jeda singkat saat penyimpanan dihentikan." },
      { type: "steps", items: ["Jalankan dry run saat trafik normal untuk mengukur durasi dan menemukan konflik.", "Umumkan maintenance dan pilih waktu sepi.", "Matikan server atau nonaktifkan penyimpanan ke DataStore terkait.", "Jalankan migrasi dan tunggu sampai semua key terverifikasi.", "Publikasikan update game yang membaca DataStore baru.", "Biarkan DataStore lama utuh minimal seminggu sebagai jalur rollback."] },
      { type: "h", text: "Rollback" },
      { type: "p", text: "Karena sumber tidak pernah diubah, rollback berarti mempublikasikan versi game sebelumnya yang membaca DataStore lama. Data yang tersimpan di store baru setelah cutover tidak disalin balik otomatis." },
    ],
  },
  {
    slug: "limits",
    group: "Referensi",
    title: "Batasan Roblox",
    summary: "Batas platform yang menentukan lama sebuah job.",
    blocks: [
      { type: "table", head: ["Batas", "Nilai"], rows: [["Ukuran entry", "4 MB setelah serialisasi"], ["Nama DataStore, key, scope", "Masing-masing 50 karakter"], ["Atribut", "Total 300 karakter"], ["Kuota baca standar", "300 + 40 × pemain bersamaan / menit"], ["Kuota tulis standar", "300 + 20 × pemain bersamaan / menit"]], mono: [1] },
      { type: "p", text: "Open Cloud berbagi kuota experience dengan server live-mu. DataBridge membatasi dirinya per universe dan mundur saat respons 429, jadi job melambat — bukan gagal — saat game sedang ramai." },
      { type: "callout", tone: "info", text: "Roblox bisa mengubah batas ini. DataBridge selalu mengikuti dokumentasi resmi terbaru." },
    ],
  },
  {
    slug: "troubleshooting",
    group: "Referensi",
    title: "Pemecahan masalah",
    summary: "Arti setiap galat dan cara memperbaikinya.",
    blocks: [
      { type: "table", head: ["Pesan", "Kemungkinan penyebab", "Perbaikan"], rows: [["Ditolak", "Key salah, dicabut, atau dibatasi IP", "Buat key baru tanpa batasan IP lalu “Ganti key”"], ["Kedaluwarsa", "Tidak dipakai 60 hari atau lewat tanggal kedaluwarsa", "Buat key baru lalu ganti"], ["Tanpa izin baca DataStore", "Data Stores API belum ditambahkan ke key", "Tambahkan operasi list/read lalu tes lagi"], ["Izin untuk experience ini kurang", "Key belum diizinkan ke universe itu", "Tambahkan experience ke izin key"], ["Dibatasi request", "Throttling Roblox", "Tunggu — DataBridge mengulang otomatis"], ["Experience atau place tidak ditemukan", "Universe/Place ID salah", "Salin Universe ID dari Creator Dashboard"]] },
    ],
  },
  {
    slug: "security",
    group: "Referensi",
    title: "Keamanan & privasi",
    summary: "Apa yang kami simpan, dan apa yang tidak pernah kami sentuh.",
    blocks: [
      { type: "list", items: ["API key dienkripsi AES-256-GCM, hanya ditampilkan 4 karakter terakhir, dan tidak pernah ditulis ke log.", "Kami tidak pernah meminta password atau cookie Roblox dan tidak pernah scraping situs.", "Setiap request dibatasi ke workspace tempatmu menjadi anggota; workspace lain tidak bisa melihat koneksi atau project-mu.", "Role mengatur siapa yang boleh mengelola koneksi, project, dan anggota.", "Migrasi menyalin data antar DataStore-mu; kami menyimpan metadata job, bukan isi data pemain."] },
      { type: "table", head: ["Role", "Bisa"], rows: [["Owner", "Semua, termasuk mengelola owner"], ["Admin", "Anggota, koneksi, project"], ["Developer", "Project, DataStore, migrasi"], ["Viewer", "Hanya lihat"]] },
    ],
  },
];

export const docs = { en, id } as const;
export const DOC_SLUGS = en.map((d) => d.slug);
export const docsUi = {
  en: { title: "Documentation", subtitle: "Guides and reference for moving Roblox DataStore data safely.", prev: "Previous", next: "Next", onThisPage: "Documentation" },
  id: { title: "Dokumentasi", subtitle: "Panduan dan referensi untuk memindahkan data DataStore Roblox dengan aman.", prev: "Sebelumnya", next: "Berikutnya", onThisPage: "Dokumentasi" },
};
