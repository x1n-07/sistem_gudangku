import React, { useState } from 'react';
import { useAppContext } from '../../store';
import { Plus, Trash2, Users } from 'lucide-react';
import { motion } from 'motion/react';

export const TechnicianView: React.FC = () => {
  const { technicians, addTechnician, removeTechnician } = useAppContext();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTech, setNewTech] = useState({ name: '', role: '', phone: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addTechnician(newTech);
    setIsAddModalOpen(false);
    setNewTech({ name: '', role: '', phone: '' });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Daftar Teknisi</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto flex justify-center items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Tambah Teknisi
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <th className="p-4 font-semibold text-sm">Nama Teknisi</th>
              <th className="p-4 font-semibold text-sm">Peran / Posisi</th>
              <th className="p-4 font-semibold text-sm">No. Handphone</th>
              <th className="p-4 font-semibold text-sm text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {technicians.map(tech => (
              <tr key={tech.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mr-3 font-bold text-sm">
                      {tech.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-800">{tech.name}</span>
                  </div>
                </td>
                <td className="p-4 text-slate-600">{tech.role}</td>
                <td className="p-4 text-slate-600">{tech.phone}</td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => removeTechnician(tech.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Hapus Teknisi"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {technicians.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500 flex flex-col items-center">
                <Users size={48} className="text-slate-300 mb-2" />
                Belum ada data teknisi
              </td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4 pointer-events-none">
          <motion.div 
            drag 
            dragMomentum={false}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden pointer-events-auto"
          >
            <div className="p-6 border-b border-slate-100 cursor-move bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Tambah Teknisi Baru</h3>
            </div>
            <form onSubmit={handleAdd} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                <input required type="text" value={newTech.name} onChange={e => setNewTech({...newTech, name: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none" placeholder="Mis: Budi Santoso" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Peran / Posisi</label>
                <input required type="text" value={newTech.role} onChange={e => setNewTech({...newTech, role: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none" placeholder="Mis: Teknisi Lapangan" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">No. Handphone</label>
                <input required type="text" value={newTech.phone} onChange={e => setNewTech({...newTech, phone: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none" placeholder="Mis: 08123456789" />
              </div>
              <div className="pt-4 flex space-x-3 justify-end">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">Simpan Data</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
