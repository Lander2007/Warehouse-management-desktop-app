@echo off
REM ========================================================================
REM WAREHOUSE MANAGEMENT SYSTEM - CLIENT SETUP SCRIPT
REM ========================================================================
REM This script installs the Electron client app on workstations
REM ========================================================================

echo.
echo ========================================================================
echo    WAREHOUSE MANAGEMENT SYSTEM - CLIENT INSTALLATION
echo ========================================================================
echo.
echo This script will install the warehouse management client application.
echo.
pause

echo.
echo [1/4] Checking prerequisites...
echo.

REM Check if the app executable exists
if not exist "%~dp0..\release\Warehouse Manager Setup.exe" (
    echo ERROR: Application installer not found!
    echo.
    echo Please build the application first by running:
    echo     npm run package:win
    echo.
    echo This will create the installer in the release folder.
    echo.
    pause
    exit /b 1
)

echo     Application installer found

echo.
echo [2/4] Installing application...
echo.
echo Please follow the installation wizard to install the application.
echo.

start /wait "%~dp0..\release\Warehouse Manager Setup.exe"

if %errorLevel% neq 0 (
    echo.
    echo ERROR: Installation failed or was cancelled!
    echo.
    pause
    exit /b 1
)

echo     Application installed successfully

echo.
echo [3/4] Configuring server connection...
echo.

set /p SERVER_IP="Enter the Server IP Address (e.g., 192.168.1.100): "

if "%SERVER_IP%"=="" (
    echo ERROR: Server IP cannot be empty!
    pause
    exit /b 1
)

REM Create config file in user's AppData
set CONFIG_DIR=%APPDATA%\Warehouse Manager
if not exist "%CONFIG_DIR%" mkdir "%CONFIG_DIR%"

(
echo {
echo   "serverIP": "%SERVER_IP%",
echo   "serverPort": 3001
echo }
) > "%CONFIG_DIR%\config.json"

echo     Configuration saved

echo.
echo [4/4] Creating desktop shortcut...
echo.

REM Create desktop shortcut (if needed, adjust the path to actual .exe location)
set SHORTCUT_PATH=%USERPROFILE%\Desktop\Warehouse Manager.lnk
set EXE_PATH=%ProgramFiles%\Warehouse Manager\Warehouse Manager.exe

if not exist "%EXE_PATH%" (
    set EXE_PATH=%LOCALAPPDATA%\Programs\warehouse-manager\Warehouse Manager.exe
)

if exist "%EXE_PATH%" (
    powershell "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%EXE_PATH%'; $s.Save()"
    echo     Desktop shortcut created
) else (
    echo     WARNING: Could not find application executable
    echo     You can manually create a shortcut from the Start Menu
)

echo.
echo ========================================================================
echo                    INSTALLATION COMPLETE!
echo ========================================================================
echo.
echo Server IP: %SERVER_IP%
echo Server Port: 3001
echo.
echo The application has been installed successfully!
echo.
echo HOW TO USE:
echo 1. Launch "Warehouse Manager" from the Desktop or Start Menu
echo 2. Login with your credentials:
echo    - Admin: username=admin, password=admin123
echo    - Sales: username=sales, password=sales123
echo    - Warehouse: username=warehouse, password=warehouse123
echo.
echo TROUBLESHOOTING:
echo - If the app cannot connect to the server:
echo   1. Check if the server is running
echo   2. Verify the Server IP is correct
echo   3. Make sure port 3001 is open in the firewall
echo   4. Try pinging the server: ping %SERVER_IP%
echo.
echo - To change server IP later:
echo   Edit: %CONFIG_DIR%\config.json
echo.
echo ========================================================================
echo.
pause
