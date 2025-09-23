const express = require('express');
const { db } = require('../database');

const router = express.Router();

// Tüm kullanıcıları getir
router.get('/', (req, res) => {
  const sql = 'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC';
  
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

// Kullanıcı girişi (basit demo)
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    res.status(400).json({ error: 'E-posta ve şifre gerekli' });
    return;
  }
  
  // Demo için sabit şifre kontrolü
  if (password !== '123456') {
    res.status(401).json({ error: 'Geçersiz şifre' });
    return;
  }
  
  const sql = 'SELECT id, name, email, role FROM users WHERE email = ?';
  
  db.get(sql, [email], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(401).json({ error: 'Kullanıcı bulunamadı' });
      return;
    }
    
    const user = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role
    };
    
    res.json(user);
  });
});

module.exports = router;

