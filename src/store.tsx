import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  GoodsItem, GoodsTransaction, 
  EquipmentItem, EquipmentLog, 
  VehicleItem, VehicleLog, VehicleNeed,
  Technician, User, Company
} from './types';
import { 
  apiLogin, apiFetchDashboard, apiGoods, apiGoodsTransactions, apiEquipment, 
  apiVehicles, apiTechnicians, apiCompanies, apiUsers 
} from './api/client';

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
  loading: boolean;
}

interface AppContextType extends AppState {
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
  refreshData: () => Promise<void>;
  
  // Goods Actions
  addGoodsItem: (item: Omit<GoodsItem, 'id' | 'adminId' | 'companyId'>) => Promise<void>;
  removeGoodsItem: (id: string) => Promise<void>;
  addGoodsTransaction: (transaction: Omit<GoodsTransaction, 'id' | 'date' | 'adminId' | 'companyId'>) => Promise<void>;
  
  // Equipment Actions
  addEquipmentItem: (item: Omit<EquipmentItem, 'id' | 'status' | 'currentUser' | 'adminId' | 'companyId'>) => Promise<void>;
  removeEquipmentItem: (id: string) => Promise<void>;
  addEquipmentLog: (log: Omit<EquipmentLog, 'id' | 'date' | 'adminId' | 'companyId'>) => Promise<void>;
  updateEquipmentCondition: (id: string, condition: EquipmentItem['condition']) => Promise<void>;
  
  // Vehicle Actions
  addVehicleItem: (item: Omit<VehicleItem, 'id' | 'status' | 'adminId' | 'companyId'>) => Promise<void>;
  removeVehicleItem: (id: string) => Promise<void>;
  addVehicleLog: (log: Omit<VehicleLog, 'id' | 'date' | 'status' | 'adminId' | 'companyId'>) => Promise<void>;
  finishVehicleTrip: (logId: string) => Promise<void>;
  addVehicleNeed: (need: Omit<VehicleNeed, 'id' | 'date' | 'adminId' | 'companyId'>) => Promise<void>;
  updateVehicleStatus: (id: string, status: VehicleItem['status']) => Promise<void>;
  
  // Technician Actions
  addTechnician: (tech: Omit<Technician, 'id' | 'adminId' | 'companyId'>) => Promise<void>;
  removeTechnician: (id: string) => Promise<void>;
  
  // Company Actions
  addCompany: (company: Omit<Company, 'id'>) => Promise<void>;
  removeCompany: (id: string) => Promise<void>;
  toggleCompanyDisabled: (id: string, disabled: boolean) => Promise<void>;
  updateCompany: (id: string, updates: Partial<Omit<Company, 'id'>>) => Promise<void>;
  
  // User Actions
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<Omit<User, 'id'>>) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  toggleUserDisabled: (id: string, disabled: boolean) => Promise<void>;
}

const emptyState: AppState = {
  users: [],
  companies: [],
  currentUser: null,
  goods: [],
  goodsTransactions: [],
  equipment: [],
  equipmentLogs: [],
  vehicles: [],
  vehicleLogs: [],
  vehicleNeeds: [],
  technicians: [],
  loading: false,
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(emptyState);

  const refreshData = async () => {
    if (!state.currentUser) return;
    try {
      setState(p => ({ ...p, loading: true }));
      const data = await apiFetchDashboard();
      setState(prev => ({
        ...prev,
        ...data,
        loading: false
      }));
    } catch (e) {
      console.error('Failed to refresh data', e);
      setState(p => ({ ...p, loading: false }));
    }
  };

  useEffect(() => {
    if (state.currentUser) {
      refreshData();
    }
  }, [state.currentUser]);

  const login = async (username: string, password?: string) => {
    try {
      const user = await apiLogin(username, password || '');
      setState(prev => ({ ...prev, currentUser: user }));
      return true;
    } catch (e) {
      console.error('Login failed', e);
      return false;
    }
  };

  const logout = () => {
    (window as any).__TOKEN__ = null;
    setState(emptyState);
  };

  // ---- Goods ----
  const addGoodsItem = async (item: any) => {
    await apiGoods.create(item);
    await refreshData();
  };
  const removeGoodsItem = async (id: string) => {
    await apiGoods.delete(id);
    await refreshData();
  };
  const addGoodsTransaction = async (tx: any) => {
    await apiGoodsTransactions.create(tx);
    await refreshData();
  };

  // ---- Equipment ----
  const addEquipmentItem = async (item: any) => {
    await apiEquipment.create(item);
    await refreshData();
  };
  const removeEquipmentItem = async (id: string) => {
    await apiEquipment.delete(id);
    await refreshData();
  };
  const addEquipmentLog = async (log: any) => {
    await apiEquipment.logCreate(log);
    await refreshData();
  };
  const updateEquipmentCondition = async (id: string, condition: any) => {
    await apiEquipment.updateCondition(id, condition);
    await refreshData();
  };

  // ---- Vehicles ----
  const addVehicleItem = async (item: any) => {
    await apiVehicles.create(item);
    await refreshData();
  };
  const removeVehicleItem = async (id: string) => {
    await apiVehicles.delete(id);
    await refreshData();
  };
  const addVehicleLog = async (log: any) => {
    await apiVehicles.logCreate(log);
    await refreshData();
  };
  const finishVehicleTrip = async (logId: string) => {
    await apiVehicles.finishTrip(logId);
    await refreshData();
  };
  const addVehicleNeed = async (need: any) => {
    await apiVehicles.needCreate(need);
    await refreshData();
  };
  const updateVehicleStatus = async (id: string, status: any) => {
    await apiVehicles.updateStatus(id, status);
    await refreshData();
  };

  // ---- Technicians ----
  const addTechnician = async (tech: any) => {
    await apiTechnicians.create(tech);
    await refreshData();
  };
  const removeTechnician = async (id: string) => {
    await apiTechnicians.delete(id);
    await refreshData();
  };

  // ---- Companies ----
  const addCompany = async (company: any) => {
    await apiCompanies.create(company);
    await refreshData();
  };
  const removeCompany = async (id: string) => {
    await apiCompanies.delete(id);
    await refreshData();
  };
  const toggleCompanyDisabled = async (id: string, disabled: boolean) => {
    await apiCompanies.toggleDisabled(id, disabled);
    await refreshData();
  };
  const updateCompany = async (id: string, updates: any) => {
    await apiCompanies.update(id, updates);
    await refreshData();
  };

  // ---- Users ----
  const addUser = async (user: any) => {
    await apiUsers.create(user);
    await refreshData();
  };
  const updateUser = async (id: string, updates: any) => {
    await apiUsers.update(id, updates);
    await refreshData();
  };
  const removeUser = async (id: string) => {
    await apiUsers.delete(id);
    await refreshData();
  };
  const toggleUserDisabled = async (id: string, disabled: boolean) => {
    await apiUsers.toggleDisabled(id, disabled);
    await refreshData();
  };

  return (
    <AppContext.Provider value={{
      ...state,
      login, logout, refreshData,
      addGoodsItem, removeGoodsItem, addGoodsTransaction,
      addEquipmentItem, removeEquipmentItem, addEquipmentLog, updateEquipmentCondition,
      addVehicleItem, removeVehicleItem, addVehicleLog, finishVehicleTrip, addVehicleNeed, updateVehicleStatus,
      addTechnician, removeTechnician,
      addCompany, removeCompany, toggleCompanyDisabled, updateCompany,
      addUser, updateUser, removeUser, toggleUserDisabled
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
