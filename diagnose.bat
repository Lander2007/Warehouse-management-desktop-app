@echo off
echo.
echo ========================================
echo   WAREHOUSE SYSTEM DIAGNOSTICS
echo ========================================
echo.
echo Running database checks...
echo.

node check-database.js

echo.
echo.
echo Diagnostics complete!
echo.
echo Press any key to exit...
pause >null
