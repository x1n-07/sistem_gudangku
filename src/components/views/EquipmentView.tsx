import React, { useState } from 'react';
import { useAppContext } from '../../store';
import { Plus, PenTool, CheckCircle, AlertTriangle, XCircle, UserCheck, ArrowRightLeft, Trash2 } from 'lucide-react';
import { EquipmentCondition } from '../../types';
import { motion } from 'motion/react';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

export const EquipmentView: React.FC = () => {
  const { equipment, equipmentLogs, technicians, addEquipmentItem, addEquipmentLog, updateEquipmentCondition, removeEquipmentItem, currentUser } = useAppContext();
  const [activeTab, setActiveTab] = useState<'daftar' | 'riwayat'>('daftar');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedEqId, setSelectedEqId] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newItem, setNewItem] = useState({ name: '', condition: 'Baik' as EquipmentCondition });
  const [logForm, setLogForm] = useState({ action: 'PINJAM' as 'PINJAM' | 'KEMBALI', user: '', condition: 'Baik' as EquipmentCondition, notes: '' });

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'Baik': return <CheckCircle size={16} className="text-green-500 mr-1" />;
      case 'Rusak Ringan': return <AlertTriangle size={16} className="text-amber-500 mr-1" />;
      case 'Rusak Berat': return <XCircle size={16} className="text-red-500 mr-1" />;
      default: return null;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Baik': return 'bg-green-50 text-green-700 border-green-200';
      case 'Rusak Ringan': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Rusak Berat': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    addEquipmentItem(newItem);
    setIsAddModalOpen(false);
    setNewItem({ name: '', condition: 'Baik' });
  };

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    
    // When returning, use the user who borrowed it, or if it's changing condition mid-way
    let finalUser = logForm.user;
    if (logForm.action === 'KEMBALI') {
      const eq = equipment.find(e => e.id === selectedEqId);
      finalUser = eq?.currentUser || logForm.user;
    }

    addEquipmentLog({
      equipmentId: selectedEqId,
      action: logForm.action,
      user: finalUser,
      condition: logForm.condition,
      notes: logForm.notes
    });
    setIsLogModalOpen(false);
    setLogForm({ action: 'PINJAM', user: '', condition: 'Baik', notes: '' });
  };

  const handleOpenLogModal = (eqId: string, action: 'PINJAM' | 'KEMBALI') => {
    const eq = equipment.find(e => e.id === eqId);
    setSelectedEqId(eqId);
    setLogForm(prev => ({
      ...prev,
      action,
      condition: eq?.condition || 'Baik',
      user: action === 'KEMBALI' ? (eq?.currentUser || '') : ''
    }));
    setIsLogModalOpen(true);
  };

  const filteredEquipment = equipment.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Manajemen Alat & Inventaris</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto flex justify-center items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Alat Baru
        </button>
      </div>

      <div className="flex flex-col md:flex-row border-b border-slate-200 justify-between items-start md:items-center gap-4">
        <div className="flex w-full md:w-auto overflow-x-auto hide-scrollbar">
          <button
            className={`whitespace-nowrap px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'daftar' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('daftar')}
          >
            Daftar Alat
            {activeTab === 'daftar' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
          </button>
          <button
            className={`whitespace-nowrap px-6 py-3 font-medium text-sm transition-colors relative flex items-center ${activeTab === 'riwayat' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('riwayat')}
          >
            Riwayat Penggunaan
            {activeTab === 'riwayat' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
          </button>
        </div>
        {activeTab === 'daftar' && (
          <div className="w-full md:w-auto pb-2">
            <input
              type="text"
              placeholder="Cari nama alat..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm w-full md:w-64"
            />
          </div>
        )}
      </div>

      {activeTab === 'daftar' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipment.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                    <PenTool size={20} />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-lg">{item.name}</h3>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  item.status === 'Tersedia' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {item.status}
                </span>
              </div>
              
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Kondisi:</span>
                  <span className={`flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getConditionColor(item.condition)}`}>
                    {getConditionIcon(item.condition)}
                    {item.condition}
                  </span>
                </div>
                
                {item.status === 'Dipinjam' && (
                  <div className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-slate-500 flex items-center"><UserCheck size={14} className="mr-1"/> Teknisi/Peminjam:</span>
                    <span className="font-medium text-slate-700">{item.currentUser}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                {currentUser?.role === 'superadmin' && (
                  <button
                    onClick={() => setItemToDelete(item.id)}
                    className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    title="Hapus Alat"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                {item.status === 'Tersedia' ? (
                  <button 
                    onClick={() => handleOpenLogModal(item.id, 'PINJAM')}
                    disabled={item.condition === 'Rusak Berat'}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Pinjam Alat
                  </button>
                ) : (
                  <button 
                    onClick={() => handleOpenLogModal(item.id, 'KEMBALI')}
                    className="flex-1 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors"
                  >
                    Kembalikan Alat
                  </button>
                )}
              </div>
            </div>
          ))}
          {equipment.length === 0 && (
            <div className="col-span-full p-8 text-center text-slate-500 bg-white border border-slate-200 rounded-xl">
              Belum ada data alat
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-4 font-semibold text-sm">Waktu</th>
                <th className="p-4 font-semibold text-sm">Alat</th>
                <th className="p-4 font-semibold text-sm">Aksi</th>
                <th className="p-4 font-semibold text-sm">Teknisi / Pengguna</th>
                <th className="p-4 font-semibold text-sm">Kondisi Laporan</th>
                <th className="p-4 font-semibold text-sm">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {equipmentLogs.map(log => {
                const eq = equipment.find(e => e.id === log.equipmentId);
                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm text-slate-600">{new Date(log.date).toLocaleString('id-ID')}</td>
                    <td className="p-4 font-medium text-slate-800">{eq?.name || 'Alat Terhapus'}</td>
                    <td className="p-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center w-fit ${
                        log.action === 'PINJAM' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        <ArrowRightLeft size={12} className="mr-1" />
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{log.user}</td>
                    <td className="p-4">
                      <span className={`flex items-center text-xs font-medium w-fit px-2 py-0.5 rounded border ${getConditionColor(log.condition)}`}>
                        {getConditionIcon(log.condition)} {log.condition}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600 max-w-[200px] truncate" title={log.notes}>{log.notes || '-'}</td>
                  </tr>
                );
              })}
              {equipmentLogs.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Belum ada riwayat penggunaan alat</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) removeEquipmentItem(itemToDelete);
        }}
        title="Hapus Alat Inventaris"
      />


      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4 pointer-events-none">
          <motion.div 
            drag 
            dragMomentum={false}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden pointer-events-auto"
          >
            <div className="p-6 border-b border-slate-100 cursor-move bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Tambah Alat Baru</h3>
            </div>
            <form onSubmit={handleAddItem} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Alat</label>
                <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kondisi Awal</label>
                <select 
                  value={newItem.condition} 
                  onChange={e => setNewItem({...newItem, condition: e.target.value as EquipmentCondition})} 
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="Baik">Baik</option>
                  <option value="Rusak Ringan">Rusak Ringan</option>
                  <option value="Rusak Berat">Rusak Berat</option>
                </select>
              </div>
              <div className="pt-4 flex space-x-3 justify-end">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Simpan</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Action/Log Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4 pointer-events-none">
          <motion.div 
            drag 
            dragMomentum={false}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden pointer-events-auto"
          >
            <div className="p-6 border-b border-slate-100 cursor-move bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">
                {logForm.action === 'PINJAM' ? 'Pinjam Alat' : 'Pengembalian Alat'}
              </h3>
            </div>
            <form onSubmit={handleLog} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-4">
                <span className="text-sm text-slate-500">Alat:</span>
                <p className="font-semibold text-slate-800">{equipment.find(e => e.id === selectedEqId)?.name}</p>
              </div>
              
              {logForm.action === 'PINJAM' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Teknisi / Peminjam</label>
                  <select 
                    required 
                    value={logForm.user} 
                    onChange={e => setLogForm({...logForm, user: e.target.value})} 
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="" disabled>Pilih Teknisi</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.name}>{t.name} - {t.role}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dikembalikan Oleh (Teknisi)</label>
                  <input required type="text" disabled value={logForm.user} className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-600 cursor-not-allowed" />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kondisi (Laporkan jika berubah)</label>
                <select 
                  value={logForm.condition} 
                  onChange={e => setLogForm({...logForm, condition: e.target.value as EquipmentCondition})} 
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="Baik">Baik</option>
                  <option value="Rusak Ringan">Rusak Ringan</option>
                  <option value="Rusak Berat">Rusak Berat</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea 
                  rows={2}
                  value={logForm.notes} 
                  onChange={e => setLogForm({...logForm, notes: e.target.value})} 
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" 
                  placeholder={logForm.action === 'KEMBALI' ? 'Cth: Sudah dibersihkan, ada lecet sedikit' : 'Tujuan penggunaan...'}
                />
              </div>
              
              <div className="pt-4 flex space-x-3 justify-end">
                <button type="button" onClick={() => setIsLogModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  Konfirmasi {logForm.action === 'PINJAM' ? 'Pinjam' : 'Kembali'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
