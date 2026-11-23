@echo off
setlocal enabledelayedexpansion

echo ==============================================
echo           Starting Noize Local Dev
echo ==============================================
echo.

:: [0/5] Mendeteksi Package Manager (memprioritaskan pnpm)
where pnpm >nul 2>&1
if %errorlevel% equ 0 (
    set "PKG_MGR=pnpm"
    set "RUN_DEV=pnpm run dev:pnpm"
    echo Package manager terdeteksi: PNPM (Direkomendasikan)
) else (
    set "PKG_MGR=npm"
    set "RUN_DEV=npm run dev"
    echo Package manager terdeteksi: NPM
)
echo.

echo [1/5] Checking Dependencies...
if not exist "node_modules\" (
    echo Menginstall root dependencies menggunakan !PKG_MGR!...
    call !PKG_MGR! install
)
if not exist "frontend\node_modules\" (
    echo Menginstall frontend dependencies menggunakan !PKG_MGR!...
    cd frontend
    call !PKG_MGR! install
    cd ..
)
if not exist "backend\node_modules\" (
    echo Menginstall backend dependencies menggunakan !PKG_MGR!...
    cd backend
    call !PKG_MGR! install
    cd ..
)

echo.
echo [2/5] Checking Docker Status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker daemon is not running. Starting Docker Desktop...
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    ) else (
        start "" docker
    )
    echo Waiting for Docker to start...
    :wait_docker
    timeout /t 3 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 (
        echo Still waiting for Docker engine to be ready...
        goto wait_docker
    )
    echo Docker engine is ready!
    echo Memberi jeda sejenak agar daemon Docker benar-benar stabil...
    timeout /t 3 /nobreak >nul
) else (
    echo Docker is already running.
)

echo.
echo [3/5] Starting Supabase Local Environment...
call npx supabase status >nul 2>&1
if %errorlevel% neq 0 (
    echo Menjalankan Supabase start...
    call npx supabase start
    if !errorlevel! neq 0 (
        echo [ERROR] Gagal menyalakan Supabase, mencoba sekali lagi setelah jeda 3 detik...
        timeout /t 3 /nobreak >nul
        call npx supabase start
        if !errorlevel! neq 0 (
            echo [ERROR] Failed to start Supabase. Please check Docker and try again.
            pause
            exit /b !errorlevel!
        )
    )
) else (
    echo Supabase local environment is already running!
)

echo.
echo [4/5] Starting Web Development Server (Frontend ^& Backend) via !PKG_MGR!...
start "Noize Servers (!PKG_MGR!)" cmd /k "!RUN_DEV!"

echo.
echo [5/5] Opening Web and Database in Default Browser...
timeout /t 5 /nobreak >nul

start "" "http://localhost:3000"
start "" "http://127.0.0.1:54423"

echo.
echo ==============================================
echo All Noize services started successfully using !PKG_MGR!!
echo - Frontend : http://localhost:3000
echo - Backend  : http://localhost:5000/api
echo - Database : http://127.0.0.1:54423 (Studio)
echo ==============================================
echo You can close this window.
pause
