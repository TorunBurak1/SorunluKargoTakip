@echo off
echo Kargo API sunucusu başlatılıyor...
cd /d "C:\Users\HP\Desktop\SorunluKagoProjesi\project\backend"
pm2 start ecosystem.config.js
echo Kargo API sunucusu başlatıldı.
echo PM2 durumu:
pm2 status
pause








