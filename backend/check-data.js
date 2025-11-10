const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'kargo.db');

console.log('🔍 Veritabanı kontrol ediliyor...');
console.log(`📁 Veritabanı yolu: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Veritabanı bağlantı hatası:', err.message);
    return;
  }
  console.log('✅ Veritabanına bağlandı');
});

// Kullanıcıları kontrol et
db.all('SELECT * FROM users', [], (err, users) => {
  if (err) {
    console.error('❌ Kullanıcı sorgu hatası:', err.message);
  } else {
    console.log(`\n👥 Kullanıcı sayısı: ${users.length}`);
    if (users.length > 0) {
      console.log('📋 Kullanıcılar:');
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
      });
    }
  }
});

// Kargo kayıtlarını kontrol et
db.all('SELECT * FROM cargo_records', [], (err, records) => {
  if (err) {
    console.error('❌ Kargo kayıt sorgu hatası:', err.message);
  } else {
    console.log(`\n📦 Kargo kayıt sayısı: ${records.length}`);
    if (records.length > 0) {
      console.log('📋 Kargo kayıtları:');
      records.forEach(record => {
        console.log(`  - ${record.barcode_number} - ${record.status} - ${record.sender_company}`);
      });
    }
  }
  
  // Veritabanını kapat
  db.close((err) => {
    if (err) {
      console.error('❌ Veritabanı kapatma hatası:', err.message);
    } else {
      console.log('\n✅ Veritabanı kapatıldı');
    }
  });
});















