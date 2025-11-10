const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'kargo.db');

console.log('🔍 Veritabanı içeriği kontrol ediliyor...');
console.log(`📁 Veritabanı yolu: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Veritabanı bağlantı hatası:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Veritabanına bağlandı');
  
  // Kullanıcıları listele
  db.all('SELECT * FROM users ORDER BY created_at', (err, users) => {
    if (err) {
      console.error('❌ Kullanıcılar alınamadı:', err.message);
    } else {
      console.log(`\n👥 Kullanıcılar (${users.length} adet):`);
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ${user.role} - ${user.created_at}`);
      });
    }
    
    // Kargo kayıtlarını listele
    db.all('SELECT * FROM cargo_records ORDER BY created_at', (err, records) => {
      if (err) {
        console.error('❌ Kargo kayıtları alınamadı:', err.message);
      } else {
        console.log(`\n📦 Kargo Kayıtları (${records.length} adet):`);
        records.forEach(record => {
          console.log(`  - ${record.barcode_number} - ${record.sender_company} - ${record.status} - ${record.created_at}`);
        });
      }
      
      db.close((err) => {
        if (err) {
          console.error('❌ Veritabanı kapatma hatası:', err.message);
        } else {
          console.log('\n✅ Veritabanı güvenli şekilde kapatıldı');
        }
        process.exit(0);
      });
    });
  });
});






