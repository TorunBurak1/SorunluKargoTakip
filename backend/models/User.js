const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Kullanıcı adı gerekli'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'E-posta gerekli'],
    unique: true,
    lowercase: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['staff', 'admin'],
    required: [true, 'Kullanıcı rolü gerekli'],
    default: 'staff'
  }
}, {
  timestamps: true // createdAt ve updatedAt otomatik eklenir
});

// Index'ler
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);




















