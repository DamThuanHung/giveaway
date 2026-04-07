@echo off
chcp 65001 >nul
title Cho va Tang — Dev Launcher

echo.
echo  ==========================================
echo   CHO VA TANG — KHOI DONG MOI TRUONG DEV
echo  ==========================================
echo.

:: ── 1. DOCKER DESKTOP ──────────────────────────────────────────
echo [1/4] Kiem tra Docker Desktop...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo      Docker chua chay. Dang mo Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo      Cho Docker khoi dong
    :wait_docker
    timeout /t 5 /nobreak >nul
    docker ps >nul 2>&1
    if %errorlevel% neq 0 goto wait_docker
    echo      Docker san sang!
) else (
    echo      Docker dang chay.
)

:: ── 2. POSTGRESQL (Docker container) ───────────────────────────
echo.
echo [2/4] Kiem tra PostgreSQL...
docker ps --filter "name=postgres" --filter "status=running" | findstr "postgres" >nul 2>&1
if %errorlevel% neq 0 (
    echo      Dang khoi dong PostgreSQL...
    docker start postgres >nul 2>&1
    if %errorlevel% neq 0 (
        echo      Container postgres chua ton tai, tao moi...
        cd /d "%~dp0backend"
        docker-compose up -d postgres
        cd /d "%~dp0"
    )
    timeout /t 4 /nobreak >nul
    echo      PostgreSQL san sang!
) else (
    echo      PostgreSQL dang chay.
)

:: ── 3. NESTJS BACKEND ───────────────────────────────────────────
echo.
echo [3/4] Khoi dong NestJS Backend (port 3800)...
start "Backend - NestJS" cmd /k "cd /d %~dp0backend && npm run start:dev"
timeout /t 8 /nobreak >nul
echo      Backend dang chay tai http://192.168.0.108:3800

:: ── 4. FLUTTER FRONTEND ─────────────────────────────────────────
echo.
echo [4/4] Khoi dong Flutter App (Chrome)...
start "Frontend - Flutter" cmd /k "cd /d %~dp0app && flutter run -d chrome"

echo.
echo  ==========================================
echo   TAT CA DA DUOC KHOI DONG!
echo  ──────────────────────────────────────────
echo   Backend : http://localhost:3800
echo   Flutter  : Chrome se tu mo
echo  ==========================================
echo.
echo  De dung app: dong 2 cua so terminal phia tren
echo  hoac nhan Ctrl+C trong moi cua so.
echo.
pause
