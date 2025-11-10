@echo off
echo ========================================
echo KARGO API SUNUCUSU BAŞLATILIYOR
echo ========================================
echo.
echo Kalıcı SQLite veritabanı ile başlatılıyor...
echo Veriler kargo.db dosyasında saklanacak
echo.
cd /d "%~dp0"
npm run start:persistent
pause















