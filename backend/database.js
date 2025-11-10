const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Veritabanı dosyası yolu - mutlak yol kullan
const dbPath = path.resolve(__dirname, 'kargo.db');

// Veritabanı bağlantı yönetimi
class DatabaseManager {
  constructor() {
    this.db = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 saniye
  }

  /**
   * Veritabanına bağlan
   */
  connect() {
    return new Promise((resolve, reject) => {
      this.connectionAttempts++;
      
      console.log(`🔄 Veritabanı bağlantısı deneniyor... (${this.connectionAttempts}/${this.maxRetries})`);
      console.log(`📁 Veritabanı yolu: ${dbPath}`);
      
      // Veritabanı dizinini oluştur
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`📁 Veritabanı dizini oluşturuldu: ${dbDir}`);
      }
      
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error(`❌ Veritabanı bağlantı hatası (${this.connectionAttempts}/${this.maxRetries}):`, err.message);
          
          if (this.connectionAttempts < this.maxRetries) {
            console.log(`⏳ ${this.retryDelay}ms sonra tekrar deneniyor...`);
            setTimeout(() => {
              this.connect().then(resolve).catch(reject);
            }, this.retryDelay);
          } else {
            reject(err);
          }
        } else {
          this.isConnected = true;
          console.log('✅ SQLite veritabanına başarıyla bağlandı.');
          console.log(`📊 Veritabanı dosyası: ${dbPath}`);
          
          // Bağlantı ayarları - veri kalıcılığı için
          this.db.run('PRAGMA foreign_keys = ON');
          this.db.run('PRAGMA journal_mode = DELETE'); // WAL yerine DELETE mode
          this.db.run('PRAGMA synchronous = FULL'); // Veri güvenliği için FULL
          this.db.run('PRAGMA cache_size = 1000');
          this.db.run('PRAGMA temp_store = MEMORY');
          
          resolve(this.db);
        }
      });
    });
  }

  /**
   * Veritabanı bağlantısını kontrol et
   */
  checkConnection() {
    return new Promise((resolve, reject) => {
      if (!this.db || !this.isConnected) {
        reject(new Error('Veritabanı bağlantısı yok'));
        return;
      }

      this.db.get('SELECT 1', (err) => {
        if (err) {
          this.isConnected = false;
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * Veritabanını kapat
   */
  close() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      // Veritabanını güvenli şekilde kapat
      this.db.close((err) => {
        if (err) {
          console.error('❌ Veritabanı kapatma hatası:', err.message);
          reject(err);
        } else {
          console.log('✅ Veritabanı bağlantısı güvenli şekilde kapatıldı');
          this.isConnected = false;
          this.db = null;
          resolve();
        }
      });
    });
  }

  /**
   * Veritabanı dosyasının varlığını kontrol et
   */
  checkDatabaseFile() {
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      console.log(`📁 Veritabanı dosyası: ${dbPath}`);
      console.log(`📊 Boyut: ${(stats.size / 1024).toFixed(2)} KB`);
      return true;
    }
    return false;
  }

  /**
   * Veritabanı istatistiklerini al
   */
  getStats() {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Veritabanı bağlantısı yok'));
        return;
      }

      const queries = [
        'SELECT COUNT(*) as userCount FROM users',
        'SELECT COUNT(*) as cargoCount FROM cargo_records',
        'SELECT status, COUNT(*) as count FROM cargo_records GROUP BY status'
      ];

      Promise.all(queries.map(query => 
        new Promise((resolveQuery, rejectQuery) => {
          this.db.all(query, (err, rows) => {
            if (err) rejectQuery(err);
            else resolveQuery(rows);
          });
        })
      )).then(results => {
        resolve({
          users: results[0][0].userCount,
          cargoRecords: results[1][0].cargoCount,
          statusDistribution: results[2]
        });
      }).catch(reject);
    });
  }
}

// Global veritabanı yöneticisi
const dbManager = new DatabaseManager();

// Veritabanı bağlantısını başlat
let db = null;

const initializeDatabase = async () => {
  try {
    db = await dbManager.connect();
    return db;
  } catch (err) {
    console.error('❌ Veritabanı başlatılamadı:', err.message);
    throw err;
  }
};

// Veritabanı bağlantısını al
const getDatabase = () => {
  if (!db) {
    throw new Error('Veritabanı bağlantısı henüz kurulmamış');
  }
  return db;
};

// Veritabanı tablolarını oluştur
const initDatabase = () => {
  return new Promise(async (resolve, reject) => {
    try {
      // Veritabanı bağlantısını başlat
      const database = await initializeDatabase();
      
      database.serialize(() => {
      // Users tablosu
      database.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('staff', 'admin')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // CargoRecords tablosu
      database.run(`CREATE TABLE IF NOT EXISTS cargo_records (
        id TEXT PRIMARY KEY,
        barcode_number TEXT NOT NULL,
        exit_number TEXT NOT NULL,
        carrier_company TEXT NOT NULL CHECK(carrier_company IN ('ptt', 'aras', 'surat', 'yurtici', 'verar')),
        sender_company TEXT NOT NULL,
        recipient_name TEXT NOT NULL,
        description TEXT NOT NULL,
        photos TEXT, -- JSON array olarak saklanacak
        status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'paid', 'rejected')),
        resolution_note TEXT, -- Çözülme sebebi
        payment_note TEXT, -- Ödeme açıklaması
        rejection_reason TEXT, -- Reddedilme sebebi
        status_updated_by TEXT, -- Durumu güncelleyen kişi
        status_updated_by_name TEXT, -- Durumu güncelleyen kişinin adı
        status_updated_at DATETIME, -- Durum güncelleme tarihi
        created_by TEXT NOT NULL,
        created_by_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id),
        FOREIGN KEY (status_updated_by) REFERENCES users (id)
      )`);

      // Mevcut tabloya yeni sütunları ekle (eğer yoksa) - hata kontrolü ile
      database.run(`ALTER TABLE cargo_records ADD COLUMN status TEXT DEFAULT 'open'`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Status sütunu eklenirken hata:', err.message);
        }
      });
      database.run(`ALTER TABLE cargo_records ADD COLUMN resolution_note TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Resolution note sütunu eklenirken hata:', err.message);
        }
      });
      database.run(`ALTER TABLE cargo_records ADD COLUMN payment_note TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Payment note sütunu eklenirken hata:', err.message);
        }
      });
      database.run(`ALTER TABLE cargo_records ADD COLUMN rejection_reason TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Rejection reason sütunu eklenirken hata:', err.message);
        }
      });
      database.run(`ALTER TABLE cargo_records ADD COLUMN status_updated_by TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Status updated by sütunu eklenirken hata:', err.message);
        }
      });
      database.run(`ALTER TABLE cargo_records ADD COLUMN status_updated_by_name TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Status updated by name sütunu eklenirken hata:', err.message);
        }
      });
      database.run(`ALTER TABLE cargo_records ADD COLUMN status_updated_at DATETIME`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Status updated at sütunu eklenirken hata:', err.message);
        }
      });
      database.run(`ALTER TABLE cargo_records ADD COLUMN recipient_name TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Recipient name sütunu eklenirken hata:', err.message);
        }
      });
      database.run(`ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Users updated_at sütunu eklenirken hata:', err.message);
        }
      });
      database.run(`ALTER TABLE users ADD COLUMN password TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Users password sütunu eklenirken hata:', err.message);
        }
      });

      // Sadece ilk kurulumda örnek kullanıcıları ekle
      database.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) {
          console.error('Kullanıcı sayısı kontrol edilemedi:', err.message);
        } else if (row.count === 0) {
          // Hiç kullanıcı yoksa örnek kullanıcıları ekle
          database.run(`INSERT INTO users (id, name, email, role) VALUES 
            ('1', 'Ahmet Yılmaz', 'ahmet@kargo.com', 'staff'),
            ('2', 'Fatma Demir', 'fatma@kargo.com', 'staff'),
            ('3', 'Mehmet Kaya', 'mehmet@kargo.com', 'admin')`);
          console.log('✅ Örnek kullanıcılar eklendi (ilk kurulum)');
        } else {
          console.log(`✅ Mevcut kullanıcılar korunuyor (${row.count} adet)`);
        }
      });

      database.run(`PRAGMA foreign_keys = ON`, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { db, initDatabase, dbManager, initializeDatabase, getDatabase };

