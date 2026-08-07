import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../../store';
import { Plus, X, Building, User, Phone, Search, Trash2, Key } from 'lucide-react';
import { UserRole } from '../../types';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

export const UserManagementView: React.FC = () => {
  const { users, addUser, removeUser, currentUser } = useAppContext();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    company: '',
    contact: '',
    role: 'admin' as UserRole
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
      alert('Username sudah terdaftar!');
      return;
    }
    addUser(newUser);
    setIsAddModalOpen(false);
    setNewUser({ name: '', username: '', password: '', company: '', contact: '', role: 'admin' });
  };

  const filteredUsers = users.filter(user => 
    user.role === 'admin' && 
    (user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     user.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (currentUser?.role !== 'superadmin') {
    return (
      <div className="p-6 text-center text-slate-500">
        Anda tidak memiliki akses ke halaman ini.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Perusahaan / Cabang</h1>
          <p className="text-slate-500 mt-1">Kelola akses untuk admin perusahaan atau cabang baru.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto flex justify-center items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          <span>Tambah Akun Admin</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Cari admin, perusahaan, username..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          </div>
        </div>
        
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama PIC</th>
                <th className="px-6 py-4 font-semibold">Username</th>
                <th className="px-6 py-4 font-semibold">Perusahaan / Cabang</th>
                <th className="px-6 py-4 font-semibold">Kontak</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.username}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {user.company ? (
                        <span className="inline-flex items-center space-x-1">
                          <Building size={14} className="text-slate-400" />
                          <span>{user.company}</span>
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {user.contact ? (
                        <span className="inline-flex items-center space-x-1">
                          <Phone size={14} className="text-slate-400" />
                          <span>{user.contact}</span>
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setItemToDelete(user.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors inline-flex"
                        title="Hapus Akun"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data admin ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {itemToDelete && (
          <ConfirmDeleteModal 
            isOpen={!!itemToDelete}
            onClose={() => setItemToDelete(null)}
            onConfirm={() => {
              if (itemToDelete) removeUser(itemToDelete);
            }}
            title="Hapus Akun Admin"
          />
        )}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-lg flex items-center space-x-2">
                  <User className="text-blue-600" size={20} />
                  <span>Tambah Akun Admin / Perusahaan</span>
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Username Login</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input 
                        required 
                        type="text" 
                        value={newUser.username} 
                        onChange={e => setNewUser({...newUser, username: e.target.value})} 
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                        placeholder="Cth: admin_budi"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input 
                      required 
                      type="password" 
                      value={newUser.password} 
                      onChange={e => setNewUser({...newUser, password: e.target.value})} 
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama PIC (Penanggung Jawab)</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      required 
                      type="text" 
                      value={newUser.name} 
                      onChange={e => setNewUser({...newUser, name: e.target.value})} 
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                      placeholder="Cth: Budi Santoso"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Perusahaan / Cabang</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={newUser.company} 
                      onChange={e => setNewUser({...newUser, company: e.target.value})} 
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                      placeholder="Cth: PT Logistik Sejahtera / Cabang Jakarta"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kontak / No. Telepon</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={newUser.contact} 
                      onChange={e => setNewUser({...newUser, contact: e.target.value})} 
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                      placeholder="Cth: 08123456789"
                    />
                  </div>
                </div>

                <div className="pt-4 flex space-x-3 justify-end border-t border-slate-100">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Tambah Akun</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
