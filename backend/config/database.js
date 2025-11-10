const mongoose = require('mongoose');

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    // MongoDB Atlas bağlantı string'i
    // Bu string'i MongoDB Atlas'tan alacaksınız
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kargo:123456@cluster0.mongodb.net/kargo-takip?retryWrites=true&w=majority';
    
    console.log('🔄 MongoDB bağlantısı kuruluyor...');
    
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB bağlandı: ${conn.connection.host}`);
    
    // Bağlantı olaylarını dinle
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB bağlantı hatası:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB bağlantısı kesildi');
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;




















