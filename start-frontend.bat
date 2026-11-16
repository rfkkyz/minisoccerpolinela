@echo off
title POLISOCCER - Frontend Dev Server (Port 3000)
echo ===================================================
echo    POLISOCCER FRONTEND CLIENT - MINT KACA BERGRID
echo ===================================================

set PATH=D:\nodejs;C:\Program Files\nodejs;%PATH%
cd /d "%~dp0"

:: 1. Cek dependensi node_modules
if not exist "frontend\node_modules" (
    echo [INFO] Menginstal dependensi frontend...
    cd frontend
    call npm install
    cd ..
)

:: 2. Jalankan Vite dev server
echo.
echo ===================================================
echo Menjalankan Frontend di http://localhost:3000
echo ===================================================
cd frontend
call npm run dev
pause
