# 🚀 Panduan Deployment SIAK Desa Poncol ke GitHub & Vercel

Panduan resmi langkah demi langkah untuk mengunggah repositori ke **GitHub** dan melakukan peluncuran (*launching*) aplikasi **SIAK Desa Poncol** di **Vercel**.

---

## 📌 Prasyarat
1. Akun **GitHub** ([github.com](https://github.com))
2. Akun **Vercel** ([vercel.com](https://vercel.com)) yang sudah terhubung dengan akun GitHub Anda.
3. Node.js & Git terinstall di komputer lokal (jika melakukan push dari komputer lokal).

---

## ⚙️ Variabel Lingkungan (Environment Variables)

Saat mendeploy di Vercel, tambahkan variabel berikut di menu **Project Settings > Environment Variables**:

| Nama Variabel | Nilai Contoh / Default | Deskripsi |
|---|---|---|
| `APPS_SCRIPT_URL` | `https://script.google.com/macros/s/.../exec` | URL Web App Google Apps Script berakhiran `/exec` |
| `API_SECRET` | `SIAK_SECRET_KEY_2026` | Kunci rahasia autentikasi dengan Google Apps Script |
| `ADMIN_PASSWORD` | `Indrasta14` | Password login untuk Admin / Petugas Desa |

---

## 🛠️ LANGKAH 1: Unggah / Push Kode ke GitHub

### Jika menggunakan Git Terminal / Command Prompt:
1. Inisialisasi Git di repositori lokal (jika belum):
   ```bash
   git init
   git add .
   git commit -m "Feat: SIAK Desa Poncol v2.0 - Siap Launching Vercel"
   ```
2. Buat Repositori Baru di GitHub:
   - Buka [github.com/new](https://github.com/new).
   - Beri nama repositori, contoh: `siak-desa-poncol`.
   - Pilih **Private** atau **Public**, lalu klik **Create repository**.

3. Hubungkan dan Push ke GitHub:
   ```bash
   git remote add origin https://github.com/USERNAME_ANDA/siak-desa-poncol.git
   git branch -M main
   git push -u origin main
   ```

---

## ⚡ LANGKAH 2: Deploy ke Vercel (1-Click Integration)

1. Buka [Vercel Dashboard](https://vercel.com/dashboard) dan klik tombol **"Add New..." > "Project"**.
2. Pilih repositori **`siak-desa-poncol`** dari daftar GitHub Anda, lalu klik **Import**.
3. Pada halaman **Configure Project**:
   - **Framework Preset**: Pilih **Vite**
   - **Root Directory**: `./` (default).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Buka bagian **Environment Variables** dan tambahkan 3 variabel utama:
   - `APPS_SCRIPT_URL` = `https://script.google.com/macros/s/AKfycbw6-Il9kInrIRHT9cMnm7wwST2y04irxWIZpyIzuo0Do6FeBL5zUVfdYDPVQ6N6UNIA/exec`
   - `API_SECRET` = `SIAK_SECRET_KEY_2026`
   - `ADMIN_PASSWORD` = `Indrasta14`
5. Klik tombol **Deploy**.
6. Tunggu proses build selesai (~1-2 menit). Vercel akan memberikan domain publik gratis seperti `siak-desa-poncol.vercel.app`.

---

## ⚠️ PENTING: Jika Password Masih Muncul "Salah" Setelah Mengisi Environment Variables di Vercel

Di Vercel, jika Anda menambahkan atau mengedit Environment Variables **setelah aplikasi selesai di-deploy**, variabel baru **TIDAK langsung aktif** pada deployment yang lama. Anda wajib melakukan **Redeploy**:

1. Buka dashboard Vercel proyek Anda (`warga-plus`).
2. Masuk ke tab **Deployments**.
3. Klik tombol titik tiga (**`...`**) di sebelah kanan deployment paling atas (Production).
4. Pilih **"Redeploy"** (centang "Use existing Build Cache" atau langsung klik Redeploy).
5. Tunggu 30 detik hingga statusnya kembali **Ready**.
6. Refresh browser Anda dan login dengan password: `Indrasta14`.

---

## 🔍 Ciri-ciri Sistem Berhasil Diluncurkan di Vercel:
- **Respon Super Cepat (< 10ms)**: Sistem dilengkapi *Server In-Memory Cache*. Data 4,244 penduduk dimuat secara instan dari memori server.
- **Toleransi Gangguan (Anti-Error & Resilience)**: Jika koneksi Google Apps Script mengalami penundaan, sistem otomatis menyajikan data dari *cache* lokal sehingga aplikasi tidak pernah *crash* atau *blank*.
- **Sync Otomatis**: Setiap ada penambahan/perubahan data penduduk, sistem otomatis memperbarui Google Spreadsheet secara *real-time*.

---

## 💡 Bantuan & Dukungan
Sistem ini dikembangkan khusus untuk **Pemerintah Desa Poncol, Kecamatan Poncol, Kabupaten Magetan**.
Tagline: *"Data Tepat, Desa Hebat"*
