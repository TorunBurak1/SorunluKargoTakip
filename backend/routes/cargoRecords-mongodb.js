const express = require('express');
const CargoRecord = require('../models/CargoRecord');
const User = require('../models/User');

const router = express.Router();

// Tüm kargo kayıtlarını getir
router.get('/', async (req, res) => {
  try {
    const records = await CargoRecord.find()
      .populate('createdBy', 'name email')
      .populate('statusUpdatedBy', 'name email')
      .sort({ createdAt: -1 });
    
    const formattedRecords = records.map(record => ({
      id: record._id.toString(),
      barcodeNumber: record.barcodeNumber,
      exitNumber: record.exitNumber,
      carrierCompany: record.carrierCompany,
      senderCompany: record.senderCompany,
      recipientName: record.recipientName,
      description: record.description,
      photos: record.photos || [],
      status: record.status || 'open',
      resolutionNote: record.resolutionNote,
      paymentNote: record.paymentNote,
      rejectionReason: record.rejectionReason,
      statusUpdatedBy: record.statusUpdatedBy?._id?.toString(),
      statusUpdatedByName: record.statusUpdatedByName,
      statusUpdatedAt: record.statusUpdatedAt,
      createdBy: record.createdBy._id.toString(),
      createdByName: record.createdByName,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }));
    
    res.json(formattedRecords);
  } catch (error) {
    console.error('Kargo kayıtları getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Belirli bir kargo kaydını getir
router.get('/:id', async (req, res) => {
  try {
    const record = await CargoRecord.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('statusUpdatedBy', 'name email');
    
    if (!record) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }
    
    res.json({
      id: record._id.toString(),
      barcodeNumber: record.barcodeNumber,
      exitNumber: record.exitNumber,
      carrierCompany: record.carrierCompany,
      senderCompany: record.senderCompany,
      recipientName: record.recipientName,
      description: record.description,
      photos: record.photos || [],
      status: record.status || 'open',
      resolutionNote: record.resolutionNote,
      paymentNote: record.paymentNote,
      rejectionReason: record.rejectionReason,
      statusUpdatedBy: record.statusUpdatedBy?._id?.toString(),
      statusUpdatedByName: record.statusUpdatedByName,
      statusUpdatedAt: record.statusUpdatedAt,
      createdBy: record.createdBy._id.toString(),
      createdByName: record.createdByName,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    });
  } catch (error) {
    console.error('Kargo kaydı getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Yeni kargo kaydı oluştur
router.post('/', async (req, res) => {
  try {
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
      return res.status(400).json({ error: 'Tüm gerekli alanlar doldurulmalıdır' });
    }
    
    const record = new CargoRecord({
      barcodeNumber,
      exitNumber,
      carrierCompany,
      senderCompany,
      recipientName,
      description,
      photos,
      createdBy,
      createdByName
    });
    
    await record.save();
    
    // Populate ile tekrar getir
    const populatedRecord = await CargoRecord.findById(record._id)
      .populate('createdBy', 'name email')
      .populate('statusUpdatedBy', 'name email');
    
    res.status(201).json({
      id: populatedRecord._id.toString(),
      barcodeNumber: populatedRecord.barcodeNumber,
      exitNumber: populatedRecord.exitNumber,
      carrierCompany: populatedRecord.carrierCompany,
      senderCompany: populatedRecord.senderCompany,
      recipientName: populatedRecord.recipientName,
      description: populatedRecord.description,
      photos: populatedRecord.photos || [],
      status: populatedRecord.status || 'open',
      resolutionNote: populatedRecord.resolutionNote,
      paymentNote: populatedRecord.paymentNote,
      rejectionReason: populatedRecord.rejectionReason,
      statusUpdatedBy: populatedRecord.statusUpdatedBy?._id?.toString(),
      statusUpdatedByName: populatedRecord.statusUpdatedByName,
      statusUpdatedAt: populatedRecord.statusUpdatedAt,
      createdBy: populatedRecord.createdBy._id.toString(),
      createdByName: populatedRecord.createdByName,
      createdAt: populatedRecord.createdAt,
      updatedAt: populatedRecord.updatedAt
    });
  } catch (error) {
    console.error('Kargo kaydı oluşturma hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Kargo kaydını güncelle
router.put('/:id', async (req, res) => {
  try {
    const {
      barcodeNumber,
      exitNumber,
      carrierCompany,
      senderCompany,
      recipientName,
      description,
      photos
    } = req.body;
    
    const updateData = {};
    if (barcodeNumber !== undefined) updateData.barcodeNumber = barcodeNumber;
    if (exitNumber !== undefined) updateData.exitNumber = exitNumber;
    if (carrierCompany !== undefined) updateData.carrierCompany = carrierCompany;
    if (senderCompany !== undefined) updateData.senderCompany = senderCompany;
    if (recipientName !== undefined) updateData.recipientName = recipientName;
    if (description !== undefined) updateData.description = description;
    if (photos !== undefined) updateData.photos = photos;
    
    const record = await CargoRecord.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'name email')
    .populate('statusUpdatedBy', 'name email');
    
    if (!record) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }
    
    res.json({
      id: record._id.toString(),
      barcodeNumber: record.barcodeNumber,
      exitNumber: record.exitNumber,
      carrierCompany: record.carrierCompany,
      senderCompany: record.senderCompany,
      recipientName: record.recipientName,
      description: record.description,
      photos: record.photos || [],
      status: record.status || 'open',
      resolutionNote: record.resolutionNote,
      paymentNote: record.paymentNote,
      rejectionReason: record.rejectionReason,
      statusUpdatedBy: record.statusUpdatedBy?._id?.toString(),
      statusUpdatedByName: record.statusUpdatedByName,
      statusUpdatedAt: record.statusUpdatedAt,
      createdBy: record.createdBy._id.toString(),
      createdByName: record.createdByName,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    });
  } catch (error) {
    console.error('Kargo kaydı güncelleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Kargo kaydının durumunu güncelle
router.patch('/:id/status', async (req, res) => {
  try {
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
      return res.status(400).json({ error: 'Durum, güncelleyen kişi bilgileri gereklidir' });
    }
    
    const validStatuses = ['open', 'in_progress', 'resolved', 'paid', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Geçersiz durum değeri' });
    }
    
    // Mevcut kaydı al
    const currentRecord = await CargoRecord.findById(req.params.id);
    if (!currentRecord) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }
    
    // Yeni notu oluştur
    let newNote = '';
    let statusText = '';
    const now = new Date().toISOString();
    
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
    
    // Açıklamaya yeni notu ekle
    const updatedDescription = currentRecord.description + newNote;
    
    const record = await CargoRecord.findByIdAndUpdate(
      req.params.id,
      {
        status,
        description: updatedDescription,
        resolutionNote: resolutionNote || null,
        paymentNote: paymentNote || null,
        rejectionReason: rejectionReason || null,
        statusUpdatedBy: updatedBy,
        statusUpdatedByName: updatedByName,
        statusUpdatedAt: new Date()
      },
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'name email')
    .populate('statusUpdatedBy', 'name email');
    
    res.json({
      id: record._id.toString(),
      barcodeNumber: record.barcodeNumber,
      exitNumber: record.exitNumber,
      carrierCompany: record.carrierCompany,
      senderCompany: record.senderCompany,
      recipientName: record.recipientName,
      description: record.description,
      photos: record.photos || [],
      status: record.status || 'open',
      resolutionNote: record.resolutionNote,
      paymentNote: record.paymentNote,
      rejectionReason: record.rejectionReason,
      statusUpdatedBy: record.statusUpdatedBy?._id?.toString(),
      statusUpdatedByName: record.statusUpdatedByName,
      statusUpdatedAt: record.statusUpdatedAt,
      createdBy: record.createdBy._id.toString(),
      createdByName: record.createdByName,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    });
  } catch (error) {
    console.error('Durum güncelleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Kargo kaydını sil
router.delete('/:id', async (req, res) => {
  try {
    const record = await CargoRecord.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }
    
    res.json({ message: 'Kayıt başarıyla silindi' });
  } catch (error) {
    console.error('Kargo kaydı silme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;




















