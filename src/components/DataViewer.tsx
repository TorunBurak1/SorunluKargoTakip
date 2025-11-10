import React, { useState, useEffect } from 'react';
import { Database, Users, Package, BarChart3, X, Download, RefreshCw, Calendar, User, Shield, UserCheck } from 'lucide-react';
import { apiService } from '../services/api';
import { User as UserType, CargoRecord } from '../services/api';

interface DataViewerProps {
  onClose: () => void;
}

interface AllData {
  users: UserType[];
  cargoRecords: CargoRecord[];
  summary: {
    totalUsers: number;
    totalCargoRecords: number;
    usersByRole: {
      admin: number;
      staff: number;
    };
    cargoRecordsByStatus: {
      open: number;
      in_progress: number;
      resolved: number;
      paid: number;
      rejected: number;
    };
  };
}

export const DataViewer: React.FC<DataViewerProps> = ({ onClose }) => {
  const [data, setData] = useState<AllData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'users' | 'cargo'>('summary');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const allData = await apiService.getAllData();
      setData(allData);
    } catch (err) {
      console.error('Veriler yüklenirken hata:', err);
      setError(err instanceof Error ? err.message : 'Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Açık';
      case 'in_progress': return 'İşlemde';
      case 'resolved': return 'Çözüldü';
      case 'paid': return 'Ödendi';
      case 'rejected': return 'Reddedildi';
      default: return status;
    }
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' 
      ? 'bg-purple-100 text-purple-800 border-purple-200' 
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getRoleText = (role: string) => {
    return role === 'admin' ? 'Yönetici' : 'Çalışan';
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? <Shield className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />;
  };

  const exportToCSV = () => {
    if (!data) return;

    let csvContent = '';
    
    if (activeTab === 'users') {
      csvContent = 'ID,Ad,E-posta,Rol,Oluşturulma Tarihi\n';
      data.users.forEach(user => {
        csvContent += `${user.id},${user.name},${user.email},${getRoleText(user.role)},${user.createdAt}\n`;
      });
    } else if (activeTab === 'cargo') {
      csvContent = 'ID,Barkod No,Çıkış No,Taşıyıcı,Gönderici,Alıcı,Durum,Oluşturan,Oluşturulma Tarihi\n';
      data.cargoRecords.forEach(record => {
        csvContent += `${record.id},${record.barcodeNumber},${record.exitNumber},${record.carrierCompany},${record.senderCompany},${record.recipientName},${getStatusText(record.status)},${record.createdByName},${record.createdAt}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTab === 'users' ? 'kullanicilar' : 'kargo_kayitlari'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <Database className="w-6 h-6 text-teal-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Veritabanı Verileri</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              className="flex items-center px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Yenile
            </button>
            {data && (
              <button
                onClick={exportToCSV}
                className="flex items-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV İndir
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
            </div>
          )}

          {/* Data Display */}
          {data && !loading && (
            <>
              {/* Tabs */}
              <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'summary' 
                      ? 'bg-white text-teal-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  Özet
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'users' 
                      ? 'bg-white text-teal-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Kullanıcılar ({data.summary.totalUsers})
                </button>
                <button
                  onClick={() => setActiveTab('cargo')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'cargo' 
                      ? 'bg-white text-teal-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Package className="w-4 h-4 inline mr-2" />
                  Kargo Kayıtları ({data.summary.totalCargoRecords})
                </button>
              </div>

              {/* Summary Tab */}
              {activeTab === 'summary' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg border p-6">
                      <div className="flex items-center">
                        <Users className="w-8 h-8 text-blue-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Toplam Kullanıcı</p>
                          <p className="text-2xl font-bold text-gray-900">{data.summary.totalUsers}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border p-6">
                      <div className="flex items-center">
                        <Package className="w-8 h-8 text-teal-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Toplam Kargo Kaydı</p>
                          <p className="text-2xl font-bold text-gray-900">{data.summary.totalCargoRecords}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border p-6">
                      <div className="flex items-center">
                        <Shield className="w-8 h-8 text-purple-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Yönetici</p>
                          <p className="text-2xl font-bold text-gray-900">{data.summary.usersByRole.admin}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border p-6">
                      <div className="flex items-center">
                        <UserCheck className="w-8 h-8 text-green-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Çalışan</p>
                          <p className="text-2xl font-bold text-gray-900">{data.summary.usersByRole.staff}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg border p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Kullanıcı Dağılımı</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Yönetici</span>
                          <span className="text-sm font-medium text-gray-900">{data.summary.usersByRole.admin}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Çalışan</span>
                          <span className="text-sm font-medium text-gray-900">{data.summary.usersByRole.staff}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Kargo Durum Dağılımı</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Açık</span>
                          <span className="text-sm font-medium text-gray-900">{data.summary.cargoRecordsByStatus.open}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">İşlemde</span>
                          <span className="text-sm font-medium text-gray-900">{data.summary.cargoRecordsByStatus.in_progress}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Çözüldü</span>
                          <span className="text-sm font-medium text-gray-900">{data.summary.cargoRecordsByStatus.resolved}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Ödendi</span>
                          <span className="text-sm font-medium text-gray-900">{data.summary.cargoRecordsByStatus.paid}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Reddedildi</span>
                          <span className="text-sm font-medium text-gray-900">{data.summary.cargoRecordsByStatus.rejected}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-posta</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oluşturulma Tarihi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.users.map((user, index) => (
                          <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{user.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <User className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-sm font-medium text-gray-900">{user.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                                {getRoleIcon(user.role)}
                                <span className="ml-1">{getRoleText(user.role)}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="w-4 h-4 mr-1" />
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '-'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Cargo Records Tab */}
              {activeTab === 'cargo' && (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barkod</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Çıkış No</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taşıyıcı</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gönderici</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alıcı</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oluşturan</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.cargoRecords.map((record, index) => (
                          <tr key={record.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-500">{record.id}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{record.barcodeNumber}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{record.exitNumber}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{record.carrierCompany}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 truncate" title={record.senderCompany}>{record.senderCompany}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 truncate" title={record.recipientName}>{record.recipientName}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                                {getStatusText(record.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{record.createdByName}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(record.createdAt).toLocaleDateString('tr-TR')}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};























