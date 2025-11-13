import React, { useState, useEffect } from 'react';
import { Plus, Package, Calendar, Camera, FileText, LogOut, X, Search, Edit, Trash2 } from 'lucide-react';
import { CargoRecord, User, RecordStatus, CARRIER_COMPANIES } from '../types';
import { useRecords } from '../contexts/RecordsContext';

interface StaffDashboardProps {
  user: User;
  onLogout: () => void;
  onViewRecord: (record: CargoRecord) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ user, onLogout, onViewRecord }) => {
  const { records, addRecord, updateRecord, updateRecordStatus, deleteRecord, loading, error } = useRecords();
  const [showForm, setShowForm] = useState(false);
  const [statusUpdateRecord, setStatusUpdateRecord] = useState<CargoRecord | null>(null);
  const [formData, setFormData] = useState({
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
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editRecord, setEditRecord] = useState<CargoRecord | null>(null);
  const [editFormData, setEditFormData] = useState({
    barcodeNumber: '',
    exitNumber: '',
    carrierCompany: 'ptt' as 'ptt' | 'aras' | 'surat' | 'yurtici' | 'verar',
    senderCompany: '',
    recipientName: '',
    description: '',
  });
  const [editPhotos, setEditPhotos] = useState<string[]>([]); // Mevcut fotoğraflar (base64)
  const [newPhotos, setNewPhotos] = useState<File[]>([]); // Yeni eklenen fotoğraflar

  const userRecords = records.filter(record => record.createdBy === user.id);
  
  const filteredUserRecords = userRecords.filter(record => {
    if (searchTerm === '') return true;
    return (
      record.barcodeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.exitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.senderCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  // Debug: Kayıt sayısını kontrol et
  console.log('StaffDashboard: Toplam kayıt sayısı:', records.length);
  console.log('StaffDashboard: Kullanıcı kayıtları:', userRecords.length);

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

  // Çalışan panelinde durum değiştirilebilir mi kontrol et
  const canChangeStatus = (status: RecordStatus) => {
    // Sadece 'open' ve 'in_progress' durumlarında değişiklik yapılabilir
    return status === 'open' || status === 'in_progress';
  };

  // Fotoğrafı base64 formatına çevir (maksimum 5MB)
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Dosya boyutu kontrolü (5MB = 5 * 1024 * 1024 bytes)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        reject(new Error(`${file.name} dosyası çok büyük (${(file.size / 1024 / 1024).toFixed(2)}MB). Maksimum 5MB olmalıdır.`));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result); // data:image/jpeg;base64,... formatında
      };
      reader.onerror = (error) => reject(new Error(`Fotoğraf okunurken hata: ${error}`));
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Çift tıklamayı önle
    
    setIsSubmitting(true);
    
    try {
      // Seçilen fotoğrafları base64 formatına çevir
      const photoBase64Array = selectedPhotos.length > 0
        ? await Promise.all(selectedPhotos.map(photo => convertFileToBase64(photo)))
        : [];

      // Yeni kayıt oluştur (ID backend tarafından oluşturulacak)
      const newRecord: CargoRecord = {
        id: '', // Backend'den gelecek
        barcodeNumber: formData.barcodeNumber,
        exitNumber: formData.exitNumber,
        carrierCompany: formData.carrierCompany,
        senderCompany: formData.senderCompany,
        recipientName: formData.recipientName,
        description: formData.description,
        photos: photoBase64Array, // Base64 formatında fotoğraflar
        status: 'open', // Varsayılan durum
        createdBy: user.id,
        createdByName: user.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Context'e yeni kaydı ekle (await ile bekliyoruz)
      await addRecord(newRecord);
      
      console.log('Yeni kayıt başarıyla eklendi');
      
      // Başarılı olduysa formu temizle
      setShowForm(false);
      setFormData({ 
        barcodeNumber: '', 
        exitNumber: '', 
        carrierCompany: 'ptt', 
        senderCompany: '', 
        recipientName: '',
        description: '' 
      });
      setSelectedPhotos([]);
    } catch (error) {
      console.error('Kayıt ekleme hatası:', error);
      const errorMessage = error instanceof Error ? error.message : 'Kayıt eklenirken bir hata oluştu';
      alert(`Hata: ${errorMessage}\n\nLütfen tekrar deneyin.`);
    } finally {
      setIsSubmitting(false);
    }
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

  // Kayıt düzenleme fonksiyonları
  const handleDeleteClick = async (record: CargoRecord) => {
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

  const handleEditClick = (record: CargoRecord) => {
    setEditRecord(record);
    setEditFormData({
      barcodeNumber: record.barcodeNumber,
      exitNumber: record.exitNumber,
      carrierCompany: record.carrierCompany,
      senderCompany: record.senderCompany,
      recipientName: record.recipientName,
      description: record.description,
    });
    setEditPhotos([...record.photos]); // Mevcut fotoğrafları kopyala
    setNewPhotos([]); // Yeni fotoğrafları temizle
  };

  const handleEditCancel = () => {
    setEditRecord(null);
    setEditFormData({
      barcodeNumber: '',
      exitNumber: '',
      carrierCompany: 'ptt',
      senderCompany: '',
      recipientName: '',
      description: '',
    });
    setEditPhotos([]);
    setNewPhotos([]);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      // Yeni fotoğrafları base64'e çevir
      const newPhotoBase64Array = newPhotos.length > 0
        ? await Promise.all(newPhotos.map(photo => convertFileToBase64(photo)))
        : [];

      // Tüm fotoğrafları birleştir (mevcut + yeni)
      const allPhotos = [...editPhotos, ...newPhotoBase64Array];

      // Kaydı güncelle
      await updateRecord(editRecord.id, {
        barcodeNumber: editFormData.barcodeNumber,
        exitNumber: editFormData.exitNumber,
        carrierCompany: editFormData.carrierCompany,
        senderCompany: editFormData.senderCompany,
        recipientName: editFormData.recipientName,
        description: editFormData.description,
        photos: allPhotos,
      });

      console.log('Kayıt başarıyla güncellendi');
      handleEditCancel(); // Modalı kapat
    } catch (error) {
      console.error('Kayıt güncelleme hatası:', error);
      const errorMessage = error instanceof Error ? error.message : 'Kayıt güncellenirken bir hata oluştu';
      alert(`Hata: ${errorMessage}\n\nLütfen tekrar deneyin.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fotoğraf silme
  const handleRemovePhoto = (index: number) => {
    setEditPhotos(editPhotos.filter((_, i) => i !== index));
  };

  // Yeni fotoğraf silme (henüz eklenmemiş)
  const handleRemoveNewPhoto = (index: number) => {
    setNewPhotos(newPhotos.filter((_, i) => i !== index));
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
                    Taşıyıcı Firma (Kargo Şirketi) *
                  </label>
                  <select
                    value={formData.carrierCompany}
                    onChange={(e) => setFormData({ ...formData, carrierCompany: e.target.value as typeof formData.carrierCompany })}
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
                    value={formData.senderCompany}
                    onChange={(e) => setFormData({ ...formData, senderCompany: e.target.value })}
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
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
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
                    value={formData.barcodeNumber}
                    onChange={(e) => setFormData({ ...formData, barcodeNumber: e.target.value })}
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
                    value={formData.exitNumber}
                    onChange={(e) => setFormData({ ...formData, exitNumber: e.target.value })}
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
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Sorun detaylarını açıklayın..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fotoğraf Ekle
                </label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-teal-400', 'bg-teal-50');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-teal-400', 'bg-teal-50');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-teal-400', 'bg-teal-50');
                    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
                    if (files.length > 0) {
                      setSelectedPhotos(prev => [...prev, ...files]);
                    }
                  }}
                >
                  <Camera className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Fotoğraf yüklemek için tıklayın veya sürükleyin
                  </p>
                  <input 
                    id="photo-upload"
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files);
                        setSelectedPhotos(prev => [...prev, ...files]);
                        console.log('Seçilen dosyalar:', files);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Seçilen Fotoğraflar */}
              {selectedPhotos.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seçilen Fotoğraflar ({selectedPhotos.length})
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Seçilen fotoğraf ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedPhotos(prev => prev.filter((_, i) => i !== index))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {photo.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors flex items-center justify-center ${
                    isSubmitting 
                      ? 'bg-teal-400 cursor-not-allowed text-white' 
                      : 'bg-teal-500 hover:bg-teal-600 text-white'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Kaydediliyor...
                    </>
                  ) : (
                    'Kaydet'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Records List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Kayıtlarım {loading ? '(Yükleniyor...)' : `(${filteredUserRecords.length})`}
            </h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Kayıtlarımda ara..."
                disabled={loading}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium underline"
              >
                Sayfayı Yenile
              </button>
            </div>
          )}
          
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mb-4"></div>
              <p className="text-gray-600">Kayıtlar yükleniyor...</p>
              <p className="text-gray-500 text-sm mt-2">Sunucu uyku modundaysa bu işlem 10-15 saniye sürebilir</p>
            </div>
          ) : filteredUserRecords.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600">
                {userRecords.length === 0 ? 'Henüz kayıt bulunmuyor.' : 'Arama kriterlerinize uygun kayıt bulunamadı.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredUserRecords.map((record) => (
                <div
                  key={record.id}
                  onClick={() => onViewRecord(record)}
                  className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900">
                          Barkod: {record.barcodeNumber}
                        </h3>
                        <span className="text-xs text-gray-500">
                          Çıkış No: {record.exitNumber}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm text-gray-600">
                          Taşıyıcı: {CARRIER_COMPANIES.find(c => c.value === record.carrierCompany)?.label}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-600">
                          Gönderici: {record.senderCompany}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm text-gray-600">
                          Alıcı: {record.recipientName}
                        </span>
                      </div>
                      <div className="text-gray-600 text-sm line-clamp-2 mb-2 whitespace-pre-line">
                        {record.description}
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                          {getStatusText(record.status)}
                        </span>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(record);
                            }}
                            className="flex items-center text-blue-600 hover:text-blue-900 text-xs font-medium transition-colors"
                            title="Kaydı Düzenle"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Düzenle
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(record);
                            }}
                            className="flex items-center text-red-600 hover:text-red-900 text-xs font-medium transition-colors"
                            title="Kaydı Sil"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Sil
                          </button>
                          {canChangeStatus(record.status) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdateClick(record);
                              }}
                              className="text-purple-600 hover:text-purple-900 text-xs font-medium"
                            >
                              Durum Güncelle
                            </button>
                          )}
                          {!canChangeStatus(record.status) && (
                            <span className="text-gray-400 text-xs font-medium">
                              Durum Değiştirilemez
                            </span>
                          )}
                        </div>
                      </div>
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

      {/* Kayıt Düzenleme Modalı */}
      {editRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Kayıt Düzenle</h2>
              <button
                onClick={handleEditCancel}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barkod Numarası *
                  </label>
                  <input
                    type="text"
                    value={editFormData.barcodeNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, barcodeNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Çıkış Numarası *
                  </label>
                  <input
                    type="text"
                    value={editFormData.exitNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, exitNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taşıyıcı Firma *
                  </label>
                  <select
                    value={editFormData.carrierCompany}
                    onChange={(e) => setEditFormData({ ...editFormData, carrierCompany: e.target.value as typeof editFormData.carrierCompany })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    {CARRIER_COMPANIES.map((company) => (
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
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alıcı Adı *
                  </label>
                  <input
                    type="text"
                    value={editFormData.recipientName}
                    onChange={(e) => setEditFormData({ ...editFormData, recipientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama *
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              {/* Mevcut Fotoğraflar */}
              {editPhotos.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mevcut Fotoğraflar
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {editPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Fotoğraf ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                          title="Fotoğrafı Sil"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Yeni Fotoğraf Ekleme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yeni Fotoğraf Ekle
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 transition-colors">
                  <input
                    id="edit-photo-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files);
                        setNewPhotos(prev => [...prev, ...files]);
                      }
                    }}
                  />
                  <label
                    htmlFor="edit-photo-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Fotoğraf eklemek için tıklayın veya sürükleyin
                    </p>
                  </label>
                </div>
              </div>

              {/* Yeni Seçilen Fotoğraflar */}
              {newPhotos.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yeni Eklenen Fotoğraflar ({newPhotos.length})
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {newPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Yeni fotoğraf ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewPhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                          title="Fotoğrafı Kaldır"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {photo.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors flex items-center justify-center ${
                    isSubmitting 
                      ? 'bg-teal-400 cursor-not-allowed text-white' 
                      : 'bg-teal-500 hover:bg-teal-600 text-white'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Güncelleniyor...
                    </>
                  ) : (
                    'Kaydet'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleEditCancel}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};