const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const dns = require('dns');
require('dotenv').config();

// Bu dosya hem PostgreSQL hem de SQLite destekler
// DATABASE_URL varsa PostgreSQL kullanır, yoksa SQLite kullanır (yerel geliştirme için)

// Veritabanı yönetimi (PostgreSQL veya SQLite)
class DatabaseManager {
  constructor() {
    this.pool = null;
    this.db = null; // SQLite için
    this.isConnected = false;
    this.databaseType = null; // 'postgresql' veya 'sqlite'
    this.connectionAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 saniye
  }

  /**
   * Veritabanına bağlan
   */
  async connect() {
    return new Promise(async (resolve, reject) => {
      // DATABASE_URL environment variable'ından bağlantı bilgilerini al
      const databaseUrl = process.env.DATABASE_URL;
      
      // DATABASE_URL yoksa SQLite kullan (yerel geliştirme için)
      if (!databaseUrl) {
        console.log('💡 DATABASE_URL bulunamadı, SQLite kullanılıyor (yerel geliştirme)');
        return this.connectSQLite(resolve, reject);
      }
      
      // DATABASE_URL varsa PostgreSQL kullan
      this.connectionAttempts = (this.connectionAttempts || 0) + 1;
      console.log(`🔄 PostgreSQL bağlantısı deneniyor... (${this.connectionAttempts}/${this.maxRetries})`);
      
      try {
        // Supabase için connection string'i parse et ve IPv4 kullan
        let poolConfig;
        
        // DNS lookup'u IPv4'e zorla
        dns.setDefaultResultOrder('ipv4first');
        
        // Supabase veya Neon için özel işlem
        if (databaseUrl.includes('supabase')) {
          // Connection string'den query parametrelerini temizle
          let cleanUrl = databaseUrl.split('?')[0];
          
          try {
            const url = new URL(cleanUrl);
            const hostname = url.hostname;
            const port = url.port || 5432;
            const database = url.pathname.slice(1) || 'postgres';
            const username = url.username || 'postgres';
            const password = url.password || '';
            
            // Hostname'i IPv4 adresine çevir
            const ipv4Address = await new Promise((resolve, reject) => {
              dns.lookup(hostname, { family: 4, all: false }, (err, address) => {
                if (err) {
                  console.error('⚠️ DNS lookup hatası, hostname kullanılıyor:', err.message);
                  resolve(hostname); // Hata durumunda hostname'i kullan
                } else {
                  resolve(address); // IPv4 adresini kullan
                }
              });
            });
            
            console.log(`📡 Bağlantı: ${username}@${ipv4Address}:${port}/${database} (IPv4)`);
            
            poolConfig = {
              host: ipv4Address,
              port: parseInt(port),
              database: database,
              user: username,
              password: password,
              ssl: { 
                rejectUnauthorized: false
              },
              connectionTimeoutMillis: 10000,
              keepAlive: true,
              keepAliveInitialDelayMillis: 10000,
            };
          } catch (e) {
            console.error('⚠️ Connection string parse edilemedi, connection string kullanılıyor:', e.message);
            poolConfig = {
              connectionString: cleanUrl,
              ssl: { 
                rejectUnauthorized: false
              },
              connectionTimeoutMillis: 10000,
            };
          }
        } else if (databaseUrl.includes('neon')) {
          // Neon için connection string'i direkt kullan (SSL gerekli)
          // Connection string'deki query parametrelerini koru
          poolConfig = {
            connectionString: databaseUrl,
            ssl: { 
              rejectUnauthorized: false,
              require: true
            },
            connectionTimeoutMillis: 10000,
          };
          
          try {
            // URL parse için query parametrelerini geçici olarak kaldır
            const urlWithoutQuery = databaseUrl.split('?')[0];
            const url = new URL(urlWithoutQuery);
            console.log(`📡 Bağlantı: ${url.username}@${url.hostname}:${url.port || 5432}/${url.pathname.slice(1) || 'neondb'} (Neon)`);
          } catch (e) {
            console.log(`📡 Bağlantı: Neon PostgreSQL (${databaseUrl.substring(0, 50)}...)`);
          }
        } else {
          // Diğer PostgreSQL veritabanları
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
            this.databaseType = 'postgresql';
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
   * SQLite veritabanına bağlan (yerel geliştirme için)
   */
  connectSQLite(resolve, reject) {
    const dbPath = path.join(__dirname, 'kargo.db');
    
    console.log(`🔄 SQLite veritabanı bağlantısı kuruluyor: ${dbPath}`);
    
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ SQLite bağlantı hatası:', err.message);
        reject(err);
        return;
      }
      
      this.isConnected = true;
      this.databaseType = 'sqlite';
      console.log('✅ SQLite veritabanına başarıyla bağlandı.');
      console.log(`📁 Veritabanı dosyası: ${dbPath}`);
      resolve(this.db);
    });
  }

  /**
   * Veritabanı bağlantısını kontrol et
   */
  checkConnection() {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Veritabanı bağlantısı yok'));
        return;
      }

      if (this.databaseType === 'postgresql') {
        if (!this.pool) {
          reject(new Error('PostgreSQL bağlantısı yok'));
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
      } else if (this.databaseType === 'sqlite') {
        if (!this.db) {
          reject(new Error('SQLite bağlantısı yok'));
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
      } else {
        reject(new Error('Bilinmeyen veritabanı tipi'));
      }
    });
  }

  /**
   * Veritabanını kapat
   */
  close() {
    return new Promise((resolve, reject) => {
      if (this.databaseType === 'postgresql') {
        if (!this.pool) {
          resolve();
          return;
        }
        this.pool.end((err) => {
          if (err) {
            console.error('❌ PostgreSQL kapatma hatası:', err.message);
            reject(err);
          } else {
            console.log('✅ PostgreSQL bağlantısı güvenli şekilde kapatıldı');
            this.isConnected = false;
            this.pool = null;
            resolve();
          }
        });
      } else if (this.databaseType === 'sqlite') {
        if (!this.db) {
          resolve();
          return;
        }
        this.db.close((err) => {
          if (err) {
            console.error('❌ SQLite kapatma hatası:', err.message);
            reject(err);
          } else {
            console.log('✅ SQLite bağlantısı güvenli şekilde kapatıldı');
            this.isConnected = false;
            this.db = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
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

      if (this.databaseType === 'postgresql') {
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
      } else if (this.databaseType === 'sqlite') {
        const queries = [
          'SELECT COUNT(*) as userCount FROM users',
          'SELECT COUNT(*) as cargoCount FROM cargo_records',
          'SELECT status, COUNT(*) as count FROM cargo_records GROUP BY status'
        ];

        Promise.all(queries.map(query => 
          new Promise((resolveQuery, rejectQuery) => {
            this.db.all(query, [], (err, rows) => {
              if (err) rejectQuery(err);
              else resolveQuery(rows);
            });
          })
        )).then(results => {
          resolve({
            users: parseInt(results[0][0].userCount),
            cargoRecords: parseInt(results[1][0].cargoCount),
            statusDistribution: results[2]
          });
        }).catch(reject);
      } else {
        reject(new Error('Bilinmeyen veritabanı tipi'));
      }
    });
  }

  /**
   * SQL sorgusunu PostgreSQL formatına çevir (? -> $1, $2, $3)
   */
  convertToPostgresSQL(sql, params) {
    if (!params || params.length === 0) {
      return { sql, params };
    }
    
    let paramIndex = 1;
    const convertedSQL = sql.replace(/\?/g, () => `$${paramIndex++}`);
    return { sql: convertedSQL, params };
  }

  /**
   * SQL sorgusu çalıştır
   */
  query(sql, params = []) {
    if (this.databaseType === 'postgresql') {
      if (!this.pool) {
        throw new Error('PostgreSQL bağlantısı yok');
      }
      const { sql: pgSQL, params: pgParams } = this.convertToPostgresSQL(sql, params);
      return this.pool.query(pgSQL, pgParams);
    } else if (this.databaseType === 'sqlite') {
      if (!this.db) {
        throw new Error('SQLite bağlantısı yok');
      }
      return new Promise((resolve, reject) => {
        this.db.all(sql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve({ rows });
          }
        });
      });
    } else {
      throw new Error('Veritabanı bağlantısı yok');
    }
  }

  /**
   * SQLite db.all() uyumluluğu
   */
  all(sql, params, callback) {
    if (this.databaseType === 'postgresql') {
      const { sql: pgSQL, params: pgParams } = this.convertToPostgresSQL(sql, params);
      this.pool.query(pgSQL, pgParams, (err, result) => {
        if (err) {
          callback(err, null);
        } else {
          callback(null, result.rows);
        }
      });
    } else if (this.databaseType === 'sqlite') {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          callback(err, null);
        } else {
          callback(null, rows);
        }
      });
    } else {
      callback(new Error('Veritabanı bağlantısı yok'), null);
    }
  }

  /**
   * SQLite db.get() uyumluluğu
   */
  get(sql, params, callback) {
    if (this.databaseType === 'postgresql') {
      const { sql: pgSQL, params: pgParams } = this.convertToPostgresSQL(sql, params);
      this.pool.query(pgSQL, pgParams, (err, result) => {
        if (err) {
          callback(err, null);
        } else {
          callback(null, result.rows[0] || null);
        }
      });
    } else if (this.databaseType === 'sqlite') {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          callback(err, null);
        } else {
          callback(null, row || null);
        }
      });
    } else {
      callback(new Error('Veritabanı bağlantısı yok'), null);
    }
  }

  /**
   * SQLite db.run() uyumluluğu
   */
  run(sql, params, callback) {
    if (this.databaseType === 'postgresql') {
      const { sql: pgSQL, params: pgParams } = this.convertToPostgresSQL(sql, params);
      this.pool.query(pgSQL, pgParams, (err, result) => {
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
    } else if (this.databaseType === 'sqlite') {
      this.db.run(sql, params, function(err) {
        if (callback) {
          if (err) {
            callback(err);
          } else {
            // SQLite'ın kendi context'ini kullan (this.changes ve this.lastID)
            callback.call(this, null);
          }
        }
      });
    } else {
      if (callback) {
        callback(new Error('Veritabanı bağlantısı yok'));
      }
    }
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
  if (!dbManager.isConnected) {
    throw new Error('Veritabanı bağlantısı henüz kurulmamış');
  }
  // PostgreSQL için dbManager'ı döndür (SQLite uyumluluğu için get/all/run metodları var)
  return dbManager;
};

// Veritabanı tablolarını oluştur
const initDatabase = () => {
  return new Promise(async (resolve, reject) => {
    try {
      // Veritabanı bağlantısını başlat
      const database = await initializeDatabase();
      const dbType = dbManager.databaseType;
      
      if (dbType === 'postgresql') {
        // PostgreSQL için
        // Users tablosu
        await dbManager.query(`
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
        await dbManager.query(`
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

        // Mevcut tablolara eksik sütunları ekle (PostgreSQL için)
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
            await dbManager.query(query);
          } catch (err) {
            // Sütun zaten varsa hata verme
            if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
              console.error('Sütun ekleme hatası:', err.message);
            }
          }
        }
      } else if (dbType === 'sqlite') {
        // SQLite için
        // Users tablosu
        await dbManager.query(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('staff', 'admin')),
            password TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // CargoRecords tablosu
        await dbManager.query(`
          CREATE TABLE IF NOT EXISTS cargo_records (
            id TEXT PRIMARY KEY,
            barcode_number TEXT NOT NULL,
            exit_number TEXT NOT NULL,
            carrier_company TEXT NOT NULL CHECK(carrier_company IN ('ptt', 'aras_aylin', 'aras_verar', 'aras_hatip', 'surat', 'verar', 'yurtici')),
            sender_company TEXT NOT NULL,
            recipient_name TEXT NOT NULL,
            description TEXT NOT NULL,
            photos TEXT,
            status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'paid', 'rejected')),
            resolution_note TEXT,
            payment_note TEXT,
            rejection_reason TEXT,
            status_updated_by TEXT,
            status_updated_by_name TEXT,
            status_updated_at DATETIME,
            created_by TEXT NOT NULL,
            created_by_name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
            FOREIGN KEY (status_updated_by) REFERENCES users (id) ON DELETE SET NULL
          )
        `);

        // SQLite için sütun ekleme (IF NOT EXISTS desteklemez, manuel kontrol gerekir)
        const columnsToAdd = [
          { table: 'cargo_records', column: 'status', type: 'TEXT DEFAULT "open"' },
          { table: 'cargo_records', column: 'resolution_note', type: 'TEXT' },
          { table: 'cargo_records', column: 'payment_note', type: 'TEXT' },
          { table: 'cargo_records', column: 'rejection_reason', type: 'TEXT' },
          { table: 'cargo_records', column: 'status_updated_by', type: 'TEXT' },
          { table: 'cargo_records', column: 'status_updated_by_name', type: 'TEXT' },
          { table: 'cargo_records', column: 'status_updated_at', type: 'DATETIME' },
          { table: 'cargo_records', column: 'recipient_name', type: 'TEXT' },
          { table: 'users', column: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
          { table: 'users', column: 'password', type: 'TEXT' }
        ];
        
        // Tüm sütun ekleme işlemlerinin tamamlanmasını bekle
        await Promise.all(columnsToAdd.map(col => 
          new Promise((resolve) => {
            dbManager.db.all(`PRAGMA table_info(${col.table})`, [], (err, rows) => {
              if (err) {
                resolve();
                return;
              }
              const columnExists = rows.some(row => row.name === col.column);
              if (!columnExists) {
                dbManager.query(`ALTER TABLE ${col.table} ADD COLUMN ${col.column} ${col.type}`)
                  .then(() => resolve())
                  .catch(() => resolve());
              } else {
                resolve();
              }
            });
          })
        ));
      }

      // Sadece ilk kurulumda örnek kullanıcıları ekle
      const userCountResult = await dbManager.query('SELECT COUNT(*) as count FROM users');
      const userCount = parseInt(userCountResult.rows[0].count);

      if (userCount === 0) {
        // Hiç kullanıcı yoksa örnek kullanıcıları ekle
        if (dbType === 'postgresql') {
          await dbManager.query(`
            INSERT INTO users (id, name, email, role) VALUES 
            ('1', 'Ahmet Yılmaz', 'ahmet@kargo.com', 'staff'),
            ('2', 'Fatma Demir', 'fatma@kargo.com', 'staff'),
            ('3', 'Mehmet Kaya', 'mehmet@kargo.com', 'admin')
            ON CONFLICT (id) DO NOTHING
          `);
        } else {
          // SQLite için
          await dbManager.query(`
            INSERT OR IGNORE INTO users (id, name, email, role) VALUES 
            ('1', 'Ahmet Yılmaz', 'ahmet@kargo.com', 'staff'),
            ('2', 'Fatma Demir', 'fatma@kargo.com', 'staff'),
            ('3', 'Mehmet Kaya', 'mehmet@kargo.com', 'admin')
          `);
        }
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
