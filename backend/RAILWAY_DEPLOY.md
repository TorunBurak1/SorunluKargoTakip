# Railway'e Backend Deploy Etme Rehberi

## Adım 1: Railway Hesabı Oluşturma

1. https://railway.app adresine gidin
2. "Start a New Project" butonuna tıklayın
3. GitHub hesabınızla giriş yapın

## Adım 2: Projeyi Railway'e Bağlama

1. Railway dashboard'da "New Project" butonuna tıklayın
2. "Deploy from GitHub repo" seçeneğini seçin
3. Repository'nizi seçin: `SorunluKargoTakip`
4. Root Directory olarak `backend` klasörünü seçin

## Adım 3: Environment Variables (Gerekirse)

Railway otomatik olarak PORT'u ayarlar. Ekstra bir environment variable gerekmez.

## Adım 4: Deploy

1. Railway otomatik olarak deploy başlatacak
2. Deploy tamamlandıktan sonra "Settings" → "Networking" bölümünden public URL'i alın
3. URL şu formatta olacak: `https://your-app-name.up.railway.app`

## Adım 5: Netlify'da Environment Variable Ayarlama

1. Netlify Dashboard → Site settings → Environment variables
2. Add variable:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://your-app-name.up.railway.app/api` (Railway'den aldığınız URL + `/api`)

## Önemli Notlar

- Railway ücretsiz tier'da 500 saat/ay verir
- SQLite veritabanı Railway'de persistent storage'da saklanır
- İlk deploy'da veritabanı otomatik oluşturulur

## Sorun Giderme

- Deploy başarısız olursa, Railway logs'u kontrol edin
- Port hatası alırsanız, `process.env.PORT` kullanıldığından emin olun (zaten var)
- Veritabanı hatası alırsanız, logs'u kontrol edin

