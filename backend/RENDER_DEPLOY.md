# Render'da Backend Deploy Etme Rehberi

## Ön Hazırlık

1. **GitHub Repository**: Kodunuz GitHub'da olmalı
2. **PostgreSQL Veritabanı**: Render'da PostgreSQL servisi oluşturmalısınız

## Adım 1: PostgreSQL Veritabanı Oluşturma

1. Render Dashboard'a gidin: https://dashboard.render.com
2. **"New +"** butonuna tıklayın
3. **"PostgreSQL"** seçin
4. Ayarları yapın:
   - **Name**: `kargo-db` (veya istediğiniz isim)
   - **Database**: `kargo` (veya istediğiniz isim)
   - **User**: Otomatik oluşturulur
   - **Region**: Size en yakın bölgeyi seçin
   - **PostgreSQL Version**: 15 veya 16
   - **Plan**: Free tier yeterli (başlangıç için)
5. **"Create Database"** butonuna tıklayın
6. Veritabanı oluşturulduktan sonra, **"Connections"** sekmesinden **"Internal Database URL"** veya **"External Database URL"** kopyalayın
   - Bu URL şu formatta olacak: `postgresql://user:password@host:port/database`

## Adım 2: Web Service Oluşturma

1. Render Dashboard'da **"New +"** butonuna tıklayın
2. **"Web Service"** seçin
3. GitHub repository'nizi bağlayın:
   - GitHub hesabınızı bağlayın (ilk kez ise)
   - Repository'nizi seçin: `SorunluKagoProjesi` (veya proje adınız)
   - **Root Directory**: `project/backend` olarak ayarlayın

## Adım 3: Build ve Deploy Ayarları

1. **Name**: `sorunlukargotakip-backend` (veya istediğiniz isim)
2. **Region**: PostgreSQL ile aynı bölgeyi seçin
3. **Branch**: `main` (veya default branch)
4. **Root Directory**: `project/backend`
5. **Runtime**: `Node`
6. **Build Command**: `npm install`
7. **Start Command**: `npm start`
8. **Plan**: Free tier yeterli (başlangıç için)

## Adım 4: Environment Variables Ekleme

**Settings** → **Environment** sekmesine gidin ve şu değişkenleri ekleyin:

### Zorunlu:
- **Key**: `DATABASE_URL`
- **Value**: PostgreSQL veritabanından kopyaladığınız URL (Adım 1'den)
  - Örnek: `postgresql://user:password@host:5432/database`

### Önerilen (CORS için):
- **Key**: `ALLOWED_ORIGINS`
- **Value**: Frontend URL'iniz (virgülle ayrılmış birden fazla olabilir)
  - Örnek: `https://sorunlu-kargo-takip.netlify.app,http://localhost:5173`
  - Not: Eğer eklemezseniz, kod içinde varsayılan değerler kullanılacak

### Opsiyonel:
- **Key**: `NODE_ENV`
- **Value**: `production`

## Adım 5: Deploy

1. **"Create Web Service"** butonuna tıklayın
2. Render otomatik olarak:
   - Bağımlılıkları yükleyecek (`npm install`)
   - Servisi başlatacak (`npm start`)
3. Deploy tamamlandıktan sonra **"Events"** sekmesinden logları kontrol edin
4. Başarılı olursa, **"Settings"** → **"Info"** sekmesinden URL'inizi alın
   - URL şu formatta olacak: `https://sorunlukargotakip.onrender.com`

## Adım 6: Veritabanı Tablolarını Oluşturma

İlk deploy'dan sonra veritabanı tabloları otomatik oluşturulmalı. Eğer oluşmadıysa:

1. Backend loglarını kontrol edin
2. `initDatabase()` fonksiyonu otomatik çalışmalı
3. Sorun varsa, Render'ın PostgreSQL'e bağlantısını kontrol edin

## Adım 7: Netlify'da Frontend Environment Variable Güncelleme

1. Netlify Dashboard → Site settings → Environment variables
2. `VITE_API_BASE_URL` değişkenini güncelleyin:
   - **Value**: `https://sorunlukargotakip.onrender.com/api` (Render'dan aldığınız URL + `/api`)
3. Netlify'ı yeniden deploy edin (otomatik olabilir)

## Test

1. Backend health check: `https://sorunlukargotakip.onrender.com/api/health`
2. Tarayıcıda açın, `{"status":"OK","message":"Kargo API çalışıyor"}` görmelisiniz
3. Frontend'den giriş yapmayı deneyin

## Sorun Giderme

### Veritabanı Bağlantı Hatası
- `DATABASE_URL` doğru mu kontrol edin
- PostgreSQL servisi çalışıyor mu kontrol edin
- Render logs'u kontrol edin

### CORS Hatası
- `ALLOWED_ORIGINS` environment variable'ını eklediniz mi?
- Frontend URL'i doğru mu?

### Port Hatası
- Render otomatik olarak PORT'u ayarlar, sorun olmamalı
- `process.env.PORT` kullanıldığından emin olun (zaten var)

### Deploy Başarısız
- Logs'u kontrol edin: **Events** sekmesi
- `npm install` başarılı oldu mu?
- Root directory doğru mu? (`project/backend`)

## Önemli Notlar

- **Free Tier Limitleri**: 
  - Render free tier'da servisler 15 dakika kullanılmazsa uyku moduna geçer
  - İlk istekte 30-60 saniye bekleme olabilir (spin-up)
  - Production için paid plan önerilir

- **Veritabanı**: 
  - PostgreSQL veritabanı Render'da kalıcı olarak saklanır
  - Free tier'da 90 gün kullanılmazsa silinebilir

- **Backup**: 
  - Önemli veriler için düzenli backup alın
  - Render'ın backup özelliğini kullanabilirsiniz

