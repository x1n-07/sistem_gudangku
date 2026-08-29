# Sistem Manajemen Gudang - GudangKu

Aplikasi terintegrasi untuk pencatatan stok barang, manajemen inventaris alat, dan penggunaan kendaraan.

## Instalasi & Menjalankan

```bash
npm install
npm run dev
```

Buka browser di `http://localhost:3000`.

## Sinkronisasi Data Antar Device

Secara default, aplikasi menyimpan data di **localStorage** (hanya tersimpan di 1 browser/device).
Untuk membuat data **sama di semua device dan browser**, Anda perlu mengaktifkan sinkronisasi via **Supabase** (gratis).

### Langkah-langkah:

1. **Buat akun gratis** di [https://supabase.com](https://supabase.com)

2. **Buat project baru** di Supabase Dashboard

3. **Buka SQL Editor** di Supabase Dashboard, lalu **copy-paste** seluruh isi file `supabase-schema.sql` ini dan klik **Run/Execute**

4. **Ambil kredensial** Anda:
   - Buka **Settings > API** di Supabase Dashboard
   - Copy **Project URL** (contoh: `https://xxxxx.supabase.co`)
   - Copy **anon public key**

5. **Buat file `.env`** di root project (jika belum ada):
   ```
   VITE_SUPABASE_URL="https://xxxxx.supabase.co"
   VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."
   ```

6. **Jalankan ulang** aplikasi:
   ```bash
   npm run dev
   ```

Sekarang setiap perubahan data akan otomatis tersimpan di Supabase dan bisa diakses dari device/browser mana pun!

## Default Login

| Username      | Password | Role       |
|---------------|----------|------------|
| superadmin    | 123      | superadmin |
| admin1        | 123      | admin      |
| admin2        | 123      | admin      |
| pengawas1     | 123      | pengawas   |
| teknisi1      | 123      | teknisi    |

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- Supabase (PostgreSQL + Realtime)
