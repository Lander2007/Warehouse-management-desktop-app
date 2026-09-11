@echo off
cls
color 0B
title Warehouse Management System - Starting...

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║      WAREHOUSE MANAGEMENT SYSTEM                           ║
echo ║      نظام إدارة المستودعات                               ║  
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo [INFO] Starting application...
echo.

cd /d "%~dp0"

REM Kill any running electron processes
taskkill /F /IM electron.exe /T >nul 2>&1

REM Clean build
if exist "dist-electron" rd /s /q "dist-electron"

echo [INFO] Building application...
call npm run dev

echo.
echo [INFO] If the window doesn't appear, check Windows taskbar
echo.
pause
