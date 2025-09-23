import React, { useState } from 'react';
import { Package, Filter, Search, Eye, Edit, Trash2, LogOut, Calendar, User } from 'lucide-react';
import { CargoRecord, User as UserType, CARRIER_COMPANIES } from '../types';

interface AdminDashboardProps {
  user: UserType;
  onLogout: () => void;
  onViewRecord: (record: CargoRecord) => void;
  records: CargoRecord[];
  users: User[];
  onUpdateRecord: (id: string, updates: Partial<Omit<CargoRecord, 'id' | 'createdBy' | 'createdByName' | 'createdAt'>>) => void;
  onDeleteRecord: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout, onViewRecord, records, users, onUpdateRecord, onDeleteRecord }) => {
  const [selectedRecord, setSelectedRecord] = useState<CargoRecord | null>(null);
  const [filters, setFilters] = useState({
    carrierCompany: '',
    user: '',
    search: '',
  });

  const getCarrierCompanyLabel = (carrierCompany: string) => {
    const company = CARRIER_COMPANIES.find(c => c.value === carrierCompany);
    return company ? company.label : carrierCompany;
  };

  const filteredRecords = records.filter(record => {
    return (
      (filters.carrierCompany === '' || record.carrierCompany === filters.carrierCompany) &&
      (filters.user === '' || record.createdBy === filters.user) &&
      (filters.search === '' || 
       record.barcodeNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
       record.exitNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
       record.senderCompany.toLowerCase().includes(filters.search.toLowerCase()) ||
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
            <button
              onClick={onLogout}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-1" />
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Toplam Kargo</p>
                <p className="text-2xl font-bold text-gray-900">{records.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Farklı Taşıyıcı</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(records.map(r => r.carrierCompany)).size}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Farklı Gönderici</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(records.map(r => r.senderCompany)).size}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Bu Ay</p>
                <p className="text-2xl font-bold text-gray-900">
                  {records.filter(r => new Date(r.createdAt).getMonth() === new Date().getMonth()).length}
                </p>
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
                  placeholder="Barkod, çıkış no, gönderici..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taşıyıcı Firma</label>
              <select
                value={filters.carrierCompany}
                onChange={(e) => setFilters({ ...filters, carrierCompany: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Tümü</option>
                {CARRIER_COMPANIES.map(company => (
                  <option key={company.value} value={company.value}>{company.label}</option>
                ))}
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
                {users.filter(u => u.role === 'staff').map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ carrierCompany: '', user: '', search: '' })}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg transition-colors"
              >
                Temizle
              </button>
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Tüm Kayıtlar ({filteredRecords.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Barkod No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Çıkış No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taşıyıcı Firma
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gönderici Firma
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Oluşturan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.barcodeNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.exitNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {getCarrierCompanyLabel(record.carrierCompany)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {record.senderCompany}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {record.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{record.createdByName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(record.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onViewRecord(record)}
                          className="text-teal-600 hover:text-teal-900 p-1 rounded hover:bg-teal-50"
                          title="Görüntüle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteRecord(record.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
};