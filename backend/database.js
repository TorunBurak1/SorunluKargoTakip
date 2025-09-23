const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı dosyası yolu
const dbPath = path.join(__dirname, 'kargo.db');

// Veritabanı bağlantısı
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Veritabanı bağlantı hatası:', err.message);
  } else {
    console.log('SQLite veritabanına bağlandı.');
  }
});

// Veritabanı tablolarını oluştur
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users tablosu
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('staff', 'admin')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // CargoRecords tablosu
      db.run(`CREATE TABLE IF NOT EXISTS cargo_records (
        id TEXT PRIMARY KEY,
        barcode_number TEXT NOT NULL,
        exit_number TEXT NOT NULL,
        carrier_company TEXT NOT NULL CHECK(carrier_company IN ('aras_aylin', 'aras_verar', 'aras_hatip', 'ptt', 'surat', 'verar', 'yurtici')),
        sender_company TEXT NOT NULL,
        description TEXT NOT NULL,
        photos TEXT, -- JSON array olarak saklanacak
        created_by TEXT NOT NULL,
        created_by_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id)
      )`);

      // Örnek kullanıcıları ekle
      db.run(`INSERT OR IGNORE INTO users (id, name, email, role) VALUES 
        ('1', 'Ahmet Yılmaz', 'ahmet@kargo.com', 'staff'),
        ('2', 'Fatma Demir', 'fatma@kargo.com', 'staff'),
        ('3', 'Mehmet Kaya', 'mehmet@kargo.com', 'admin')`);

      // Örnek kargo kayıtlarını ekle
      db.run(`INSERT OR IGNORE INTO cargo_records 
        (id, barcode_number, exit_number, carrier_company, sender_company, description, photos, created_by, created_by_name) VALUES 
        ('1', '1234567890123', 'EX2024001234', 'aras_aylin', 'Teknoloji A.Ş.', 'Paket hasarlı şekilde teslim edildi. Müşteri şikayeti mevcut. Kutu ezik ve içerik zarar görmüş durumda.', '["https://images.pexels.com/photos/4481327/pexels-photo-4481327.jpeg?auto=compress&cs=tinysrgb&w=400","https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg?auto=compress&cs=tinysrgb&w=400"]', '1', 'Ahmet Yılmaz'),
        ('2', '2345678901234', 'EX2024001235', 'ptt', 'Moda Dünyası Ltd.', 'Yanlış adrese teslim edilmiş paket. Doğru adres araştırılıyor ve müşteri ile iletişim kuruldu.', '["https://images.pexels.com/photos/4481328/pexels-photo-4481328.jpeg?auto=compress&cs=tinysrgb&w=400"]', '2', 'Fatma Demir'),
        ('3', '3456789012345', 'EX2024001236', 'surat', 'Kitap Evi Yayıncılık', 'Geç teslim edilen paket için müşteri memnuniyetsizliği. Özür dilendi ve iade süreci tamamlandı.', '[]', '1', 'Ahmet Yılmaz'),
        ('4', '4567890123456', 'EX2024001237', 'yurtici', 'Elektronik Market', 'Paket kayıp. Müşteri kargo durumunu sorgulayamıyor ve paket sistemde görünmüyor.', '[]', '2', 'Fatma Demir')`);

      db.run(`PRAGMA foreign_keys = ON`, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};

module.exports = { db, initDatabase };

