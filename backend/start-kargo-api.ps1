# Kargo API Sunucusu Başlatma Scripti
# Bu script Windows Task Scheduler ile otomatik çalıştırılabilir

# Çalışma dizinini ayarla
Set-Location "C:\Users\HP\Desktop\SorunluKagoProjesi\project\backend"

# PM2 ile sunucuyu başlat
& pm2 start ecosystem.config.js

# Log dosyasına yaz
$logMessage = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Kargo API sunucusu başlatıldı"
Add-Content -Path "logs\startup.log" -Value $logMessage

Write-Host "Kargo API sunucusu başlatıldı: $(Get-Date)"












