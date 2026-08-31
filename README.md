# Sistem Manajemen Gudang - GudangKu

Aplikasi terintegrasi untuk pencatatan stok barang, manajemen inventaris alat, dan penggunaan kendaraan.

## Arsitektur Aplikasi
Aplikasi ini menggunakan:
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **Backend API**: Node.js + Express
- **Database**: PostgreSQL 16 (on-premise / lokal)

## Instalasi & Menjalankan Aplikasi

1. Pastikan Anda memiliki server **PostgreSQL 16** berjalan (bisa di localhost).
2. Install dependensi:
   ```bash
   npm install
   ```
3. Buat file `.env.server` di root project dan isi dengan detail koneksi PostgreSQL Anda:
   ```env
   DB_USER=serveradmin
   DB_PASSWORD=salamalekum
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=gudangku
   PORT=5000
   ```
   *(Pastikan database `gudangku` sudah Anda buat sebelumnya di PostgreSQL, atau ubah `DB_NAME` jika namanya beda)*
4. Buat file `.env` di root project untuk menghubungkan frontend ke API lokal:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
5. Jalankan aplikasi (server API dan frontend akan jalan sekaligus):
   ```bash
   npm run dev
   ```

Tunggu hingga console menampilkan:
- `Backend server running on http://localhost:5000`
- `Vite server ready`

Aplikasi web dapat diakses di browser pada: `http://localhost:3000`

### Inisialisasi Database
Saat backend API pertama kali dijalankan (`npm run dev`), ia akan secara otomatis terhubung ke PostgreSQL, membuat seluruh tabel yang dibutuhkan jika belum ada, serta mengisi data default (stok awal, user superadmin, dll). Anda tidak perlu menjalankan skrip SQL secara manual.

## Sinkronisasi Data Antar Device

Backend Express dan PostgreSQL memastikan bahwa seluruh device dalam satu jaringan lokal yang mengakses web ini selalu melihat data yang tersinkronisasi. Frontend (React) secara otomatis akan melakukan *polling* ke server API setiap 10 detik untuk memastikan data real-time, selain juga melakukan sinkronisasi otomatis setiap kali terjadi transaksi/perubahan data.

## Default Login

| Username      | Password | Role       |
|---------------|----------|------------|
| superadmin    | 123      | superadmin |
| admin1        | 123      | admin      |
| admin2        | 123      | admin      |
| pengawas1     | 123      | pengawas   |
| teknisi1      | 123      | teknisi    |

