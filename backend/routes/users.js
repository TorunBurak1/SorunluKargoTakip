const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { getDatabase } = require('../database');

const router = express.Router();

// Tüm kullanıcıları getir
router.get('/', (req, res) => {
  const sql = 'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC';
  
  const db = getDatabase();
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const users = rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: row.created_at
    }));
    
    res.json(users);
  });
});

// Belirli bir kullanıcıyı getir
router.get('/:id', (req, res) => {
  const sql = 'SELECT id, name, email, role, created_at FROM users WHERE id = ?';
  
  const db = getDatabase();
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      return;
    }
    
    const user = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: row.created_at
    };
    
    res.json(user);
  });
});

// Kullanıcı girişi
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  console.log('🔐 Login denemesi:', { email, passwordLength: password?.length });
  
  if (!email || !password) {
    console.error('❌ Eksik bilgi:', { hasEmail: !!email, hasPassword: !!password });
    res.status(400).json({ error: 'E-posta ve şifre gerekli' });
    return;
  }
  
  // Email'i lowercase yap (case-insensitive)
  const emailLower = email.toLowerCase().trim();
  const sql = 'SELECT id, name, email, role, password FROM users WHERE LOWER(email) = ?';
  
  const db = getDatabase();
  
  try {
    // Promise tabanlı sorgu
    const row = await new Promise((resolve, reject) => {
      db.get(sql, [emailLower], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
    
    if (!row) {
      console.error('❌ Kullanıcı bulunamadı:', emailLower);
      res.status(401).json({ error: 'Geçersiz e-posta veya şifre!' });
      return;
    }
    
    console.log('✅ Kullanıcı bulundu:', { id: row.id, name: row.name, email: row.email, hasPassword: !!row.password });
    
    // Şifre kontrolü
    let isPasswordValid = false;
    
    if (!row.password) {
      console.log('⚠️  Şifre yok, eski sistem kontrolü yapılıyor...');
      // Eski kullanıcılar için geçici olarak sabit şifre kontrolü (geriye dönük uyumluluk)
      isPasswordValid = (password === '123456');
    } else {
      // Hash'lenmiş şifreyi kontrol et
      console.log('🔐 Hash\'lenmiş şifre kontrol ediliyor...');
      isPasswordValid = await bcrypt.compare(password, row.password);
      console.log(`   Şifre kontrolü: ${isPasswordValid ? '✅ DOĞRU' : '❌ YANLIŞ'}`);
    }
    
    if (!isPasswordValid) {
      console.error('❌ Geçersiz şifre:', { email: emailLower, passwordLength: password.length });
      res.status(401).json({ error: 'Geçersiz e-posta veya şifre!' });
      return;
    }
    
    const user = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role
    };
    
    console.log('✅ Login başarılı:', user);
    res.json(user);
  } catch (error) {
    console.error('❌ Login hatası:', error);
    res.status(500).json({ error: 'Giriş yapılırken bir hata oluştu' });
  }
});

// Yeni kullanıcı oluştur
router.post('/', async (req, res) => {
  const { name, email, role, password } = req.body;
  
  console.log('📝 Yeni kullanıcı oluşturuluyor:', { name, email, role, passwordLength: password?.length });
  
  // Validasyon
  if (!name || !email || !role || !password) {
    console.error('❌ Validasyon hatası: Tüm alanlar doldurulmalıdır', { name, email, role, hasPassword: !!password });
    res.status(400).json({ error: 'Tüm alanlar doldurulmalıdır' });
    return;
  }
  
  if (!['staff', 'admin'].includes(role)) {
    console.error('❌ Geçersiz rol:', role);
    res.status(400).json({ error: 'Geçersiz rol. Sadece "staff" veya "admin" olabilir' });
    return;
  }
  
  if (password.length < 6) {
    console.error('❌ Şifre çok kısa:', password.length);
    res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır' });
    return;
  }
  
  // E-posta formatı kontrolü
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ Geçersiz e-posta formatı:', email);
    res.status(400).json({ error: 'Geçersiz e-posta formatı' });
    return;
  }
  
  try {
    // Şifreyi hash'le
    console.log('🔐 Şifre hash\'leniyor...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Şifre hash\'lendi, uzunluk:', hashedPassword.length);
    
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const sql = `
      INSERT INTO users (id, name, email, role, password, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const params = [id, name, email, role, hashedPassword, now];
    
    console.log('💾 Veritabanına kaydediliyor...', { id, name, email, role, hasPassword: !!hashedPassword });
    
    const db = getDatabase();
    db.run(sql, params, function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          console.error('❌ E-posta zaten kullanılıyor:', email);
          res.status(400).json({ error: 'Bu e-posta adresi zaten kullanılıyor' });
          return;
        }
        console.error('❌ Database error:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      
      console.log('✅ Kullanıcı veritabanına kaydedildi, ID:', id);
      
      // Oluşturulan kullanıcıyı kontrol et (şifre dahil)
      const checkSql = 'SELECT id, name, email, role, password, created_at FROM users WHERE id = ?';
      db.get(checkSql, [id], (checkErr, checkRow) => {
        if (checkErr) {
          console.error('❌ Kullanıcı kontrol hatası:', checkErr);
        } else if (checkRow) {
          console.log('✅ Kullanıcı doğrulandı:', {
            id: checkRow.id,
            name: checkRow.name,
            email: checkRow.email,
            hasPassword: !!checkRow.password,
            passwordLength: checkRow.password?.length
          });
        }
      });
      
      // Oluşturulan kullanıcıyı döndür
      const selectSql = 'SELECT id, name, email, role, created_at FROM users WHERE id = ?';
      
      db.get(selectSql, [id], (err, row) => {
        if (err) {
          console.error('❌ Database error:', err);
          res.status(500).json({ error: err.message });
          return;
        }
        
        const user = {
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role,
          createdAt: row.created_at
        };
        
        console.log('✅ Kullanıcı başarıyla oluşturuldu:', user);
        res.status(201).json(user);
      });
    });
  } catch (error) {
    console.error('❌ Şifre hash hatası:', error);
    res.status(500).json({ error: 'Kullanıcı oluşturulurken bir hata oluştu' });
  }
});

// Kullanıcı güncelle
router.put('/:id', (req, res) => {
  const { name, email, role } = req.body;
  
  // Validasyon
  if (!name || !email || !role) {
    res.status(400).json({ error: 'Tüm alanlar doldurulmalıdır' });
    return;
  }
  
  if (!['staff', 'admin'].includes(role)) {
    res.status(400).json({ error: 'Geçersiz rol. Sadece "staff" veya "admin" olabilir' });
    return;
  }
  
  // E-posta formatı kontrolü
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Geçersiz e-posta formatı' });
    return;
  }
  
  const sql = `
    UPDATE users 
    SET name = ?, email = ?, role = ?
    WHERE id = ?
  `;
  
  const params = [name, email, role, req.params.id];
  
  const db = getDatabase();
  db.run(sql, params, function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ error: 'Bu e-posta adresi zaten kullanılıyor' });
        return;
      }
      console.error('Database error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      return;
    }
    
    // Güncellenmiş kullanıcıyı döndür
    const selectSql = 'SELECT id, name, email, role, created_at FROM users WHERE id = ?';
    
    db.get(selectSql, [req.params.id], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      
      const user = {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        createdAt: row.created_at
      };
      
      res.json(user);
    });
  });
});

// Kullanıcı şifresini güncelle
router.patch('/:id/password', async (req, res) => {
  const { newPassword } = req.body;
  
  // Validasyon
  if (!newPassword) {
    res.status(400).json({ error: 'Yeni şifre gerekli' });
    return;
  }
  
  if (newPassword.length < 6) {
    res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır' });
    return;
  }
  
  try {
    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const sql = `
      UPDATE users 
      SET password = ?, updated_at = ?
      WHERE id = ?
    `;
    
    const now = new Date().toISOString();
    const params = [hashedPassword, now, req.params.id];
    
    const db = getDatabase();
    db.run(sql, params, function(err) {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        return;
      }
      
      res.json({ message: 'Şifre başarıyla güncellendi' });
    });
  } catch (error) {
    console.error('Şifre hash hatası:', error);
    res.status(500).json({ error: 'Şifre güncellenirken bir hata oluştu' });
  }
});

// Kullanıcı sil
router.delete('/:id', (req, res) => {
  const userId = req.params.id;
  const db = getDatabase();
  
  // Önce kullanıcıya ait kargo kayıtlarını kontrol et
  const checkSql = `
    SELECT COUNT(*) as count 
    FROM cargo_records 
    WHERE created_by = ? OR status_updated_by = ?
  `;
  
  db.get(checkSql, [userId, userId], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Eğer kullanıcıya ait kargo kayıtları varsa silme işlemini engelle
    if (row && row.count > 0) {
      res.status(400).json({ 
        error: `Bu kullanıcı ${row.count} adet kargo kaydı ile ilişkilidir. Kullanıcıyı silmek için önce bu kayıtları silmeniz veya başka bir kullanıcıya atamanız gerekir.` 
      });
      return;
    }
    
    // Kullanıcıya ait kargo kaydı yoksa silme işlemini gerçekleştir
    const deleteSql = 'DELETE FROM users WHERE id = ?';
    
    db.run(deleteSql, [userId], function(deleteErr) {
      if (deleteErr) {
        console.error('Database error:', deleteErr);
        res.status(500).json({ error: deleteErr.message });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        return;
      }
      
      res.json({ message: 'Kullanıcı başarıyla silindi' });
    });
  });
});

module.exports = router;


