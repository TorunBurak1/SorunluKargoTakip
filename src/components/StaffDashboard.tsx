import React, { useState } from 'react';
import { Plus, Package, Calendar, Camera, FileText, LogOut } from 'lucide-react';
import { CargoRecord, User, CARRIER_COMPANIES } from '../types';

interface StaffDashboardProps {
  user: User;
  onLogout: () => void;
  onViewRecord: (record: CargoRecord) => void;
  records: CargoRecord[];
  onCreateRecord: (data: { barcodeNumber: string; exitNumber: string; carrierCompany: string; senderCompany: string; description: string; photos?: string[] }) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ user, onLogout, onViewRecord, records, onCreateRecord }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    barcodeNumber: '',
    exitNumber: '',
    carrierCompany: '',
    senderCompany: '',
    description: '',
  });
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const userRecords = records.filter(record => record.createdBy === user.id);

  const getCarrierCompanyLabel = (carrierCompany: string) => {
    const company = CARRIER_COMPANIES.find(c => c.value === carrierCompany);
    return company ? company.label : carrierCompany;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRecord({
      barcodeNumber: formData.barcodeNumber,
      exitNumber: formData.exitNumber,
      carrierCompany: formData.carrierCompany,
      senderCompany: formData.senderCompany,
      description: formData.description,
      photos: photoPreviews,
    });
    setShowForm(false);
    setFormData({ barcodeNumber: '', exitNumber: '', carrierCompany: '', senderCompany: '', description: '' });
    setPhotoPreviews([]);
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const readers = Array.from(files).map(file => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    }));
    const results = await Promise.all(readers);
    setPhotoPreviews(prev => [...prev, ...results]);
  };

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
                <h1 className="text-xl font-semibold text-gray-900">Kargo Takip</h1>
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
        {/* Add New Record Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            <Plus className="w-5 h-5 mr-2" />
            Yeni Kayıt Ekle
          </button>
        </div>

        {/* Add New Record Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Yeni Sorunlu Kargo Kaydı</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barkod Numarası
                  </label>
                  <input
                    type="text"
                    value={formData.barcodeNumber}
                    onChange={(e) => setFormData({ ...formData, barcodeNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="1234567890123"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Çıkış Numarası
                  </label>
                  <input
                    type="text"
                    value={formData.exitNumber}
                    onChange={(e) => setFormData({ ...formData, exitNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="EX2024001234"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taşıyıcı Firma
                  </label>
                  <select
                    value={formData.carrierCompany}
                    onChange={(e) => setFormData({ ...formData, carrierCompany: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    <option value="">Seçiniz</option>
                    {CARRIER_COMPANIES.map(company => (
                      <option key={company.value} value={company.value}>{company.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gönderici Firma
                  </label>
                  <input
                    type="text"
                    value={formData.senderCompany}
                    onChange={(e) => setFormData({ ...formData, senderCompany: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Firma Adı"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Sorun detaylarını açıklayın..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fotoğraf Ekle
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Camera className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Fotoğraf yüklemek için tıklayın veya sürükleyin
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                    className="mt-3 block w-full text-sm text-gray-600"
                  />
                </div>
                {photoPreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {photoPreviews.map((src, idx) => (
                      <img key={idx} src={src} alt={`Önizleme ${idx + 1}`} className="w-full h-24 object-cover rounded" />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Records List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Kayıtlarım ({userRecords.length})</h2>
          
          {userRecords.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600">Henüz kayıt bulunmuyor.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {userRecords.map((record) => (
                <div
                  key={record.id}
                  onClick={() => onViewRecord(record)}
                  className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900">{record.barcodeNumber}</h3>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {record.exitNumber}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mb-2 text-sm text-gray-600">
                        <span><strong>Taşıyıcı:</strong> {getCarrierCompanyLabel(record.carrierCompany)}</span>
                        <span><strong>Gönderici:</strong> {record.senderCompany}</span>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                        {record.description}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(record.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                        {record.photos.length > 0 && (
                          <div className="flex items-center">
                            <Camera className="w-4 h-4 mr-1" />
                            {record.photos.length} fotoğraf
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};