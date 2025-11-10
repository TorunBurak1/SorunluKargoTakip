const mongoose = require('mongoose');

const cargoRecordSchema = new mongoose.Schema({
  barcodeNumber: {
    type: String,
    required: [true, 'Barkod numarası gerekli'],
    trim: true
  },
  exitNumber: {
    type: String,
    required: [true, 'Çıkış numarası gerekli'],
    trim: true
  },
  carrierCompany: {
    type: String,
    required: [true, 'Taşıyıcı firma gerekli'],
    enum: ['ptt', 'aras', 'surat', 'yurtici', 'verar', 'aras_aylin', 'aras_verar', 'aras_hatip']
  },
  senderCompany: {
    type: String,
    required: [true, 'Gönderici firma gerekli'],
    trim: true
  },
  recipientName: {
    type: String,
    required: [true, 'Alıcı adı gerekli'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Açıklama gerekli'],
    trim: true
  },
  photos: [{
    type: String // URL'ler
  }],
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'paid', 'rejected'],
    default: 'open'
  },
  resolutionNote: {
    type: String,
    trim: true
  },
  paymentNote: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  statusUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  statusUpdatedByName: {
    type: String,
    trim: true
  },
  statusUpdatedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Oluşturan kullanıcı gerekli']
  },
  createdByName: {
    type: String,
    required: [true, 'Oluşturan kullanıcı adı gerekli'],
    trim: true
  }
}, {
  timestamps: true // createdAt ve updatedAt otomatik eklenir
});

// Index'ler
cargoRecordSchema.index({ barcodeNumber: 1 });
cargoRecordSchema.index({ exitNumber: 1 });
cargoRecordSchema.index({ status: 1 });
cargoRecordSchema.index({ createdBy: 1 });
cargoRecordSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CargoRecord', cargoRecordSchema);




















