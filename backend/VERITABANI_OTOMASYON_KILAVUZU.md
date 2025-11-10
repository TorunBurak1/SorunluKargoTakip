# 🗄️ Veritabanı Otomasyon Kılavuzu

Bu kılavuz, kargo takip sistemi veritabanının otomatik yönetimi için geliştirilen araçları açıklar.

## 🚀 Hızlı Başlangıç

### 1. Bağımlılıkları Yükle
```bash
npm install
```

### 2. Veritabanını Otomatik Başlat
```bash
npm run setup
```
Bu komut veritabanını başlatır ve sunucuyu çalıştırır.

## 📋 Mevcut Komutlar

### Veritabanı Yönetimi
```bash
# Veritabanını başlat ve kontrol et
npm run db:init

# Veritabanı istatistiklerini göster
npm run db:stats

# Veritabanı bağlantısını kontrol et
npm run db:check

# Manuel yedekleme yap
npm run backup:manual

# Yedekleme istatistiklerini göster
npm run backup:stats

# Yedekleme durumunu kontrol et
npm run backup:status
```

### Sunucu Yönetimi
```bash
# Normal başlatma
npm start

# Geliştirme modu (otomatik yeniden başlatma)
npm run dev

# Tam kurulum (veritabanı + sunucu)
npm run setup

# Geliştirme modu (veritabanı + otomatik yeniden başlatma)
npm run dev:full
```

### Otomatik Yedekleme
```bash
# Günlük otomatik yedekleme başlat
npm run backup:daily

# Haftalık otomatik yedekleme başlat
npm run backup:weekly
```

## 🔧 Özellikler

### 1. Otomatik Veritabanı Başlatma
- ✅ Veritabanı dosyası otomatik oluşturulur
- ✅ Tablolar otomatik oluşturulur
- ✅ Örnek veriler otomatik eklenir
- ✅ Bağlantı hatalarında otomatik yeniden deneme
- ✅ Veritabanı performans optimizasyonları

### 2. Gelişmiş Bağlantı Yönetimi
- ✅ Bağlantı durumu kontrolü
- ✅ Otomatik yeniden bağlanma
- ✅ Graceful shutdown
- ✅ Bağlantı istatistikleri

### 3. Otomatik Yedekleme Sistemi
- ✅ Manuel yedekleme
- ✅ Günlük otomatik yedekleme
- ✅ Haftalık otomatik yedekleme
- ✅ Eski yedekleri otomatik temizleme
- ✅ Yedekleme istatistikleri

### 4. API Endpoint'leri
- `GET /api/health` - Sunucu durumu
- `GET /api/database/status` - Veritabanı durumu ve istatistikleri
- `GET /api/all-data` - Tüm veriler

## 📊 Veritabanı İstatistikleri

Veritabanı durumunu kontrol etmek için:
```bash
npm run db:stats
```

Çıktı örneği:
```
📊 VERİTABANI İSTATİSTİKLERİ
========================================
👥 Toplam kullanıcı: 3
📦 Toplam kargo kaydı: 4

📋 Durum dağılımı:
  🔴 open: 1
  🟡 in_progress: 1
  🟢 resolved: 1
  💰 paid: 1
```

## 💾 Yedekleme Sistemi

### Manuel Yedekleme
```bash
npm run backup:manual
```

### Otomatik Yedekleme Zamanlayıcıları
```bash
# Günlük yedekleme (her gün 02:00)
npm run backup:daily

# Haftalık yedekleme (her Pazar 01:00)
npm run backup:weekly
```

### Yedekleme İstatistikleri
```bash
npm run backup:stats
```

Çıktı örneği:
```
📊 YEDEKLEME İSTATİSTİKLERİ
==================================================
📁 Toplam yedek sayısı: 5
💾 Toplam yedek boyutu: 2.45 MB
📅 En son yedek: 15.01.2024 14:30:25
📅 En eski yedek: 10.01.2024 02:00:15

📋 Son 5 yedek:
  1. kargo-backup-2024-01-15T14-30-25-123Z.db (512.45 KB) - 15.01.2024 14:30:25
  2. kargo-backup-2024-01-14T02-00-15-456Z.db (498.32 KB) - 14.01.2024 02:00:15
  ...
```

## 🛠️ Gelişmiş Kullanım

### Veritabanı Bağlantı Ayarları
Veritabanı bağlantısı otomatik olarak optimize edilir:
- `PRAGMA foreign_keys = ON` - Foreign key kontrolü
- `PRAGMA journal_mode = WAL` - Write-Ahead Logging
- `PRAGMA synchronous = NORMAL` - Performans optimizasyonu
- `PRAGMA cache_size = 1000` - Cache boyutu
- `PRAGMA temp_store = MEMORY` - Geçici verileri bellekte sakla

### Hata Yönetimi
- Bağlantı hatalarında otomatik yeniden deneme (3 kez)
- Graceful shutdown ile güvenli kapatma
- Detaylı hata logları
- Bağlantı durumu monitoring

### Performans İzleme
- Veritabanı boyutu takibi
- Bağlantı durumu monitoring
- Yedekleme süreçleri izleme
- API endpoint'leri ile durum kontrolü

## 🔍 Sorun Giderme

### Veritabanı Bağlantı Sorunları
```bash
# Bağlantıyı kontrol et
npm run db:check

# Veritabanını yeniden başlat
npm run db:init
```

### Yedekleme Sorunları
```bash
# Yedekleme durumunu kontrol et
npm run backup:status

# Manuel yedekleme yap
npm run backup:manual
```

### Sunucu Sorunları
```bash
# Sunucu durumunu kontrol et
curl http://localhost:3001/api/health

# Veritabanı durumunu kontrol et
curl http://localhost:3001/api/database/status
```

## 📁 Dosya Yapısı

```
backend/
├── scripts/
│   ├── auto-db.js          # Otomatik veritabanı yöneticisi
│   └── backup-scheduler.js # Yedekleme zamanlayıcısı
├── backups/                # Yedek dosyaları (otomatik oluşturulur)
├── database.js             # Gelişmiş veritabanı yönetimi
├── server.js               # Güncellenmiş sunucu
└── package.json            # Yeni scriptler ve bağımlılıklar
```

## 🎯 Öneriler

1. **Günlük Yedekleme**: Üretim ortamında günlük yedekleme kullanın
2. **Monitoring**: `/api/database/status` endpoint'ini düzenli kontrol edin
3. **Yedek Kontrolü**: Haftalık olarak yedek dosyalarını kontrol edin
4. **Log Takibi**: Sunucu loglarını düzenli olarak inceleyin

## 🆘 Destek

Sorun yaşarsanız:
1. Önce `npm run db:check` ile bağlantıyı kontrol edin
2. `npm run backup:status` ile yedekleme durumunu kontrol edin
3. Sunucu loglarını inceleyin
4. Gerekirse `npm run setup` ile yeniden kurulum yapın

---

**Not**: Bu otomasyon sistemi veritabanınızı tamamen otomatik olarak yönetir. Artık manuel müdahale gerektirmez! 🎉






















