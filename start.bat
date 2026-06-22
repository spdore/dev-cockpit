@echo off

cd /d "%~dp0"

echo.
echo   DevCockpit Server Launcher
echo   ---------------------------
echo.

if "%1"=="dev" (
    set DEVCOCKPIT_ENV=dev
    echo   [Mode: DEV]     Database: database\dev.db (demo data)
) else (
    set DEVCOCKPIT_ENV=personal
    echo   [Mode: PERSONAL] Database: database\dev-cockpit.db (your data)
)
echo.

echo [1] Checking Node.js ...

where node >nul 2>nul
if errorlevel 1 (
    echo   Node.js NOT found!
    echo   Download from: https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo   Node.js OK (%NODE_VER%)

echo.
echo [2] Starting server ...
echo   Open http://localhost:3000 in your browser
echo   Press Ctrl+C to stop
echo.

npm run dev

pause
