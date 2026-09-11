@echo off
echo ============================================
echo Starting Backend API Server
echo ============================================
echo.
echo Server will start on: http://localhost:3001
echo API endpoints: http://localhost:3001/api
echo.
echo Press Ctrl+C to stop the server
echo.
echo ============================================

cd backend
node server.js

pause
