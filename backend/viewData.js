const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı dosyası yolu
const dbPath = path.join(__dirname, 'kargo.db');

// Veritabanı bağlantısı
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Veritabanı bağlantı hatası:', err.message);
  } else {
    console.log('✅ Veritabanına bağlandı:', dbPath);
  }
});

console.log('\n📊 KARGO VERİTABANI İÇERİĞİ\n');
console.log('=' .repeat(50));

// Kullanıcıları listele
console.log('\n👥 KULLANICILAR:');
db.all('SELECT * FROM users', [], (err, rows) => {
  if (err) {
    console.error('Hata:', err.message);
  } else {
    rows.forEach(row => {
      console.log(`ID: ${row.id} | Ad: ${row.name} | Email: ${row.email} | Rol: ${row.role}`);
    });
  }
});

// Kargo kayıtlarını listele
console.log('\n📦 KARGO KAYITLARI:');
db.all('SELECT * FROM cargo_records ORDER BY created_at DESC', [], (err, rows) => {
  if (err) {
    console.error('Hata:', err.message);
  } else {
    console.log(`Toplam ${rows.length} kayıt bulundu:\n`);
    rows.forEach((row, index) => {
      console.log(`${index + 1}. Kayıt:`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Barkod: ${row.barcode_number}`);
      console.log(`   Çıkış No: ${row.exit_number}`);
      console.log(`   Taşıyıcı: ${row.carrier_company}`);
      console.log(`   Gönderici: ${row.sender_company}`);
      console.log(`   Açıklama: ${row.description.substring(0, 50)}...`);
      console.log(`   Oluşturan: ${row.created_by_name}`);
      console.log(`   Tarih: ${row.created_at}`);
      console.log(`   Fotoğraf Sayısı: ${JSON.parse(row.photos || '[]').length}`);
      console.log('   ' + '-'.repeat(40));
    });
  }
  
  // Veritabanı bağlantısını kapat
  db.close((err) => {
    if (err) {
      console.error('Veritabanı kapatma hatası:', err.message);
    } else {
      console.log('\n✅ Veritabanı bağlantısı kapatıldı.');
    }
  });
});


