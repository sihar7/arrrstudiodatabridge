// Teks halaman marketing terpisah (/features, /how-it-works, /pricing, /docs). Bentuk ID = EN.

const en = {
  nav: { features: "Features", how: "How it works", pricing: "Pricing", docs: "Docs" },
  landing: {
    ctaDocs: "Explore documentation",
    allFeatures: "All features",
    fullHow: "See the full flow",
    fullPricing: "Compare plans",
  },
  features: {
    title: "Everything a migration needs. Nothing it doesn’t.",
    subtitle: "DataBridge focuses on one job: moving DataStore data between stores and experiences safely, and proving it worked.",
    modesTitle: "Migration modes",
    modes: [
      { name: "Full", body: "Every key in the source DataStore and scope." },
      { name: "Selected keys", body: "Only the keys you list — ideal for fixing a handful of players." },
      { name: "Prefix filter", body: "Keys that start with a pattern, e.g. Player_ or a version tag." },
    ],
    conflictTitle: "Conflict strategies",
    conflictBody: "What happens when the destination already has a key. The default never overwrites.",
    conflicts: [
      { code: "skip_existing", body: "Leave the destination key untouched and mark it skipped.", tag: "default" },
      { code: "overwrite", body: "Replace the destination value — requires explicit confirmation.", tag: "" },
      { code: "fail_on_conflict", body: "Flag the key as a conflict and write nothing.", tag: "" },
      { code: "rename_key", body: "Write to a new key name using your mapping rule.", tag: "" },
    ],
  },
  how: {
    title: "From API key to verified migration.",
    subtitle: "No scripts inside your game, no Studio plugin. Everything runs over Roblox Open Cloud.",
    pipelineTitle: "What happens to every key",
    pipeline: ["read source", "transform", "check conflict", "write destination", "read back & verify"],
    pipelineBody: "Each key is processed independently with a checkpoint, so a job can pause, resume or retry only the keys that failed — without redoing the ones that succeeded.",
  },
  pricing: {
    title: "Simple plans for every team size.",
    subtitle: "Start free. Pay by QRIS when you need more connections, projects or seats.",
    faqTitle: "Questions",
    faq: [
      { q: "How do I pay?", a: "Choose a plan, pay with any QRIS-supported app, then upload the proof. We confirm it manually, usually within a few hours." },
      { q: "Is my Roblox data stored by DataBridge?", a: "Only when you create a backup. Migrations copy data directly between your DataStores; we keep job metadata, not player payloads." },
      { q: "Do limits count keys?", a: "Plans limit connections, projects and seats. Fair-use limits on requests and storage apply so one job can’t starve others." },
      { q: "Can I switch plans later?", a: "Yes. Upgrades apply as soon as payment is confirmed; downgrades apply at the end of the period." },
    ],
  },
};

export type MarketingDict = typeof en;

const id: MarketingDict = {
  nav: { features: "Fitur", how: "Cara kerja", pricing: "Harga", docs: "Dokumentasi" },
  landing: {
    ctaDocs: "Jelajahi dokumentasi",
    allFeatures: "Semua fitur",
    fullHow: "Lihat alur lengkap",
    fullPricing: "Bandingkan paket",
  },
  features: {
    title: "Semua yang dibutuhkan migrasi. Tanpa yang tidak perlu.",
    subtitle: "DataBridge fokus pada satu tugas: memindahkan data DataStore antar-store dan antar-experience dengan aman, lalu membuktikan hasilnya.",
    modesTitle: "Mode migrasi",
    modes: [
      { name: "Penuh", body: "Semua key di DataStore dan scope sumber." },
      { name: "Key terpilih", body: "Hanya key yang kamu daftarkan — cocok untuk memperbaiki beberapa pemain." },
      { name: "Filter prefix", body: "Key yang diawali pola tertentu, mis. Player_ atau tag versi." },
    ],
    conflictTitle: "Strategi konflik",
    conflictBody: "Apa yang terjadi jika key sudah ada di tujuan. Default-nya tidak pernah menimpa.",
    conflicts: [
      { code: "skip_existing", body: "Key tujuan dibiarkan dan ditandai dilewati.", tag: "default" },
      { code: "overwrite", body: "Nilai tujuan diganti — wajib konfirmasi eksplisit.", tag: "" },
      { code: "fail_on_conflict", body: "Key ditandai konflik dan tidak ditulis.", tag: "" },
      { code: "rename_key", body: "Ditulis ke nama key baru sesuai aturan mapping.", tag: "" },
    ],
  },
  how: {
    title: "Dari API key sampai migrasi terverifikasi.",
    subtitle: "Tanpa script di game, tanpa plugin Studio. Semua lewat Roblox Open Cloud.",
    pipelineTitle: "Yang terjadi pada setiap key",
    pipeline: ["baca sumber", "transformasi", "cek konflik", "tulis tujuan", "baca ulang & verifikasi"],
    pipelineBody: "Setiap key diproses mandiri dengan checkpoint, jadi job bisa dijeda, dilanjutkan, atau mengulang hanya key yang gagal — tanpa mengulang yang sudah berhasil.",
  },
  pricing: {
    title: "Paket sederhana untuk setiap ukuran tim.",
    subtitle: "Mulai gratis. Bayar via QRIS saat butuh lebih banyak koneksi, project, atau anggota.",
    faqTitle: "Pertanyaan",
    faq: [
      { q: "Bagaimana cara bayar?", a: "Pilih paket, bayar lewat aplikasi apa pun yang mendukung QRIS, lalu unggah bukti. Kami konfirmasi manual, biasanya dalam beberapa jam." },
      { q: "Apakah data Roblox-ku disimpan DataBridge?", a: "Hanya saat kamu membuat backup. Migrasi menyalin data langsung antar DataStore-mu; kami menyimpan metadata job, bukan isi data pemain." },
      { q: "Apakah batasnya dihitung per key?", a: "Paket membatasi koneksi, project, dan anggota. Batas wajar untuk request dan penyimpanan berlaku agar satu job tidak menghabiskan kapasitas." },
      { q: "Bisa ganti paket nanti?", a: "Bisa. Upgrade berlaku begitu pembayaran dikonfirmasi; downgrade berlaku di akhir periode." },
    ],
  },
};

export const marketing = { en, id } as const;
