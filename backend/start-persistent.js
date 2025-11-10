#!/usr/bin/env node

/**
 * Kalıcı Veritabanı ile Kargo API Sunucusu
 * Bu script SQLite veritabanını kullanır ve veriler kalıcı olarak saklanır
 */

const express = require('express');
const cors = require('cors');
const { initDatabase, dbManager, initializeDatabase, getDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
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
      const formattedCargoRecords = cargoRecords.map(row => ({
        id: row.id,
        barcodeNumber: row.barcode_number,
        exitNumber: row.exit_number,
        carrierCompany: row.carrier_company,
        senderCompany: row.sender_company,
        recipientName: row.recipient_name,
        description: row.description,
        photos: JSON.parse(row.photos || '[]'),
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
      }));
      
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
  res.json({ status: 'OK', message: 'Kargo API çalışıyor (Kalıcı SQLite)' });
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
      message: 'Veritabanı bağlantısı aktif (Kalıcı SQLite)',
      databaseType: 'SQLite',
      persistent: true
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
    console.log('🔄 Kalıcı SQLite veritabanı başlatılıyor...');
    await initDatabase();
    
    console.log('🔄 Veritabanı bağlantısı kontrol ediliyor...');
    await dbManager.checkConnection();
    
    console.log('📊 Veritabanı istatistikleri alınıyor...');
    const stats = await dbManager.getStats();
    console.log(`👥 Kullanıcı sayısı: ${stats.users}`);
    console.log(`📦 Kargo kayıt sayısı: ${stats.cargoRecords}`);
    
    console.log('✅ Veritabanı bağlantısı aktif ve kalıcı (PostgreSQL)');
    
    app.listen(PORT, () => {
      console.log('\n🚀 KARGO API SUNUCUSU BAŞLATILDI (KALICI SQLITE)');
      console.log('='.repeat(60));
      console.log(`🌐 Sunucu adresi: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🗄️  Veritabanı durumu: http://localhost:${PORT}/api/database/status`);
      console.log(`📋 Tüm veriler: http://localhost:${PORT}/api/all-data`);
      console.log('='.repeat(60));
      console.log('✅ Sunucu hazır ve çalışıyor!');
      console.log('💾 Veriler SQLite dosyasında kalıcı olarak saklanıyor');
      console.log('🔄 Program kapatılıp açıldığında veriler korunacak');
      console.log('='.repeat(60));
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
    console.log('✅ Veritabanı bağlantısı güvenli şekilde kapatıldı');
    console.log('💾 Veriler korundu');
  } catch (error) {
    console.error('❌ Veritabanı kapatma hatası:', error.message);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Sunucu kapatılıyor (SIGTERM)...');
  try {
    await dbManager.close();
    console.log('✅ Veritabanı bağlantısı güvenli şekilde kapatıldı');
    console.log('💾 Veriler korundu');
  } catch (error) {
    console.error('❌ Veritabanı kapatma hatası:', error.message);
  }
  process.exit(0);
});

// Sunucuyu başlat
startServer();

















