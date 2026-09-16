import React from 'react';
import { useAppContext } from '../../store';
import { Download, FileSpreadsheet, Package, Wrench, Truck, Users } from 'lucide-react';

export const ExportView: React.FC = () => {
  const { 
    goods, goodsTransactions, 
    equipment, equipmentLogs, 
    vehicles, vehicleLogs, vehicleNeeds,
    technicians 
  } = useAppContext();

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const csvRows = data.map(row => 
      Object.values(row).map(value => {
        if (value === null || value === undefined) return '""';
        const stringValue = String(value);
        return `"${stringValue.replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csvString = [headers, ...csvRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportGoods = () => {
    const data = goods.map(g => ({
      'ID Barang': g.id,
      'Nama Barang': g.name,
      'Kategori': g.category,
      'Stok Saat Ini': g.stock,
      'Batas Minimum': g.minStock,
      'Satuan': g.unit
    }));
    downloadCSV(data, 'data_stok_barang.csv');
  };

  const handleExportGoodsTx = () => {
    const data = goodsTransactions.map(tx => {
      const item = goods.find(g => g.id === tx.itemId);
      return {
        'ID Transaksi': tx.id,
        'Tanggal': new Date(tx.date).toLocaleString('id-ID'),
        'Nama Barang': item?.name || 'Barang Terhapus',
        'Tipe Transaksi': tx.type === 'IN' ? 'Masuk' : 'Keluar',
        'Jumlah': tx.quantity,
        'Satuan': item?.unit || '-',
        'Penanggung Jawab': tx.pic || '-',
        'Keterangan': tx.notes
      };
    });
    downloadCSV(data, 'riwayat_transaksi_barang.csv');
  };

  const handleExportEquipment = () => {
    const data = equipment.map(e => ({
      'ID Alat': e.id,
      'Nama Alat': e.name,
      'Kondisi': e.condition,
      'Status': e.status,
      'Peminjam Saat Ini': e.currentUser || '-'
    }));
    downloadCSV(data, 'data_inventaris_alat.csv');
  };

  const handleExportEquipmentLogs = () => {
    const data = equipmentLogs.map(log => {
      const eq = equipment.find(e => e.id === log.equipmentId);
      return {
        'ID Log': log.id,
        'Tanggal': new Date(log.date).toLocaleString('id-ID'),
        'Nama Alat': eq?.name || 'Alat Terhapus',
        'Aksi': log.action,
        'Teknisi / Pengguna': log.user,
        'Kondisi': log.condition,
        'Catatan': log.notes
      };
    });
    downloadCSV(data, 'riwayat_penggunaan_alat.csv');
  };

  const handleExportVehicles = () => {
    const data = vehicles.map(v => ({
      'ID Kendaraan': v.id,
      'Nama Kendaraan': v.name,
      'Plat Nomor': v.plateNumber,
      'Status': v.status
    }));
    downloadCSV(data, 'data_kendaraan.csv');
  };

  const handleExportVehicleLogs = () => {
    const data = vehicleLogs.map(log => {
      const v = vehicles.find(veh => veh.id === log.vehicleId);
      return {
        'ID Log': log.id,
        'Nama Kendaraan': v?.name || 'Kendaraan Terhapus',
        'Plat Nomor': v?.plateNumber || '-',
        'Supir / Teknisi': log.driver,
        'Keperluan': log.purpose,
        'Waktu Berangkat': new Date(log.startDate).toLocaleString('id-ID'),
        'Waktu Selesai': log.endDate ? new Date(log.endDate).toLocaleString('id-ID') : '-',
        'Status': log.status
      };
    });
    downloadCSV(data, 'riwayat_perjalanan_kendaraan.csv');
  };

  const handleExportVehicleNeeds = () => {
    const data = vehicleNeeds.map(need => {
      const v = vehicles.find(veh => veh.id === need.vehicleId);
      return {
        'ID Catatan': need.id,
        'Tanggal': new Date(need.date).toLocaleDateString('id-ID'),
        'Nama Kendaraan': v?.name || 'Kendaraan Terhapus',
        'Plat Nomor': v?.plateNumber || '-',
        'Jenis Kebutuhan': need.type,
        'Keterangan': need.description,
        'Teknisi / Penanggung Jawab': need.pic || '-',
        'Biaya (Rp)': need.cost
      };
    });
    downloadCSV(data, 'catatan_kebutuhan_kendaraan.csv');
  };

  const handleExportTechnicians = () => {
    const data = technicians.map(t => ({
      'ID Teknisi': t.id,
      'Nama': t.name,
      'Peran / Posisi': t.role,
      'No. Handphone': t.phone
    }));
    downloadCSV(data, 'data_teknisi.csv');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Ekspor Data (CSV)</h2>
        <p className="text-slate-500 mt-1">Unduh data sistem ke dalam format CSV yang dapat dibuka di Excel atau Spreadsheet lainnya.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        
        {/* Stok Barang Export */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start space-x-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Package size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Stok Barang</h3>
              <p className="text-sm text-slate-500 mt-1">Data master barang dan riwayat pergerakan (masuk/keluar).</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-slate-100">
            <button onClick={handleExportGoods} className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium">
              <FileSpreadsheet size={16} className="mr-2" /> Data Stok ({goods.length})
            </button>
            <button onClick={handleExportGoodsTx} className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium">
              <FileSpreadsheet size={16} className="mr-2" /> Riwayat ({goodsTransactions.length})
            </button>
          </div>
        </div>

        {/* Alat Export */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start space-x-4 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Wrench size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Inventaris Alat</h3>
              <p className="text-sm text-slate-500 mt-1">Data master alat dan riwayat pinjam/kembali oleh teknisi.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-slate-100">
            <button onClick={handleExportEquipment} className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors text-sm font-medium">
              <FileSpreadsheet size={16} className="mr-2" /> Data Alat ({equipment.length})
            </button>
            <button onClick={handleExportEquipmentLogs} className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors text-sm font-medium">
              <FileSpreadsheet size={16} className="mr-2" /> Riwayat ({equipmentLogs.length})
            </button>
          </div>
        </div>

        {/* Kendaraan Export */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start space-x-4 mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Truck size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Kendaraan</h3>
              <p className="text-sm text-slate-500 mt-1">Data master, riwayat perjalanan, dan catatan kebutuhan (BBM/Servis).</p>
            </div>
          </div>
          <div className="flex flex-col space-y-2 mt-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={handleExportVehicles} className="flex-1 flex items-center justify-center px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors text-sm font-medium">
                <FileSpreadsheet size={16} className="mr-2" /> Data Armada ({vehicles.length})
              </button>
              <button onClick={handleExportVehicleLogs} className="flex-1 flex items-center justify-center px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors text-sm font-medium">
                <FileSpreadsheet size={16} className="mr-2" /> Perjalanan ({vehicleLogs.length})
              </button>
            </div>
            <button onClick={handleExportVehicleNeeds} className="w-full flex items-center justify-center px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors text-sm font-medium">
              <FileSpreadsheet size={16} className="mr-2" /> Catatan Kebutuhan & Biaya ({vehicleNeeds.length})
            </button>
          </div>
        </div>

        {/* Teknisi Export */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start space-x-4 mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Teknisi</h3>
              <p className="text-sm text-slate-500 mt-1">Data daftar nama beserta peran dan kontak yang dapat dihubungi.</p>
            </div>
          </div>
          <div className="flex space-x-3 mt-4 pt-4 border-t border-slate-100">
            <button onClick={handleExportTechnicians} className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors text-sm font-medium">
              <Download size={16} className="mr-2" /> Unduh Data Teknisi ({technicians.length})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
