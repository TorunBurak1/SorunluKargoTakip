import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CargoRecord } from '../types';
import { apiService } from '../services/api';

interface RecordsContextType {
  records: CargoRecord[];
  loading: boolean;
  error: string | null;
  addRecord: (record: CargoRecord) => Promise<void>;
  updateRecord: (id: string, updatedRecord: Partial<CargoRecord>) => Promise<void>;
  updateRecordStatus: (id: string, statusData: {
    status: 'open' | 'in_progress' | 'resolved' | 'paid' | 'rejected';
    resolutionNote?: string;
    paymentNote?: string;
    rejectionReason?: string;
    updatedBy: string;
    updatedByName: string;
  }) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  refreshRecords: () => Promise<void>;
}

const RecordsContext = createContext<RecordsContextType | undefined>(undefined);

export const useRecords = () => {
  const context = useContext(RecordsContext);
  if (context === undefined) {
    throw new Error('useRecords must be used within a RecordsProvider');
  }
  return context;
};

interface RecordsProviderProps {
  children: ReactNode;
}

export const RecordsProvider: React.FC<RecordsProviderProps> = ({ children }) => {
  const [records, setRecords] = useState<CargoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Kayıtları yükle
  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('RecordsContext: Kayıtlar yükleniyor...');
      
      // Önce health check yap (sunucuyu uyandır)
      try {
        console.log('RecordsContext: Health check yapılıyor...');
        await apiService.healthCheck();
        console.log('RecordsContext: Health check başarılı');
      } catch (healthError) {
        console.log('RecordsContext: Health check başarısız, devam ediliyor...', healthError);
      }
      
      // Önce getAllData endpoint'ini dene
      try {
        console.log('RecordsContext: getAllData endpoint deneniyor...');
        const allData = await apiService.getAllData();
        console.log('RecordsContext: getAllData başarılı:', allData);
        console.log('RecordsContext: Cargo records sayısı:', allData.cargoRecords.length);
        setRecords(allData.cargoRecords);
      } catch (allDataError) {
        console.log('RecordsContext: getAllData başarısız:', allDataError);
        console.log('RecordsContext: getCargoRecords deneniyor...');
        const data = await apiService.getCargoRecords();
        console.log('RecordsContext: getCargoRecords başarılı:', data);
        console.log('RecordsContext: Records sayısı:', data.length);
        setRecords(data);
      }
    } catch (err) {
      console.error('RecordsContext: Kayıtlar yüklenirken hata:', err);
      console.error('RecordsContext: Hata detayı:', err);
      const errorMessage = err instanceof Error ? err.message : 'Kayıtlar yüklenirken hata oluştu';
      setError(errorMessage);
      
      // Kullanıcıya daha anlaşılır mesaj göster
      if (errorMessage.includes('zaman aşımı') || errorMessage.includes('uyku modunda')) {
        setError('Sunucu uyku modunda. Lütfen birkaç saniye bekleyip sayfayı yenileyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Component mount olduğunda kayıtları yükle
  useEffect(() => {
    loadRecords();
  }, []);

  const addRecord = async (record: CargoRecord) => {
    try {
      setError(null);
      const newRecord = await apiService.createCargoRecord({
        barcodeNumber: record.barcodeNumber,
        exitNumber: record.exitNumber,
        carrierCompany: record.carrierCompany,
        senderCompany: record.senderCompany,
        recipientName: record.recipientName,
        description: record.description,
        photos: record.photos,
        createdBy: record.createdBy,
        createdByName: record.createdByName,
      });
      setRecords(prevRecords => [...prevRecords, newRecord]);
    } catch (err) {
      console.error('Kayıt eklenirken hata:', err);
      setError(err instanceof Error ? err.message : 'Kayıt eklenirken hata oluştu');
      throw err;
    }
  };

  const updateRecord = async (id: string, updatedRecord: Partial<CargoRecord>) => {
    try {
      setError(null);
      const updated = await apiService.updateCargoRecord(id, {
        barcodeNumber: updatedRecord.barcodeNumber,
        exitNumber: updatedRecord.exitNumber,
        carrierCompany: updatedRecord.carrierCompany,
        senderCompany: updatedRecord.senderCompany,
        recipientName: updatedRecord.recipientName,
        description: updatedRecord.description,
        photos: updatedRecord.photos,
      });
      setRecords(prevRecords => 
        prevRecords.map(record => record.id === id ? updated : record)
      );
    } catch (err) {
      console.error('Kayıt güncellenirken hata:', err);
      setError(err instanceof Error ? err.message : 'Kayıt güncellenirken hata oluştu');
      throw err;
    }
  };

  const updateRecordStatus = async (id: string, statusData: {
    status: 'open' | 'in_progress' | 'resolved' | 'paid' | 'rejected';
    resolutionNote?: string;
    paymentNote?: string;
    rejectionReason?: string;
    updatedBy: string;
    updatedByName: string;
  }) => {
    try {
      setError(null);
      const updated = await apiService.updateCargoRecordStatus(id, statusData);
      setRecords(prevRecords => 
        prevRecords.map(record => record.id === id ? updated : record)
      );
    } catch (err) {
      console.error('Durum güncellenirken hata:', err);
      setError(err instanceof Error ? err.message : 'Durum güncellenirken hata oluştu');
      throw err;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      setError(null);
      await apiService.deleteCargoRecord(id);
      setRecords(prevRecords => prevRecords.filter(record => record.id !== id));
    } catch (err) {
      console.error('Kayıt silinirken hata:', err);
      setError(err instanceof Error ? err.message : 'Kayıt silinirken hata oluştu');
      throw err;
    }
  };

  const refreshRecords = async () => {
    await loadRecords();
  };

  const value = {
    records,
    loading,
    error,
    addRecord,
    updateRecord,
    updateRecordStatus,
    deleteRecord,
    refreshRecords,
  };

  return (
    <RecordsContext.Provider value={value}>
      {children}
    </RecordsContext.Provider>
  );
};
