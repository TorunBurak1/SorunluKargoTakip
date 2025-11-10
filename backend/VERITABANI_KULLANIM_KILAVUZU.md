# Veritabanı Kullanım Kılavuzu

## Sorun
Program her kapatılıp açıldığında veriler sıfırlanıyor.

## Çözüm
Kalıcı SQLite veritabanı kullanın.

## Kullanım

### 1. Kalıcı Veritabanı ile Başlatma
```bash
cd project/backend
npm run start:persistent
```

### 2. Geliştirme Modu (Otomatik Yeniden Başlatma)
```bash
cd project/backend
npm run dev:persistent
```

## Veritabanı Seçenekleri

### ✅ Önerilen: Kalıcı SQLite
- **Dosya**: `start-persistent.js`
- **Komut**: `npm run start:persistent`
- **Avantaj**: Veriler kalıcı, program kapatılıp açıldığında veriler korunur
- **Veritabanı**: `kargo.db` dosyası

### ❌ Geçici: In-Memory
- **Dosya**: `server-local-mongodb.js`
- **Komut**: `npm run start:local`
- **Sorun**: Veriler geçici, program kapatıldığında veriler silinir

### 🔧 MongoDB (Gelişmiş)
- **Dosya**: `server-mongodb.js`
- **Komut**: `npm run start:mongodb`
- **Gereksinim**: MongoDB kurulumu gerekli

## Veri Kalıcılığı Kontrolü

### Veritabanı Durumu Kontrolü
```
http://localhost:3001/api/database/status
```

### Tüm Verileri Görüntüleme
```
http://localhost:3001/api/all-data
```

## Veritabanı Dosyası
- **Konum**: `project/backend/kargo.db`
- **Tip**: SQLite
- **Boyut**: Verilerinize göre değişir
- **Yedekleme**: Dosyayı kopyalayarak yedekleyebilirsiniz

## Sorun Giderme

### Veriler Hala Sıfırlanıyor
1. Doğru komutu kullandığınızdan emin olun: `npm run start:persistent`
2. `kargo.db` dosyasının oluştuğunu kontrol edin
3. Veritabanı durumunu kontrol edin: `http://localhost:3001/api/database/status`

### Veritabanı Bağlantı Hatası
1. `project/backend` dizininde olduğunuzdan emin olun
2. Node.js modüllerinin yüklü olduğunu kontrol edin: `npm install`
3. Port 3001'in kullanımda olmadığını kontrol edin

## Örnek Kullanım

```bash
# 1. Proje dizinine git
cd project/backend

# 2. Bağımlılıkları yükle (sadece ilk seferde)
npm install

# 3. Kalıcı veritabanı ile başlat
npm run start:persistent

# 4. Başka bir terminalde frontend'i başlat
cd ../../
npm run dev

# 5. Tarayıcıda kontrol et
# Backend: http://localhost:3001/api/health
# Frontend: http://localhost:5173
```

## Sorun Giderme

### Veriler Hala Görünmüyor
1. **Backend çalışıyor mu?** 
   ```bash
   # Backend durumunu kontrol et
   curl http://localhost:3001/api/health
   ```

2. **Veritabanında veri var mı?**
   ```bash
   npm run check:data
   ```

3. **API endpoint'leri çalışıyor mu?**
   ```bash
   npm run test:api
   ```

4. **Frontend console'da hata var mı?**
   - F12 tuşuna basın
   - Console sekmesini açın
   - Hata mesajlarını kontrol edin

### Backend Başlatma Sorunları
```bash
# Windows için
start-server.bat

# Manuel başlatma
npm run start:persistent
```

## Önemli Notlar
- ✅ `start-persistent.js` kullanın
- ❌ `server-local-mongodb.js` kullanmayın (geçici veri)
- 💾 Veriler `kargo.db` dosyasında saklanır
- 🔄 Program kapatılıp açıldığında veriler korunur
