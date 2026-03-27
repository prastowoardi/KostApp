# 🏠 Kos-Management System (MacBook M1 Edition)
> "Panduan sat-set buat jalanin Backend, Mobile, dan Build APK."

---

## 🚀 1. Persiapan Backend (Laravel)
Jalankan di terminal folder `backend`:

1.  **Install & Setup Env:**
    ```bash
    composer install
    ```
2.  **Migrate & Seed:**
    ```bash
    php artisan migrate:fresh --seed
    ```
3.  **Jalankan Server:**
    ```bash
    php artisan serve
    ```

---

## 🌐 2. Generate URL Ngrok (Public API)
Agar HP Android bisa nembak API dari MacBook kamu, buka terminal baru:

1.  **Jalankan Ngrok (Port 8000):**
    ```bash
    ngrok http 8000 --host-header=rewrite
    ```
2.  **Update Mobile Config:**
    Salin URL `http://xxxx-xxxx.ngrok-free.app` yang muncul, lalu buka file `.env` di folder **Mobile** dan ganti:
    ```env
    EXPO_PUBLIC_API_URL=[http://xxxx-xxxx.ngrok-free.app/api](http://xxxx-xxxx.ngrok-free.app/api)
    ```
    *⚠️ Gunakan HTTP (bukan HTTPS) agar tidak kena error SSL 'Trust anchor not found' di Android.*

---

## 📱 3. Running Mobile (Expo Go)
Jalankan di terminal folder `mobile`:

1.  **Install & Start:**
    ```bash
    npm install
    ```
2.  **Clear Cache & Run:**
    ```bash
    npx expo start -c
    ```
    *Scan QR Code pakai aplikasi **Expo Go** di HP.*

---

## 📦 4. Cara Build APK (Android)
Kita pakai **EAS Build** agar proses build dilakukan di Cloud (tidak membebani RAM MacBook).

1.  **Login ke Expo (Jika belum):**
    ```bash
    npx eas login
    ```
2.  **Konfigurasi Project:**
    ```bash
    npx eas build:configure
    ```
3.  **Install Dev Client (Wajib):**
    ```bash
    npx expo install expo-dev-client
    ```
4.  **Eksekusi Build APK:**
    ```bash
    npx eas build --profile development --platform android
    ```
    *Tunggu proses selesai, lalu download file `.apk` dari link yang diberikan terminal.*

---

## 🔑 Akun Testing
* **Admin:** `admin@kos.com` | `password`
