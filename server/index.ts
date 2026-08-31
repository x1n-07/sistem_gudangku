import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.server
dotenv.config({ path: path.join(import.meta.dirname, '../.env.server') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER || 'serveradmin',
  password: process.env.DB_PASSWORD || 'salamalekum',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'gudangku',
});

// Helper for snake_case to camelCase conversion (to match frontend types)
const toCamel = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamel(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [key.replace(/_([a-z])/g, g => g[1].toUpperCase())]: toCamel(obj[key]),
      }),
      {}
    );
  }
  return obj;
};

// Initialize database tables
const initDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('Menghubungkan ke PostgreSQL...');
    
    // Create tables if they do not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        disabled BOOLEAN DEFAULT FALSE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT,
        role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'pengawas', 'teknisi')),
        name TEXT NOT NULL,
        company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
        contact TEXT,
        disabled BOOLEAN DEFAULT FALSE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS goods (
        id TEXT PRIMARY KEY,
        admin_id TEXT NOT NULL,
        company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        stock NUMERIC NOT NULL DEFAULT 0,
        min_stock NUMERIC NOT NULL DEFAULT 0,
        unit TEXT NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS goods_transactions (
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
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS equipment (
        id TEXT PRIMARY KEY,
        admin_id TEXT NOT NULL,
        company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        condition TEXT NOT NULL CHECK (condition IN ('Baik', 'Rusak Ringan', 'Rusak Berat')),
        status TEXT NOT NULL CHECK (status IN ('Tersedia', 'Dipinjam')),
        current_user TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS equipment_logs (
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
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        admin_id TEXT NOT NULL,
        company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        plate_number TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('Tersedia', 'Sedang Digunakan', 'Perbaikan'))
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicle_logs (
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
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicle_needs (
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
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS technicians (
        id TEXT PRIMARY KEY,
        admin_id TEXT NOT NULL,
        company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT NOT NULL
      );
    `);

    // Seed default state if empty
    const checkCompanies = await client.query('SELECT COUNT(*) FROM companies');
    if (parseInt(checkCompanies.rows[0].count) === 0) {
      console.log('Menyemai data default...');
      await client.query(`
        INSERT INTO companies (id, name, disabled) VALUES
        ('c1', 'PT Logistik A', false),
        ('c2', 'PT Logistik B', false)
        ON CONFLICT (id) DO NOTHING;
      `);

      await client.query(`
        INSERT INTO users (id, username, password, role, name, company_id, contact, disabled) VALUES
        ('super1', 'superadmin', '123', 'superadmin', 'Super Administrator', null, null, false),
        ('admin1', 'admin1', '123', 'admin', 'Admin Gudang A', 'c1', '081234567890', false),
        ('admin2', 'admin2', '123', 'admin', 'Admin Gudang B', 'c2', '081234567891', false),
        ('peng1', 'pengawas1', '123', 'pengawas', 'Pengawas A', 'c1', '081234567892', false),
        ('tek1', 'teknisi1', '123', 'teknisi', 'Teknisi A', 'c1', '081234567893', false)
        ON CONFLICT (id) DO NOTHING;
      `);

      await client.query(`
        INSERT INTO goods (id, admin_id, company_id, name, category, stock, min_stock, unit) VALUES
        ('1', 'admin1', 'c1', 'Semen Portland', 'Material', 150, 50, 'Sak'),
        ('2', 'admin1', 'c1', 'Paku 5cm', 'Material', 50, 10, 'Kg')
        ON CONFLICT (id) DO NOTHING;
      `);

      await client.query(`
        INSERT INTO equipment (id, admin_id, company_id, name, condition, status) VALUES
        ('1', 'admin1', 'c1', 'Mesin Bor Bosch', 'Baik', 'Tersedia'),
        ('2', 'admin1', 'c1', 'Genset 5000W', 'Baik', 'Tersedia')
        ON CONFLICT (id) DO NOTHING;
      `);

      await client.query(`
        INSERT INTO vehicles (id, admin_id, company_id, name, plate_number, status) VALUES
        ('1', 'admin1', 'c1', 'Mitsubishi Colt Diesel', 'B 1234 CD', 'Tersedia'),
        ('2', 'admin1', 'c1', 'Toyota Hilux', 'B 5678 EF', 'Tersedia')
        ON CONFLICT (id) DO NOTHING;
      `);

      await client.query(`
        INSERT INTO technicians (id, admin_id, company_id, name, role, phone) VALUES
        ('1', 'admin1', 'c1', 'Budi Santoso', 'Teknisi Gudang', '081234567890'),
        ('2', 'admin1', 'c1', 'Agus Pratama', 'Mekanik', '089876543210')
        ON CONFLICT (id) DO NOTHING;
      `);
      console.log('Selesai menyemai data default.');
    }

    console.log('Inisialisasi database PostgreSQL berhasil.');
  } catch (err) {
    console.error('Gagal menginisialisasi database:', err);
  } finally {
    client.release();
  }
};

// Start DB Initialization
initDatabase();

// ─── API Routes ──────────────────────────────────────────────────────────────

// Fetch all data in one request (similar to front page initialization)
app.get('/api/all-data', async (req, res) => {
  try {
    const [
      companies,
      users,
      goods,
      goodsTransactions,
      equipment,
      equipmentLogs,
      vehicles,
      vehicleLogs,
      vehicleNeeds,
      technicians,
    ] = await Promise.all([
      pool.query('SELECT * FROM companies'),
      pool.query('SELECT * FROM users'),
      pool.query('SELECT * FROM goods'),
      pool.query('SELECT * FROM goods_transactions ORDER BY date DESC'),
      pool.query('SELECT * FROM equipment'),
      pool.query('SELECT * FROM equipment_logs ORDER BY date DESC'),
      pool.query('SELECT * FROM vehicles'),
      pool.query('SELECT * FROM vehicle_logs ORDER BY start_date DESC'),
      pool.query('SELECT * FROM vehicle_needs ORDER BY date DESC'),
      pool.query('SELECT * FROM technicians'),
    ]);

    res.json({
      companies: toCamel(companies.rows),
      users: toCamel(users.rows),
      goods: toCamel(goods.rows),
      goodsTransactions: toCamel(goodsTransactions.rows),
      equipment: toCamel(equipment.rows),
      equipmentLogs: toCamel(equipmentLogs.rows),
      vehicles: toCamel(vehicles.rows),
      vehicleLogs: toCamel(vehicleLogs.rows),
      vehicleNeeds: toCamel(vehicleNeeds.rows),
      technicians: toCamel(technicians.rows),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// COMPANIES API
app.post('/api/companies', async (req, res) => {
  const { id, name, disabled } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO companies (id, name, disabled) VALUES ($1, $2, $3) RETURNING *',
      [id, name, disabled ?? false]
    );
    res.json(toCamel(result.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/companies/:id', async (req, res) => {
  const { id } = req.params;
  const updates: any = req.body;
  const fields = Object.keys(updates);
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

  const setClause = fields.map((field, idx) => {
    // map camelCase to snake_case if necessary, e.g., companyId to company_id
    const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
    return `${dbField} = $${idx + 2}`;
  }).join(', ');

  try {
    const result = await pool.query(
      `UPDATE companies SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...Object.values(updates)]
    );
    res.json(toCamel(result.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/companies/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM companies WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// USERS API
app.post('/api/users', async (req, res) => {
  const { id, username, password, role, name, companyId, contact, disabled } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (id, username, password, role, name, company_id, contact, disabled) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [id, username, password, role, name, companyId ?? null, contact ?? null, disabled ?? false]
    );
    res.json(toCamel(result.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const updates: any = req.body;
  const fields = Object.keys(updates);
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

  const setClause = fields.map((field, idx) => {
    const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
    return `${dbField} = $${idx + 2}`;
  }).join(', ');

  try {
    const result = await pool.query(
      `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...Object.values(updates)]
    );
    res.json(toCamel(result.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GOODS API
app.post('/api/goods', async (req, res) => {
  const { id, adminId, companyId, name, category, stock, minStock, unit } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO goods (id, admin_id, company_id, name, category, stock, min_stock, unit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [id, adminId, companyId, name, category, stock, minStock, unit]
    );
    res.json(toCamel(result.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/goods/:id', async (req, res) => {
  const { id } = req.params;
  const updates: any = req.body;
  const fields = Object.keys(updates);
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

  const setClause = fields.map((field, idx) => {
    const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
    return `${dbField} = $${idx + 2}`;
  }).join(', ');

  try {
    const result = await pool.query(
      `UPDATE goods SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...Object.values(updates)]
    );
    res.json(toCamel(result.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/goods/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM goods WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GOODS TRANSACTIONS API
app.post('/api/goods-transactions', async (req, res) => {
  const { id, adminId, companyId, itemId, type, quantity, date, notes, pic } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO goods_transactions (id, admin_id, company_id, item_id, type, quantity, date, notes, pic) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [id, adminId, companyId, itemId, type, quantity, date, notes, pic ?? null]
    );
    res.json(toCamel(result.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// EQUIPMENT API
app.post('/api/equipment', async (req, res) => {
  const { id, adminId, companyId, name, condition, status, currentUser } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO equipment (id, admin_id, company_id, name, condition, status, current_user) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, adminId, companyId, name, condition, status, currentUser ?? null]
    );
    res.json(toCamel(result.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/equipment/:id', async (req, res) => {
  const { id } = req.params;
  const updates: any = req.body;
  const fields = Object.keys(updates);
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

  const setClause = fields.map((field, idx) => {
    const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
    return `${dbField} = $${idx + 2}`;
  }).join(', ');

  try {
    const result = await pool.query(
      `UPDATE equipment SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...Object.values(updates)]
    );
    res.json(toCamel(result.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/equipment/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM equipment WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// EQUIPMENT LOGS API
app.post('/api/equipment-logs', async (req, res) => {
  const { id, adminId, companyId, equipmentId, user, action, date, condition, notes } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO equipment_logs (id, admin_id, company_id, equipment_id, "user", action, date, condition, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [id, adminId, companyId, equipmentId, user, action, date, condition, notes]
    );
    res.json(toCamel(result.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// VEHICLES API
app.post('/api/vehicles', async (req, res) => {
  const { id, adminId, companyId, name, plateNumber, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO vehicles (id, admin_id, company_id, name, plate_number, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, adminId, companyId, name, plateNumber, status]
    );
    res.json(toCamel(result.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/vehicles/:id', async (req, res) => {
  const { id } = req.params;
  const updates: any = req.body;
  const fields = Object.keys(updates);
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

  const setClause = fields.map((field, idx) => {
    const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
    return `${dbField} = $${idx + 2}`;
  }).join(', ');

  try {
    const result = await pool.query(
      `UPDATE vehicles SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...Object.values(updates)]
    );
    res.json(toCamel(result.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/vehicles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM vehicles WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// VEHICLE LOGS API
app.post('/api/vehicle-logs', async (req, res) => {
  const { id, adminId, companyId, vehicleId, driver, purpose, startDate, endDate, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO vehicle_logs (id, admin_id, company_id, vehicle_id, driver, purpose, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [id, adminId, companyId, vehicleId, driver, purpose, startDate, endDate ?? null, status]
    );
    res.json(toCamel(result.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/vehicle-logs/:id', async (req, res) => {
  const { id } = req.params;
  const updates: any = req.body;
  const fields = Object.keys(updates);
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

  const setClause = fields.map((field, idx) => {
    const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
    return `${dbField} = $${idx + 2}`;
  }).join(', ');

  try {
    const result = await pool.query(
      `UPDATE vehicle_logs SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...Object.values(updates)]
    );
    res.json(toCamel(result.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// VEHICLE NEEDS API
app.post('/api/vehicle-needs', async (req, res) => {
  const { id, adminId, companyId, vehicleId, type, description, cost, date, pic } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO vehicle_needs (id, admin_id, company_id, vehicle_id, type, description, cost, date, pic) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [id, adminId, companyId, vehicleId, type, description, cost, date, pic]
    );
    res.json(toCamel(result.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// TECHNICIANS API
app.post('/api/technicians', async (req, res) => {
  const { id, adminId, companyId, name, role, phone } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO technicians (id, admin_id, company_id, name, role, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, adminId, companyId, name, role, phone]
    );
    res.json(toCamel(result.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/technicians/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM technicians WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
