# Dashboard Admin SSP (Web, React)

Web dashboard terpisah untuk melihat & mengelola data dari HP (Bon, Laporan
Operasional, Invoice) langsung dari PC/laptop, browser. Memakai 2 backend
Google Apps Script yang **sama** dengan aplikasi Android (`Code.gs` dan
`InvoiceCode.gs`), tidak perlu server tambahan, dan hosting-nya **gratis**
lewat GitHub Pages.

Tersedia 5 modul:
- **Bon** — lihat semua pengajuan bon, tandai "Cair" (approve pencairan).
- **Operasional** — lihat semua laporan kas masuk/keluar, edit data yang salah.
- **Invoice** — lihat semua invoice (dengan indikator telat jatuh tempo), edit
  data invoice, dan catat pembayaran baru (cicilan/lunas).
- **Absensi** — punya 2 sub-tab:
  - **Rekap Bulanan**: format matriks (karyawan × tanggal, seperti rekap manual
    di Excel) dengan filter "dari tanggal – sampai tanggal", ✓ untuk hari
    penuh (+ angka kecil oranye kalau ada jam lembur hari itu), ½ untuk
    setengah hari, kolom Total Hari & Jam Lembur otomatis terhitung. Ada
    tombol **Export Excel** dan **Export PDF** (diunduh langsung dari
    browser, tidak perlu server tambahan).
  - **Detail & Edit Lembur**: daftar mentah per baris (seperti sebelumnya),
    untuk cari & edit Jam Lembur satu per satu.
- **Gaji** — estimasi gaji per karyawan (Hari Masuk × Upah Harian + Jam Lembur
  × Upah Lembur − Bon Diterima), dengan opsi edit Upah Harian/Lembur per orang.

Juga ada ringkasan (KPI) di atas: jumlah karyawan aktif, bon menunggu, invoice
telat, dan total saldo operasional — dengan animasi angka berjalan.

---

## 1. Update KEDUA backend Apps Script (WAJIB dilakukan dulu)

Ada 2 spreadsheet/Apps Script yang perlu diperbarui — masing-masing dengan
file barunya sendiri yang saya sertakan terpisah dari folder ini:

### 1a. Spreadsheet tool management (Absensi/Bon/Operasional/Gudang)
1. Buka Google Sheet yang sudah dipakai aplikasi Android Anda untuk modul ini.
2. Extensions > Apps Script.
3. Select all isi `Code.gs` lama, hapus, ganti dengan isi `Code.gs` baru
   (endpoint lama untuk Android **tidak berubah sama sekali**; ada tambahan
   endpoint dashboard: `adminLogin`, `getBonAll`, `cairkanBon`,
   `getOperasionalAll`, `editOperasionalAdmin`, `editJamLembur`,
   `editUpahKaryawan`, dan `searchHistory` sekarang ikut mengirim `rowIndex` +
   `jamLembur` per baris — aman, ini cuma field tambahan di response JSON yang
   sudah publik, tidak menghapus field lama).
4. Ikon gerigi **"Project Settings"** > **Script Properties** > **Add script property**:
   - Property: `ADMIN_DASHBOARD_PASSWORD`
   - Value: password pilihan Anda, mis. `SspAdmin2026!`
5. **Deploy > Manage deployments** > ikon pensil pada deployment aktif >
   Version: **New version** > Deploy. (Jangan buat deployment baru dari nol —
   supaya URL Web App tetap sama, tidak perlu update APK Android.)

### 1b. Spreadsheet Invoice
1. Buka Google Sheet khusus Invoice Anda.
2. Extensions > Apps Script.
3. Select all isi `InvoiceCode.gs` lama, ganti dengan isi `InvoiceCode.gs`
   baru (endpoint lama untuk Android — `simpanInvoice`, `tambahPembayaran`,
   `listInvoice`, `detailInvoice` — **tidak berubah**).
4. **Project Settings > Script Properties > Add script property**:
   - Property: `ADMIN_DASHBOARD_PASSWORD`
   - Value: **gunakan password yang SAMA** seperti langkah 1a, supaya satu kali
     login di dashboard berlaku untuk kedua backend.
5. **Deploy > Manage deployments** > New version > Deploy (URL tetap sama).

---

## 2. Isi URL kedua backend di dashboard

Buka `src/api.js`, isi 2 baris ini:

```js
export const GAS_WEB_APP_URL = "PASTE_URL_WEB_APP_APPS_SCRIPT_DI_SINI";
export const GAS_INVOICE_WEB_APP_URL = "PASTE_URL_WEB_APP_APPS_SCRIPT_INVOICE_DI_SINI";
```

`GAS_WEB_APP_URL` sama dengan `AppConstants.WEB_APP_URL`, dan
`GAS_INVOICE_WEB_APP_URL` sama dengan `InvoiceConfig.INVOICE_SCRIPT_URL` di
aplikasi Android.

---

## 3. Deploy gratis ke GitHub Pages

1. Buat repository baru di GitHub (boleh **public** atau **private** — GitHub
   Pages gratis untuk keduanya di akun personal).
2. Upload semua isi folder ini ke repo tersebut (via `git push` atau upload
   manual/drag-drop lewat web GitHub — folder `.github/workflows` ikut ter-upload).
3. Di repo GitHub: **Settings > Pages** > bagian "Build and deployment" >
   Source pilih **"GitHub Actions"** (bukan "Deploy from a branch").
4. Push ke branch `main` (atau klik tab **Actions** > pilih workflow "Deploy
   Dashboard to GitHub Pages" > **Run workflow** untuk trigger manual pertama
   kali).
5. Tunggu 1-2 menit, lalu buka **Settings > Pages** lagi — URL dashboard Anda
   akan muncul di situ, formatnya:
   `https://USERNAME.github.io/NAMA-REPO/`

Setiap kali Anda push perubahan ke `main`, dashboard otomatis ter-build &
ter-deploy ulang — tidak perlu upload manual lagi.

---

## 4. Pakai sehari-hari

- Buka URL dashboard, masukkan password admin yang tadi di-set di Script
  Properties.
- Login tersimpan selama tab browser masih terbuka (logout otomatis kalau
  tab/browser ditutup, demi keamanan karena ini dashboard finansial).
- Tab **Bon**: klik "Cairkan" untuk menandai bon sudah dicairkan (otomatis
  isi Tanggal Cair hari ini).
- Tab **Operasional**: klik "Edit" pada baris yang mau dibetulkan, ubah
  nilainya, klik "Simpan". Saldo berjalan otomatis dihitung ulang.
- Tab **Invoice**: baris jatuh tempo yang sudah lewat & belum lunas otomatis
  ditandai merah. Klik "Edit" untuk membetulkan data, atau "+ Bayar" untuk
  mencatat pembayaran baru (status Sebagian/Lunas terhitung otomatis).
- Tab **Absensi**:
  - **Rekap Bulanan**: atur rentang tanggal, klik "Terapkan", lalu "Export
    Excel"/"Export PDF" untuk unduh rekapnya.
  - **Detail & Edit Lembur**: cari nama/rentang tanggal, klik "Edit Lembur"
    untuk isi Jam Lembur baris tsb (langsung berpengaruh ke tab Gaji & Rekap).
- Tab **Gaji**: klik "Edit Upah" untuk ubah Upah Harian/Lembur seorang
  karyawan — perubahan berlaku untuk perhitungan gaji & batas bon berikutnya.

---

## Catatan keamanan (penting dibaca)

- Password dikirim ke server tiap request (via POST, bukan nyangkut di URL),
  tapi Apps Script sendiri **tidak** mendukung rate-limiting/brute-force
  protection bawaan. Untuk pemakaian internal tim kecil ini cukup aman, tapi
  **jangan bagikan URL Web App atau password ke luar tim**, dan ganti password
  kalau merasa bocor (cukup ubah value `ADMIN_DASHBOARD_PASSWORD` di Script
  Properties, tanpa perlu deploy ulang).
- Kalau ke depan butuh multi-user (misalnya beberapa admin dengan password
  berbeda, atau log siapa yang approve), kabari saya — bisa dikembangkan dari
  fondasi ini.
