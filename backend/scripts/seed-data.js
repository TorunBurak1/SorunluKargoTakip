const mongoose = require('mongoose');
const User = require('../models/User');
const CargoRecord = require('../models/CargoRecord');

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kargo:123456@cluster0.mongodb.net/kargo-takip?retryWrites=true&w=majority';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB bağlandı');
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    console.log('🔄 Veritabanı temizleniyor...');
    await User.deleteMany({});
    await CargoRecord.deleteMany({});
    
    console.log('🔄 Örnek kullanıcılar oluşturuluyor...');
    
    // Örnek kullanıcıları oluştur
    const users = await User.insertMany([
      {
        name: 'Ahmet Yılmaz',
        email: 'ahmet@kargo.com',
        role: 'staff'
      },
      {
        name: 'Fatma Demir',
        email: 'fatma@kargo.com',
        role: 'staff'
      },
      {
        name: 'Mehmet Kaya',
        email: 'mehmet@kargo.com',
        role: 'admin'
      }
    ]);
    
    console.log('✅ Kullanıcılar oluşturuldu:', users.length);
    
    console.log('🔄 Örnek kargo kayıtları oluşturuluyor...');
    
    // Örnek kargo kayıtlarını oluştur
    const cargoRecords = await CargoRecord.insertMany([
      {
        barcodeNumber: '1234567890123',
        exitNumber: 'EX2024001234',
        carrierCompany: 'aras',
        senderCompany: 'Teknoloji A.Ş.',
        recipientName: 'Mehmet Yılmaz',
        description: 'Paket hasarlı şekilde teslim edildi. Müşteri şikayeti mevcut. Kutu ezik ve içerik zarar görmüş durumda.',
        photos: [
          'https://images.pexels.com/photos/4481327/pexels-photo-4481327.jpeg?auto=compress&cs=tinysrgb&w=400',
          'https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg?auto=compress&cs=tinysrgb&w=400'
        ],
        status: 'in_progress',
        statusUpdatedBy: users[2]._id, // Mehmet Kaya (admin)
        statusUpdatedByName: 'Mehmet Kaya',
        statusUpdatedAt: new Date('2024-01-15T10:30:00Z'),
        createdBy: users[0]._id, // Ahmet Yılmaz
        createdByName: 'Ahmet Yılmaz'
      },
      {
        barcodeNumber: '2345678901234',
        exitNumber: 'EX2024001235',
        carrierCompany: 'ptt',
        senderCompany: 'Moda Dünyası Ltd.',
        recipientName: 'Ayşe Demir',
        description: 'Yanlış adrese teslim edilmiş paket. Doğru adres araştırılıyor ve müşteri ile iletişim kuruldu.',
        photos: [
          'https://images.pexels.com/photos/4481328/pexels-photo-4481328.jpeg?auto=compress&cs=tinysrgb&w=400'
        ],
        status: 'resolved',
        resolutionNote: 'Paket doğru adrese yeniden gönderildi ve müşteri memnuniyeti sağlandı.',
        statusUpdatedBy: users[2]._id, // Mehmet Kaya (admin)
        statusUpdatedByName: 'Mehmet Kaya',
        statusUpdatedAt: new Date('2024-01-14T15:45:00Z'),
        createdBy: users[1]._id, // Fatma Demir
        createdByName: 'Fatma Demir'
      },
      {
        barcodeNumber: '3456789012345',
        exitNumber: 'EX2024001236',
        carrierCompany: 'surat',
        senderCompany: 'Kitap Evi Yayıncılık',
        recipientName: 'Ali Kaya',
        description: 'Geç teslim edilen paket için müşteri memnuniyetsizliği. Özür dilendi ve iade süreci tamamlandı.',
        photos: [],
        status: 'paid',
        paymentNote: '500 TL iade edildi. Banka transferi ile ödeme yapıldı.',
        statusUpdatedBy: users[2]._id, // Mehmet Kaya (admin)
        statusUpdatedByName: 'Mehmet Kaya',
        statusUpdatedAt: new Date('2024-01-13T09:20:00Z'),
        createdBy: users[0]._id, // Ahmet Yılmaz
        createdByName: 'Ahmet Yılmaz'
      },
      {
        barcodeNumber: '4567890123456',
        exitNumber: 'EX2024001237',
        carrierCompany: 'yurtici',
        senderCompany: 'Elektronik Market',
        recipientName: 'Zeynep Özkan',
        description: 'Paket kayıp. Müşteri kargo durumunu sorgulayamıyor ve paket sistemde görünmüyor.',
        photos: [],
        status: 'open',
        createdBy: users[1]._id, // Fatma Demir
        createdByName: 'Fatma Demir'
      }
    ]);
    
    console.log('✅ Kargo kayıtları oluşturuldu:', cargoRecords.length);
    
    console.log('\n🎉 Veritabanı başarıyla dolduruldu!');
    console.log('📊 İstatistikler:');
    console.log(`👥 Kullanıcı sayısı: ${users.length}`);
    console.log(`📦 Kargo kayıt sayısı: ${cargoRecords.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Veri ekleme hatası:', error);
    process.exit(1);
  }
};

// Script'i çalıştır
const run = async () => {
  await connectDB();
  await seedData();
};

run();




















