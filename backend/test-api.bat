@echo off
REM Quick API test script

echo.
echo ========================================
echo   WAREHOUSE API - QUICK TEST
echo ========================================
echo.

set SERVER=localhost
set PORT=3001

echo Testing: http://%SERVER%:%PORT%
echo.

echo [1/5] Health Check...
curl -s http://%SERVER%:%PORT%/api/health
echo.
echo.

echo [2/5] Login Test (Admin)...
curl -s -X POST http://%SERVER%:%PORT%/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
echo.
echo.

echo [3/5] Get Stats...
curl -s http://%SERVER%:%PORT%/api/stats
echo.
echo.

echo [4/5] Get Items (first 5)...
curl -s http://%SERVER%:%PORT%/api/items?limit=5
echo.
echo.

echo [5/5] Get Payment Methods...
curl -s http://%SERVER%:%PORT%/api/payment-methods
echo.
echo.

echo ========================================
echo   TEST COMPLETE
echo ========================================
echo.
echo If you see JSON responses above, the API is working!
echo.
pause
