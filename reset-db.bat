@echo off
chcp 65001 >nul 2>&1
title Reset DevCockpit DB
cd /d "%~dp0"

echo.
echo   =================================
echo     Reset DevCockpit Database
echo   =================================
echo.
echo   This will delete all data (projects, tasks, etc.)
echo   Settings (API Key, theme) will be kept.
echo.
choice /c yn /m "Continue?"

if errorlevel 2 exit /b 0

node scripts/reset-db.js

echo.
pause
