@echo off
cd /d "%~dp0"
echo.
echo   Oyun hazirlaniyor... Tarayici birkac saniye icinde otomatik acilacak.
echo.
echo   ONEMLI: Oynarken bu pencere ACIK kalmali.
echo   Bitirince bu pencereyi kapatabilirsin.
echo.
start "" /b powershell -NoProfile -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:4173/'"
call npm run preview -- --port 4173 --host
