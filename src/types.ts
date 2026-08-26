export type TransactionType = 'IN' | 'OUT';
export type EquipmentCondition = 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
export type EquipmentStatus = 'Tersedia' | 'Dipinjam';
export type VehicleStatus = 'Tersedia' | 'Sedang Digunakan' | 'Perbaikan';
export type VehicleNeedType = 'BBM' | 'Servis' | 'Suku Cadang' | 'Lainnya';

export type UserRole = 'admin' | 'superadmin' | 'pengawas' | 'teknisi';

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  name: string;
  companyId?: string;
  contact?: string;
  disabled?: boolean;
}

export interface Company {
  id: string;
  name: string;
  disabled?: boolean;
}

export interface Technician {
  id: string;
  adminId: string;
  companyId: string;
  name: string;
  role: string;
  phone: string;
}

export interface GoodsItem {
  id: string;
  adminId: string;
  companyId: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
}

export interface GoodsTransaction {
  id: string;
  adminId: string;
  companyId: string;
  itemId: string;
  type: TransactionType;
  quantity: number;
  date: string;
  notes: string;
  pic?: string;
}

export interface EquipmentItem {
  id: string;
  adminId: string;
  companyId: string;
  name: string;
  condition: EquipmentCondition;
  status: EquipmentStatus;
  currentUser?: string;
}

export interface EquipmentLog {
  id: string;
  adminId: string;
  companyId: string;
  equipmentId: string;
  user: string;
  action: 'PINJAM' | 'KEMBALI';
  date: string;
  condition: EquipmentCondition;
  notes: string;
}

export interface VehicleItem {
  id: string;
  adminId: string;
  companyId: string;
  plateNumber: string;
  name: string;
  status: VehicleStatus;
}

export interface VehicleLog {
  id: string;
  adminId: string;
  companyId: string;
  vehicleId: string;
  driver: string;
  purpose: string;
  startDate: string;
  endDate?: string;
  status: 'JALAN' | 'SELESAI';
}

export interface VehicleNeed {
  id: string;
  adminId: string;
  companyId: string;
  vehicleId: string;
  type: VehicleNeedType;
  description: string;
  cost: number;
  date: string;
  pic: string;
}
