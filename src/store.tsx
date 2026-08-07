import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  GoodsItem, GoodsTransaction, 
  EquipmentItem, EquipmentLog, 
  VehicleItem, VehicleLog, VehicleNeed,
  Technician, User
} from './types';

interface AppState {
  users: User[];
  currentUser: User | null;
  goods: GoodsItem[];
  goodsTransactions: GoodsTransaction[];
  equipment: EquipmentItem[];
  equipmentLogs: EquipmentLog[];
  vehicles: VehicleItem[];
  vehicleLogs: VehicleLog[];
  vehicleNeeds: VehicleNeed[];
  technicians: Technician[];
}

interface AppContextType extends AppState {
  login: (username: string, password?: string) => boolean;
  logout: () => void;
  // Goods Actions
  addGoodsItem: (item: Omit<GoodsItem, 'id' | 'adminId'>) => void;
  removeGoodsItem: (id: string) => void;
  addGoodsTransaction: (transaction: Omit<GoodsTransaction, 'id' | 'date' | 'adminId'>) => void;
  // Equipment Actions
  addEquipmentItem: (item: Omit<EquipmentItem, 'id' | 'status' | 'currentUser' | 'adminId'>) => void;
  removeEquipmentItem: (id: string) => void;
  addEquipmentLog: (log: Omit<EquipmentLog, 'id' | 'date' | 'adminId'>) => void;
  updateEquipmentCondition: (id: string, condition: EquipmentItem['condition']) => void;
  // Vehicle Actions
  addVehicleItem: (item: Omit<VehicleItem, 'id' | 'status' | 'adminId'>) => void;
  removeVehicleItem: (id: string) => void;
  addVehicleLog: (log: Omit<VehicleLog, 'id' | 'date' | 'status' | 'adminId'>) => void;
  finishVehicleTrip: (logId: string) => void;
  addVehicleNeed: (need: Omit<VehicleNeed, 'id' | 'date' | 'adminId'>) => void;
  updateVehicleStatus: (id: string, status: VehicleItem['status']) => void;
  // Technician Actions
  addTechnician: (tech: Omit<Technician, 'id' | 'adminId'>) => void;
  removeTechnician: (id: string) => void;
  // User Actions
  addUser: (user: Omit<User, 'id'>) => void;
  removeUser: (id: string) => void;
}

const defaultState: AppState = {
  users: [
    { id: 'super1', username: 'superadmin', password: '123', role: 'superadmin', name: 'Super Administrator' },
    { id: 'admin1', username: 'admin1', password: '123', role: 'admin', name: 'Admin Gudang A' },
    { id: 'admin2', username: 'admin2', password: '123', role: 'admin', name: 'Admin Gudang B' }
  ],
  currentUser: null,
  goods: [
    { id: '1', adminId: 'admin1', name: 'Semen Portland', category: 'Material', stock: 150, minStock: 50, unit: 'Sak' },
    { id: '2', adminId: 'admin1', name: 'Paku 5cm', category: 'Material', stock: 50, minStock: 10, unit: 'Kg' }
  ],
  goodsTransactions: [],
  equipment: [
    { id: '1', adminId: 'admin1', name: 'Mesin Bor Bosch', condition: 'Baik', status: 'Tersedia' },
    { id: '2', adminId: 'admin1', name: 'Genset 5000W', condition: 'Baik', status: 'Tersedia' }
  ],
  equipmentLogs: [],
  vehicles: [
    { id: '1', adminId: 'admin1', name: 'Mitsubishi Colt Diesel', plateNumber: 'B 1234 CD', status: 'Tersedia' },
    { id: '2', adminId: 'admin1', name: 'Toyota Hilux', plateNumber: 'B 5678 EF', status: 'Tersedia' }
  ],
  vehicleLogs: [],
  vehicleNeeds: [],
  technicians: [
    { id: '1', adminId: 'admin1', name: 'Budi Santoso', role: 'Teknisi Gudang', phone: '081234567890' },
    { id: '2', adminId: 'admin1', name: 'Agus Pratama', role: 'Mekanik', phone: '089876543210' }
  ]
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('warehouse_app_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultState,
          ...parsed,
          users: parsed.users || defaultState.users,
          currentUser: parsed.currentUser || defaultState.currentUser,
          goods: parsed.goods || defaultState.goods,
          goodsTransactions: parsed.goodsTransactions || defaultState.goodsTransactions,
          equipment: parsed.equipment || defaultState.equipment,
          equipmentLogs: parsed.equipmentLogs || defaultState.equipmentLogs,
          vehicles: parsed.vehicles || defaultState.vehicles,
          vehicleLogs: parsed.vehicleLogs || defaultState.vehicleLogs,
          vehicleNeeds: parsed.vehicleNeeds || defaultState.vehicleNeeds,
          technicians: parsed.technicians || defaultState.technicians,
        };
      } catch (e) {
        return defaultState;
      }
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem('warehouse_app_state', JSON.stringify(state));
  }, [state]);

  const generateId = () => Math.random().toString(36).substr(2, 9);
  
  const getAdminId = () => state.currentUser?.id || 'admin1';

  const login = (username: string, password?: string) => {
    const user = state.users.find(u => u.username === username && u.password === password);
    if (user) {
      setState(prev => ({ ...prev, currentUser: user }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  const addGoodsItem = (item: Omit<GoodsItem, 'id' | 'adminId'>) => {
    setState(prev => ({ ...prev, goods: [...prev.goods, { ...item, id: generateId(), adminId: getAdminId() }] }));
  };

  const removeGoodsItem = (id: string) => {
    setState(prev => ({ ...prev, goods: prev.goods.filter(g => g.id !== id) }));
  };

  const addGoodsTransaction = (transaction: Omit<GoodsTransaction, 'id' | 'date' | 'adminId'>) => {
    const newTx: GoodsTransaction = { ...transaction, id: generateId(), date: new Date().toISOString(), adminId: getAdminId() };
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
  };

  const addEquipmentItem = (item: Omit<EquipmentItem, 'id' | 'status' | 'currentUser' | 'adminId'>) => {
    setState(prev => ({ 
      ...prev, 
      equipment: [...prev.equipment, { ...item, id: generateId(), status: 'Tersedia', adminId: getAdminId() }] 
    }));
  };

  const removeEquipmentItem = (id: string) => {
    setState(prev => ({ ...prev, equipment: prev.equipment.filter(e => e.id !== id) }));
  };

  const addEquipmentLog = (log: Omit<EquipmentLog, 'id' | 'date' | 'adminId'>) => {
    const newLog: EquipmentLog = { ...log, id: generateId(), date: new Date().toISOString(), adminId: getAdminId() };
    setState(prev => {
      const updatedEq = prev.equipment.map(eq => {
        if (eq.id === log.equipmentId) {
          return { 
            ...eq, 
            status: log.action === 'PINJAM' ? 'Dipinjam' : 'Tersedia',
            currentUser: log.action === 'PINJAM' ? log.user : undefined,
            condition: log.condition
          };
        }
        return eq;
      });
      return { ...prev, equipment: updatedEq, equipmentLogs: [newLog, ...prev.equipmentLogs] };
    });
  };

  const updateEquipmentCondition = (id: string, condition: EquipmentItem['condition']) => {
    setState(prev => ({
      ...prev,
      equipment: prev.equipment.map(eq => eq.id === id ? { ...eq, condition } : eq)
    }));
  };

  const addVehicleItem = (item: Omit<VehicleItem, 'id' | 'status' | 'adminId'>) => {
    setState(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, { ...item, id: generateId(), status: 'Tersedia', adminId: getAdminId() }]
    }));
  };

  const removeVehicleItem = (id: string) => {
    setState(prev => ({ ...prev, vehicles: prev.vehicles.filter(v => v.id !== id) }));
  };

  const addVehicleLog = (log: Omit<VehicleLog, 'id' | 'date' | 'status' | 'adminId'>) => {
    const newLog: VehicleLog = { 
      ...log, 
      id: generateId(), 
      startDate: new Date().toISOString(),
      status: 'JALAN',
      adminId: getAdminId()
    };
    setState(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => v.id === log.vehicleId ? { ...v, status: 'Sedang Digunakan' } : v),
      vehicleLogs: [newLog, ...prev.vehicleLogs]
    }));
  };

  const finishVehicleTrip = (logId: string) => {
    setState(prev => {
      const log = prev.vehicleLogs.find(l => l.id === logId);
      if (!log) return prev;
      
      return {
        ...prev,
        vehicles: prev.vehicles.map(v => v.id === log.vehicleId ? { ...v, status: 'Tersedia' } : v),
        vehicleLogs: prev.vehicleLogs.map(l => 
          l.id === logId ? { ...l, status: 'SELESAI', endDate: new Date().toISOString() } : l
        )
      };
    });
  };

  const addVehicleNeed = (need: Omit<VehicleNeed, 'id' | 'date' | 'adminId'>) => {
    setState(prev => ({
      ...prev,
      vehicleNeeds: [{ ...need, id: generateId(), date: new Date().toISOString(), adminId: getAdminId() }, ...prev.vehicleNeeds]
    }));
  };

  const updateVehicleStatus = (id: string, status: VehicleItem['status']) => {
    setState(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => v.id === id ? { ...v, status } : v)
    }));
  };

  const addTechnician = (tech: Omit<Technician, 'id' | 'adminId'>) => {
    setState(prev => ({
      ...prev,
      technicians: [...prev.technicians, { ...tech, id: generateId(), adminId: getAdminId() }]
    }));
  };

  const removeTechnician = (id: string) => {
    setState(prev => ({
      ...prev,
      technicians: prev.technicians.filter(t => t.id !== id)
    }));
  };

  const addUser = (user: Omit<User, 'id'>) => {
    setState(prev => ({
      ...prev,
      users: [...prev.users, { ...user, id: generateId() }]
    }));
  };

  const removeUser = (id: string) => {
    setState(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== id)
    }));
  };

  const filterByTenant = <T extends { adminId: string }>(data: T[]): T[] => {
    if (state.currentUser?.role === 'superadmin') return data;
    return data.filter(item => item.adminId === state.currentUser?.id);
  };

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
      addUser,
      removeUser
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
