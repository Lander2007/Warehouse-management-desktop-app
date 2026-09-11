@echo off
title Warehouse System - Clean Start
color 0A

echo ================================================
echo    WAREHOUSE MANAGEMENT SYSTEM
echo    Clean Rebuild and Start
echo ================================================
echo.

echo [1/4] Cleaning old build files...
if exist "dist-electron" (
    rd /s /q "dist-electron"
    echo      ✓ Removed dist-electron
)
if exist "dist" (
    rd /s /q "dist"
    echo      ✓ Removed dist
)
echo.

echo [2/4] Rebuilding TypeScript files...
call npm run dev
echo.

echo ================================================
echo    Program should now be running!
echo    Check the Electron window for login screen
echo ================================================
pause
