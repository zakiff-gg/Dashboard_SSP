// ============================================================================
// API helper - panggilan ke backend Google Apps Script.
//
// ADA 2 BACKEND TERPISAH (2 Spreadsheet + 2 Web App berbeda), sesuai arsitektur
// aplikasi Android AbsenSSP:
//   1. GAS_WEB_APP_URL          -> Code.gs (Absensi, Bon, Operasional, Gudang)
//   2. GAS_INVOICE_WEB_APP_URL  -> InvoiceCode.gs (modul Invoice)
//
// CARA ISI: ganti nilai di bawah dengan URL Web App masing-masing (sama seperti
// AppConstants.WEB_APP_URL dan InvoiceConfig.INVOICE_SCRIPT_URL di Android).
// ============================================================================
export const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzkEykXX4YXGZgAWPS_71M60_j8WaXbK5av6lyp6KAV_9BN9QxehV-jZn3xNbh5Jci9SQ/exec";
export const GAS_INVOICE_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzAu3twqFvqTjPFbAQRSpABm3iHRprU6hixOJYQRH5VwkGxEkdhUNVyLiaKDgJZkG7r7w/exec";
// --- Backend 1: Code.gs -- pakai e.parameter, jadi GET biasa & POST
// form-urlencoded (bukan JSON custom) supaya browser TIDAK mengirim CORS
// preflight (OPTIONS), yang tidak ditangani Apps Script Web App dengan baik.
async function gasGet(action, params = {}) {
  const query = new URLSearchParams({ action, ...params });
  const res = await fetch(`${GAS_WEB_APP_URL}?${query.toString()}`);
  if (!res.ok) throw new Error(`Server error: HTTP ${res.status}`);
  return res.json();
}

async function gasPost(action, params = {}) {
  const body = new URLSearchParams({ action, ...params });
  const res = await fetch(GAS_WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Server error: HTTP ${res.status}`);
  return res.json();
}

// --- Backend 2: InvoiceCode.gs -- doGet pakai e.parameter (sama seperti di
// atas), tapi doPost-nya baca JSON.parse(e.postData.contents). Body tetap
// dikirim sebagai teks JSON, TAPI dengan Content-Type "text/plain" (bukan
// "application/json") supaya tetap dihitung "simple request" oleh browser dan
// tidak memicu CORS preflight -- Apps Script sendiri tidak peduli header
// Content-Type-nya, cuma baca isi body mentah.
async function invoiceGet(action, params = {}) {
  const query = new URLSearchParams({ action, ...params });
  const res = await fetch(`${GAS_INVOICE_WEB_APP_URL}?${query.toString()}`);
  if (!res.ok) throw new Error(`Server error: HTTP ${res.status}`);
  return res.json();
}

async function invoicePost(action, params = {}) {
  const res = await fetch(GAS_INVOICE_WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) throw new Error(`Server error: HTTP ${res.status}`);
  return res.json();
}

export const api = {
  adminLogin: (password) => gasPost("adminLogin", { password }),

  getBonAll: (password) => gasPost("getBonAll", { password }),
  cairkanBon: (password, rowIndex) => gasPost("cairkanBon", { password, rowIndex }),

  getOperasionalAll: (password) => gasPost("getOperasionalAll", { password }),
  editOperasionalAdmin: (password, { id, tipe, kategori, jumlah, keterangan }) =>
    gasPost("editOperasionalAdmin", { password, id, tipe, kategori, jumlah, keterangan }),

  // Absensi (publik, dipakai juga oleh halaman web pencarian riwayat) + edit Jam Lembur (admin)
  searchHistory: (nama = "", tanggalMulai = "", tanggalSelesai = "") =>
    gasGet("searchHistory", { nama, tanggalMulai, tanggalSelesai }),
  editJamLembur: (password, rowIndex, jamLembur) => gasPost("editJamLembur", { password, rowIndex, jamLembur }),

  // Gaji: pakai data getKaryawan (agregat sudah dihitung server) + edit upah (admin)
  editUpahKaryawan: (password, uid, upahHarian, upahLembur) =>
    gasPost("editUpahKaryawan", { password, uid, upahHarian, upahLembur }),

  // Data pelengkap (endpoint publik yang sudah ada, dipakai untuk tampilkan nama dsb.)
  getKaryawan: () => gasGet("getKaryawan"),

  // --- Invoice (backend terpisah) ---
  // listInvoice sudah publik (dipakai HP juga), tidak perlu password.
  listInvoice: () => invoiceGet("listInvoice"),
  editInvoice: (password, { id, tanggalInvoice, tujuan, nominal, jatuhTempo, keterangan, nomorInvoice }) =>
    invoicePost("editInvoice", { password, id, tanggalInvoice, tujuan, nominal, jatuhTempo, keterangan, nomorInvoice }),
  adminTambahPembayaran: (password, { idInvoice, tanggalBayar, nominalDibayar, catatan }) =>
    invoicePost("adminTambahPembayaran", { password, idInvoice, tanggalBayar, nominalDibayar, catatan }),
};
