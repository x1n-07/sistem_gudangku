-- ============================================================
-- Sistem GudangKu - Supabase Database Schema
-- ============================================================
-- Cara pakai:
-- 1. Buka Supabase Dashboard -> SQL Editor
-- 2. Copy seluruh isi file ini, paste ke SQL Editor
-- 3. Klik "Run" / "Execute"
-- ============================================================

-- Hapus tabel lama jika ada (hati-hati di production!)
DROP TABLE IF EXISTS vehicle_needs CASCADE;
DROP TABLE IF EXISTS vehicle_logs CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS equipment_logs CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS goods_transactions CASCADE;
DROP TABLE IF EXISTS goods CASCADE;
DROP TABLE IF EXISTS technicians CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- 1. Companies
CREATE TABLE companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  disabled BOOLEAN DEFAULT FALSE
);

-- 2. Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'pengawas', 'teknisi')),
  name TEXT NOT NULL,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  contact TEXT,
  disabled BOOLEAN DEFAULT FALSE
);

-- 3. Goods (Barang)
CREATE TABLE goods (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  stock NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL
);

-- 4. Goods Transactions (Transaksi Barang)
CREATE TABLE goods_transactions (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES goods(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
  quantity NUMERIC NOT NULL,
  date TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  pic TEXT
);

-- 5. Equipment (Alat/Inventaris)
CREATE TABLE equipment (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('Baik', 'Rusak Ringan', 'Rusak Berat')),
  status TEXT NOT NULL CHECK (status IN ('Tersedia', 'Dipinjam')),
  current_user TEXT
);

-- 6. Equipment Logs (Log Peminjaman Alat)
CREATE TABLE equipment_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  equipment_id TEXT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  "user" TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('PINJAM', 'KEMBALI')),
  date TEXT NOT NULL,
  condition TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT ''
);

-- 7. Vehicles (Kendaraan)
CREATE TABLE vehicles (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Tersedia', 'Sedang Digunakan', 'Perbaikan'))
);

-- 8. Vehicle Logs (Log Penggunaan Kendaraan)
CREATE TABLE vehicle_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver TEXT NOT NULL,
  purpose TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  status TEXT NOT NULL CHECK (status IN ('JALAN', 'SELESAI'))
);

-- 9. Vehicle Needs (Kebutuhan Kendaraan)
CREATE TABLE vehicle_needs (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('BBM', 'Servis', 'Suku Cadang', 'Lainnya')),
  description TEXT NOT NULL,
  cost NUMERIC NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  pic TEXT NOT NULL
);

-- 10. Technicians (Teknisi)
CREATE TABLE technicians (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT NOT NULL
);

-- ============================================================
-- Aktifkan Row Level Security (RLS) - opsional tapi disarankan
-- Untuk tahap awal kita biarkan policy-nya open supaya semua
-- user bisa akses. Nanti bisa ditambahkan policy ketat sesuai
-- kebutuhan role masing-masing.
-- ============================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

-- Policy: izinkan semua operasi untuk anon/public key
-- (Karena aplikasi ini pakai anon key, kita buat policy open)
CREATE POLICY "Allow all for anon" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON goods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON goods_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON equipment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON equipment_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON vehicle_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON vehicle_needs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON technicians FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Aktifkan Realtime untuk semua tabel (agar sinkronisasi
-- antar device berjalan secara otomatis)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE companies;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE goods;
ALTER PUBLICATION supabase_realtime ADD TABLE goods_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE equipment;
ALTER PUBLICATION supabase_realtime ADD TABLE equipment_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE vehicle_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE vehicle_needs;
ALTER PUBLICATION supabase_realtime ADD TABLE technicians;
