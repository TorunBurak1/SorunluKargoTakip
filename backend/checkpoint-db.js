const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'kargo.db');

console.log('🔄 Veritabanı WAL dosyası birleştiriliyor...');
console.log(`📁 Veritabanı yolu: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Veritabanı bağlantı hatası:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Veritabanına bağlandı');
  
  // WAL dosyasını ana veritabanına birleştir
  db.run('PRAGMA wal_checkpoint(FULL);', (err) => {
    if (err) {
      console.error('❌ WAL checkpoint hatası:', err.message);
    } else {
      console.log('✅ WAL dosyası başarıyla birleştirildi');
    }
    
    // Veritabanı istatistiklerini göster
    db.all('SELECT COUNT(*) as userCount FROM users', (err, rows) => {
      if (err) {
        console.error('❌ Kullanıcı sayısı alınamadı:', err.message);
      } else {
        console.log(`👥 Kullanıcı sayısı: ${rows[0].userCount}`);
      }
      
      db.all('SELECT COUNT(*) as cargoCount FROM cargo_records', (err, rows) => {
        if (err) {
          console.error('❌ Kargo kayıt sayısı alınamadı:', err.message);
        } else {
          console.log(`📦 Kargo kayıt sayısı: ${rows[0].cargoCount}`);
        }
        
        db.close((err) => {
          if (err) {
            console.error('❌ Veritabanı kapatma hatası:', err.message);
          } else {
            console.log('✅ Veritabanı güvenli şekilde kapatıldı');
          }
          process.exit(0);
        });
      });
    });
  });
});







