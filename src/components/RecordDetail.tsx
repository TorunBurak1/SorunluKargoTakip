import React from 'react';
import { ArrowLeft, Package, Calendar, User, Camera, Building2, Truck } from 'lucide-react';
import { CargoRecord, RecordStatus, CARRIER_COMPANIES } from '../types';

interface RecordDetailProps {
  record: CargoRecord;
  onBack: () => void;
  isAdmin?: boolean;
}

export const RecordDetail: React.FC<RecordDetailProps> = ({ record, onBack, isAdmin = false }) => {
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
      case 'open': return 'Açık';
      case 'in_progress': return 'İşlemde';
      case 'resolved': return 'Çözüldü';
      case 'paid': return 'Ödendi';
      case 'rejected': return 'Reddedildi';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Geri
            </button>
            <div className="flex items-center">
              <Package className="h-8 w-8 text-teal-500" />
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">Kayıt Detayı</h1>
                <p className="text-sm text-gray-600">Barkod: {record.barcodeNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Info Card */}
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
            <div className="mb-4 lg:mb-0 flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Kargo Bilgileri</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-start space-x-3">
                  <Package className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Barkod Numarası</p>
                    <p className="font-semibold text-gray-900">{record.barcodeNumber}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Package className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Çıkış Numarası</p>
                    <p className="font-semibold text-gray-900">{record.exitNumber}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Truck className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Taşıyıcı Firma (Kargo Şirketi)</p>
                    <p className="font-semibold text-gray-900">
                      {CARRIER_COMPANIES.find(c => c.value === record.carrierCompany)?.label}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Building2 className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Gönderici Firma</p>
                    <p className="font-semibold text-gray-900">{record.senderCompany}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Alıcı Adı Soyadı</p>
                    <p className="font-semibold text-gray-900">{record.recipientName}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center text-gray-600">
                  <User className="w-4 h-4 mr-1" />
                  <span className="text-sm">Kaydı Oluşturan: {record.createdByName}</span>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                  {getStatusText(record.status)}
                </span>
              </div>
            </div>
            
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Açıklama</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {record.description.split('\n\n[')[0]}
              </div>
            </div>
          </div>

          {/* Status Notes */}
          {(record.resolutionNote || record.paymentNote || record.rejectionReason) && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Durum Notları</h3>
              <div className="space-y-3">
                {record.resolutionNote && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 mr-2">
                            Çözüldü
                          </span>
                          {record.statusUpdatedAt && (
                            <span className="text-xs text-gray-500">
                              {new Date(record.statusUpdatedAt).toLocaleDateString('tr-TR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {record.resolutionNote}
                        </p>
                        {record.statusUpdatedByName && (
                          <p className="text-xs text-gray-500 mt-2">
                            Güncelleyen: {record.statusUpdatedByName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {record.paymentNote && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 mr-2">
                            Ödendi
                          </span>
                          {record.statusUpdatedAt && (
                            <span className="text-xs text-gray-500">
                              {new Date(record.statusUpdatedAt).toLocaleDateString('tr-TR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {record.paymentNote}
                        </p>
                        {record.statusUpdatedByName && (
                          <p className="text-xs text-gray-500 mt-2">
                            Güncelleyen: {record.statusUpdatedByName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {record.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 mr-2">
                            Reddedildi
                          </span>
                          {record.statusUpdatedAt && (
                            <span className="text-xs text-gray-500">
                              {new Date(record.statusUpdatedAt).toLocaleDateString('tr-TR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {record.rejectionReason}
                        </p>
                        {record.statusUpdatedByName && (
                          <p className="text-xs text-gray-500 mt-2">
                            Güncelleyen: {record.statusUpdatedByName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description History (if there are multiple notes in description) */}
          {record.description.includes('\n\n[') && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Durum Geçmişi</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                  {record.description.split('\n\n[').slice(1).map((note, index) => (
                    <div key={index} className="mb-2 pb-2 border-b border-gray-200 last:border-0">
                      [{note}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Photos */}
          {record.photos.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Camera className="w-5 h-5 mr-2" />
                Fotoğraflar ({record.photos.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {record.photos.map((photo, index) => {
                  // Fotoğraf tipini kontrol et
                  const isBlobUrl = photo && typeof photo === 'string' && photo.startsWith('blob:');
                  const isValidBase64 = photo && typeof photo === 'string' && photo.startsWith('data:image/');
                  const isEmpty = !photo || photo === '' || photo === null || photo === undefined;
                  
                  return (
                    <div key={index} className="relative group">
                      {isEmpty || isBlobUrl ? (
                        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                          <p className="text-gray-500 text-sm">
                            {isEmpty ? 'Fotoğraf bulunamadı' : 'Fotoğraf görüntülenemiyor'}
                          </p>
                        </div>
                      ) : (
                        <img
                          src={photo}
                          alt={`Fotoğraf ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                          onError={(e) => {
                            // Hata durumunda placeholder göster
                            const target = e.target as HTMLImageElement;
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.error-placeholder')) {
                              target.style.display = 'none';
                              const placeholder = document.createElement('div');
                              placeholder.className = 'error-placeholder w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center';
                              placeholder.innerHTML = '<p class="text-gray-500 text-sm">Fotoğraf yüklenemedi</p>';
                              parent.appendChild(placeholder);
                            }
                          }}
                          onLoad={(e) => {
                            // Başarıyla yüklendiğinde hata placeholder'ını kaldır
                            const target = e.target as HTMLImageElement;
                            const parent = target.parentElement;
                            if (parent) {
                              const errorPlaceholder = parent.querySelector('.error-placeholder');
                              if (errorPlaceholder) {
                                errorPlaceholder.remove();
                              }
                              // Görüntüyü tekrar göster
                              target.style.display = 'block';
                            }
                          }}
                        />
                      )}
                      {!isEmpty && !isBlobUrl && (
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <button className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-3 py-1 rounded-full text-sm font-medium transition-opacity">
                            Büyüt
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date Information */}
          <div className="border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Oluşturulma Tarihi</h4>
                <div className="flex items-center text-gray-900">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  {formatDate(record.createdAt)}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Son Güncelleme</h4>
                <div className="flex items-center text-gray-900">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  {formatDate(record.updatedAt)}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};