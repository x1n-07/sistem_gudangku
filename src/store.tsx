import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  GoodsItem, GoodsTransaction,
  EquipmentItem, EquipmentLog,
  VehicleItem, VehicleLog, VehicleNeed,
  Technician, User, Company
} from './types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// ─── State & Context Types ────────────────────────────────────────────────────

interface AppState {
  users: User[];
  companies: Company[];
  currentUser: User | null;
  goods: GoodsItem[];
  goodsTransactions: GoodsTransaction[];
  equipment: EquipmentItem[];
  equipmentLogs: EquipmentLog[];
  vehicles: VehicleItem[];
  vehicleLogs: VehicleLog[];
  vehicleNeeds: VehicleNeed[];
  technicians: Technician[];
  isLoading: boolean;
}

interface AppContextType extends AppState {
  login: (username: string, password?: string) => boolean;
  logout: () => void;
  addGoodsItem: (item: Omit<GoodsItem, 'id' | 'adminId' | 'companyId'>) => void;
  removeGoodsItem: (id: string) => void;
  addGoodsTransaction: (transaction: Omit<GoodsTransaction, 'id' | 'date' | 'adminId' | 'companyId'>) => void;
  addEquipmentItem: (item: Omit<EquipmentItem, 'id' | 'status' | 'currentUser' | 'adminId' | 'companyId'>) => void;
  removeEquipmentItem: (id: string) => void;
  addEquipmentLog: (log: Omit<EquipmentLog, 'id' | 'date' | 'adminId' | 'companyId'>) => void;
  updateEquipmentCondition: (id: string, condition: EquipmentItem['condition']) => void;
  addVehicleItem: (item: Omit<VehicleItem, 'id' | 'status' | 'adminId' | 'companyId'>) => void;
  removeVehicleItem: (id: string) => void;
  addVehicleLog: (log: Omit<VehicleLog, 'id' | 'date' | 'status' | 'adminId' | 'companyId'>) => void;
  finishVehicleTrip: (logId: string) => void;
  addVehicleNeed: (need: Omit<VehicleNeed, 'id' | 'date' | 'adminId' | 'companyId'>) => void;
  updateVehicleStatus: (id: string, status: VehicleItem['status']) => void;
  addTechnician: (tech: Omit<Technician, 'id' | 'adminId' | 'companyId'>) => void;
  removeTechnician: (id: string) => void;
  addCompany: (company: Omit<Company, 'id'>) => void;
  removeCompany: (id: string) => void;
  toggleCompanyDisabled: (id: string, disabled: boolean) => void;
  updateCompany: (id: string, updates: Partial<Omit<Company, 'id'>>) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<Omit<User, 'id'>>) => void;
  removeUser: (id: string) => void;
  toggleUserDisabled: (id: string, disabled: boolean) => void;
}

// ─── Default Seed Data ────────────────────────────────────────────────────────

const defaultState: Omit<AppState, 'isLoading'> = {
  companies: [
    { id: 'c1', name: 'PT Logistik A', disabled: false },
    { id: 'c2', name: 'PT Logistik B', disabled: false }
  ],
  users: [
    { id: 'super1', username: 'superadmin', password: '123', role: 'superadmin', name: 'Super Administrator', disabled: false },
    { id: 'admin1', username: 'admin1', password: '123', role: 'admin', name: 'Admin Gudang A', companyId: 'c1', contact: '081234567890', disabled: false },
    { id: 'admin2', username: 'admin2', password: '123', role: 'admin', name: 'Admin Gudang B', companyId: 'c2', contact: '081234567891', disabled: false },
    { id: 'peng1', username: 'pengawas1', password: '123', role: 'pengawas', name: 'Pengawas A', companyId: 'c1', contact: '081234567892', disabled: false },
    { id: 'tek1', username: 'teknisi1', password: '123', role: 'teknisi', name: 'Teknisi A', companyId: 'c1', contact: '081234567893', disabled: false }
  ],
  currentUser: null,
  goods: [
    { id: '1', adminId: 'admin1', companyId: 'c1', name: 'Semen Portland', category: 'Material', stock: 150, minStock: 50, unit: 'Sak' },
    { id: '2', adminId: 'admin1', companyId: 'c1', name: 'Paku 5cm', category: 'Material', stock: 50, minStock: 10, unit: 'Kg' }
  ],
  goodsTransactions: [],
  equipment: [
    { id: '1', adminId: 'admin1', companyId: 'c1', name: 'Mesin Bor Bosch', condition: 'Baik', status: 'Tersedia' },
    { id: '2', adminId: 'admin1', companyId: 'c1', name: 'Genset 5000W', condition: 'Baik', status: 'Tersedia' }
  ],
  equipmentLogs: [],
  vehicles: [
    { id: '1', adminId: 'admin1', companyId: 'c1', name: 'Mitsubishi Colt Diesel', plateNumber: 'B 1234 CD', status: 'Tersedia' },
    { id: '2', adminId: 'admin1', companyId: 'c1', name: 'Toyota Hilux', plateNumber: 'B 5678 EF', status: 'Tersedia' }
  ],
  vehicleLogs: [],
  vehicleNeeds: [],
  technicians: [
    { id: '1', adminId: 'admin1', companyId: 'c1', name: 'Budi Santoso', role: 'Teknisi Gudang', phone: '081234567890' },
    { id: '2', adminId: 'admin1', companyId: 'c1', name: 'Agus Pratama', role: 'Mekanik', phone: '089876543210' }
  ]
};

// ─── Helpers: localStorage fallback ──────────────────────────────────────────

const loadLocalState = (): Omit<AppState, 'isLoading'> => {
  const saved = localStorage.getItem('warehouse_app_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        ...defaultState,
        ...parsed,
        currentUser: parsed.currentUser || null,
      };
    } catch { /* ignore */ }
  }
  return defaultState;
};

const saveLocalState = (state: Omit<AppState, 'isLoading'>) => {
  localStorage.setItem('warehouse_app_state', JSON.stringify(state));
};

// ─── Supabase column-mapping helpers ─────────────────────────────────────────
// Supabase returns snake_case column names by default, so we map them to our
// camelCase TypeScript types.

const mapUser = (r: Record<string, unknown>): User => ({
  id: r.id as string,
  username: r.username as string,
  password: r.password as string | undefined,
  role: r.role as User['role'],
  name: r.name as string,
  companyId: r.company_id as string | undefined,
  contact: r.contact as string | undefined,
  disabled: (r.disabled as boolean) ?? false,
});

const mapCompany = (r: Record<string, unknown>): Company => ({
  id: r.id as string,
  name: r.name as string,
  disabled: (r.disabled as boolean) ?? false,
});

const mapGoods = (r: Record<string, unknown>): GoodsItem => ({
  id: r.id as string,
  adminId: r.admin_id as string,
  companyId: r.company_id as string,
  name: r.name as string,
  category: r.category as string,
  stock: r.stock as number,
  minStock: r.min_stock as number,
  unit: r.unit as string,
});

const mapGoodsTx = (r: Record<string, unknown>): GoodsTransaction => ({
  id: r.id as string,
  adminId: r.admin_id as string,
  companyId: r.company_id as string,
  itemId: r.item_id as string,
  type: r.type as 'IN' | 'OUT',
  quantity: r.quantity as number,
  date: r.date as string,
  notes: r.notes as string,
  pic: r.pic as string | undefined,
});

const mapEquipment = (r: Record<string, unknown>): EquipmentItem => ({
  id: r.id as string,
  adminId: r.admin_id as string,
  companyId: r.company_id as string,
  name: r.name as string,
  condition: r.condition as EquipmentItem['condition'],
  status: r.status as EquipmentItem['status'],
  currentUser: r.current_user as string | undefined,
});

const mapEquipmentLog = (r: Record<string, unknown>): EquipmentLog => ({
  id: r.id as string,
  adminId: r.admin_id as string,
  companyId: r.company_id as string,
  equipmentId: r.equipment_id as string,
  user: r.user as string,
  action: r.action as 'PINJAM' | 'KEMBALI',
  date: r.date as string,
  condition: r.condition as EquipmentItem['condition'],
  notes: r.notes as string,
});

const mapVehicle = (r: Record<string, unknown>): VehicleItem => ({
  id: r.id as string,
  adminId: r.admin_id as string,
  companyId: r.company_id as string,
  name: r.name as string,
  plateNumber: r.plate_number as string,
  status: r.status as VehicleItem['status'],
});

const mapVehicleLog = (r: Record<string, unknown>): VehicleLog => ({
  id: r.id as string,
  adminId: r.admin_id as string,
  companyId: r.company_id as string,
  vehicleId: r.vehicle_id as string,
  driver: r.driver as string,
  purpose: r.purpose as string,
  startDate: r.start_date as string,
  endDate: r.end_date as string | undefined,
  status: r.status as 'JALAN' | 'SELESAI',
});

const mapVehicleNeed = (r: Record<string, unknown>): VehicleNeed => ({
  id: r.id as string,
  adminId: r.admin_id as string,
  companyId: r.company_id as string,
  vehicleId: r.vehicle_id as string,
  type: r.type as VehicleNeed['type'],
  description: r.description as string,
  cost: r.cost as number,
  date: r.date as string,
  pic: r.pic as string,
});

const mapTechnician = (r: Record<string, unknown>): Technician => ({
  id: r.id as string,
  adminId: r.admin_id as string,
  companyId: r.company_id as string,
  name: r.name as string,
  role: r.role as string,
  phone: r.phone as string,
});

// ─── Supabase fetch all data ──────────────────────────────────────────────────

const fetchAllFromSupabase = async (): Promise<Omit<AppState, 'currentUser' | 'isLoading'> | null> => {
  if (!supabase) return null;
  try {
    const [
      { data: companies },
      { data: users },
      { data: goods },
      { data: goodsTransactions },
      { data: equipment },
      { data: equipmentLogs },
      { data: vehicles },
      { data: vehicleLogs },
      { data: vehicleNeeds },
      { data: technicians },
    ] = await Promise.all([
      supabase.from('companies').select('*'),
      supabase.from('users').select('*'),
      supabase.from('goods').select('*'),
      supabase.from('goods_transactions').select('*').order('date', { ascending: false }),
      supabase.from('equipment').select('*'),
      supabase.from('equipment_logs').select('*').order('date', { ascending: false }),
      supabase.from('vehicles').select('*'),
      supabase.from('vehicle_logs').select('*').order('start_date', { ascending: false }),
      supabase.from('vehicle_needs').select('*').order('date', { ascending: false }),
      supabase.from('technicians').select('*'),
    ]);

    return {
      companies: (companies ?? []).map(mapCompany),
      users: (users ?? []).map(mapUser),
      goods: (goods ?? []).map(mapGoods),
      goodsTransactions: (goodsTransactions ?? []).map(mapGoodsTx),
      equipment: (equipment ?? []).map(mapEquipment),
      equipmentLogs: (equipmentLogs ?? []).map(mapEquipmentLog),
      vehicles: (vehicles ?? []).map(mapVehicle),
      vehicleLogs: (vehicleLogs ?? []).map(mapVehicleLog),
      vehicleNeeds: (vehicleNeeds ?? []).map(mapVehicleNeed),
      technicians: (technicians ?? []).map(mapTechnician),
    };
  } catch (err) {
    console.error('Gagal mengambil data dari Supabase:', err);
    return null;
  }
};

// ─── Supabase seed default data ───────────────────────────────────────────────

const seedSupabaseDefaults = async () => {
  if (!supabase) return;
  try {
    await Promise.all([
      supabase.from('companies').upsert(
        defaultState.companies.map(c => ({
          id: c.id, name: c.name, disabled: c.disabled
        })),
        { onConflict: 'id', ignoreDuplicates: true }
      ),
      supabase.from('users').upsert(
        defaultState.users.map(u => ({
          id: u.id, username: u.username, password: u.password,
          role: u.role, name: u.name, company_id: u.companyId,
          contact: u.contact, disabled: u.disabled
        })),
        { onConflict: 'id', ignoreDuplicates: true }
      ),
      supabase.from('goods').upsert(
        defaultState.goods.map(g => ({
          id: g.id, admin_id: g.adminId, company_id: g.companyId,
          name: g.name, category: g.category, stock: g.stock,
          min_stock: g.minStock, unit: g.unit
        })),
        { onConflict: 'id', ignoreDuplicates: true }
      ),
      supabase.from('equipment').upsert(
        defaultState.equipment.map(e => ({
          id: e.id, admin_id: e.adminId, company_id: e.companyId,
          name: e.name, condition: e.condition, status: e.status
        })),
        { onConflict: 'id', ignoreDuplicates: true }
      ),
      supabase.from('vehicles').upsert(
        defaultState.vehicles.map(v => ({
          id: v.id, admin_id: v.adminId, company_id: v.companyId,
          name: v.name, plate_number: v.plateNumber, status: v.status
        })),
        { onConflict: 'id', ignoreDuplicates: true }
      ),
      supabase.from('technicians').upsert(
        defaultState.technicians.map(t => ({
          id: t.id, admin_id: t.adminId, company_id: t.companyId,
          name: t.name, role: t.role, phone: t.phone
        })),
        { onConflict: 'id', ignoreDuplicates: true }
      ),
    ]);
  } catch (err) {
    console.error('Gagal menyemai data default ke Supabase:', err);
  }
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    ...loadLocalState(),
    currentUser: null,
    isLoading: isSupabaseConfigured ? true : false,
  });

  // Keep a ref so async callbacks always see the latest state
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9);
  const getAdminId = () => stateRef.current.currentUser?.id || 'admin1';
  const getCurrentCompanyId = () => stateRef.current.currentUser?.companyId;

  // ── On Mount: load data ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Local-only mode: nothing extra to do
      return;
    }

    let realtimeChannel: any = null;

    const initData = async () => {
      // Seed default rows (ignored if rows already exist)
      await seedSupabaseDefaults();

      // Fetch fresh data
      const remote = await fetchAllFromSupabase();
      if (remote) {
        setState(prev => ({
          ...prev,
          ...remote,
          currentUser: prev.currentUser, // keep session
          isLoading: false,
        }));
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }

      // Subscribe to realtime changes for all tables
      realtimeChannel = supabase!
        .channel('db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, async () => {
          // When any table changes (from another device), refetch everything
          const fresh = await fetchAllFromSupabase();
          if (fresh) {
            setState(prev => ({
              ...prev,
              ...fresh,
              currentUser: prev.currentUser,
            }));
          }
        })
        .subscribe();
    };

    initData();

    return () => {
      if (realtimeChannel) supabase!.removeChannel(realtimeChannel);
    };
  }, []);

  // ── Persist to localStorage when Supabase is NOT configured ───────────────
  useEffect(() => {
    if (!isSupabaseConfigured) {
      const { isLoading, ...rest } = state;
      saveLocalState(rest);
    }
  }, [state]);

  // ─── AUTH ──────────────────────────────────────────────────────────────────

  const login = (username: string, password?: string): boolean => {
    const user = state.users.find(u => u.username === username && u.password === password);
    const company = user?.companyId ? state.companies.find(c => c.id === user.companyId) : undefined;
    if (user && !user.disabled && !company?.disabled) {
      setState(prev => ({ ...prev, currentUser: user }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  // ─── GOODS ─────────────────────────────────────────────────────────────────

  const addGoodsItem = async (item: Omit<GoodsItem, 'id' | 'adminId' | 'companyId'>) => {
    const newItem: GoodsItem = {
      ...item,
      id: generateId(),
      adminId: getAdminId(),
      companyId: getCurrentCompanyId() ?? '',
    };
    setState(prev => ({ ...prev, goods: [...prev.goods, newItem] }));
    if (supabase) {
      await supabase.from('goods').insert({
        id: newItem.id, admin_id: newItem.adminId, company_id: newItem.companyId,
        name: newItem.name, category: newItem.category, stock: newItem.stock,
        min_stock: newItem.minStock, unit: newItem.unit,
      });
    }
  };

  const removeGoodsItem = async (id: string) => {
    setState(prev => ({ ...prev, goods: prev.goods.filter(g => g.id !== id) }));
    if (supabase) await supabase.from('goods').delete().eq('id', id);
  };

  const addGoodsTransaction = async (transaction: Omit<GoodsTransaction, 'id' | 'date' | 'adminId' | 'companyId'>) => {
    const newTx: GoodsTransaction = {
      ...transaction,
      id: generateId(),
      date: new Date().toISOString(),
      adminId: getAdminId(),
      companyId: getCurrentCompanyId() ?? '',
    };
    setState(prev => {
      const updatedGoods = prev.goods.map(g => {
        if (g.id === transaction.itemId) {
          const newStock = transaction.type === 'IN'
            ? g.stock + transaction.quantity
            : Math.max(0, g.stock - transaction.quantity);
          return { ...g, stock: newStock };
        }
        return g;
      });
      return { ...prev, goods: updatedGoods, goodsTransactions: [newTx, ...prev.goodsTransactions] };
    });
    if (supabase) {
      await supabase.from('goods_transactions').insert({
        id: newTx.id, admin_id: newTx.adminId, company_id: newTx.companyId,
        item_id: newTx.itemId, type: newTx.type, quantity: newTx.quantity,
        date: newTx.date, notes: newTx.notes, pic: newTx.pic ?? null,
      });
      // Update stock in DB
      const currentGoods = stateRef.current.goods.find(g => g.id === transaction.itemId);
      if (currentGoods) {
        const newStock = transaction.type === 'IN'
          ? currentGoods.stock + transaction.quantity
          : Math.max(0, currentGoods.stock - transaction.quantity);
        await supabase.from('goods').update({ stock: newStock }).eq('id', transaction.itemId);
      }
    }
  };

  // ─── EQUIPMENT ─────────────────────────────────────────────────────────────

  const addEquipmentItem = async (item: Omit<EquipmentItem, 'id' | 'status' | 'currentUser' | 'adminId' | 'companyId'>) => {
    const newItem: EquipmentItem = {
      ...item,
      id: generateId(),
      status: 'Tersedia',
      adminId: getAdminId(),
      companyId: getCurrentCompanyId() ?? '',
    };
    setState(prev => ({ ...prev, equipment: [...prev.equipment, newItem] }));
    if (supabase) {
      await supabase.from('equipment').insert({
        id: newItem.id, admin_id: newItem.adminId, company_id: newItem.companyId,
        name: newItem.name, condition: newItem.condition, status: newItem.status,
      });
    }
  };

  const removeEquipmentItem = async (id: string) => {
    setState(prev => ({ ...prev, equipment: prev.equipment.filter(e => e.id !== id) }));
    if (supabase) await supabase.from('equipment').delete().eq('id', id);
  };

  const addEquipmentLog = async (log: Omit<EquipmentLog, 'id' | 'date' | 'adminId' | 'companyId'>) => {
    const newLog: EquipmentLog = {
      ...log,
      id: generateId(),
      date: new Date().toISOString(),
      adminId: getAdminId(),
      companyId: getCurrentCompanyId() ?? '',
    };
    const newStatus = log.action === 'PINJAM' ? 'Dipinjam' : 'Tersedia';
    const newCurrentUser = log.action === 'PINJAM' ? log.user : undefined;

    setState(prev => {
      const updatedEq = prev.equipment.map(eq => {
        if (eq.id === log.equipmentId) {
          return { ...eq, status: newStatus, currentUser: newCurrentUser, condition: log.condition };
        }
        return eq;
      });
      return { ...prev, equipment: updatedEq, equipmentLogs: [newLog, ...prev.equipmentLogs] };
    });

    if (supabase) {
      await Promise.all([
        supabase.from('equipment_logs').insert({
          id: newLog.id, admin_id: newLog.adminId, company_id: newLog.companyId,
          equipment_id: newLog.equipmentId, user: newLog.user, action: newLog.action,
          date: newLog.date, condition: newLog.condition, notes: newLog.notes,
        }),
        supabase.from('equipment').update({
          status: newStatus,
          current_user: newCurrentUser ?? null,
          condition: log.condition,
        }).eq('id', log.equipmentId),
      ]);
    }
  };

  const updateEquipmentCondition = async (id: string, condition: EquipmentItem['condition']) => {
    setState(prev => ({
      ...prev,
      equipment: prev.equipment.map(eq => eq.id === id ? { ...eq, condition } : eq),
    }));
    if (supabase) await supabase.from('equipment').update({ condition }).eq('id', id);
  };

  // ─── VEHICLES ──────────────────────────────────────────────────────────────

  const addVehicleItem = async (item: Omit<VehicleItem, 'id' | 'status' | 'adminId' | 'companyId'>) => {
    const newItem: VehicleItem = {
      ...item,
      id: generateId(),
      status: 'Tersedia',
      adminId: getAdminId(),
      companyId: getCurrentCompanyId() ?? '',
    };
    setState(prev => ({ ...prev, vehicles: [...prev.vehicles, newItem] }));
    if (supabase) {
      await supabase.from('vehicles').insert({
        id: newItem.id, admin_id: newItem.adminId, company_id: newItem.companyId,
        name: newItem.name, plate_number: newItem.plateNumber, status: newItem.status,
      });
    }
  };

  const removeVehicleItem = async (id: string) => {
    setState(prev => ({ ...prev, vehicles: prev.vehicles.filter(v => v.id !== id) }));
    if (supabase) await supabase.from('vehicles').delete().eq('id', id);
  };

  const addVehicleLog = async (log: Omit<VehicleLog, 'id' | 'date' | 'status' | 'adminId' | 'companyId'>) => {
    const newLog: VehicleLog = {
      ...log,
      id: generateId(),
      startDate: new Date().toISOString(),
      status: 'JALAN',
      adminId: getAdminId(),
      companyId: getCurrentCompanyId() ?? '',
    };
    setState(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => v.id === log.vehicleId ? { ...v, status: 'Sedang Digunakan' } : v),
      vehicleLogs: [newLog, ...prev.vehicleLogs],
    }));
    if (supabase) {
      await Promise.all([
        supabase.from('vehicle_logs').insert({
          id: newLog.id, admin_id: newLog.adminId, company_id: newLog.companyId,
          vehicle_id: newLog.vehicleId, driver: newLog.driver, purpose: newLog.purpose,
          start_date: newLog.startDate, status: newLog.status,
        }),
        supabase.from('vehicles').update({ status: 'Sedang Digunakan' }).eq('id', log.vehicleId),
      ]);
    }
  };

  const finishVehicleTrip = async (logId: string) => {
    const log = stateRef.current.vehicleLogs.find(l => l.id === logId);
    if (!log) return;
    const endDate = new Date().toISOString();

    setState(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => v.id === log.vehicleId ? { ...v, status: 'Tersedia' } : v),
      vehicleLogs: prev.vehicleLogs.map(l =>
        l.id === logId ? { ...l, status: 'SELESAI', endDate } : l
      ),
    }));

    if (supabase) {
      await Promise.all([
        supabase.from('vehicle_logs').update({ status: 'SELESAI', end_date: endDate }).eq('id', logId),
        supabase.from('vehicles').update({ status: 'Tersedia' }).eq('id', log.vehicleId),
      ]);
    }
  };

  const addVehicleNeed = async (need: Omit<VehicleNeed, 'id' | 'date' | 'adminId' | 'companyId'>) => {
    const newNeed: VehicleNeed = {
      ...need,
      id: generateId(),
      date: new Date().toISOString(),
      adminId: getAdminId(),
      companyId: getCurrentCompanyId() ?? '',
    };
    setState(prev => ({
      ...prev,
      vehicleNeeds: [newNeed, ...prev.vehicleNeeds],
    }));
    if (supabase) {
      await supabase.from('vehicle_needs').insert({
        id: newNeed.id, admin_id: newNeed.adminId, company_id: newNeed.companyId,
        vehicle_id: newNeed.vehicleId, type: newNeed.type, description: newNeed.description,
        cost: newNeed.cost, date: newNeed.date, pic: newNeed.pic,
      });
    }
  };

  const updateVehicleStatus = async (id: string, status: VehicleItem['status']) => {
    setState(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => v.id === id ? { ...v, status } : v),
    }));
    if (supabase) await supabase.from('vehicles').update({ status }).eq('id', id);
  };

  // ─── TECHNICIANS ───────────────────────────────────────────────────────────

  const addTechnician = async (tech: Omit<Technician, 'id' | 'adminId' | 'companyId'>) => {
    const newTech: Technician = {
      ...tech,
      id: generateId(),
      adminId: getAdminId(),
      companyId: getCurrentCompanyId() ?? '',
    };
    setState(prev => ({ ...prev, technicians: [...prev.technicians, newTech] }));
    if (supabase) {
      await supabase.from('technicians').insert({
        id: newTech.id, admin_id: newTech.adminId, company_id: newTech.companyId,
        name: newTech.name, role: newTech.role, phone: newTech.phone,
      });
    }
  };

  const removeTechnician = async (id: string) => {
    setState(prev => ({ ...prev, technicians: prev.technicians.filter(t => t.id !== id) }));
    if (supabase) await supabase.from('technicians').delete().eq('id', id);
  };

  // ─── USERS ─────────────────────────────────────────────────────────────────

  const addUser = async (user: Omit<User, 'id'>) => {
    const newUser: User = { ...user, id: generateId(), disabled: user.disabled ?? false };
    setState(prev => ({ ...prev, users: [...prev.users, newUser] }));
    if (supabase) {
      await supabase.from('users').insert({
        id: newUser.id, username: newUser.username, password: newUser.password,
        role: newUser.role, name: newUser.name, company_id: newUser.companyId ?? null,
        contact: newUser.contact ?? null, disabled: newUser.disabled,
      });
    }
  };

  const updateUser = async (id: string, updates: Partial<Omit<User, 'id'>>) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === id ? { ...u, ...updates } : u),
    }));
    if (supabase) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.username !== undefined) dbUpdates.username = updates.username;
      if (updates.password !== undefined) dbUpdates.password = updates.password;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.companyId !== undefined) dbUpdates.company_id = updates.companyId ?? null;
      if (updates.contact !== undefined) dbUpdates.contact = updates.contact ?? null;
      if (updates.disabled !== undefined) dbUpdates.disabled = updates.disabled;
      await supabase.from('users').update(dbUpdates).eq('id', id);
    }
  };

  const removeUser = async (id: string) => {
    setState(prev => ({ ...prev, users: prev.users.filter(u => u.id !== id) }));
    if (supabase) await supabase.from('users').delete().eq('id', id);
  };

  const toggleUserDisabled = async (id: string, disabled: boolean) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === id ? { ...u, disabled } : u),
    }));
    if (supabase) await supabase.from('users').update({ disabled }).eq('id', id);
  };

  // ─── COMPANIES ─────────────────────────────────────────────────────────────

  const addCompany = async (company: Omit<Company, 'id'>) => {
    const newCompany: Company = { ...company, id: generateId(), disabled: company.disabled ?? false };
    setState(prev => ({ ...prev, companies: [...prev.companies, newCompany] }));
    if (supabase) {
      await supabase.from('companies').insert({
        id: newCompany.id, name: newCompany.name, disabled: newCompany.disabled,
      });
    }
  };

  const removeCompany = async (id: string) => {
    setState(prev => ({
      ...prev,
      companies: prev.companies.filter(c => c.id !== id),
      users: prev.users.map(u => u.companyId === id ? { ...u, companyId: undefined } : u),
      goods: prev.goods.filter(g => g.companyId !== id),
      goodsTransactions: prev.goodsTransactions.filter(tx => tx.companyId !== id),
      equipment: prev.equipment.filter(e => e.companyId !== id),
      equipmentLogs: prev.equipmentLogs.filter(log => log.companyId !== id),
      vehicles: prev.vehicles.filter(v => v.companyId !== id),
      vehicleLogs: prev.vehicleLogs.filter(log => log.companyId !== id),
      vehicleNeeds: prev.vehicleNeeds.filter(n => n.companyId !== id),
      technicians: prev.technicians.filter(t => t.companyId !== id),
    }));
    if (supabase) {
      await supabase.from('companies').delete().eq('id', id);
    }
  };

  const toggleCompanyDisabled = async (id: string, disabled: boolean) => {
    setState(prev => ({
      ...prev,
      companies: prev.companies.map(c => c.id === id ? { ...c, disabled } : c),
    }));
    if (supabase) await supabase.from('companies').update({ disabled }).eq('id', id);
  };

  const updateCompany = async (id: string, updates: Partial<Omit<Company, 'id'>>) => {
    setState(prev => ({
      ...prev,
      companies: prev.companies.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
    if (supabase) await supabase.from('companies').update(updates).eq('id', id);
  };

  // ─── Tenant filter ─────────────────────────────────────────────────────────

  const filterByTenant = <T extends { companyId?: string }>(data: T[]): T[] => {
    if (state.currentUser?.role === 'superadmin') return data;
    if (!state.currentUser?.companyId) return [];
    return data.filter(item => item.companyId === state.currentUser!.companyId);
  };

  // ─── Loading screen ────────────────────────────────────────────────────────

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      ...state,
      goods: filterByTenant(state.goods),
      goodsTransactions: filterByTenant(state.goodsTransactions),
      equipment: filterByTenant(state.equipment),
      equipmentLogs: filterByTenant(state.equipmentLogs),
      vehicles: filterByTenant(state.vehicles),
      vehicleLogs: filterByTenant(state.vehicleLogs),
      vehicleNeeds: filterByTenant(state.vehicleNeeds),
      technicians: filterByTenant(state.technicians),
      login,
      logout,
      addGoodsItem,
      removeGoodsItem,
      addGoodsTransaction,
      addEquipmentItem,
      removeEquipmentItem,
      addEquipmentLog,
      updateEquipmentCondition,
      addVehicleItem,
      removeVehicleItem,
      addVehicleLog,
      finishVehicleTrip,
      addVehicleNeed,
      updateVehicleStatus,
      addTechnician,
      removeTechnician,
      addCompany,
      removeCompany,
      toggleCompanyDisabled,
      updateCompany,
      addUser,
      updateUser,
      removeUser,
      toggleUserDisabled,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
