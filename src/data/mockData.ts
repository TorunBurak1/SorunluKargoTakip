import { CargoRecord, User } from '../types';

export const mockUsers: User[] = [
  { id: '1', name: 'Ahmet Yılmaz', email: 'ahmet@kargo.com', role: 'staff' },
  { id: '2', name: 'Fatma Demir', email: 'fatma@kargo.com', role: 'staff' },
  { id: '3', name: 'Mehmet Kaya', email: 'mehmet@kargo.com', role: 'admin' },
];

export const mockRecords: CargoRecord[] = [
  {
    id: '1',
    barcodeNumber: '1234567890123',
    exitNumber: 'EX2024001234',
    carrierCompany: 'aras',
    senderCompany: 'Teknoloji A.Ş.',
    description: 'Paket hasarlı şekilde teslim edildi. Müşteri şikayeti mevcut. Kutu ezik ve içerik zarar görmüş durumda.',
    photos: [
      'https://images.pexels.com/photos/4481327/pexels-photo-4481327.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    createdBy: '1',
    createdByName: 'Ahmet Yılmaz',
    createdAt: '2024-01-15T09:30:00Z',
    updatedAt: '2024-01-15T09:30:00Z',
  },
  {
    id: '2',
    barcodeNumber: '2345678901234',
    exitNumber: 'EX2024001235',
    carrierCompany: 'ptt',
    senderCompany: 'Moda Dünyası Ltd.',
    description: 'Yanlış adrese teslim edilmiş paket. Doğru adres araştırılıyor ve müşteri ile iletişim kuruldu.',
    photos: [
      'https://images.pexels.com/photos/4481328/pexels-photo-4481328.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    createdBy: '2',
    createdByName: 'Fatma Demir',
    createdAt: '2024-01-14T14:20:00Z',
    updatedAt: '2024-01-15T08:15:00Z',
  },
  {
    id: '3',
    barcodeNumber: '3456789012345',
    exitNumber: 'EX2024001236',
    carrierCompany: 'surat',
    senderCompany: 'Kitap Evi Yayıncılık',
    description: 'Geç teslim edilen paket için müşteri memnuniyetsizliği. Özür dilendi ve iade süreci tamamlandı.',
    photos: [],
    createdBy: '1',
    createdByName: 'Ahmet Yılmaz',
    createdAt: '2024-01-13T16:45:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
  },
  {
    id: '4',
    barcodeNumber: '4567890123456',
    exitNumber: 'EX2024001237',
    carrierCompany: 'yurtici',
    senderCompany: 'Elektronik Market',
    description: 'Paket kayıp. Müşteri kargo durumunu sorgulayamıyor ve paket sistemde görünmüyor.',
    photos: [],
    createdBy: '2',
    createdByName: 'Fatma Demir',
    createdAt: '2024-01-15T13:10:00Z',
    updatedAt: '2024-01-15T13:10:00Z',
  }
];