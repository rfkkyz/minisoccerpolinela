@echo off
title POLISOCCER - Launcher
echo ===================================================
echo    MEMULAI SISTEM POLISOCCER (POLINELA) - FASE 2
echo    Tema: Mint Kaca Bergrid (#12A150 & #7CFFB2)
echo ===================================================

:: 1. Cek & Jalankan MySQL jika belum aktif
netstat -ano | findstr :3306 >nul
if %errorlevel% neq 0 (
    echo [1/3] Menjalankan MySQL via XAMPP...
    if exist "%~dp0..\..\mysql_start.bat" (
        start "POLISOCCER MySQL" /min "%~dp0..\..\mysql_start.bat"
        ping 127.0.0.1 -n 3 >nul
    ) else if exist "D:\xampp\mysql_start.bat" (
        start "POLISOCCER MySQL" /min "D:\xampp\mysql_start.bat"
        ping 127.0.0.1 -n 3 >nul
    ) else if exist "C:\xampp\mysql_start.bat" (
        start "POLISOCCER MySQL" /min "C:\xampp\mysql_start.bat"
        ping 127.0.0.1 -n 3 >nul
    ) else (
        echo [PERINGATAN] MySQL belum aktif di port 3306. Pastikan XAMPP MySQL sudah dinyalakan!
    )
) else (
    echo [1/3] MySQL sudah aktif di port 3306.
)

:: 2. Jalankan Backend Server di jendela terpisah
echo [2/3] Memulai Backend Server (Port 5000)...
start "POLISOCCER Backend (Port 5000)" cmd /k "%~dp0start-backend.bat"

:: 3. Jalankan Frontend Dev Server di jendela terpisah
echo [3/3] Memulai Frontend Client (Port 3000)...
start "POLISOCCER Frontend (Port 3000)" cmd /k "%~dp0start-frontend.bat"

echo.
echo ===================================================
echo Semua service sedang dijalankan di jendela terpisah.
echo Menunggu inisialisasi server sebelum membuka browser...
echo ===================================================
ping 127.0.0.1 -n 4 >nul
start http://localhost:3000
exit
