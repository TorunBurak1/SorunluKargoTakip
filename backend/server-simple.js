const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// JSON dosya yolu
const dataFile = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Veri okuma fonksiyonu
const readData = () => {
  try {
    const data = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Veri okuma hatası:', error);
    return { users: [], cargoRecords: [] };
  }
};

// Veri yazma fonksiyonu
const writeData = (data) => {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Veri yazma hatası:', error);
    return false;
  }
};

// ID oluşturma fonksiyonu
const generateId = () => {
  return Date.now().toString();
};

// Kullanıcı işlemleri
app.get('/api/users', (req, res) => {
  try {
    const data = readData();
    res.json(data.users);
  } catch (error) {
    console.error('Kullanıcılar getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre gerekli' });
    }
    
    if (password !== '123456') {
      return res.status(401).json({ error: 'Geçersiz şifre' });
    }
    
    const data = readData();
    const user = data.users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Kargo kayıt işlemleri
app.get('/api/cargo-records', (req, res) => {
  try {
    const data = readData();
    res.json(data.cargoRecords);
  } catch (error) {
    console.error('Kargo kayıtları getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cargo-records/:id', (req, res) => {
  try {
    const data = readData();
    const record = data.cargoRecords.find(r => r.id === req.params.id);
    
    if (!record) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }
    
    res.json(record);
  } catch (error) {
    console.error('Kargo kaydı getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cargo-records', (req, res) => {
  try {
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
    
    const data = readData();
    const newRecord = {
      id: generateId(),
      barcodeNumber,
      exitNumber,
      carrierCompany,
      senderCompany,
      recipientName,
      description,
      photos,
      status: 'open',
      resolutionNote: null,
      paymentNote: null,
      rejectionReason: null,
      statusUpdatedBy: null,
      statusUpdatedByName: null,
      statusUpdatedAt: null,
      createdBy,
      createdByName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    data.cargoRecords.push(newRecord);
    
    if (writeData(data)) {
      res.status(201).json(newRecord);
    } else {
      res.status(500).json({ error: 'Veri kaydedilemedi' });
    }
  } catch (error) {
    console.error('Kargo kaydı oluşturma hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/cargo-records/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      resolutionNote,
      paymentNote,
      rejectionReason,
      updatedBy,
      updatedByName
    } = req.body;
    
    const data = readData();
    const recordIndex = data.cargoRecords.findIndex(r => r.id === id);
    
    if (recordIndex === -1) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }
    
    const record = data.cargoRecords[recordIndex];
    
    // Durumu güncelle
    record.status = status;
    record.resolutionNote = resolutionNote || null;
    record.paymentNote = paymentNote || null;
    record.rejectionReason = rejectionReason || null;
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
    
    if (writeData(data)) {
      res.json(record);
    } else {
      res.status(500).json({ error: 'Veri kaydedilemedi' });
    }
  } catch (error) {
    console.error('Durum güncelleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Kargo kaydını sil
app.delete('/api/cargo-records/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = readData();
    const recordIndex = data.cargoRecords.findIndex(r => r.id === id);
    
    if (recordIndex === -1) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }
    
    // Kaydı sil
    data.cargoRecords.splice(recordIndex, 1);
    
    if (writeData(data)) {
      res.json({ message: 'Kayıt başarıyla silindi' });
    } else {
      res.status(500).json({ error: 'Veri kaydedilemedi' });
    }
  } catch (error) {
    console.error('Kargo kaydı silme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Tüm verileri getir endpoint'i
app.get('/api/all-data', (req, res) => {
  try {
    const data = readData();
    
    res.json({
      users: data.users,
      cargoRecords: data.cargoRecords,
      summary: {
        totalUsers: data.users.length,
        totalCargoRecords: data.cargoRecords.length,
        usersByRole: {
          admin: data.users.filter(u => u.role === 'admin').length,
          staff: data.users.filter(u => u.role === 'staff').length
        },
        cargoRecordsByStatus: {
          open: data.cargoRecords.filter(c => c.status === 'open').length,
          in_progress: data.cargoRecords.filter(c => c.status === 'in_progress').length,
          resolved: data.cargoRecords.filter(c => c.status === 'resolved').length,
          paid: data.cargoRecords.filter(c => c.status === 'paid').length,
          rejected: data.cargoRecords.filter(c => c.status === 'rejected').length
        }
      }
    });
  } catch (error) {
    console.error('All-data endpoint hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Kargo API çalışıyor (JSON File System)' });
});

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
  console.log('\n🚀 KARGO API SUNUCUSU BAŞLATILDI (JSON File System)');
  console.log('='.repeat(50));
  console.log(`🌐 Sunucu adresi: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Tüm veriler: http://localhost:${PORT}/api/all-data`);
  console.log(`📁 Veri dosyası: ${dataFile}`);
  console.log('='.repeat(50));
  console.log('✅ Sunucu hazır ve çalışıyor!');
  console.log('💾 Veriler JSON dosyasında saklanıyor - Kalıcı!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Sunucu kapatılıyor...');
  console.log('✅ Veriler JSON dosyasında saklandı');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Sunucu kapatılıyor (SIGTERM)...');
  console.log('✅ Veriler JSON dosyasında saklandı');
  process.exit(0);
});

