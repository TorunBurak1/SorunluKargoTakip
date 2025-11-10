#!/usr/bin/env node

const { initDatabase, dbManager, initializeDatabase } = require('../database');
const fs = require('fs');
const path = require('path');

/**
 * Otomatik Veritabanı Yönetim Sistemi
 * Bu script veritabanını otomatik olarak başlatır, kontrol eder ve yedekler
 */

class AutoDatabaseManager {
  constructor() {
    this.dbPath = path.join(__dirname, '..', 'kargo.db');
    this.backupDir = path.join(__dirname, '..', 'backups');
    this.maxBackups = 7; // Son 7 yedek sakla
  }

  /**
   * Veritabanı bağlantısını kontrol et
   */
  async checkConnection() {
    try {
      await dbManager.checkConnection();
      console.log('✅ Veritabanı bağlantısı başarılı');
      return true;
    } catch (err) {
      console.error('❌ Veritabanı bağlantı hatası:', err.message);
      throw err;
    }
  }

  /**
   * Veritabanı dosyasının varlığını kontrol et
   */
  checkDatabaseFile() {
    if (fs.existsSync(this.dbPath)) {
      const stats = fs.statSync(this.dbPath);
      console.log(`📁 Veritabanı dosyası mevcut: ${this.dbPath}`);
      console.log(`📊 Dosya boyutu: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`📅 Son değişiklik: ${stats.mtime.toLocaleString('tr-TR')}`);
      return true;
    } else {
      console.log('⚠️  Veritabanı dosyası bulunamadı, oluşturulacak...');
      return false;
    }
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
    this.createBackupDirectory();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `kargo-backup-${timestamp}.db`);
    
    try {
      fs.copyFileSync(this.dbPath, backupPath);
      console.log(`💾 Veritabanı yedeklendi: ${backupPath}`);
      
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
      }
    } catch (error) {
      console.error('⚠️  Yedek temizleme hatası:', error.message);
    }
  }

  /**
   * Veritabanı istatistiklerini göster
   */
  async showDatabaseStats() {
    try {
      const stats = await dbManager.getStats();
      
      console.log('\n📊 VERİTABANI İSTATİSTİKLERİ');
      console.log('='.repeat(40));
      console.log(`👥 Toplam kullanıcı: ${stats.users}`);
      console.log(`📦 Toplam kargo kaydı: ${stats.cargoRecords}`);
      console.log('\n📋 Durum dağılımı:');
      
      stats.statusDistribution.forEach(stat => {
        const statusEmoji = {
          'open': '🔴',
          'in_progress': '🟡', 
          'resolved': '🟢',
          'paid': '💰',
          'rejected': '❌'
        };
        console.log(`  ${statusEmoji[stat.status] || '📄'} ${stat.status}: ${stat.count}`);
      });
      
      return stats;
    } catch (error) {
      console.error('❌ İstatistik alma hatası:', error.message);
      throw error;
    }
  }

  /**
   * Ana başlatma fonksiyonu
   */
  async start() {
    console.log('🚀 Otomatik Veritabanı Yöneticisi Başlatılıyor...\n');
    
    try {
      // 1. Veritabanı dosyasını kontrol et
      const dbExists = this.checkDatabaseFile();
      
      // 2. Mevcut veritabanını yedekle (varsa)
      if (dbExists) {
        await this.backupDatabase();
      }
      
      // 3. Veritabanını başlat
      console.log('\n🔄 Veritabanı başlatılıyor...');
      await initDatabase();
      
      // 4. Bağlantıyı kontrol et
      await this.checkConnection();
      
      // 5. İstatistikleri göster
      await this.showDatabaseStats();
      
      console.log('\n✅ Veritabanı başarıyla hazırlandı!');
      console.log('🌐 Sunucu başlatılabilir: npm start veya npm run dev');
      
    } catch (error) {
      console.error('\n❌ Veritabanı başlatma hatası:', error.message);
      process.exit(1);
    }
  }

  /**
   * Veritabanını kapat
   */
  async close() {
    try {
      await dbManager.close();
      console.log('✅ Veritabanı bağlantısı kapatıldı');
    } catch (error) {
      console.error('❌ Veritabanı kapatma hatası:', error.message);
    }
  }
}

// Script doğrudan çalıştırılıyorsa
if (require.main === module) {
  const manager = new AutoDatabaseManager();
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Veritabanı yöneticisi kapatılıyor...');
    await manager.close();
    process.exit(0);
  });
  
  manager.start();
}

module.exports = AutoDatabaseManager;
