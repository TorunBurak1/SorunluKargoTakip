const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database');

const router = express.Router();

// Tüm kargo kayıtlarını getir
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      cr.*,
      u.name as created_by_name,
      su.name as status_updated_by_name
    FROM cargo_records cr
    LEFT JOIN users u ON cr.created_by = u.id
    LEFT JOIN users su ON cr.status_updated_by = su.id
    ORDER BY cr.created_at DESC
  `;
  
  const db = getDatabase();
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const records = rows.map(row => {
      // Photos'u parse et
      let photosArray = [];
      try {
        photosArray = JSON.parse(row.photos || '[]');
      } catch (parseErr) {
        console.error('JSON parse error for photos:', parseErr, 'Row ID:', row.id);
        photosArray = [];
      }
      
      return {
        id: row.id,
        barcodeNumber: row.barcode_number,
        exitNumber: row.exit_number,
        carrierCompany: row.carrier_company,
        senderCompany: row.sender_company,
        recipientName: row.recipient_name,
        description: row.description,
        photos: photosArray,
        status: row.status || 'open',
        resolutionNote: row.resolution_note,
        paymentNote: row.payment_note,
        rejectionReason: row.rejection_reason,
        statusUpdatedBy: row.status_updated_by,
        statusUpdatedByName: row.status_updated_by_name,
        statusUpdatedAt: row.status_updated_at,
        createdBy: row.created_by,
        createdByName: row.created_by_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });
    
    res.json(records);
  });
});

// Belirli bir kargo kaydını getir
router.get('/:id', (req, res) => {
  const sql = `
    SELECT 
      cr.*,
      u.name as created_by_name,
      su.name as status_updated_by_name
    FROM cargo_records cr
    LEFT JOIN users u ON cr.created_by = u.id
    LEFT JOIN users su ON cr.status_updated_by = su.id
    WHERE cr.id = ?
  `;
  
  const db = getDatabase();
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'Kayıt bulunamadı' });
      return;
    }
    
    // Photos'u parse et
    let photosArray = [];
    try {
      photosArray = JSON.parse(row.photos || '[]');
    } catch (parseErr) {
      console.error('JSON parse error for photos in get/:id:', parseErr, 'Row ID:', row.id);
      photosArray = [];
    }
    
    const record = {
      id: row.id,
      barcodeNumber: row.barcode_number,
      exitNumber: row.exit_number,
      carrierCompany: row.carrier_company,
      senderCompany: row.sender_company,
      recipientName: row.recipient_name,
      description: row.description,
      photos: photosArray,
      status: row.status || 'open',
      resolutionNote: row.resolution_note,
      paymentNote: row.payment_note,
      rejectionReason: row.rejection_reason,
      statusUpdatedBy: row.status_updated_by,
      statusUpdatedByName: row.status_updated_by_name,
      statusUpdatedAt: row.status_updated_at,
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
    recipientName,
    description,
    photos = [],
    createdBy,
    createdByName
  } = req.body;
  
  // Validasyon
  if (!barcodeNumber || !exitNumber || !carrierCompany || !senderCompany || !recipientName || !description || !createdBy || !createdByName) {
    console.error('Validation error: Missing required fields', req.body);
    res.status(400).json({ error: 'Tüm gerekli alanlar doldurulmalıdır' });
    return;
  }
  
  // Taşıyıcı firma validasyonu
  const validCarrierCompanies = ['ptt', 'aras_aylin', 'aras_verar', 'aras_hatip', 'surat', 'yurtici', 'verar'];
  if (!validCarrierCompanies.includes(carrierCompany)) {
    console.error('Validation error: Invalid carrier company', carrierCompany);
    res.status(400).json({ 
      error: `Geçersiz taşıyıcı firma. İzin verilen değerler: ${validCarrierCompanies.join(', ')}` 
    });
    return;
  }
  
  const id = uuidv4();
  const now = new Date().toISOString();
  
  // Photos'u JSON'a çevir
  let photosJson;
  try {
    photosJson = JSON.stringify(photos || []);
  } catch (err) {
    console.error('JSON stringify error for photos:', err);
    res.status(400).json({ error: 'Fotoğraflar işlenirken hata oluştu' });
    return;
  }
  
  const sql = `
    INSERT INTO cargo_records 
    (id, barcode_number, exit_number, carrier_company, sender_company, recipient_name, description, photos, created_by, created_by_name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    id,
    barcodeNumber,
    exitNumber,
    carrierCompany,
    senderCompany,
    recipientName,
    description,
    photosJson,
    createdBy,
    createdByName,
    now,
    now
  ];
  
  console.log('Creating cargo record:', { id, barcodeNumber, exitNumber, photosCount: photos?.length || 0 });
  
  const db = getDatabase();
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
        u.name as created_by_name,
        su.name as status_updated_by_name
      FROM cargo_records cr
      LEFT JOIN users u ON cr.created_by = u.id
      LEFT JOIN users su ON cr.status_updated_by = su.id
      WHERE cr.id = ?
    `;
    
    db.get(selectSql, [id], (err, row) => {
      if (err) {
        console.error('Database error (select):', err);
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (!row) {
        console.error('Record not found after insert:', id);
        res.status(500).json({ error: 'Kayıt oluşturuldu ancak geri getirilemedi' });
        return;
      }
      
      // Photos'u parse et
      let photosArray = [];
      try {
        photosArray = JSON.parse(row.photos || '[]');
      } catch (parseErr) {
        console.error('JSON parse error for photos:', parseErr);
        photosArray = [];
      }
      
      const record = {
        id: row.id,
        barcodeNumber: row.barcode_number,
        exitNumber: row.exit_number,
        carrierCompany: row.carrier_company,
        senderCompany: row.sender_company,
        recipientName: row.recipient_name,
        description: row.description,
        photos: photosArray,
        status: row.status || 'open',
        resolutionNote: row.resolution_note,
        paymentNote: row.payment_note,
        rejectionReason: row.rejection_reason,
        statusUpdatedBy: row.status_updated_by,
        statusUpdatedByName: row.status_updated_by_name,
        statusUpdatedAt: row.status_updated_at,
        createdBy: row.created_by,
        createdByName: row.created_by_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      console.log('Cargo record created successfully:', record.id);
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
    recipientName,
    description,
    photos
  } = req.body;
  
  // Taşıyıcı firma validasyonu (eğer gönderilmişse)
  if (carrierCompany) {
    const validCarrierCompanies = ['ptt', 'aras_aylin', 'aras_verar', 'aras_hatip', 'surat', 'yurtici', 'verar'];
    if (!validCarrierCompanies.includes(carrierCompany)) {
      console.error('Validation error: Invalid carrier company', carrierCompany);
      res.status(400).json({ 
        error: `Geçersiz taşıyıcı firma. İzin verilen değerler: ${validCarrierCompanies.join(', ')}` 
      });
      return;
    }
  }
  
  const now = new Date().toISOString();
  
  const sql = `
    UPDATE cargo_records 
    SET barcode_number = COALESCE(?, barcode_number),
        exit_number = COALESCE(?, exit_number),
        carrier_company = COALESCE(?, carrier_company),
        sender_company = COALESCE(?, sender_company),
        recipient_name = COALESCE(?, recipient_name),
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
    recipientName,
    description,
    photos ? JSON.stringify(photos) : null,
    now,
    req.params.id
  ];
  
  const db = getDatabase();
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
        u.name as created_by_name,
        su.name as status_updated_by_name
      FROM cargo_records cr
      LEFT JOIN users u ON cr.created_by = u.id
      LEFT JOIN users su ON cr.status_updated_by = su.id
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
        recipientName: row.recipient_name,
        description: row.description,
        photos: JSON.parse(row.photos || '[]'),
        status: row.status || 'open',
        resolutionNote: row.resolution_note,
        paymentNote: row.payment_note,
        rejectionReason: row.rejection_reason,
        statusUpdatedBy: row.status_updated_by,
        statusUpdatedByName: row.status_updated_by_name,
        statusUpdatedAt: row.status_updated_at,
        createdBy: row.created_by,
        createdByName: row.created_by_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      res.json(record);
    });
  });
});

// Kargo kaydının durumunu güncelle
router.patch('/:id/status', (req, res) => {
  const {
    status,
    resolutionNote,
    paymentNote,
    rejectionReason,
    updatedBy,
    updatedByName
  } = req.body;
  
  // Validasyon
  if (!status || !updatedBy || !updatedByName) {
    res.status(400).json({ error: 'Durum, güncelleyen kişi bilgileri gereklidir' });
    return;
  }
  
  const validStatuses = ['open', 'in_progress', 'resolved', 'paid', 'rejected'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Geçersiz durum değeri' });
    return;
  }
  
  const now = new Date().toISOString();
  
  // Önce mevcut kaydı al
  const getCurrentRecordSql = 'SELECT description FROM cargo_records WHERE id = ?';
  
  const db = getDatabase();
  db.get(getCurrentRecordSql, [req.params.id], (err, currentRecord) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!currentRecord) {
      res.status(404).json({ error: 'Kayıt bulunamadı' });
      return;
    }
    
    // Yeni notu oluştur
    let newNote = '';
    let statusText = '';
    
    console.log('Status update debug:', { status, resolutionNote, paymentNote, rejectionReason, now });
    
    switch (status) {
      case 'resolved':
        statusText = 'Çözüldü';
        if (resolutionNote) {
          newNote = `\n\n[${statusText} - ${now}] ${resolutionNote}`;
        }
        break;
      case 'paid':
        statusText = 'Ödendi';
        if (paymentNote) {
          newNote = `\n\n[${statusText} - ${now}] ${paymentNote}`;
        }
        break;
      case 'rejected':
        statusText = 'Reddedildi';
        if (rejectionReason) {
          newNote = `\n\n[${statusText} - ${now}] ${rejectionReason}`;
        }
        break;
      case 'in_progress':
        statusText = 'İşlemde';
        newNote = `\n\n[${statusText} - ${now}] Durum güncellendi.`;
        break;
      default:
        statusText = 'Açık';
        newNote = `\n\n[${statusText} - ${now}] Durum güncellendi.`;
    }
    
    console.log('New note created:', newNote);
    
    // Açıklamaya yeni notu ekle
    const updatedDescription = currentRecord.description + newNote;
    
    console.log('Updated description:', updatedDescription);
    
    const sql = `
      UPDATE cargo_records 
      SET status = ?,
          description = ?,
          resolution_note = ?,
          payment_note = ?,
          rejection_reason = ?,
          status_updated_by = ?,
          status_updated_by_name = ?,
          status_updated_at = ?,
          updated_at = ?
      WHERE id = ?
    `;
    
    const params = [
      status,
      updatedDescription,
      resolutionNote || null,
      paymentNote || null,
      rejectionReason || null,
      updatedBy,
      updatedByName,
      now,
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
        u.name as created_by_name,
        su.name as status_updated_by_name
      FROM cargo_records cr
      LEFT JOIN users u ON cr.created_by = u.id
      LEFT JOIN users su ON cr.status_updated_by = su.id
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
        recipientName: row.recipient_name,
        description: row.description,
        photos: JSON.parse(row.photos || '[]'),
        status: row.status || 'open',
        resolutionNote: row.resolution_note,
        paymentNote: row.payment_note,
        rejectionReason: row.rejection_reason,
        statusUpdatedBy: row.status_updated_by,
        statusUpdatedByName: row.status_updated_by_name,
        statusUpdatedAt: row.status_updated_at,
        createdBy: row.created_by,
        createdByName: row.created_by_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      res.json(record);
    });
  });
  });
});

// Kargo kaydını sil
router.delete('/:id', (req, res) => {
  const sql = 'DELETE FROM cargo_records WHERE id = ?';
  
  const db = getDatabase();
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