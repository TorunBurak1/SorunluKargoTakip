# Kargo Takip Sistemi

Sorunlu kargo kayıt ve yönetim sistemi. Bu sistem, kargo şirketlerinin sorunlu kargo kayıtlarını takip etmelerini ve yönetmelerini sağlar.

## Özellikler

- **Kullanıcı Yönetimi**: Çalışan ve yönetici rolleri
- **Kargo Kayıt Sistemi**: Barkod numarası, çıkış numarası, taşıyıcı firma ve gönderici firma bilgileri
- **Taşıyıcı Firmalar**: Aras Aylin, Aras Verar, Aras Hatip, PTT, Sürat, Verar, Yurtiçi
- **Fotoğraf Yükleme**: Sorunlu kargo fotoğraflarını ekleme
- **Gerçek Zamanlı Veritabanı**: SQLite veritabanı ile kalıcı veri saklama
- **RESTful API**: Express.js ile backend API
- **Modern UI**: React + TypeScript + Tailwind CSS

## Teknolojiler

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Vite
- Lucide React (İkonlar)

### Backend
- Node.js
- Express.js
- SQLite3
- CORS

## Kurulum

### 1. Projeyi klonlayın
```bash
git clone <repository-url>
cd SorunluKagoProjesi/project
```

### 2. Backend bağımlılıklarını yükleyin
```bash
cd backend
npm install
```

### 3. Frontend bağımlılıklarını yükleyin
```bash
cd ../
npm install
```

## Çalıştırma

### 1. Backend'i başlatın
```bash
cd backend
npm start
```
Backend http://localhost:3001 adresinde çalışacak.

### 2. Frontend'i başlatın
```bash
npm run dev
```
Frontend http://localhost:5173 adresinde çalışacak.

## Demo Hesapları

- **Çalışan**: ahmet@kargo.com / 123456
- **Yönetici**: mehmet@kargo.com / 123456

## API Endpoints

### Kullanıcılar
- `GET /api/users` - Tüm kullanıcıları listele
- `GET /api/users/:id` - Belirli kullanıcıyı getir
- `POST /api/users/login` - Kullanıcı girişi

### Kargo Kayıtları
- `GET /api/cargo-records` - Tüm kargo kayıtlarını listele
- `GET /api/cargo-records/:id` - Belirli kargo kaydını getir
- `POST /api/cargo-records` - Yeni kargo kaydı oluştur
- `PUT /api/cargo-records/:id` - Kargo kaydını güncelle
- `DELETE /api/cargo-records/:id` - Kargo kaydını sil

## Veritabanı Şeması

### Users Tablosu
- id (TEXT PRIMARY KEY)
- name (TEXT NOT NULL)
- email (TEXT UNIQUE NOT NULL)
- role (TEXT NOT NULL CHECK(role IN ('staff', 'admin')))
- created_at (DATETIME DEFAULT CURRENT_TIMESTAMP)

### CargoRecords Tablosu
- id (TEXT PRIMARY KEY)
- barcode_number (TEXT NOT NULL)
- exit_number (TEXT NOT NULL)
- carrier_company (TEXT NOT NULL)
- sender_company (TEXT NOT NULL)
- description (TEXT NOT NULL)
- photos (TEXT) -- JSON array
- created_by (TEXT NOT NULL)
- created_by_name (TEXT NOT NULL)
- created_at (DATETIME DEFAULT CURRENT_TIMESTAMP)
- updated_at (DATETIME DEFAULT CURRENT_TIMESTAMP)

## Geliştirme

### Backend Geliştirme
```bash
cd backend
npm run dev  # nodemon ile otomatik yeniden başlatma
```

### Frontend Geliştirme
```bash
npm run dev  # Vite development server
```

## Netlify Deployment

### Environment Variables

Netlify'da frontend'i deploy ederken, backend API URL'ini environment variable olarak ayarlamanız gerekir:

1. **Netlify Dashboard** → **Site settings** → **Environment variables**
2. **Add variable** butonuna tıklayın
3. Şu değişkeni ekleyin:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: Backend'inizin gerçek URL'i (örn: `https://your-backend-url.com/api`)

**Önemli**: Backend'iniz internet üzerinden erişilebilir olmalıdır. Eğer backend localhost'ta çalışıyorsa, başka bir bilgisayardan erişilemez.

### Backend Hosting Seçenekleri

Backend'inizi host etmek için şu seçenekleri kullanabilirsiniz:
- **Heroku**
- **Railway**
- **Render**
- **DigitalOcean**
- **AWS/Google Cloud/Azure**
- **VPS (Virtual Private Server)**

Backend deploy edildikten sonra, Netlify environment variable'ında backend URL'ini ayarlayın.

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.


