@echo off
REM ========================================================================
REM WAREHOUSE MANAGEMENT SYSTEM - SERVER SETUP SCRIPT
REM ========================================================================
REM This script sets up the server machine with:
REM 1. PostgreSQL database
REM 2. Node.js backend API
REM 3. Windows Service for auto-start
REM ========================================================================

echo.
echo ========================================================================
echo    WAREHOUSE MANAGEMENT SYSTEM - SERVER INSTALLATION
echo ========================================================================
echo.
echo This script will install and configure the server components.
echo Please make sure you have Administrator privileges!
echo.
pause

REM Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ERROR: This script must be run as Administrator!
    echo Please right-click and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

echo.
echo [1/7] Checking prerequisites...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org/
    echo Recommended version: LTS ^(Long Term Support^)
    echo.
    pause
    exit /b 1
)

echo     Node.js: OK
node --version

REM Check if PostgreSQL is installed
psql --version >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo WARNING: PostgreSQL is not installed or not in PATH!
    echo.
    echo Please install PostgreSQL from: https://www.postgresql.org/download/windows/
    echo.
    echo After installation, please:
    echo 1. Remember the postgres user password
    echo 2. Add PostgreSQL bin directory to PATH
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)

echo     PostgreSQL: OK
psql --version

echo.
echo [2/7] Creating PostgreSQL database...
echo.

set /p DB_PASSWORD="Enter PostgreSQL password for 'postgres' user: "

REM Create database
psql -U postgres -c "CREATE DATABASE warehouse_db;" 2>nul
if %errorLevel% neq 0 (
    echo     Database may already exist, continuing...
)

echo     Database created/exists: warehouse_db

echo.
echo [3/7] Setting up database schema...
echo.

REM Run schema creation
psql -U postgres -d warehouse_db -f "%~dp0..\backend\database\schema.sql"
if %errorLevel% neq 0 (
    echo.
    echo ERROR: Failed to create database schema!
    echo Please check the error messages above.
    echo.
    pause
    exit /b 1
)

echo     Schema created successfully

echo.
echo [4/7] Updating backend configuration...
echo.

REM Get server IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do set SERVER_IP=%%a
set SERVER_IP=%SERVER_IP:~1%

echo     Server IP detected: %SERVER_IP%
echo.
echo     Updating backend\config.json...

REM Create config.json
(
echo {
echo   "server": {
echo     "port": 3001,
echo     "host": "0.0.0.0"
echo   },
echo   "database": {
echo     "host": "localhost",
echo     "port": 5432,
echo     "database": "warehouse_db",
echo     "user": "postgres",
echo     "password": "%DB_PASSWORD%",
echo     "max": 20,
echo     "idleTimeoutMillis": 30000,
echo     "connectionTimeoutMillis": 2000
echo   },
echo   "cors": {
echo     "enabled": true,
echo     "origins": ["*"]
echo   }
echo }
) > "%~dp0..\backend\config.json"

echo     Configuration updated

echo.
echo [5/7] Installing backend dependencies...
echo.

cd "%~dp0..\backend"
call npm install
if %errorLevel% neq 0 (
    echo.
    echo ERROR: Failed to install npm dependencies!
    echo.
    pause
    exit /b 1
)

echo     Dependencies installed

echo.
echo [6/7] Migrating data from Excel to PostgreSQL...
echo.

set /p MIGRATE="Do you want to migrate data from Excel file now? (Y/N): "
if /i "%MIGRATE%"=="Y" (
    node database\migrate-from-excel.js
    if %errorLevel% neq 0 (
        echo.
        echo WARNING: Data migration had some issues. You can run it manually later with:
        echo     cd backend
        echo     node database\migrate-from-excel.js
        echo.
    )
) else (
    echo     Skipped. You can run it later with: npm run migrate
)

echo.
echo [7/7] Installing Windows Service...
echo.

node install-service.js
if %errorLevel% neq 0 (
    echo.
    echo ERROR: Failed to install Windows Service!
    echo The API server will need to be started manually with: npm start
    echo.
)

echo.
echo [8/7] Configuring Windows Firewall...
echo.

netsh advfirewall firewall add rule name="Warehouse API" dir=in action=allow protocol=TCP localport=3001
if %errorLevel% neq 0 (
    echo     WARNING: Failed to add firewall rule. You may need to add it manually.
) else (
    echo     Firewall rule added for port 3001
)

echo.
echo ========================================================================
echo                    INSTALLATION COMPLETE!
echo ========================================================================
echo.
echo Server IP Address: %SERVER_IP%
echo API Port: 3001
echo API URL: http://%SERVER_IP%:3001/api
echo.
echo The Windows Service "WarehouseAPI" has been installed and started.
echo It will automatically start when the server reboots.
echo.
echo NEXT STEPS:
echo 1. Test the API by opening: http://%SERVER_IP%:3001/api/health
echo 2. Write down the Server IP: %SERVER_IP%
echo 3. Install the client app on other machines using client-setup.bat
echo 4. When installing clients, enter the Server IP: %SERVER_IP%
echo.
echo To manage the service:
echo - Open Services (Win+R, type: services.msc)
echo - Find "WarehouseAPI"
echo - Right-click to Start/Stop/Restart
echo.
echo ========================================================================
echo.
pause
