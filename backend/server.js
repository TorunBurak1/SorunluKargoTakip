const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/cargo-records', require('./routes/cargoRecords'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Kargo API çalışıyor' });
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
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Kargo API sunucusu http://localhost:${PORT} adresinde çalışıyor`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('Veritabanı başlatma hatası:', err);
    process.exit(1);
  });

