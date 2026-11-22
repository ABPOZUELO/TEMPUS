@echo off
cd /d "%~dp0\.."
echo ======================================================== >> automation\daily_runner.log
echo [%date% %time%] INICIANDO EJECUCION DIARIA >> automation\daily_runner.log
echo ======================================================== >> automation\daily_runner.log

node automation\run_daily_video.cjs >> automation\daily_runner.log 2>&1

if %ERRORLEVEL% EQU 0 (
  echo [%date% %time%] [OK] Proceso terminado con exito. >> automation\daily_runner.log
) else (
  echo [%date% %time%] [ERROR] Hubo un fallo con codigo %ERRORLEVEL% >> automation\daily_runner.log
)
