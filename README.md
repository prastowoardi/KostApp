# 🏠 SerrataKost - Mobile App
> Aplikasi Manajemen Kos Modern (Serrata Kost) berbasis **Expo / React Native** untuk Admin & Penghuni (Tenant).

---

## 📋 Daftar Isi
1. [Fitur Utama](#-fitur-utama)
2. [Tech Stack & Arsitektur](#-tech-stack--arsitektur)
3. [Struktur Folder](#-struktur-folder)
4. [Konfigurasi Environment](#-konfigurasi-environment)
5. [Instalasi & Menjalankan Aplikasi (Development)](#-instalasi--menjalankan-aplikasi-development)
6. [Panduan Build APK Production (Lokal & EAS)](#-panduan-build-apk-production)
7. [Akun Testing](#-akun-testing)

---

## ✨ Fitur Utama

### 👨‍💼 Panel Admin (Pengelola Kos)
* **Dashboard Interaktif**: Statistik kamar terisi/kosong, okupansi kos, total pemasukan bulan berjalan, dan peringatan tagihan jatuh tempo.
* **Pengingat WhatsApp Otomatis**: Tombol direct WhatsApp reminder untuk penghuni yang mendekati atau melewati jatuh tempo sewa.
* **Manajemen Kamar**: Pantau status kamar, fasilitas, dan harga sewa.
* **Pendaftaran Penghuni (Tenant)**: Formulir tambah penyewa baru dilengkapi modal sukses dan integrasi kirim kredensial akun via WhatsApp.
* **Pencatatan Pembayaran Sewa**: Verifikasi pembayaran, cetak/bagikan kwitansi digital langsung ke WhatsApp penyewa.
* **Pencatatan Keuangan Kos**: Catat pemasukan lain dan pengeluaran operasional secara terinci.
* **Penanganan Komplain**: Pantau tiket keluhan penghuni, ubah status (Menunggu/Diproses/Selesai).

### 🧑‍💼 Panel Penghuni (Tenant)
* **Dashboard Personal**: Informasi nomor kamar, tanggal jatuh tempo sewa, dan status tagihan bulan ini.
* **Pembayaran & Riwayat**: Cek status tagihan, unggah bukti bayar, dan telusuri riwayat pembayaran sewa terdahulu.
* **Lapor Komplain Fasilitas**: Ajukan keluhan kerusakan fasilitas kos langsung dari aplikasi.
* **Bantuan & Kontak Pengelola**: Tombol direct WhatsApp ke pemilik kos untuk respons cepat.
* **Profil & Ganti Password**: Kelola akun pribadi secara mandiri.

---

## 🛠️ Tech Stack & Arsitektur

* **Framework**: React Native with [Expo SDK 54](https://expo.dev/)
* **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based Routing)
* **State & Storage**: `@react-native-async-storage/async-storage`
* **HTTP Client**: [Axios](https://axios-http.com/) dengan interceptor Bearer token otomatis
* **Styling**: Modular Style Architecture (`styles/*.styles.js` + `styles/theme.js` konsisten)
* **Build Engine**: Android Gradle + Expo Prebuild & EAS Build ready

---

## 📁 Struktur Folder

```text
KostApp/
├── app/                        # Direktori Halaman (Expo Router)
│   ├── _layout.tsx             # Root layout & route guard
│   ├── index.js                # Layar Login
│   ├── admin/                  # Layar khusus Admin
│   │   ├── dashboard.js        # Dashboard Pengelola & Reminder WA
│   │   ├── room.js             # Kelola Kamar
│   │   ├── tenant.js           # Kelola & Tambah Penyewa
│   │   ├── verify.js           # Verifikasi Pembayaran
│   │   ├── payment/create.js   # Catat Pembayaran Sewa
│   │   ├── finances/           # Keuangan (List, Create, Detail)
│   │   └── complaint/          # Komplain (List & Detail)
│   └── tenant/                 # Layar khusus Penghuni (Tenant)
│       ├── dashboard.js        # Dashboard Penghuni & Kontak Owner
│       ├── payment.js          # Pembayaran Sewa
│       ├── payment/            # Riwayat & Detail Pembayaran
│       ├── report.js           # Formulir Lapor Komplain
│       ├── complaint-history.js# Riwayat Komplain
│       ├── profile.js          # Profil Penghuni
│       └── change-password.js  # Ubah Sandi
├── assets/                     # Splash screen, App Icon, Foreground
├── builds/                     # Output APK hasil kompilasi lokal
├── components/                 # Reusable components
├── helpers/
│   ├── api.js                  # Axios client & baseURL resolver
│   └── format.js               # Helper format mata uang, tanggal, dsb.
├── scripts/
│   └── build-prod-apk.js       # Otomasi build APK Production lokal
├── styles/                     # Pemisahan style modular & tema warna
│   ├── theme.js                # Color palette & standard spacing
│   └── *.styles.js             # File style per halaman
├── app.json                    # Konfigurasi metadata aplikasi Expo
└── package.json                # Dependencies & script shortcut
```

---

## 🌐 Konfigurasi Environment

Aplikasi membaca URL API dari `EXPO_PUBLIC_API_URL`. Helper `helpers/api.js` otomatis menormalkan URL (menghandle trailing slash maupun `/api`).

* **File `.env` (Development):**
  ```env
  EXPO_PUBLIC_API_URL=https://serrata.xyz/api
  # Atau jika backend lokal via ngrok:
  # EXPO_PUBLIC_API_URL=http://xxxx-xxxx.ngrok-free.app/api
  ```

* **File `.env.production` (Production):**
  ```env
  EXPO_PUBLIC_API_URL=https://serrata.xyz/api
  ```

---

## 🚀 Instalasi & Menjalankan Aplikasi (Development)

1. **Install dependensi:**
   ```bash
   npm install
   ```

2. **Jalankan Expo Development Server:**
   ```bash
   npm start
   # atau dengan membersihkan cache:
   npx expo start -c
   ```

3. **Buka di Perangkat:**
   * **Android Device / Emulator**: Tekan `a` pada terminal.
   * **Expo Go**: Scan QR code yang tampil di terminal menggunakan aplikasi Expo Go.

---

## 📦 Panduan Build APK Production

Telah disediakan perintah otomatis satu langkah (*one-command build*) yang langsung mengompilasi APK release, menerapkan optimasi kompresi ukuran, dan menyalin hasilnya ke folder `builds/`.

### 1. Build APK Super Ramping Lokal (Rekomendasi Utama)
Mengompilasi APK arsitektur `arm64-v8a` yang mencakup **95%+ smartphone Android modern** (Samsung, Xiaomi/Poco, Oppo, Vivo, Realme, dsb) dengan ukuran file yang sangat hemat kuota (~18–25 MB):
```bash
npm run build:prod
```
> **Hasil APK:**
> * `builds/SerrataKost-v1.0.0-arm64.apk`
> * `builds/SerrataKost-latest.apk` (link shortcut langsung ke versi terbaru)

---

### 2. Build APK Universal Lokal (Semua HP Fisik)
Jika ingin menyertakan kompatibilitas untuk ponsel Android model lama 32-bit (`arm64-v8a` + `armeabi-v7a`):
```bash
npm run build:prod:universal
```

---

### 3. Build via Expo Cloud (EAS Build)
Jika ingin melakukan build di server cloud tanpa menggunakan beban CPU/RAM laptop:

* **Build APK Release:**
  ```bash
  npm run build:eas:prod
  ```
* **Build Android App Bundle (`.aab`) untuk Google Play Store:**
  ```bash
  npm run build:eas:aab
  ```

---

## 🔑 Akun Pengujian (Testing)

| Role | Email / Username | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@kos.com` | `password` | Akses penuh dashboard pengelola |
| **Tenant** | Sesuai data pendaftaran tenant di web / aplikasi | `password` | Akses portal penghuni kos |
