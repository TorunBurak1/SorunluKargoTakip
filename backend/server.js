const express = require('express');
const cors = require('cors');
const { initDatabase, dbManager, initializeDatabase, getDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Configuration
// Environment variable'dan allowed origins al, yoksa varsayılanları kullan
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'https://sorunlu-kargo-takip.netlify.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    ];

const corsOptions = {
  origin: function (origin, callback) {
    // Origin yoksa (örneğin Postman, mobile app) veya allowed origins içindeyse izin ver
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy tarafından izin verilmedi'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/cargo-records', require('./routes/cargoRecords'));

// Tüm verileri getir endpoint'i
app.get('/api/all-data', (req, res) => {
  const db = getDatabase();
  
  // Kullanıcıları getir
  const usersQuery = 'SELECT * FROM users ORDER BY created_at DESC';
  
  // Kargo kayıtlarını getir
  const cargoQuery = `
    SELECT 
      cr.*,
      u.name as created_by_name,
      su.name as status_updated_by_name
    FROM cargo_records cr
    LEFT JOIN users u ON cr.created_by = u.id
    LEFT JOIN users su ON cr.status_updated_by = su.id
    ORDER BY cr.created_at DESC
  `;
  
  db.all(usersQuery, [], (err, users) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    db.all(cargoQuery, [], (err, cargoRecords) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Kargo kayıtlarını formatla
      const formattedCargoRecords = cargoRecords.map(row => {
        // Photos'u parse et
        let photosArray = [];
        try {
          photosArray = JSON.parse(row.photos || '[]');
        } catch (parseErr) {
          console.error('JSON parse error for photos in getAllData:', parseErr, 'Row ID:', row.id);
          photosArray = [];
        }
        
        return {
          id: row.id,
          barcodeNumber: row.barcode_number,
          exitNumber: row.exit_number,
          carrierCompany: row.carrier_company,
          senderCompany: row.sender_company,
          recipientName: row.recipient_name,
          description: row.description,
          photos: photosArray,
          status: row.status || 'open',
          resolutionNote: row.resolution_note,
          paymentNote: row.payment_note,
          rejectionReason: row.rejection_reason,
          statusUpdatedBy: row.status_updated_by,
          statusUpdatedByName: row.status_updated_by_name,
          statusUpdatedAt: row.status_updated_at,
          createdBy: row.created_by,
          createdByName: row.created_by_name,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      });
      
      res.json({
        users: users,
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
    });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Kargo API çalışıyor' });
});

// Veritabanı durumu endpoint'i
app.get('/api/database/status', async (req, res) => {
  try {
    await dbManager.checkConnection();
    const stats = await dbManager.getStats();
    res.json({
      status: 'OK',
      connected: true,
      stats: stats,
      message: 'Veritabanı bağlantısı aktif'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      connected: false,
      error: error.message,
      message: 'Veritabanı bağlantı hatası'
    });
  }
});

// Constraint kaldırma endpoint'i (manuel olarak çalıştırılabilir)
app.post('/api/database/remove-constraints', async (req, res) => {
  try {
    const { removeCarrierCompanyConstraints } = require('./database');
    const result = await removeCarrierCompanyConstraints();
    res.json({
      status: 'OK',
      message: 'Constraint kaldırma işlemi tamamlandı',
      removed: result.removed,
      errors: result.errors
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      message: 'Constraint kaldırma hatası'
    });
  }
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

// Veritabanını başlat ve sunucuyu çalıştır
const startServer = async () => {
  try {
    console.log('🔄 Veritabanı başlatılıyor...');
    await initDatabase();
    
    console.log('🔄 Veritabanı bağlantısı kontrol ediliyor...');
    await dbManager.checkConnection();
    
    console.log('📊 Veritabanı istatistikleri alınıyor...');
    const stats = await dbManager.getStats();
    console.log(`👥 Kullanıcı sayısı: ${stats.users}`);
    console.log(`📦 Kargo kayıt sayısı: ${stats.cargoRecords}`);
    
    const dbType = dbManager.databaseType === 'postgresql' ? 'PostgreSQL' : 'SQLite';
    const dbTypeEmoji = dbManager.databaseType === 'postgresql' ? '🐘' : '💾';
    console.log(`✅ Veritabanı bağlantısı aktif ve kalıcı (${dbType})`);
    
    app.listen(PORT, () => {
      console.log(`\n🚀 KARGO API SUNUCUSU BAŞLATILDI (${dbType})`);
      console.log('='.repeat(50));
      console.log(`🌐 Sunucu adresi: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🗄️  Veritabanı durumu: http://localhost:${PORT}/api/database/status`);
      console.log(`📋 Tüm veriler: http://localhost:${PORT}/api/all-data`);
      console.log('='.repeat(50));
      console.log('✅ Sunucu hazır ve çalışıyor!');
      console.log(`${dbTypeEmoji} Veriler ${dbType} veritabanında kalıcı olarak saklanıyor`);
    });
  } catch (err) {
    console.error('❌ Sunucu başlatma hatası:', err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Sunucu kapatılıyor...');
  try {
    await dbManager.close();
    console.log('✅ Veritabanı bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Veritabanı kapatma hatası:', error.message);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Sunucu kapatılıyor (SIGTERM)...');
  try {
    await dbManager.close();
    console.log('✅ Veritabanı bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Veritabanı kapatma hatası:', error.message);
  }
  process.exit(0);
});

// Sunucuyu başlat
startServer();

