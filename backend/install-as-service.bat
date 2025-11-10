@echo off
echo Kargo API'yi Windows Service olarak yukluyor...

cd /d "C:\Users\HP\Desktop\SorunluKagoProjesi\project\backend"

echo PM2'yi Windows Service olarak yukluyor...
pm2-service-install -n "KargoAPI" -p "C:\Users\HP\Desktop\SorunluKagoProjesi\project\backend"

echo Service yuklendi. Sunucu baslatiliyor...
pm2 start ecosystem.config.js
pm2 save

echo Kargo API Windows Service olarak yuklendi!
echo Sistem yeniden basladiginda otomatik baslayacak.
pause






