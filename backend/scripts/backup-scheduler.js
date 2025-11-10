#!/usr/bin/env node

const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { dbManager } = require('../database');

/**
 * Otomatik Veritabanı Yedekleme Zamanlayıcısı
 * Bu script belirli aralıklarla veritabanını otomatik olarak yedekler
 */

class BackupScheduler {
  constructor() {
    this.backupDir = path.join(__dirname, '..', 'backups');
    this.dbPath = path.join(__dirname, '..', 'kargo.db');
    this.maxBackups = 30; // Son 30 yedek sakla
    this.isRunning = false;
    this.tasks = new Map();
  }

  /**
   * Yedek klasörünü oluştur
   */
  createBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`📂 Yedek klasörü oluşturuldu: ${this.backupDir}`);
    }
  }

  /**
   * Veritabanını yedekle
   */
  async backupDatabase() {
    try {
      this.createBackupDirectory();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `kargo-backup-${timestamp}.db`);
      
      // Veritabanı bağlantısını kontrol et
      await dbManager.checkConnection();
      
      // Dosyayı kopyala
      fs.copyFileSync(this.dbPath, backupPath);
      
      const stats = fs.statSync(backupPath);
      console.log(`💾 Veritabanı yedeklendi: ${backupPath}`);
      console.log(`📊 Yedek boyutu: ${(stats.size / 1024).toFixed(2)} KB`);
      
      // Eski yedekleri temizle
      this.cleanOldBackups();
      
      return backupPath;
    } catch (error) {
      console.error('❌ Yedekleme hatası:', error.message);
      throw error;
    }
  }

  /**
   * Eski yedekleri temizle
   */
  cleanOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('kargo-backup-') && file.endsWith('.db'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          time: fs.statSync(path.join(this.backupDir, file)).mtime
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length > this.maxBackups) {
        const filesToDelete = files.slice(this.maxBackups);
        filesToDelete.forEach(file => {
          fs.unlinkSync(file.path);
          console.log(`🗑️  Eski yedek silindi: ${file.name}`);
        });
        console.log(`🧹 ${filesToDelete.length} eski yedek temizlendi`);
      }
    } catch (error) {
      console.error('⚠️  Yedek temizleme hatası:', error.message);
    }
  }

  /**
   * Günlük yedekleme zamanlayıcısını başlat
   */
  startDailyBackup() {
    if (this.isRunning) {
      console.log('⚠️  Yedekleme zamanlayıcısı zaten çalışıyor');
      return;
    }

    // Her gün saat 02:00'da yedekle
    const dailyTask = cron.schedule('0 2 * * *', async () => {
      console.log('\n🕐 Günlük otomatik yedekleme başlatılıyor...');
      try {
        await this.backupDatabase();
        console.log('✅ Günlük yedekleme tamamlandı');
      } catch (error) {
        console.error('❌ Günlük yedekleme hatası:', error.message);
      }
    }, {
      scheduled: false,
      timezone: "Europe/Istanbul"
    });

    this.tasks.set('daily', dailyTask);
    dailyTask.start();
    this.isRunning = true;
    
    console.log('📅 Günlük yedekleme zamanlayıcısı başlatıldı (Her gün 02:00)');
  }

  /**
   * Haftalık yedekleme zamanlayıcısını başlat
   */
  startWeeklyBackup() {
    if (this.tasks.has('weekly')) {
      console.log('⚠️  Haftalık yedekleme zamanlayıcısı zaten çalışıyor');
      return;
    }

    // Her Pazar saat 01:00'da yedekle
    const weeklyTask = cron.schedule('0 1 * * 0', async () => {
      console.log('\n🕐 Haftalık otomatik yedekleme başlatılıyor...');
      try {
        await this.backupDatabase();
        console.log('✅ Haftalık yedekleme tamamlandı');
      } catch (error) {
        console.error('❌ Haftalık yedekleme hatası:', error.message);
      }
    }, {
      scheduled: false,
      timezone: "Europe/Istanbul"
    });

    this.tasks.set('weekly', weeklyTask);
    weeklyTask.start();
    
    console.log('📅 Haftalık yedekleme zamanlayıcısı başlatıldı (Her Pazar 01:00)');
  }

  /**
   * Manuel yedekleme
   */
  async manualBackup() {
    console.log('🔄 Manuel yedekleme başlatılıyor...');
    try {
      const backupPath = await this.backupDatabase();
      console.log('✅ Manuel yedekleme tamamlandı');
      return backupPath;
    } catch (error) {
      console.error('❌ Manuel yedekleme hatası:', error.message);
      throw error;
    }
  }

  /**
   * Yedekleme istatistiklerini göster
   */
  showBackupStats() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        console.log('📊 Henüz yedek bulunmuyor');
        return;
      }

      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('kargo-backup-') && file.endsWith('.db'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            date: stats.mtime
          };
        })
        .sort((a, b) => b.date - a.date);

      console.log('\n📊 YEDEKLEME İSTATİSTİKLERİ');
      console.log('='.repeat(50));
      console.log(`📁 Toplam yedek sayısı: ${files.length}`);
      
      if (files.length > 0) {
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        console.log(`💾 Toplam yedek boyutu: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📅 En son yedek: ${files[0].date.toLocaleString('tr-TR')}`);
        console.log(`📅 En eski yedek: ${files[files.length - 1].date.toLocaleString('tr-TR')}`);
        
        console.log('\n📋 Son 5 yedek:');
        files.slice(0, 5).forEach((file, index) => {
          console.log(`  ${index + 1}. ${file.name} (${(file.size / 1024).toFixed(2)} KB) - ${file.date.toLocaleString('tr-TR')}`);
        });
      }
    } catch (error) {
      console.error('❌ Yedek istatistikleri alınamadı:', error.message);
    }
  }

  /**
   * Tüm zamanlayıcıları durdur
   */
  stopAll() {
    this.tasks.forEach((task, name) => {
      task.stop();
      console.log(`⏹️  ${name} yedekleme zamanlayıcısı durduruldu`);
    });
    this.tasks.clear();
    this.isRunning = false;
  }

  /**
   * Zamanlayıcı durumunu göster
   */
  showStatus() {
    console.log('\n📊 YEDEKLEME ZAMANLAYICI DURUMU');
    console.log('='.repeat(40));
    console.log(`🔄 Çalışma durumu: ${this.isRunning ? '✅ Aktif' : '❌ Pasif'}`);
    console.log(`📁 Yedek klasörü: ${this.backupDir}`);
    console.log(`💾 Maksimum yedek sayısı: ${this.maxBackups}`);
    
    if (this.tasks.size > 0) {
      console.log('\n⏰ Aktif zamanlayıcılar:');
      this.tasks.forEach((task, name) => {
        console.log(`  - ${name}: ${task.getStatus()}`);
      });
    } else {
      console.log('\n⏰ Aktif zamanlayıcı bulunmuyor');
    }
  }
}

// Script doğrudan çalıştırılıyorsa
if (require.main === module) {
  const scheduler = new BackupScheduler();
  
  // Komut satırı argümanlarını kontrol et
  const args = process.argv.slice(2);
  
  if (args.includes('--manual')) {
    // Manuel yedekleme
    scheduler.manualBackup()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else if (args.includes('--stats')) {
    // İstatistikleri göster
    scheduler.showBackupStats();
    process.exit(0);
  } else if (args.includes('--status')) {
    // Durumu göster
    scheduler.showStatus();
    process.exit(0);
  } else if (args.includes('--daily')) {
    // Günlük yedekleme başlat
    scheduler.startDailyBackup();
    console.log('🔄 Günlük yedekleme zamanlayıcısı çalışıyor...');
  } else if (args.includes('--weekly')) {
    // Haftalık yedekleme başlat
    scheduler.startWeeklyBackup();
    console.log('🔄 Haftalık yedekleme zamanlayıcısı çalışıyor...');
  } else {
    // Varsayılan: günlük yedekleme başlat
    scheduler.startDailyBackup();
    console.log('🔄 Varsayılan günlük yedekleme zamanlayıcısı başlatıldı');
  }
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Yedekleme zamanlayıcısı kapatılıyor...');
    scheduler.stopAll();
    process.exit(0);
  });
  
  // Sürekli çalışması için
  if (args.includes('--daily') || args.includes('--weekly') || args.length === 0) {
    console.log('⏳ Yedekleme zamanlayıcısı çalışıyor. Durdurmak için Ctrl+C basın.');
    // Sürekli çalışması için
    setInterval(() => {}, 1000);
  }
}

module.exports = BackupScheduler;






















