const { Pool } = require('pg');
const dns = require('dns');
require('dotenv').config();

// Not: Bu dosya artık PostgreSQL kullanıyor (SQLite yerine)
// Veriler Supabase PostgreSQL veritabanında kalıcı olarak saklanır

// PostgreSQL bağlantı yönetimi
class DatabaseManager {
  constructor() {
    this.pool = null;
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
      this.connectionAttempts = (this.connectionAttempts || 0) + 1;
      
      console.log(`🔄 PostgreSQL bağlantısı deneniyor... (${this.connectionAttempts}/${this.maxRetries})`);
      
      // DATABASE_URL environment variable'ından bağlantı bilgilerini al
      const databaseUrl = process.env.DATABASE_URL;
      
      if (!databaseUrl) {
        const error = new Error('DATABASE_URL environment variable bulunamadı. Lütfen Render Environment ayarlarından DATABASE_URL ekleyin.');
        console.error('❌', error.message);
        console.error('💡 Render Dashboard → Environment → Add Environment Variable → Key: DATABASE_URL');
        reject(error);
        return;
      }
      
      try {
        // Supabase için connection string'i parse et ve IPv4 kullan
        let poolConfig;
        
        if (databaseUrl.includes('supabase')) {
          // DNS lookup'u IPv4'e zorla
          dns.setDefaultResultOrder('ipv4first');
          
          // Supabase için connection string'i direkt kullan (parse etme)
          // Session Pooler zaten doğru formatlanmış connection string kullanıyor
          poolConfig = {
            connectionString: databaseUrl,
            ssl: { 
              rejectUnauthorized: false,
              require: true
            },
            connectionTimeoutMillis: 10000,
          };
          
          try {
            const url = new URL(databaseUrl);
            console.log(`📡 Bağlantı: ${url.username}@${url.hostname}:${url.port || 5432}/${url.pathname.slice(1) || 'postgres'}`);
          } catch (e) {
            console.log(`📡 Bağlantı: Supabase PostgreSQL`);
          }
        } else {
          poolConfig = {
            connectionString: databaseUrl,
            ssl: false,
          };
        }
        
        this.pool = new Pool(poolConfig);

        // Bağlantıyı test et
        this.pool.query('SELECT NOW()', (err, result) => {
          if (err) {
            console.error(`❌ PostgreSQL bağlantı hatası (${this.connectionAttempts}/${this.maxRetries}):`, err.message);
            
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
            console.log('✅ PostgreSQL veritabanına başarıyla bağlandı.');
            console.log(`📊 Bağlantı zamanı: ${result.rows[0].now}`);
            resolve(this.pool);
          }
        });
      } catch (error) {
        console.error(`❌ PostgreSQL bağlantı hatası:`, error.message);
        reject(error);
      }
    });
  }

  /**
   * Veritabanı bağlantısını kontrol et
   */
  checkConnection() {
    return new Promise((resolve, reject) => {
      if (!this.pool || !this.isConnected) {
        reject(new Error('Veritabanı bağlantısı yok'));
        return;
      }

      this.pool.query('SELECT 1', (err) => {
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
      if (!this.pool) {
        resolve();
        return;
      }

      this.pool.end((err) => {
        if (err) {
          console.error('❌ Veritabanı kapatma hatası:', err.message);
          reject(err);
        } else {
          console.log('✅ Veritabanı bağlantısı güvenli şekilde kapatıldı');
          this.isConnected = false;
          this.pool = null;
          resolve();
        }
      });
    });
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
        'SELECT COUNT(*) as "userCount" FROM users',
        'SELECT COUNT(*) as "cargoCount" FROM cargo_records',
        'SELECT status, COUNT(*) as count FROM cargo_records GROUP BY status'
      ];

      Promise.all(queries.map(query => 
        new Promise((resolveQuery, rejectQuery) => {
          this.pool.query(query, (err, result) => {
            if (err) rejectQuery(err);
            else resolveQuery(result.rows);
          });
        })
      )).then(results => {
        resolve({
          users: parseInt(results[0][0].userCount),
          cargoRecords: parseInt(results[1][0].cargoCount),
          statusDistribution: results[2]
        });
      }).catch(reject);
    });
  }

  /**
   * SQL sorgusu çalıştır (SQLite uyumluluğu için wrapper)
   */
  query(sql, params = []) {
    if (!this.pool) {
      throw new Error('Veritabanı bağlantısı yok');
    }
    return this.pool.query(sql, params);
  }

  /**
   * SQLite db.all() uyumluluğu
   */
  all(sql, params, callback) {
    this.pool.query(sql, params, (err, result) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, result.rows);
      }
    });
  }

  /**
   * SQLite db.get() uyumluluğu
   */
  get(sql, params, callback) {
    this.pool.query(sql, params, (err, result) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, result.rows[0] || null);
      }
    });
  }

  /**
   * SQLite db.run() uyumluluğu
   */
  run(sql, params, callback) {
    this.pool.query(sql, params, (err, result) => {
      if (callback) {
        if (err) {
          callback(err);
        } else {
          // SQLite uyumluluğu için this.changes ve this.lastID
          // PostgreSQL'de lastID yok, ama INSERT için RETURNING kullanılabilir
          const mockThis = {
            changes: result.rowCount || 0,
            lastID: result.rows && result.rows[0] && result.rows[0].id ? result.rows[0].id : null
          };
          // Callback'i mockThis context'i ile çağır
          if (typeof callback === 'function') {
            callback.call(mockThis, null);
          }
        }
      }
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
      
      // Users tablosu
      await database.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          role VARCHAR(50) NOT NULL CHECK(role IN ('staff', 'admin')),
          password TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // CargoRecords tablosu
      await database.query(`
        CREATE TABLE IF NOT EXISTS cargo_records (
          id VARCHAR(255) PRIMARY KEY,
          barcode_number VARCHAR(255) NOT NULL,
          exit_number VARCHAR(255) NOT NULL,
          carrier_company VARCHAR(50) NOT NULL CHECK(carrier_company IN ('ptt', 'aras_aylin', 'aras_verar', 'aras_hatip', 'surat', 'verar', 'yurtici')),
          sender_company VARCHAR(255) NOT NULL,
          recipient_name VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          photos TEXT,
          status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'paid', 'rejected')),
          resolution_note TEXT,
          payment_note TEXT,
          rejection_reason TEXT,
          status_updated_by VARCHAR(255),
          status_updated_by_name VARCHAR(255),
          status_updated_at TIMESTAMP,
          created_by VARCHAR(255) NOT NULL,
          created_by_name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
          FOREIGN KEY (status_updated_by) REFERENCES users (id) ON DELETE SET NULL
        )
      `);

      // Mevcut tablolara eksik sütunları ekle (eğer yoksa)
      const alterQueries = [
        `ALTER TABLE cargo_records ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'open'`,
        `ALTER TABLE cargo_records ADD COLUMN IF NOT EXISTS resolution_note TEXT`,
        `ALTER TABLE cargo_records ADD COLUMN IF NOT EXISTS payment_note TEXT`,
        `ALTER TABLE cargo_records ADD COLUMN IF NOT EXISTS rejection_reason TEXT`,
        `ALTER TABLE cargo_records ADD COLUMN IF NOT EXISTS status_updated_by VARCHAR(255)`,
        `ALTER TABLE cargo_records ADD COLUMN IF NOT EXISTS status_updated_by_name VARCHAR(255)`,
        `ALTER TABLE cargo_records ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP`,
        `ALTER TABLE cargo_records ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(255)`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT`
      ];

      for (const query of alterQueries) {
        try {
          await database.query(query);
        } catch (err) {
          // Sütun zaten varsa hata verme
          if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
            console.error('Sütun ekleme hatası:', err.message);
          }
        }
      }

      // Sadece ilk kurulumda örnek kullanıcıları ekle
      const userCountResult = await database.query('SELECT COUNT(*) as count FROM users');
      const userCount = parseInt(userCountResult.rows[0].count);

      if (userCount === 0) {
        // Hiç kullanıcı yoksa örnek kullanıcıları ekle
        await database.query(`
          INSERT INTO users (id, name, email, role) VALUES 
          ('1', 'Ahmet Yılmaz', 'ahmet@kargo.com', 'staff'),
          ('2', 'Fatma Demir', 'fatma@kargo.com', 'staff'),
          ('3', 'Mehmet Kaya', 'mehmet@kargo.com', 'admin')
          ON CONFLICT (id) DO NOTHING
        `);
        console.log('✅ Örnek kullanıcılar eklendi (ilk kurulum)');
      } else {
        console.log(`✅ Mevcut kullanıcılar korunuyor (${userCount} adet)`);
      }

      console.log('✅ Veritabanı tabloları hazır');
      resolve();
    } catch (error) {
      console.error('❌ Veritabanı başlatma hatası:', error);
      reject(error);
    }
  });
};

module.exports = { db, initDatabase, dbManager, initializeDatabase, getDatabase };
