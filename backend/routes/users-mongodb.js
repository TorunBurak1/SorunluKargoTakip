const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Tüm kullanıcıları getir
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    })));
  } catch (error) {
    console.error('Kullanıcılar getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Belirli bir kullanıcıyı getir
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Kullanıcı getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Kullanıcı girişi (basit demo)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre gerekli' });
    }
    
    // Demo için sabit şifre kontrolü
    if (password !== '123456') {
      return res.status(401).json({ error: 'Geçersiz şifre' });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Yeni kullanıcı oluştur
router.post('/', async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    
    // Validasyon
    if (!name || !email || !role || !password) {
      return res.status(400).json({ error: 'Tüm alanlar doldurulmalıdır' });
    }
    
    if (!['staff', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Geçersiz rol. Sadece "staff" veya "admin" olabilir' });
    }
    
    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Geçersiz e-posta formatı' });
    }
    
    const user = new User({
      name,
      email: email.toLowerCase(),
      role
    });
    
    await user.save();
    
    res.status(201).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Bu e-posta adresi zaten kullanılıyor' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Kullanıcı güncelle
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    // Validasyon
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Tüm alanlar doldurulmalıdır' });
    }
    
    if (!['staff', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Geçersiz rol. Sadece "staff" veya "admin" olabilir' });
    }
    
    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Geçersiz e-posta formatı' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email: email.toLowerCase(), role },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Bu e-posta adresi zaten kullanılıyor' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Kullanıcı şifresini güncelle (demo için boş)
router.patch('/:id/password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({ error: 'Yeni şifre gerekli' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır' });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    // Demo için şifre güncelleme işlemi yapılmıyor
    res.json({ message: 'Şifre başarıyla güncellendi' });
  } catch (error) {
    console.error('Şifre güncelleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Kullanıcı sil
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    res.json({ message: 'Kullanıcı başarıyla silindi' });
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;




















