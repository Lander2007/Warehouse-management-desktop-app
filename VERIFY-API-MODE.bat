@echo off
cls
color 0A
title Warehouse System - API Mode Verification

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║      API MODE VERIFICATION                                 ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo [1] Checking files...
echo.

if exist "dist-electron\main.js" (
    echo ✅ main.js exists
) else (
    echo ❌ main.js NOT FOUND
    goto :error
)

if exist "dist-electron\preload.cjs" (
    echo ✅ preload.cjs exists
) else (
    echo ❌ preload.cjs NOT FOUND
    goto :error
)

if exist "config.json" (
    echo ✅ config.json exists
) else (
    echo ❌ config.json NOT FOUND
    goto :error
)

echo.
echo [2] Checking preload.cjs content...
echo.

findstr /C:"fetch" dist-electron\preload.cjs >nul
if %ERRORLEVEL%==0 (
    echo ✅ preload.cjs uses fetch ^(API mode^)
) else (
    echo ❌ preload.cjs does NOT use fetch ^(wrong version^)
    goto :error
)

findstr /C:"authenticateUser" dist-electron\preload.cjs >nul
if %ERRORLEVEL%==0 (
    echo ✅ preload.cjs has authenticateUser
) else (
    echo ❌ preload.cjs missing authenticateUser
    goto :error
)

echo.
echo [3] Checking main.js content...
echo.

findstr /C:"node-adodb" dist-electron\main.js >nul
if %ERRORLEVEL%==0 (
    echo ❌ main.js has node-adodb ^(wrong version - database mode^)
    goto :error
) else (
    echo ✅ main.js does NOT have node-adodb ^(correct - API mode^)
)

findstr /C:"getApiBaseUrl" dist-electron\main.js >nul
if %ERRORLEVEL%==0 (
    echo ✅ main.js has getApiBaseUrl
) else (
    echo ❌ main.js missing getApiBaseUrl
    goto :error
)

echo.
echo [4] Checking config.json...
echo.
type config.json
echo.

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║      ✅ ALL CHECKS PASSED - API MODE IS CORRECT           ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo You can now:
echo   1. Start backend server: cd backend ^& node server.js
echo   2. Start client: npm run dev
echo.
goto :end

:error
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║      ❌ VERIFICATION FAILED                                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Please rebuild:
echo   1. Clean: rd /s /q dist-electron
echo   2. Build: npm run dev
echo.

:end
pause
