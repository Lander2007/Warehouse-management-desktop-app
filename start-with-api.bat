@echo off
echo ================================================
echo   Starting Warehouse System with API Server
echo ================================================
echo.

echo Step 1: Starting Backend API Server...
cd backend
start "Backend API Server" cmd /k "node server.js"
cd ..

timeout /t 3 /nobreak > nul

echo Step 2: Starting Client Application...
npm run dev

pause
