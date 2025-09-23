import React from 'react';
import { ArrowLeft, Package, Calendar, User, Camera, Edit, Trash2 } from 'lucide-react';
import { CargoRecord, CARRIER_COMPANIES } from '../types';

interface RecordDetailProps {
  record: CargoRecord;
  onBack: () => void;
  isAdmin?: boolean;
  onUpdateRecord?: (id: string, updates: Partial<Omit<CargoRecord, 'id' | 'createdBy' | 'createdByName' | 'createdAt'>>) => void;
  onDeleteRecord?: (id: string) => void;
}

export const RecordDetail: React.FC<RecordDetailProps> = ({ record, onBack, isAdmin = false, onUpdateRecord, onDeleteRecord }) => {
  const getCarrierCompanyLabel = (carrierCompany: string) => {
    const company = CARRIER_COMPANIES.find(c => c.value === carrierCompany);
    return company ? company.label : carrierCompany;
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
                <p className="text-sm text-gray-600">{record.barcodeNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Info Card */}
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
            <div className="mb-4 lg:mb-0">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{record.barcodeNumber}</h2>
              <div className="flex items-center space-x-4 mb-4">
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                  {record.exitNumber}
                </span>
                <div className="flex items-center text-gray-600">
                  <User className="w-4 h-4 mr-1" />
                  <span className="text-sm">{record.createdByName}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Taşıyıcı Firma:</span>
                  <span className="ml-2 text-gray-900">{getCarrierCompanyLabel(record.carrierCompany)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Gönderici Firma:</span>
                  <span className="ml-2 text-gray-900">{record.senderCompany}</span>
                </div>
              </div>
            </div>
            
            {isAdmin && (
              <div className="flex space-x-3">
                <button
                  onClick={() => onDeleteRecord && onDeleteRecord(record.id)}
                  className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Sil
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Açıklama</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed">{record.description}</p>
            </div>
          </div>

          {/* Photos */}
          {record.photos.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Camera className="w-5 h-5 mr-2" />
                Fotoğraflar ({record.photos.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {record.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Fotoğraf ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <button className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-3 py-1 rounded-full text-sm font-medium transition-opacity">
                        Büyüt
                      </button>
                    </div>
                  </div>
                ))}
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

        {/* Action Buttons for Mobile */}
        {isAdmin && (
          <div className="lg:hidden space-y-3">
            <button
              onClick={() => onDeleteRecord && onDeleteRecord(record.id)}
              className="w-full flex items-center justify-center px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Sil
            </button>
          </div>
        )}
      </div>
    </div>
  );
};