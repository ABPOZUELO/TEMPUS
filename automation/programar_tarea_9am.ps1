$TaskName = "Tempus_Daily_Video_Generator"
$ScriptPath = "C:\Users\jorge\Desktop\PORTFOLIO\automation\generar_video_hoy.bat"

$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -Command `"`& '$ScriptPath'`""
$Trigger = New-ScheduledTaskTrigger -Daily -At 9:00AM
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Generador diario silencioso de videos para Tempus Wealth Management a las 09:00 AM" -Force

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host " Tarea programada actualizada a modo 100% INVISIBLE!" -ForegroundColor Green
Write-Host " No se abrira ninguna ventana en pantalla." -ForegroundColor Green
Write-Host " Se ejecutara todos los dias a las 09:00 AM en segundo plano." -ForegroundColor Green
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
