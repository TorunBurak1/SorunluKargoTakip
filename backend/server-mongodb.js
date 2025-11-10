const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB bağlantısını başlat
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/users', require('./routes/users-mongodb'));
app.use('/api/cargo-records', require('./routes/cargoRecords-mongodb'));

// Tüm verileri getir endpoint'i
app.get('/api/all-data', async (req, res) => {
  try {
    const User = require('./models/User');
    const CargoRecord = require('./models/CargoRecord');
    
    // Kullanıcıları getir
    const users = await User.find().sort({ createdAt: -1 });
    
    // Kargo kayıtlarını getir
    const cargoRecords = await CargoRecord.find()
      .populate('createdBy', 'name email')
      .populate('statusUpdatedBy', 'name email')
      .sort({ createdAt: -1 });
    
    // Kargo kayıtlarını formatla
    const formattedCargoRecords = cargoRecords.map(record => ({
      id: record._id.toString(),
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
      statusUpdatedBy: record.statusUpdatedBy?._id?.toString(),
      statusUpdatedByName: record.statusUpdatedByName,
      statusUpdatedAt: record.statusUpdatedAt,
      createdBy: record.createdBy._id.toString(),
      createdByName: record.createdByName,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }));
    
    res.json({
      users: users.map(user => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      })),
      cargoRecords: formattedCargoRecords,
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
  } catch (error) {
    console.error('All-data endpoint hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Kargo API çalışıyor (MongoDB)' });
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
  console.log('\n🚀 KARGO API SUNUCUSU BAŞLATILDI (MongoDB)');
  console.log('='.repeat(50));
  console.log(`🌐 Sunucu adresi: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Tüm veriler: http://localhost:${PORT}/api/all-data`);
  console.log('='.repeat(50));
  console.log('✅ Sunucu hazır ve çalışıyor!');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Sunucu kapatılıyor...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ MongoDB kapatma hatası:', error.message);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Sunucu kapatılıyor (SIGTERM)...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ MongoDB kapatma hatası:', error.message);
  }
  process.exit(0);
});




















