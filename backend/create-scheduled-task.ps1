# Windows Task Scheduler ile Kargo API otomatik başlatma
# Bu scripti yönetici olarak çalıştırın

$taskName = "KargoAPI-AutoStart"
$scriptPath = "C:\Users\HP\Desktop\SorunluKagoProjesi\project\backend\start-with-checkpoint.bat"

# Mevcut görevi sil (varsa)
try {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "Mevcut görev silindi."
} catch {
    Write-Host "Silinecek görev bulunamadı."
}

# Yeni görev oluştur
$action = New-ScheduledTaskAction -Execute $scriptPath
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal

Write-Host "✅ Kargo API otomatik başlatma görevi oluşturuldu: $taskName"
Write-Host "🔄 Sistem yeniden başladığında API otomatik olarak başlayacak."
Write-Host "📋 Görev adı: $taskName"






