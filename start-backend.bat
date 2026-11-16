@echo off
title POLISOCCER - Backend Server (Port 5000)
echo ===================================================
echo    POLISOCCER BACKEND SERVER - FASE 2
echo ===================================================

set PATH=D:\nodejs;C:\Program Files\nodejs;%PATH%
cd /d "%~dp0"

:: 1. Cek file .env
if not exist "backend\.env" (
    echo [INFO] backend\.env tidak ditemukan. Menyalin dari backend\.env.example...
    copy "backend\.env.example" "backend\.env" >nul
)

:: 2. Cek dependensi node_modules
if not exist "backend\node_modules" (
    echo [INFO] Menginstal dependensi backend...
    cd backend
    call npm install
    cd ..
)

:: 3. Jalankan migrasi database otomatis
echo [INFO] Memeriksa & menjalankan migrasi database Fase 2...
node database/migrate.js

:: 4. Jalankan backend server
echo.
echo ===================================================
echo Menjalankan Backend Server di http://localhost:5000
echo ===================================================
cd backend
node server.js
pause
