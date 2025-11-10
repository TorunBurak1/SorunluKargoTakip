@echo off
echo Kargo API sunucusu başlatılıyor...
cd /d "C:\Users\HP\Desktop\SorunluKagoProjesi\project\backend"

echo Veritabanı checkpoint yapılıyor...
node checkpoint-db.js

echo PM2 ile sunucu başlatılıyor...
pm2 start ecosystem.config.js

echo Kargo API sunucusu başlatıldı.
echo PM2 durumu:
pm2 status
echo.
echo Sunucu çalışıyor: http://localhost:3001
pause







