import React, { useState, useEffect } from 'react';
import { Package, Filter, Search, Eye, Edit, Trash2, LogOut, Calendar, User, X, Users, Database, Settings, FileEdit } from 'lucide-react';
import { CargoRecord, User as UserType, RecordStatus, CARRIER_COMPANIES } from '../types';
import { useRecords } from '../contexts/RecordsContext';
import { useUsers } from '../contexts/UsersContext';
import { UserManagement } from './UserManagement';

interface AdminDashboardProps {
  user: UserType;
  onLogout: () => void;
  onViewRecord: (record: CargoRecord) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout, onViewRecord }) => {
  const { records, updateRecord, updateRecordStatus, deleteRecord } = useRecords();
  const { users } = useUsers();
  const [selectedRecord, setSelectedRecord] = useState<CargoRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<CargoRecord | null>(null);
  const [statusUpdateRecord, setStatusUpdateRecord] = useState<CargoRecord | null>(null);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [editFormData, setEditFormData] = useState({
    barcodeNumber: '',
    exitNumber: '',
    carrierCompany: 'ptt' as 'ptt' | 'aras' | 'surat' | 'yurtici' | 'verar',
    senderCompany: '',
    recipientName: '',
    description: '',
  });
  const [statusFormData, setStatusFormData] = useState({
    status: 'open' as RecordStatus,
    resolutionNote: '',
    paymentNote: '',
    rejectionReason: '',
  });
  const [filters, setFilters] = useState({
    user: '',
    search: '',
    status: '',
  });

  // Debug: Kayıt sayısını kontrol et
  console.log('AdminDashboard: Toplam kayıt sayısı:', records.length);
  console.log('AdminDashboard: Kayıtlar:', records);

  const getStatusColor = (status: RecordStatus) => {
    switch (status) {
      case 'open': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getStatusText = (status: RecordStatus) => {
    switch (status) {
      case 'open': return 'Yeni Kayıt';
      case 'in_progress': return 'İşlemde';
      case 'resolved': return 'Çözüldü';
      case 'paid': return 'Ödendi';
      case 'rejected': return 'Reddedildi';
    }
  };

  const handleEditClick = (record: CargoRecord) => {
    setEditingRecord(record);
    setEditFormData({
      barcodeNumber: record.barcodeNumber,
      exitNumber: record.exitNumber,
      carrierCompany: record.carrierCompany,
      senderCompany: record.senderCompany,
      recipientName: record.recipientName,
      description: record.description,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecord) {
      updateRecord(editingRecord.id, {
        ...editFormData,
        updatedAt: new Date().toISOString(),
      });
      setEditingRecord(null);
      console.log('Kayıt güncellendi:', editingRecord.id);
    }
  };

  const handleEditCancel = () => {
    setEditingRecord(null);
    setEditFormData({
      barcodeNumber: '',
      exitNumber: '',
      carrierCompany: 'ptt',
      senderCompany: '',
      recipientName: '',
      description: '',
    });
  };

  const handleStatusUpdateClick = (record: CargoRecord) => {
    setStatusUpdateRecord(record);
    setStatusFormData({
      status: record.status,
      resolutionNote: record.resolutionNote || '',
      paymentNote: record.paymentNote || '',
      rejectionReason: record.rejectionReason || '',
    });
  };

  const handleStatusUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (statusUpdateRecord) {
      try {
        await updateRecordStatus(statusUpdateRecord.id, {
          status: statusFormData.status,
          resolutionNote: statusFormData.resolutionNote,
          paymentNote: statusFormData.paymentNote,
          rejectionReason: statusFormData.rejectionReason,
          updatedBy: user.id,
          updatedByName: user.name,
        });
        setStatusUpdateRecord(null);
        console.log('Durum güncellendi:', statusUpdateRecord.id);
      } catch (error) {
        console.error('Durum güncellenirken hata:', error);
      }
    }
  };

  const handleStatusUpdateCancel = () => {
    setStatusUpdateRecord(null);
    setStatusFormData({
      status: 'open',
      resolutionNote: '',
      paymentNote: '',
      rejectionReason: '',
    });
  };

  const handleDeleteRecord = async (record: CargoRecord) => {
    if (window.confirm(`"${record.barcodeNumber}" barkodlu kaydı silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteRecord(record.id);
        console.log('Kayıt silindi:', record.id);
      } catch (error) {
        console.error('Kayıt silinirken hata:', error);
        alert('Kayıt silinirken hata oluştu');
      }
    }
  };


  // Kayıt oluşturan kullanıcıları bul (unique createdBy değerleri)
  const usersWithRecords = React.useMemo(() => {
    const createdByIds = new Set(records.map(record => record.createdBy));
    return users.filter(user => createdByIds.has(user.id));
  }, [records, users]);

  const filteredRecords = records.filter(record => {
    return (
      (filters.user === '' || record.createdBy === filters.user) &&
      (filters.status === '' || record.status === filters.status) &&
      (filters.search === '' || 
       record.barcodeNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
       record.exitNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
       record.senderCompany.toLowerCase().includes(filters.search.toLowerCase()) ||
       record.recipientName.toLowerCase().includes(filters.search.toLowerCase()) ||
       record.description.toLowerCase().includes(filters.search.toLowerCase())
      )
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-8 w-8 text-teal-500" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">Yönetici Paneli</h1>
                <p className="text-sm text-gray-600">Hoşgeldin, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/tablo"
                className="flex items-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
              >
                <Database className="w-4 h-4 mr-2" />
                Veri Tablosu
              </a>
              <button
                onClick={() => setShowUserManagement(true)}
                className="flex items-center px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                <Users className="w-4 h-4 mr-2" />
                Kullanıcı Yönetimi
              </button>
              <button
                onClick={onLogout}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-1" />
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Package className="w-8 h-8 text-teal-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Sorunlu Kargo Kaydı</p>
                <p className="text-3xl font-bold text-gray-900">{records.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Filtreler</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Arama</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Barkod, çıkış no, firma, alıcı veya açıklama..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Tümü</option>
                <option value="open">Yeni Kayıt</option>
                <option value="in_progress">İşlemde</option>
                <option value="resolved">Çözüldü</option>
                <option value="paid">Ödendi</option>
                <option value="rejected">Reddedildi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı</label>
              <select
                value={filters.user}
                onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Tümü</option>
                {usersWithRecords.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ user: '', search: '', status: '' })}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg transition-colors"
              >
                Temizle
              </button>
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden w-full">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Tüm Kayıtlar ({filteredRecords.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Barkod No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Çıkış No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Taşıyıcı
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    Gönderici
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                    Alıcı
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-96">
                    Açıklama
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Durum
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Oluşturan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Tarih
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record, index) => (
                  <tr key={record.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.barcodeNumber}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.exitNumber}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {CARRIER_COMPANIES.find(c => c.value === record.carrierCompany)?.label}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900 truncate" title={record.senderCompany}>
                        {record.senderCompany}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900 truncate" title={record.recipientName}>
                        {record.recipientName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-md">
                        <div className="line-clamp-2 whitespace-pre-line break-words mb-1" title={record.description}>
                          {record.description.split('\n\n[')[0]}
                        </div>
                        {(record.resolutionNote || record.paymentNote || record.rejectionReason) && (
                          <div className="mt-1 pt-1 border-t border-gray-200">
                            {record.resolutionNote && (
                              <div className="text-xs text-green-700 mb-1">
                                <span className="font-semibold">Çözülme:</span> {record.resolutionNote}
                              </div>
                            )}
                            {record.paymentNote && (
                              <div className="text-xs text-emerald-700 mb-1">
                                <span className="font-semibold">Ödeme:</span> {record.paymentNote}
                              </div>
                            )}
                            {record.rejectionReason && (
                              <div className="text-xs text-red-700 mb-1">
                                <span className="font-semibold">Red:</span> {record.rejectionReason}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                        {getStatusText(record.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 truncate" title={record.createdByName}>
                          {record.createdByName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(record.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => onViewRecord(record)}
                          className="flex items-center text-teal-600 hover:text-teal-900 px-2 py-1 rounded hover:bg-teal-50 transition-colors text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Görüntüle
                        </button>
                        <button
                          onClick={() => handleStatusUpdateClick(record)}
                          className="flex items-center text-purple-600 hover:text-purple-900 px-2 py-1 rounded hover:bg-purple-50 transition-colors text-xs"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Durum Güncelle
                        </button>
                        <button
                          onClick={() => handleEditClick(record)}
                          className="flex items-center text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50 transition-colors text-xs"
                        >
                          <FileEdit className="w-3 h-3 mr-1" />
                          Kayıt Düzenle
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRecord(record);
                          }}
                          className="flex items-center text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50 transition-colors text-xs"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Kayıt bulunamadı</h3>
              <p className="mt-1 text-sm text-gray-500">Filtreleri değiştirmeyi deneyin.</p>
            </div>
          )}
        </div>
      </div>

      {/* Düzenleme Modalı */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Kayıt Düzenle</h2>
              <button
                onClick={handleEditCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taşıyıcı Firma (Kargo Şirketi) *
                  </label>
                  <select
                    value={editFormData.carrierCompany}
                    onChange={(e) => setEditFormData({ ...editFormData, carrierCompany: e.target.value as typeof editFormData.carrierCompany })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    {CARRIER_COMPANIES.map(company => (
                      <option key={company.value} value={company.value}>
                        {company.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gönderici Firma *
                  </label>
                  <input
                    type="text"
                    value={editFormData.senderCompany}
                    onChange={(e) => setEditFormData({ ...editFormData, senderCompany: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Firma adı giriniz"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alıcı Adı Soyadı *
                  </label>
                  <input
                    type="text"
                    value={editFormData.recipientName}
                    onChange={(e) => setEditFormData({ ...editFormData, recipientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Alıcı adı soyadı giriniz"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barkod Numarası *
                  </label>
                  <input
                    type="text"
                    value={editFormData.barcodeNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, barcodeNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Barkod numarası giriniz"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Çıkış Numarası *
                  </label>
                  <input
                    type="text"
                    value={editFormData.exitNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, exitNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Çıkış numarası giriniz"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Sorun detaylarını açıklayın..."
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={handleEditCancel}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Durum Güncelleme Modalı */}
      {statusUpdateRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Durum Güncelle</h2>
              <button
                onClick={handleStatusUpdateCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleStatusUpdateSubmit} className="p-6 space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Kayıt Bilgileri</h3>
                <p className="text-sm text-gray-600">
                  <strong>Barkod:</strong> {statusUpdateRecord.barcodeNumber} | 
                  <strong> Çıkış No:</strong> {statusUpdateRecord.exitNumber} | 
                  <strong> Firma:</strong> {statusUpdateRecord.senderCompany}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durum *
                </label>
                <select
                  value={statusFormData.status}
                  onChange={(e) => setStatusFormData({ ...statusFormData, status: e.target.value as RecordStatus })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="open">Yeni Kayıt</option>
                  <option value="in_progress">İşlemde</option>
                  <option value="resolved">Çözüldü</option>
                  <option value="paid">Ödendi</option>
                  <option value="rejected">Reddedildi</option>
                </select>
              </div>

              {statusFormData.status === 'resolved' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Çözülme Sebebi *
                  </label>
                  <textarea
                    value={statusFormData.resolutionNote}
                    onChange={(e) => setStatusFormData({ ...statusFormData, resolutionNote: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Sorunun nasıl çözüldüğünü açıklayın..."
                    required
                  />
                </div>
              )}

              {statusFormData.status === 'paid' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ödeme Açıklaması *
                  </label>
                  <textarea
                    value={statusFormData.paymentNote}
                    onChange={(e) => setStatusFormData({ ...statusFormData, paymentNote: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Ödeme detaylarını açıklayın (örn: 1000 TL ödendi, banka transferi ile...)"
                    required
                  />
                </div>
              )}

              {statusFormData.status === 'rejected' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reddedilme Sebebi *
                  </label>
                  <textarea
                    value={statusFormData.rejectionReason}
                    onChange={(e) => setStatusFormData({ ...statusFormData, rejectionReason: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Neden reddedildiğini açıklayın..."
                    required
                  />
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Durumu Güncelle
                </button>
                <button
                  type="button"
                  onClick={handleStatusUpdateCancel}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {showUserManagement && (
        <UserManagement onClose={() => setShowUserManagement(false)} />
      )}
    </div>
  );
};