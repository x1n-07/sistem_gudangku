const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(path: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export const apiClient = {
  async getAllData() {
    return request('/api/all-data');
  },

  // COMPANIES
  async addCompany(company: any) {
    return request('/api/companies', {
      method: 'POST',
      body: JSON.stringify(company),
    });
  },
  async updateCompany(id: string, updates: any) {
    return request(`/api/companies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
  async removeCompany(id: string) {
    return request(`/api/companies/${id}`, {
      method: 'DELETE',
    });
  },

  // USERS
  async addUser(user: any) {
    return request('/api/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },
  async updateUser(id: string, updates: any) {
    return request(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
  async removeUser(id: string) {
    return request(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },

  // GOODS
  async addGoodsItem(item: any) {
    return request('/api/goods', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },
  async updateGoodsItem(id: string, updates: any) {
    return request(`/api/goods/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
  async removeGoodsItem(id: string) {
    return request(`/api/goods/${id}`, {
      method: 'DELETE',
    });
  },

  // GOODS TRANSACTIONS
  async addGoodsTransaction(tx: any) {
    return request('/api/goods-transactions', {
      method: 'POST',
      body: JSON.stringify(tx),
    });
  },

  // EQUIPMENT
  async addEquipmentItem(item: any) {
    return request('/api/equipment', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },
  async updateEquipmentItem(id: string, updates: any) {
    return request(`/api/equipment/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
  async removeEquipmentItem(id: string) {
    return request(`/api/equipment/${id}`, {
      method: 'DELETE',
    });
  },

  // EQUIPMENT LOGS
  async addEquipmentLog(log: any) {
    return request('/api/equipment-logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  },

  // VEHICLES
  async addVehicleItem(vehicle: any) {
    return request('/api/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicle),
    });
  },
  async updateVehicleItem(id: string, updates: any) {
    return request(`/api/vehicles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
  async removeVehicleItem(id: string) {
    return request(`/api/vehicles/${id}`, {
      method: 'DELETE',
    });
  },

  // VEHICLE LOGS
  async addVehicleLog(log: any) {
    return request('/api/vehicle-logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  },
  async updateVehicleLog(id: string, updates: any) {
    return request(`/api/vehicle-logs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // VEHICLE NEEDS
  async addVehicleNeed(need: any) {
    return request('/api/vehicle-needs', {
      method: 'POST',
      body: JSON.stringify(need),
    });
  },

  // TECHNICIANS
  async addTechnician(tech: any) {
    return request('/api/technicians', {
      method: 'POST',
      body: JSON.stringify(tech),
    });
  },
  async removeTechnician(id: string) {
    return request(`/api/technicians/${id}`, {
      method: 'DELETE',
    });
  },
};
