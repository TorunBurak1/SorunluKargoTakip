export interface User {
  id: string;
  name: string;
  email: string;
  role: 'staff' | 'admin';
}

export interface CargoRecord {
  id: string;
  barcodeNumber: string;
  exitNumber: string;
  carrierCompany: 'aras_aylin' |  'aras_verar' | 'aras_hatip' |  'ptt' | 'surat' | 'verar' | 'yurtici';
  senderCompany: string;
  description: string;
  photos: string[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export type RecordStatus = 'open' | 'in_progress' | 'resolved';

export const CARRIER_COMPANIES = [
  { value: 'aras_aylin', label: 'Aras Aylin' },
  { value: 'ptt', label: 'PTT Kargo' },
  { value: 'surat', label: 'Sürat Kargo' },
  { value: 'verar', label: 'Verar Kargo' },
  { value: 'yurtici', label: 'Yurtiçi Kargo' },
  { value: 'aras_verar', label: 'Aras Verar' },
  { value: 'aras_hatip', label: 'Aras Hatip' }
] as const;