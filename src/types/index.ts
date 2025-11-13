export interface User {
  id: string;
  name: string;
  email: string;
  role: 'calisan' | 'admin';
}

export interface CargoRecord {
  id: string;
  barcodeNumber: string;
  exitNumber: string;
  carrierCompany: 'ptt' | 'aras_aylin' | 'aras_verar' | 'aras_hatip' | 'surat' | 'yurtici' | 'verar';
  senderCompany: string;
  recipientName: string;
  description: string;
  photos: string[];
  status: RecordStatus;
  resolutionNote?: string;
  paymentNote?: string;
  rejectionReason?: string;
  statusUpdatedBy?: string;
  statusUpdatedByName?: string;
  statusUpdatedAt?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export type RecordStatus = 'open' | 'in_progress' | 'resolved' | 'paid' | 'rejected';

export const CARRIER_COMPANIES = [
  { value: 'ptt', label: 'PTT Kargo' },
  { value: 'aras_aylin', label: 'Aras Aylin' },
  { value: 'aras_verar', label: 'Aras Verar' },
  { value: 'aras_hatip', label: 'Aras Hatip' },
  { value: 'surat', label: 'Sürat Kargo' },
  { value: 'yurtici', label: 'Yurtiçi Kargo' },
  { value: 'verar', label: 'Verar Kargo İstanbul' }
] as const;