import React, { useState } from 'react';
import { useAppContext } from '../../store';
import { Plus, Car, Fuel, Wrench, CheckCircle, Navigation, MapPin, AlertTriangle, Trash2 } from 'lucide-react';
import { VehicleNeedType } from '../../types';
import { motion } from 'motion/react';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

export const VehicleView: React.FC = () => {
  const { 
    vehicles, vehicleLogs, vehicleNeeds, technicians, currentUser,
    addVehicleItem, addVehicleLog, finishVehicleTrip, addVehicleNeed, updateVehicleStatus, removeVehicleItem
  } = useAppContext();
  const canManageVehicles = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  
  const [activeTab, setActiveTab] = useState<'daftar' | 'perjalanan' | 'kebutuhan'>('daftar');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isNeedModalOpen, setIsNeedModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Forms
  const [newVehicle, setNewVehicle] = useState({ name: '', plateNumber: '' });
  const [tripForm, setTripForm] = useState({ driver: '', purpose: '' });
  const [needForm, setNeedForm] = useState({ type: 'BBM' as VehicleNeedType, description: '', cost: 0, pic: '' });

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    addVehicleItem(newVehicle);
    setIsAddModalOpen(false);
    setNewVehicle({ name: '', plateNumber: '' });
  };

  const handleStartTrip = (e: React.FormEvent) => {
    e.preventDefault();
    addVehicleLog({
      vehicleId: selectedVehicleId,
      driver: tripForm.driver,
      purpose: tripForm.purpose,
    });
    setIsTripModalOpen(false);
    setTripForm({ driver: '', purpose: '' });
  };

  const handleAddNeed = (e: React.FormEvent) => {
    e.preventDefault();
    addVehicleNeed({
      vehicleId: selectedVehicleId,
      type: needForm.type,
      description: needForm.description,
      cost: Number(needForm.cost),
      pic: needForm.pic
    });
    
    // Auto update status if need is service
    if (needForm.type === 'Servis') {
      updateVehicleStatus(selectedVehicleId, 'Perbaikan');
    }
    
    setIsNeedModalOpen(false);
    setNeedForm({ type: 'BBM', description: '', cost: 0, pic: '' });
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Operasional Kendaraan</h2>
        {canManageVehicles && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto flex justify-center items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors shadow-sm"
          >
            <Plus size={18} className="mr-2" />
            Kendaraan Baru
          </button>
        )}
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto hide-scrollbar">
        <button
          className={`whitespace-nowrap px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'daftar' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('daftar')}
        >
          Armada
          {activeTab === 'daftar' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />}
        </button>
        <button
          className={`whitespace-nowrap px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'perjalanan' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('perjalanan')}
        >
          Riwayat Perjalanan
          {activeTab === 'perjalanan' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />}
        </button>
        <button
          className={`whitespace-nowrap px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'kebutuhan' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('kebutuhan')}
        >
          Catatan Kebutuhan
          {activeTab === 'kebutuhan' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />}
        </button>
      </div>

      {activeTab === 'daftar' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.map(vehicle => {
            const activeTrip = vehicleLogs.find(l => l.vehicleId === vehicle.id && l.status === 'JALAN');
            
            return (
              <div key={vehicle.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                        <Car size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg leading-tight">{vehicle.name}</h3>
                        <p className="text-slate-500 font-mono text-sm mt-1 uppercase tracking-wider">{vehicle.plateNumber}</p>
                      </div>
                    </div>
                    {currentUser?.role === 'superadmin' && (
                      <button
                        onClick={() => setItemToDelete(vehicle.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Kendaraan"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${
                      vehicle.status === 'Tersedia' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      vehicle.status === 'Sedang Digunakan' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {vehicle.status === 'Tersedia' && <CheckCircle size={12} className="mr-1.5" />}
                      {vehicle.status === 'Sedang Digunakan' && <Navigation size={12} className="mr-1.5" />}
                      {vehicle.status === 'Perbaikan' && <Wrench size={12} className="mr-1.5" />}
                      {vehicle.status}
                    </span>
                  </div>

                  {activeTrip && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                      <div className="flex items-center text-slate-700 mb-1">
                        <span className="font-medium">{activeTrip.driver}</span>
                      </div>
                      <div className="flex items-start text-slate-500 text-xs">
                        <MapPin size={12} className="mr-1 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{activeTrip.purpose}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-slate-50 p-4 border-t border-slate-100 grid grid-cols-2 gap-2 mt-auto">
                  {vehicle.status === 'Tersedia' && (
                    canManageVehicles ? (
                      <>
                        <button 
                          onClick={() => { setSelectedVehicleId(vehicle.id); setIsTripModalOpen(true); }}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors flex justify-center items-center"
                        >
                          <Navigation size={14} className="mr-1.5" /> Pakai
                        </button>
                        <button 
                          onClick={() => { setSelectedVehicleId(vehicle.id); setIsNeedModalOpen(true); }}
                          className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors flex justify-center items-center"
                        >
                          <Fuel size={14} className="mr-1.5" /> Catat Kebutuhan
                        </button>
                      </>
                    ) : (
                      <div className="col-span-2 px-3 py-2 bg-slate-100 text-slate-500 text-center text-xs font-medium rounded-lg">Hanya lihat</div>
                    )
                  )}
                  {vehicle.status === 'Sedang Digunakan' && canManageVehicles && (
                    <button 
                      onClick={() => activeTrip && finishVehicleTrip(activeTrip.id)}
                      className="col-span-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors flex justify-center items-center"
                    >
                      <CheckCircle size={14} className="mr-1.5" /> Selesaikan Perjalanan
                    </button>
                  )}
                  {vehicle.status === 'Perbaikan' && canManageVehicles && (
                    <button 
                      onClick={() => updateVehicleStatus(vehicle.id, 'Tersedia')}
                      className="col-span-2 px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 text-xs font-medium rounded-lg transition-colors flex justify-center items-center"
                    >
                      <CheckCircle size={14} className="mr-1.5" /> Tandai Selesai Perbaikan
                    </button>
                  )}
                  {!canManageVehicles && vehicle.status !== 'Tersedia' && (
                    <div className="col-span-2 px-3 py-2 bg-slate-100 text-slate-500 text-center text-xs font-medium rounded-lg">Hanya lihat</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'perjalanan' && (
         <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-4 font-semibold text-sm">Kendaraan</th>
                <th className="p-4 font-semibold text-sm">Supir / Teknisi</th>
                <th className="p-4 font-semibold text-sm">Tujuan & Keperluan</th>
                <th className="p-4 font-semibold text-sm">Berangkat</th>
                <th className="p-4 font-semibold text-sm">Kembali</th>
                <th className="p-4 font-semibold text-sm">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicleLogs.map(log => {
                const vehicle = vehicles.find(v => v.id === log.vehicleId);
                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-slate-800">{vehicle?.name}</p>
                      <p className="text-xs font-mono text-slate-500">{vehicle?.plateNumber}</p>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{log.driver}</td>
                    <td className="p-4 text-sm text-slate-600 max-w-[200px] truncate" title={log.purpose}>{log.purpose}</td>
                    <td className="p-4 text-sm text-slate-600">{new Date(log.startDate).toLocaleString('id-ID')}</td>
                    <td className="p-4 text-sm text-slate-600">{log.endDate ? new Date(log.endDate).toLocaleString('id-ID') : '-'}</td>
                    <td className="p-4">
                      {log.status === 'JALAN' ? (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">Berjalan</span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">Selesai</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {vehicleLogs.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Belum ada riwayat perjalanan</td></tr>
              )}
            </tbody>
          </table>
          </div>
         </div>
      )}

      {activeTab === 'kebutuhan' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-4 font-semibold text-sm">Tanggal</th>
                <th className="p-4 font-semibold text-sm">Kendaraan</th>
                <th className="p-4 font-semibold text-sm">Jenis Kebutuhan</th>
                <th className="p-4 font-semibold text-sm">Keterangan</th>
                <th className="p-4 font-semibold text-sm">Teknisi / Penanggung Jawab</th>
                <th className="p-4 font-semibold text-sm text-right">Biaya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicleNeeds.map(need => {
                const vehicle = vehicles.find(v => v.id === need.vehicleId);
                return (
                  <tr key={need.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm text-slate-600">{new Date(need.date).toLocaleDateString('id-ID')}</td>
                    <td className="p-4 font-medium text-slate-800">{vehicle?.name} <span className="text-xs font-mono text-slate-500 block">{vehicle?.plateNumber}</span></td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        need.type === 'BBM' ? 'bg-amber-100 text-amber-800' :
                        need.type === 'Servis' ? 'bg-red-100 text-red-800' :
                        need.type === 'Suku Cadang' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {need.type}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600 max-w-[200px] truncate" title={need.description}>{need.description}</td>
                    <td className="p-4 text-sm font-medium text-slate-700">{need.pic || '-'}</td>
                    <td className="p-4 font-medium text-slate-800 text-right">{formatRupiah(need.cost)}</td>
                  </tr>
                );
              })}
              {vehicleNeeds.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Belum ada catatan kebutuhan</td></tr>
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
          if (itemToDelete) removeVehicleItem(itemToDelete);
        }}
        title="Hapus Kendaraan"
      />


      {/* Modals Implementation (Add Vehicle, Start Trip, Add Need) */}
      
      {/* Add Vehicle Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4 pointer-events-none">
          <motion.div 
            drag 
            dragMomentum={false}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden pointer-events-auto"
          >
            <div className="p-6 border-b border-slate-100 cursor-move bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Tambah Kendaraan</h3>
            </div>
            <form onSubmit={handleAddVehicle} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama / Jenis Kendaraan</label>
                <input required type="text" value={newVehicle.name} onChange={e => setNewVehicle({...newVehicle, name: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" placeholder="Mis: Toyota Hilux" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Plat Nomor</label>
                <input required type="text" value={newVehicle.plateNumber} onChange={e => setNewVehicle({...newVehicle, plateNumber: e.target.value.toUpperCase()})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none uppercase" placeholder="B 1234 CD" />
              </div>
              <div className="pt-4 flex space-x-3 justify-end">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">Simpan</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Start Trip Modal */}
      {isTripModalOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4 pointer-events-none">
          <motion.div 
            drag 
            dragMomentum={false}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden pointer-events-auto"
          >
            <div className="p-6 border-b border-slate-100 cursor-move bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Mulai Perjalanan</h3>
            </div>
            <form onSubmit={handleStartTrip} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-4">
                <span className="text-sm text-slate-500">Kendaraan:</span>
                <p className="font-semibold text-slate-800">{vehicles.find(v => v.id === selectedVehicleId)?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Supir / Teknisi</label>
                <select 
                  required 
                  value={tripForm.driver} 
                  onChange={e => setTripForm({...tripForm, driver: e.target.value})} 
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="" disabled>Pilih Teknisi</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.name}>{t.name} - {t.role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tujuan & Keperluan</label>
                <textarea required rows={2} value={tripForm.purpose} onChange={e => setTripForm({...tripForm, purpose: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" placeholder="Kirim barang semen ke proyek A..." />
              </div>
              <div className="pt-4 flex space-x-3 justify-end">
                <button type="button" onClick={() => setIsTripModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Catat Keberangkatan</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Need Modal */}
      {isNeedModalOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4 pointer-events-none">
          <motion.div 
            drag 
            dragMomentum={false}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden pointer-events-auto"
          >
            <div className="p-6 border-b border-slate-100 cursor-move bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Catat Kebutuhan / Pengeluaran</h3>
            </div>
            <form onSubmit={handleAddNeed} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-4">
                <span className="text-sm text-slate-500">Kendaraan:</span>
                <p className="font-semibold text-slate-800">{vehicles.find(v => v.id === selectedVehicleId)?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Kebutuhan</label>
                <select value={needForm.type} onChange={e => setNeedForm({...needForm, type: e.target.value as VehicleNeedType})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none">
                  <option value="BBM">BBM / Bensin</option>
                  <option value="Servis">Servis / Perbaikan</option>
                  <option value="Suku Cadang">Suku Cadang / Ganti Oli</option>
                  <option value="Lainnya">Lainnya (Cuci, Tol, Parkir)</option>
                </select>
                {needForm.type === 'Servis' && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center"><AlertTriangle size={12} className="mr-1"/> Status kendaraan akan otomatis berubah menjadi "Perbaikan"</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Teknisi / Penanggung Jawab</label>
                <select 
                  required 
                  value={needForm.pic} 
                  onChange={e => setNeedForm({...needForm, pic: e.target.value})} 
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                >
                  <option value="" disabled>Pilih Teknisi</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.name}>{t.name} - {t.role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan Detail</label>
                <input required type="text" value={needForm.description} onChange={e => setNeedForm({...needForm, description: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" placeholder="Isi solar 20L / Ganti kampas rem" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Biaya (Rp)</label>
                <input required type="number" min="0" value={needForm.cost} onChange={e => setNeedForm({...needForm, cost: Number(e.target.value)})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" />
              </div>
              <div className="pt-4 flex space-x-3 justify-end">
                <button type="button" onClick={() => setIsNeedModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">Simpan Catatan</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};
