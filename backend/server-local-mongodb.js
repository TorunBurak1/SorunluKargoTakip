const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3001;

// Yerel MongoDB bağlantısı (eğer MongoDB yüklüyse)
// Yoksa in-memory database kullanacağız
const connectDB = async () => {
  try {
    // Önce yerel MongoDB'yi dene
    const localMongoURI = 'mongodb://localhost:27017/kargo-takip';
    console.log('🔄 Yerel MongoDB bağlantısı deneniyor...');
    
    await mongoose.connect(localMongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ Yerel MongoDB bağlandı: ${mongoose.connection.host}`);
    return true;
  } catch (error) {
    console.log('⚠️ Yerel MongoDB bulunamadı, in-memory database kullanılıyor...');
    
    // In-memory database için
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    await mongoose.connect(uri);
    console.log('✅ In-memory MongoDB bağlandı');
    return true;
  }
};

// MongoDB bağlantısını başlat
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Basit modeller (Mongoose olmadan)
const users = [];
const cargoRecords = [];
let nextUserId = 1;
let nextRecordId = 1;

// Basit API Routes
app.get('/api/users', (req, res) => {
  res.json(users.map(user => ({
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  })));
});

app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'E-posta ve şifre gerekli' });
  }
  
  if (password !== '123456') {
    return res.status(401).json({ error: 'Geçersiz şifre' });
  }
  
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
  }
  
  res.json({
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    role: user.role
  });
});

app.get('/api/cargo-records', (req, res) => {
  res.json(cargoRecords.map(record => ({
    id: record.id.toString(),
    barcodeNumber: record.barcodeNumber,
    exitNumber: record.exitNumber,
    carrierCompany: record.carrierCompany,
    senderCompany: record.senderCompany,
    recipientName: record.recipientName,
    description: record.description,
    photos: record.photos || [],
    status: record.status || 'open',
    resolutionNote: record.resolutionNote,
    paymentNote: record.paymentNote,
    rejectionReason: record.rejectionReason,
    statusUpdatedBy: record.statusUpdatedBy,
    statusUpdatedByName: record.statusUpdatedByName,
    statusUpdatedAt: record.statusUpdatedAt,
    createdBy: record.createdBy,
    createdByName: record.createdByName,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  })));
});

app.post('/api/cargo-records', (req, res) => {
  const {
    barcodeNumber,
    exitNumber,
    carrierCompany,
    senderCompany,
    recipientName,
    description,
    photos = [],
    createdBy,
    createdByName
  } = req.body;
  
  if (!barcodeNumber || !exitNumber || !carrierCompany || !senderCompany || !recipientName || !description || !createdBy || !createdByName) {
    return res.status(400).json({ error: 'Tüm gerekli alanlar doldurulmalıdır' });
  }
  
  const newRecord = {
    id: nextRecordId++,
    barcodeNumber,
    exitNumber,
    carrierCompany,
    senderCompany,
    recipientName,
    description,
    photos,
    status: 'open',
    createdBy,
    createdByName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  cargoRecords.push(newRecord);
  
  res.status(201).json({
    id: newRecord.id.toString(),
    barcodeNumber: newRecord.barcodeNumber,
    exitNumber: newRecord.exitNumber,
    carrierCompany: newRecord.carrierCompany,
    senderCompany: newRecord.senderCompany,
    recipientName: newRecord.recipientName,
    description: newRecord.description,
    photos: newRecord.photos,
    status: newRecord.status,
    createdBy: newRecord.createdBy,
    createdByName: newRecord.createdByName,
    createdAt: newRecord.createdAt,
    updatedAt: newRecord.updatedAt
  });
});

app.patch('/api/cargo-records/:id/status', (req, res) => {
  const { id } = req.params;
  const {
    status,
    resolutionNote,
    paymentNote,
    rejectionReason,
    updatedBy,
    updatedByName
  } = req.body;
  
  const recordIndex = cargoRecords.findIndex(r => r.id.toString() === id);
  if (recordIndex === -1) {
    return res.status(404).json({ error: 'Kayıt bulunamadı' });
  }
  
  const record = cargoRecords[recordIndex];
  
  // Durumu güncelle
  record.status = status;
  record.resolutionNote = resolutionNote;
  record.paymentNote = paymentNote;
  record.rejectionReason = rejectionReason;
  record.statusUpdatedBy = updatedBy;
  record.statusUpdatedByName = updatedByName;
  record.statusUpdatedAt = new Date().toISOString();
  record.updatedAt = new Date().toISOString();
  
  // Açıklamaya not ekle
  let newNote = '';
  let statusText = '';
  const now = new Date().toISOString();
  
  switch (status) {
    case 'resolved':
      statusText = 'Çözüldü';
      if (resolutionNote) {
        newNote = `\n\n[${statusText} - ${now}] ${resolutionNote}`;
      }
      break;
    case 'paid':
      statusText = 'Ödendi';
      if (paymentNote) {
        newNote = `\n\n[${statusText} - ${now}] ${paymentNote}`;
      }
      break;
    case 'rejected':
      statusText = 'Reddedildi';
      if (rejectionReason) {
        newNote = `\n\n[${statusText} - ${now}] ${rejectionReason}`;
      }
      break;
    case 'in_progress':
      statusText = 'İşlemde';
      newNote = `\n\n[${statusText} - ${now}] Durum güncellendi.`;
      break;
    default:
      statusText = 'Açık';
      newNote = `\n\n[${statusText} - ${now}] Durum güncellendi.`;
  }
  
  record.description += newNote;
  
  res.json({
    id: record.id.toString(),
    barcodeNumber: record.barcodeNumber,
    exitNumber: record.exitNumber,
    carrierCompany: record.carrierCompany,
    senderCompany: record.senderCompany,
    recipientName: record.recipientName,
    description: record.description,
    photos: record.photos,
    status: record.status,
    resolutionNote: record.resolutionNote,
    paymentNote: record.paymentNote,
    rejectionReason: record.rejectionReason,
    statusUpdatedBy: record.statusUpdatedBy,
    statusUpdatedByName: record.statusUpdatedByName,
    statusUpdatedAt: record.statusUpdatedAt,
    createdBy: record.createdBy,
    createdByName: record.createdByName,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  });
});

// Tüm verileri getir endpoint'i
app.get('/api/all-data', (req, res) => {
  res.json({
    users: users.map(user => ({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    })),
    cargoRecords: cargoRecords.map(record => ({
      id: record.id.toString(),
      barcodeNumber: record.barcodeNumber,
      exitNumber: record.exitNumber,
      carrierCompany: record.carrierCompany,
      senderCompany: record.senderCompany,
      recipientName: record.recipientName,
      description: record.description,
      photos: record.photos || [],
      status: record.status || 'open',
      resolutionNote: record.resolutionNote,
      paymentNote: record.paymentNote,
      rejectionReason: record.rejectionReason,
      statusUpdatedBy: record.statusUpdatedBy,
      statusUpdatedByName: record.statusUpdatedByName,
      statusUpdatedAt: record.statusUpdatedAt,
      createdBy: record.createdBy,
      createdByName: record.createdByName,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    })),
    summary: {
      totalUsers: users.length,
      totalCargoRecords: cargoRecords.length,
      usersByRole: {
        admin: users.filter(u => u.role === 'admin').length,
        staff: users.filter(u => u.role === 'staff').length
      },
      cargoRecordsByStatus: {
        open: cargoRecords.filter(c => c.status === 'open').length,
        in_progress: cargoRecords.filter(c => c.status === 'in_progress').length,
        resolved: cargoRecords.filter(c => c.status === 'resolved').length,
        paid: cargoRecords.filter(c => c.status === 'paid').length,
        rejected: cargoRecords.filter(c => c.status === 'rejected').length
      }
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Kargo API çalışıyor (Local MongoDB)' });
});

// Örnek verileri ekle
const initializeData = () => {
  // Örnek kullanıcılar
  users.push(
    {
      id: nextUserId++,
      name: 'Ahmet Yılmaz',
      email: 'ahmet@kargo.com',
      role: 'staff',
      createdAt: new Date().toISOString()
    },
    {
      id: nextUserId++,
      name: 'Fatma Demir',
      email: 'fatma@kargo.com',
      role: 'staff',
      createdAt: new Date().toISOString()
    },
    {
      id: nextUserId++,
      name: 'Mehmet Kaya',
      email: 'mehmet@kargo.com',
      role: 'admin',
      createdAt: new Date().toISOString()
    }
  );
  
  // Örnek kargo kayıtları
  cargoRecords.push(
    {
      id: nextRecordId++,
      barcodeNumber: '1234567890123',
      exitNumber: 'EX2024001234',
      carrierCompany: 'aras',
      senderCompany: 'Teknoloji A.Ş.',
      recipientName: 'Mehmet Yılmaz',
      description: 'Paket hasarlı şekilde teslim edildi. Müşteri şikayeti mevcut. Kutu ezik ve içerik zarar görmüş durumda.',
      photos: [
        'https://images.pexels.com/photos/4481327/pexels-photo-4481327.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg?auto=compress&cs=tinysrgb&w=400'
      ],
      status: 'in_progress',
      statusUpdatedBy: '3',
      statusUpdatedByName: 'Mehmet Kaya',
      statusUpdatedAt: new Date('2024-01-15T10:30:00Z').toISOString(),
      createdBy: '1',
      createdByName: 'Ahmet Yılmaz',
      createdAt: new Date('2024-01-15T09:00:00Z').toISOString(),
      updatedAt: new Date('2024-01-15T10:30:00Z').toISOString()
    },
    {
      id: nextRecordId++,
      barcodeNumber: '2345678901234',
      exitNumber: 'EX2024001235',
      carrierCompany: 'ptt',
      senderCompany: 'Moda Dünyası Ltd.',
      recipientName: 'Ayşe Demir',
      description: 'Yanlış adrese teslim edilmiş paket. Doğru adres araştırılıyor ve müşteri ile iletişim kuruldu.',
      photos: [
        'https://images.pexels.com/photos/4481328/pexels-photo-4481328.jpeg?auto=compress&cs=tinysrgb&w=400'
      ],
      status: 'resolved',
      resolutionNote: 'Paket doğru adrese yeniden gönderildi ve müşteri memnuniyeti sağlandı.',
      statusUpdatedBy: '3',
      statusUpdatedByName: 'Mehmet Kaya',
      statusUpdatedAt: new Date('2024-01-14T15:45:00Z').toISOString(),
      createdBy: '2',
      createdByName: 'Fatma Demir',
      createdAt: new Date('2024-01-14T10:00:00Z').toISOString(),
      updatedAt: new Date('2024-01-14T15:45:00Z').toISOString()
    },
    {
      id: nextRecordId++,
      barcodeNumber: '3456789012345',
      exitNumber: 'EX2024001236',
      carrierCompany: 'surat',
      senderCompany: 'Kitap Evi Yayıncılık',
      recipientName: 'Ali Kaya',
      description: 'Geç teslim edilen paket için müşteri memnuniyetsizliği. Özür dilendi ve iade süreci tamamlandı.',
      photos: [],
      status: 'paid',
      paymentNote: '500 TL iade edildi. Banka transferi ile ödeme yapıldı.',
      statusUpdatedBy: '3',
      statusUpdatedByName: 'Mehmet Kaya',
      statusUpdatedAt: new Date('2024-01-13T09:20:00Z').toISOString(),
      createdBy: '1',
      createdByName: 'Ahmet Yılmaz',
      createdAt: new Date('2024-01-13T08:00:00Z').toISOString(),
      updatedAt: new Date('2024-01-13T09:20:00Z').toISOString()
    },
    {
      id: nextRecordId++,
      barcodeNumber: '4567890123456',
      exitNumber: 'EX2024001237',
      carrierCompany: 'yurtici',
      senderCompany: 'Elektronik Market',
      recipientName: 'Zeynep Özkan',
      description: 'Paket kayıp. Müşteri kargo durumunu sorgulayamıyor ve paket sistemde görünmüyor.',
      photos: [],
      status: 'open',
      createdBy: '2',
      createdByName: 'Fatma Demir',
      createdAt: new Date('2024-01-12T14:00:00Z').toISOString(),
      updatedAt: new Date('2024-01-12T14:00:00Z').toISOString()
    }
  );
  
  console.log('✅ Örnek veriler yüklendi:');
  console.log(`👥 Kullanıcı sayısı: ${users.length}`);
  console.log(`📦 Kargo kayıt sayısı: ${cargoRecords.length}`);
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Sunucu hatası' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint bulunamadı' });
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log('\n🚀 KARGO API SUNUCUSU BAŞLATILDI (Local MongoDB)');
  console.log('='.repeat(50));
  console.log(`🌐 Sunucu adresi: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Tüm veriler: http://localhost:${PORT}/api/all-data`);
  console.log('='.repeat(50));
  console.log('✅ Sunucu hazır ve çalışıyor!');
  
  // Örnek verileri yükle
  initializeData();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Sunucu kapatılıyor...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.log('⚠️ MongoDB bağlantısı zaten kapalı');
  }
  process.exit(0);
});




















