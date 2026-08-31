import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  GoodsItem, GoodsTransaction,
  EquipmentItem, EquipmentLog,
  VehicleItem, VehicleLog, VehicleNeed,
  Technician, User, Company
} from './types';
import { apiClient } from './apiClient';

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

const defaultState: Omit<AppState, 'isLoading'> = {
  companies: [],
  users: [],
  currentUser: null,
  goods: [],
  goodsTransactions: [],
  equipment: [],
  equipmentLogs: [],
  vehicles: [],
  vehicleLogs: [],
  vehicleNeeds: [],
  technicians: []
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    ...defaultState,
    currentUser: null,
    isLoading: true,
  });

  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9);
  const getAdminId = () => stateRef.current.currentUser?.id || 'admin1';
  const getCurrentCompanyId = () => stateRef.current.currentUser?.companyId;

  // ── Sync with PostgreSQL via API ─────────────────────────────────────────
  const fetchFreshData = async () => {
    try {
      const data = await apiClient.getAllData();
      if (data) {
        setState(prev => ({
          ...prev,
          ...data,
          currentUser: prev.currentUser, // keep user session intact
          isLoading: false,
        }));
      }
    } catch (err) {
      console.error('Gagal mengambil data dari server database:', err);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchFreshData();

    // Poll server every 10 seconds for real-time synchronization across devices
    const interval = setInterval(() => {
      fetchFreshData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

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
    try {
      await apiClient.addGoodsItem(newItem);
    } catch (err) {
      console.error(err);
    }
  };

  const removeGoodsItem = async (id: string) => {
    setState(prev => ({ ...prev, goods: prev.goods.filter(g => g.id !== id) }));
    try {
      await apiClient.removeGoodsItem(id);
    } catch (err) {
      console.error(err);
    }
  };

  const addGoodsTransaction = async (transaction: Omit<GoodsTransaction, 'id' | 'date' | 'adminId' | 'companyId'>) => {
    const newTx: GoodsTransaction = {
      ...transaction,
      id: generateId(),
      date: new Date().toISOString(),
      adminId: getAdminId(),
      companyId: getCurrentCompanyId() ?? '',
    };

    let updatedStock = 0;
    const currentGoods = stateRef.current.goods.find(g => g.id === transaction.itemId);
    if (currentGoods) {
      updatedStock = transaction.type === 'IN'
        ? currentGoods.stock + transaction.quantity
        : Math.max(0, currentGoods.stock - transaction.quantity);
    }

    setState(prev => {
      const updatedGoods = prev.goods.map(g => {
        if (g.id === transaction.itemId) {
          return { ...g, stock: updatedStock };
        }
        return g;
      });
      return { ...prev, goods: updatedGoods, goodsTransactions: [newTx, ...prev.goodsTransactions] };
    });

    try {
      await apiClient.addGoodsTransaction(newTx);
      await apiClient.updateGoodsItem(transaction.itemId, { stock: updatedStock });
    } catch (err) {
      console.error(err);
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
    try {
      await apiClient.addEquipmentItem(newItem);
    } catch (err) {
      console.error(err);
    }
  };

  const removeEquipmentItem = async (id: string) => {
    setState(prev => ({ ...prev, equipment: prev.equipment.filter(e => e.id !== id) }));
    try {
      await apiClient.removeEquipmentItem(id);
    } catch (err) {
      console.error(err);
    }
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
          return { ...eq, status: newStatus as EquipmentItem['status'], currentUser: newCurrentUser, condition: log.condition };
        }
        return eq;
      });
      return { ...prev, equipment: updatedEq, equipmentLogs: [newLog, ...prev.equipmentLogs] };
    });

    try {
      await apiClient.addEquipmentLog(newLog);
      await apiClient.updateEquipmentItem(log.equipmentId, {
        status: newStatus,
        currentUser: newCurrentUser ?? null,
        condition: log.condition,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const updateEquipmentCondition = async (id: string, condition: EquipmentItem['condition']) => {
    setState(prev => ({
      ...prev,
      equipment: prev.equipment.map(eq => eq.id === id ? { ...eq, condition } : eq),
    }));
    try {
      await apiClient.updateEquipmentItem(id, { condition });
    } catch (err) {
      console.error(err);
    }
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
    try {
      await apiClient.addVehicleItem(newItem);
    } catch (err) {
      console.error(err);
    }
  };

  const removeVehicleItem = async (id: string) => {
    setState(prev => ({ ...prev, vehicles: prev.vehicles.filter(v => v.id !== id) }));
    try {
      await apiClient.removeVehicleItem(id);
    } catch (err) {
      console.error(err);
    }
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
    try {
      await apiClient.addVehicleLog(newLog);
      await apiClient.updateVehicleItem(log.vehicleId, { status: 'Sedang Digunakan' });
    } catch (err) {
      console.error(err);
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

    try {
      await apiClient.updateVehicleLog(logId, { status: 'SELESAI', endDate });
      await apiClient.updateVehicleItem(log.vehicleId, { status: 'Tersedia' });
    } catch (err) {
      console.error(err);
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
    try {
      await apiClient.addVehicleNeed(newNeed);
    } catch (err) {
      console.error(err);
    }
  };

  const updateVehicleStatus = async (id: string, status: VehicleItem['status']) => {
    setState(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => v.id === id ? { ...v, status } : v),
    }));
    try {
      await apiClient.updateVehicleItem(id, { status });
    } catch (err) {
      console.error(err);
    }
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
    try {
      await apiClient.addTechnician(newTech);
    } catch (err) {
      console.error(err);
    }
  };

  const removeTechnician = async (id: string) => {
    setState(prev => ({ ...prev, technicians: prev.technicians.filter(t => t.id !== id) }));
    try {
      await apiClient.removeTechnician(id);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── USERS ─────────────────────────────────────────────────────────────────

  const addUser = async (user: Omit<User, 'id'>) => {
    const newUser: User = { ...user, id: generateId(), disabled: user.disabled ?? false };
    setState(prev => ({ ...prev, users: [...prev.users, newUser] }));
    try {
      await apiClient.addUser(newUser);
    } catch (err) {
      console.error(err);
    }
  };

  const updateUser = async (id: string, updates: Partial<Omit<User, 'id'>>) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === id ? { ...u, ...updates } : u),
    }));
    try {
      await apiClient.updateUser(id, updates);
    } catch (err) {
      console.error(err);
    }
  };

  const removeUser = async (id: string) => {
    setState(prev => ({ ...prev, users: prev.users.filter(u => u.id !== id) }));
    try {
      await apiClient.removeUser(id);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleUserDisabled = async (id: string, disabled: boolean) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === id ? { ...u, disabled } : u),
    }));
    try {
      await apiClient.updateUser(id, { disabled });
    } catch (err) {
      console.error(err);
    }
  };

  // ─── COMPANIES ─────────────────────────────────────────────────────────────

  const addCompany = async (company: Omit<Company, 'id'>) => {
    const newCompany: Company = { ...company, id: generateId(), disabled: company.disabled ?? false };
    setState(prev => ({ ...prev, companies: [...prev.companies, newCompany] }));
    try {
      await apiClient.addCompany(newCompany);
    } catch (err) {
      console.error(err);
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
    try {
      await apiClient.removeCompany(id);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCompanyDisabled = async (id: string, disabled: boolean) => {
    setState(prev => ({
      ...prev,
      companies: prev.companies.map(c => c.id === id ? { ...c, disabled } : c),
    }));
    try {
      await apiClient.updateCompany(id, { disabled });
    } catch (err) {
      console.error(err);
    }
  };

  const updateCompany = async (id: string, updates: Partial<Omit<Company, 'id'>>) => {
    setState(prev => ({
      ...prev,
      companies: prev.companies.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
    try {
      await apiClient.updateCompany(id, updates);
    } catch (err) {
      console.error(err);
    }
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
          <p className="text-slate-600 font-medium">Memuat data dari PostgreSQL...</p>
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
