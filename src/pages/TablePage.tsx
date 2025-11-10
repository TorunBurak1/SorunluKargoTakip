import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { User as UserType, CargoRecord } from '../services/api';

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

export const TablePage: React.FC = () => {
  const [data, setData] = useState<AllData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (error) {
    return <div>Hata: {error}</div>;
  }

  if (!data) {
    return <div>Veri bulunamadı</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginBottom: '30px', color: '#333' }}>Veritabanı Tabloları</h1>
      
      <h2 style={{ marginBottom: '15px', color: '#555' }}>users tablosu</h2>
      <table style={{ 
        borderCollapse: 'collapse', 
        width: '100%', 
        marginBottom: '40px',
        border: '1px solid #ddd'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>id</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>name</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>email</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>role</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>created_at</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>updated_at</th>
          </tr>
        </thead>
        <tbody>
          {data.users.map((user, index) => (
            <tr key={user.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.id}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.email}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.role}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.createdAt}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>-</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginBottom: '15px', color: '#555' }}>cargo_records tablosu</h2>
      <table style={{ 
        borderCollapse: 'collapse', 
        width: '100%',
        border: '1px solid #ddd'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>id</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>barcode_number</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>exit_number</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>carrier_company</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>sender_company</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>recipient_name</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>description</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>photos</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>status</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>resolution_note</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>payment_note</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>rejection_reason</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>status_updated_by</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>status_updated_at</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>created_by</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>created_at</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>updated_at</th>
          </tr>
        </thead>
        <tbody>
          {data.cargoRecords.map((record, index) => (
            <tr key={record.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.id}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.barcodeNumber}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.exitNumber}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.carrierCompany}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.senderCompany}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.recipientName}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.description}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{JSON.stringify(record.photos)}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.status}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.resolutionNote}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.paymentNote}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.rejectionReason}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.statusUpdatedBy}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.statusUpdatedAt}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.createdBy}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.createdAt}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
