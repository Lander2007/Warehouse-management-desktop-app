@echo off
cls
color 0B
title Warehouse Management System - API Mode

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║      WAREHOUSE MANAGEMENT SYSTEM - API MODE                ║
echo ║      PostgreSQL Backend + REST API                         ║  
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Kill stale Electron only — do NOT kill node.exe (that stops the backend API)
echo [1/3] Cleaning up old Electron processes...
taskkill /F /IM electron.exe /T >nul 2>&1

REM Clean build
echo [2/3] Cleaning old build...
if exist "dist-electron" rd /s /q "dist-electron"
if exist "dist" rd /s /q "dist"

echo [3/3] Starting application in API mode...
echo.
echo ⚠️  IMPORTANT: Make sure the backend server is running first!
echo    - Run: cd backend
echo    - Run: node server.js
echo.
pause

echo Starting Electron app...
npm run dev

pause
