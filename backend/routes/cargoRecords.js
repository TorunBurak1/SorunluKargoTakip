const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

const router = express.Router();

// Tüm kargo kayıtlarını getir
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      cr.*,
      u.name as created_by_name
    FROM cargo_records cr
    LEFT JOIN users u ON cr.created_by = u.id
    ORDER BY cr.created_at DESC
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const records = rows.map(row => ({
      id: row.id,
      barcodeNumber: row.barcode_number,
      exitNumber: row.exit_number,
      carrierCompany: row.carrier_company,
      senderCompany: row.sender_company,
      description: row.description,
      photos: JSON.parse(row.photos || '[]'),
      createdBy: row.created_by,
      createdByName: row.created_by_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json(records);
  });
});

// Belirli bir kargo kaydını getir
router.get('/:id', (req, res) => {
  const sql = `
    SELECT 
      cr.*,
      u.name as created_by_name
    FROM cargo_records cr
    LEFT JOIN users u ON cr.created_by = u.id
    WHERE cr.id = ?
  `;
  
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'Kayıt bulunamadı' });
      return;
    }
    
    const record = {
      id: row.id,
      barcodeNumber: row.barcode_number,
      exitNumber: row.exit_number,
      carrierCompany: row.carrier_company,
      senderCompany: row.sender_company,
      description: row.description,
      photos: JSON.parse(row.photos || '[]'),
      createdBy: row.created_by,
      createdByName: row.created_by_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
    
    res.json(record);
  });
});

// Yeni kargo kaydı oluştur
router.post('/', (req, res) => {
  const {
    barcodeNumber,
    exitNumber,
    carrierCompany,
    senderCompany,
    description,
    photos = [],
    createdBy,
    createdByName
  } = req.body;
  
  // Validasyon
  if (!barcodeNumber || !exitNumber || !carrierCompany || !senderCompany || !description || !createdBy || !createdByName) {
    res.status(400).json({ error: 'Tüm gerekli alanlar doldurulmalıdır' });
    return;
  }
  
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const sql = `
    INSERT INTO cargo_records 
    (id, barcode_number, exit_number, carrier_company, sender_company, description, photos, created_by, created_by_name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    id,
    barcodeNumber,
    exitNumber,
    carrierCompany,
    senderCompany,
    description,
    JSON.stringify(photos),
    createdBy,
    createdByName,
    now,
    now
  ];
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Oluşturulan kaydı döndür
    const selectSql = `
      SELECT 
        cr.*,
        u.name as created_by_name
      FROM cargo_records cr
      LEFT JOIN users u ON cr.created_by = u.id
      WHERE cr.id = ?
    `;
    
    db.get(selectSql, [id], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      
      const record = {
        id: row.id,
        barcodeNumber: row.barcode_number,
        exitNumber: row.exit_number,
        carrierCompany: row.carrier_company,
        senderCompany: row.sender_company,
        description: row.description,
        photos: JSON.parse(row.photos || '[]'),
        createdBy: row.created_by,
        createdByName: row.created_by_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      res.status(201).json(record);
    });
  });
});

// Kargo kaydını güncelle
router.put('/:id', (req, res) => {
  const {
    barcodeNumber,
    exitNumber,
    carrierCompany,
    senderCompany,
    description,
    photos
  } = req.body;
  
  const now = new Date().toISOString();
  
  const sql = `
    UPDATE cargo_records 
    SET barcode_number = COALESCE(?, barcode_number),
        exit_number = COALESCE(?, exit_number),
        carrier_company = COALESCE(?, carrier_company),
        sender_company = COALESCE(?, sender_company),
        description = COALESCE(?, description),
        photos = COALESCE(?, photos),
        updated_at = ?
    WHERE id = ?
  `;
  
  const params = [
    barcodeNumber,
    exitNumber,
    carrierCompany,
    senderCompany,
    description,
    photos ? JSON.stringify(photos) : null,
    now,
    req.params.id
  ];
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Kayıt bulunamadı' });
      return;
    }
    
    // Güncellenmiş kaydı döndür
    const selectSql = `
      SELECT 
        cr.*,
        u.name as created_by_name
      FROM cargo_records cr
      LEFT JOIN users u ON cr.created_by = u.id
      WHERE cr.id = ?
    `;
    
    db.get(selectSql, [req.params.id], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      
      const record = {
        id: row.id,
        barcodeNumber: row.barcode_number,
        exitNumber: row.exit_number,
        carrierCompany: row.carrier_company,
        senderCompany: row.sender_company,
        description: row.description,
        photos: JSON.parse(row.photos || '[]'),
        createdBy: row.created_by,
        createdByName: row.created_by_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      res.json(record);
    });
  });
});

// Kargo kaydını sil
router.delete('/:id', (req, res) => {
  const sql = 'DELETE FROM cargo_records WHERE id = ?';
  
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Kayıt bulunamadı' });
      return;
    }
    
    res.json({ message: 'Kayıt başarıyla silindi' });
  });
});

module.exports = router;
