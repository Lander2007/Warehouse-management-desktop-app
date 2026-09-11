# 🚀 WAREHOUSE MANAGEMENT SYSTEM - DEPLOYMENT GUIDE

Complete step-by-step guide for deploying the multi-machine warehouse management system across your LAN network.

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Server Setup](#server-setup)
4. [Client Setup](#client-setup)
5. [Multiple Monitor Configuration](#multiple-monitor-configuration)
6. [Troubleshooting](#troubleshooting)
7. [Maintenance & Updates](#maintenance--updates)

---

## 🏗️ SYSTEM OVERVIEW

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    COMPANY LAN NETWORK                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐        ┌─────────────────────────┐     │
│  │  SERVER MACHINE │        │   CLIENT WORKSTATIONS   │     │
│  │                 │        │                         │     │
│  │  ╔═══════════╗  │        │  ╔═══════════════════╗ │     │
│  │  ║ PostgreSQL║  │◄───────┤  ║ Electron Desktop  ║ │     │
│  │  ║ Database  ║  │        │  ║ App (Thin Client) ║ │     │
│  │  ╚═══════════╝  │        │  ╚═══════════════════╝ │     │
│  │        ▲        │        │                         │     │
│  │        │        │        │  Warehouse / POS /      │     │
│  │  ╔═══════════╗  │        │  Management Stations    │     │
│  │  ║  Node.js  ║  │        │                         │     │
│  │  ║ REST API  ║  │        └─────────────────────────┘     │
│  │  ║ Port 3001 ║  │                                         │
│  │  ╚═══════════╝  │                                         │
│  │                 │                                         │
│  │ Windows Service │                                         │
│  │ (Auto-Start)    │                                         │
│  └─────────────────┘                                         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Components

- **Server Machine**: Runs PostgreSQL + Node.js API (ONE machine only)
- **Client Machines**: Run Electron desktop app (MULTIPLE machines)
- **Communication**: HTTP REST API over LAN (port 3001)

---

## 📦 PREREQUISITES

### Server Machine Requirements

- ✅ Windows 10/11 (64-bit)
- ✅ Minimum 4GB RAM (8GB recommended)
- ✅ 20GB free disk space
- ✅ Static IP address or reserved DHCP
- ✅ Administrator privileges
- ✅ Internet connection (for initial setup)

### Client Machine Requirements

- ✅ Windows 10/11 (32-bit or 64-bit)
- ✅ Minimum 2GB RAM
- ✅ 500MB free disk space
- ✅ Network connection to server machine

### Software Prerequisites (Will be installed)

- PostgreSQL 15+ (server only)
- Node.js 18+ LTS (server only)
- Microsoft Visual C++ Redistributable (client machines)

---

## 🖥️ SERVER SETUP

### Step 1: Prepare the Server Machine

1. **Choose a reliable machine** that will stay on during business hours
2. **Set a static IP** or reserve IP in your router:
   - Example: `192.168.1.100`
   - Note this IP - you'll need it for all clients!

#### How to Set Static IP (Windows):

```
1. Open Control Panel → Network and Internet → Network Connections
2. Right-click your network adapter → Properties
3. Select "Internet Protocol Version 4 (TCP/IPv4)" → Properties
4. Select "Use the following IP address"
5. Enter:
   - IP address: 192.168.1.100 (or your choice)
   - Subnet mask: 255.255.255.0
   - Default gateway: 192.168.1.1 (your router IP)
   - DNS: 8.8.8.8 (Google DNS)
6. Click OK
```

### Step 2: Install PostgreSQL

1. **Download PostgreSQL**:
   - Visit: https://www.postgresql.org/download/windows/
   - Download PostgreSQL 15 or newer (64-bit)

2. **Run the installer**:
   - Click "Next" through the setup wizard
   - **IMPORTANT**: Remember the password you set for `postgres` user!
   - Default port: 5432 (keep it)
   - Install pgAdmin 4 (optional but recommended)

3. **Verify installation**:
   ```cmd
   psql --version
   ```
   Should show: `psql (PostgreSQL) 15.x`

### Step 3: Install Node.js

1. **Download Node.js LTS**:
   - Visit: https://nodejs.org/
   - Download the "LTS" (Long Term Support) version
   - Choose 64-bit Windows installer

2. **Run the installer**:
   - Accept all defaults
   - Make sure "Add to PATH" is checked

3. **Verify installation**:
   ```cmd
   node --version
   npm --version
   ```

### Step 4: Extract and Prepare Backend Files

1. **Copy the entire project** to the server machine:
   ```
   C:\WarehouseSystem\
   ```

2. **Open Command Prompt as Administrator**:
   - Press `Win + X`
   - Select "Command Prompt (Admin)" or "PowerShell (Admin)"

3. **Navigate to deployment folder**:
   ```cmd
   cd C:\WarehouseSystem\deployment
   ```

### Step 5: Run Server Setup Script

1. **Execute the setup script**:
   ```cmd
   server-setup.bat
   ```

2. **Follow the prompts**:
   - Enter your PostgreSQL password
   - Wait for database creation
   - Choose to migrate Excel data (recommended)
   - Service installation

3. **Note the Server IP** displayed at the end (e.g., `192.168.1.100`)

### Step 6: Verify Server is Running

1. **Check Windows Service**:
   ```cmd
   Win + R → services.msc
   ```
   - Find "WarehouseAPI"
   - Status should be "Running"

2. **Test the API**:
   - Open browser
   - Go to: `http://localhost:3001/api/health`
   - Should see: `{"success":true,"message":"Warehouse API is running",...}`

3. **Test from another machine** (optional):
   - On a client machine, open browser
   - Go to: `http://192.168.1.100:3001/api/health`
   - Should see the same response

### Step 7: Configure Firewall (If Needed)

If clients can't connect, manually add firewall rule:

```cmd
netsh advfirewall firewall add rule name="Warehouse API" dir=in action=allow protocol=TCP localport=3001
```

---

## 💻 CLIENT SETUP

### Step 1: Build the Client Application (One Time)

On your development machine (or server):

1. **Open Command Prompt**:
   ```cmd
   cd C:\WarehouseSystem
   ```

2. **Install dependencies** (if not already):
   ```cmd
   npm install
   ```

3. **Build the application**:
   ```cmd
   npm run package:win
   ```

4. **Locate the installer**:
   ```
   C:\WarehouseSystem\release\Warehouse Manager Setup.exe
   ```

5. **Copy this installer** to a USB drive or network share

### Step 2: Install on Each Client Machine

1. **Copy the client installer** to the client machine

2. **Run the installer**:
   - Double-click `Warehouse Manager Setup.exe`
   - Follow the installation wizard
   - Accept defaults

3. **The app will be installed to**:
   ```
   C:\Users\[Username]\AppData\Local\Programs\warehouse-manager\
   ```

### Step 3: Configure Server Connection

#### Option A: Using the Setup Script (Recommended)

1. **Copy `client-setup.bat`** to the client machine

2. **Run it**:
   ```cmd
   client-setup.bat
   ```

3. **Enter the Server IP** when prompted (e.g., `192.168.1.100`)

#### Option B: Manual Configuration

1. **Create config file**:
   ```
   %APPDATA%\Warehouse Manager\config.json
   ```

2. **Add this content**:
   ```json
   {
     "serverIP": "192.168.1.100",
     "serverPort": 3001
   }
   ```

### Step 4: Launch and Test

1. **Open the app** from:
   - Desktop shortcut (if created)
   - Start Menu → "Warehouse Manager"

2. **Login** with default credentials:
   - **Admin**:
     - Username: `admin`
     - Password: `admin123`
   - **Sales**:
     - Username: `sales`
     - Password: `sales123`
   - **Warehouse**:
     - Username: `warehouse`
     - Password: `warehouse123`

3. **Verify connection**:
   - Dashboard should load with data
   - Check that items, customers appear

---

## 🖥️🖥️🖥️ MULTIPLE MONITOR CONFIGURATION

You can run **different windows** of the same app on different monitors for different purposes.

### Scenario 1: Three Separate Machines

**Ideal setup for larger operations:**

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   WAREHOUSE     │  │      POS        │  │   MANAGEMENT    │
│    STATION      │  │    STATION      │  │     OFFICE      │
│                 │  │                 │  │                 │
│  [Warehouse     │  │  [Sales Login]  │  │  [Admin Login]  │
│   Login]        │  │                 │  │                 │
│                 │  │  Point of Sale  │  │  Full Dashboard │
│  - Stock Audit  │  │  - Fast Checkout│  │  - Reports      │
│  - Receive Stock│  │  - Sales Only   │  │  - All Modules  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Setup:**
1. Install app on all three machines
2. Login with appropriate role on each:
   - Warehouse station: `warehouse` user
   - POS station: `sales` user
   - Management office: `admin` user

### Scenario 2: One Machine with Multiple Monitors

**For smaller operations:**

```
┌────────────────────────────────────────────────────┐
│              SINGLE COMPUTER - 3 MONITORS          │
├────────────────────────────────────────────────────┤
│                                                    │
│  Monitor 1        Monitor 2         Monitor 3     │
│  ┌──────────┐    ┌──────────┐     ┌──────────┐  │
│  │Warehouse │    │   POS    │     │Management│  │
│  │  View    │    │  View    │     │   View   │  │
│  └──────────┘    └──────────┘     └──────────┘  │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Setup Method 1: Multiple App Instances (Recommended)**

Unfortunately, Electron typically allows only one instance. To work around:

1. **Create separate portable versions**:
   ```
   C:\WarehouseApps\Warehouse\
   C:\WarehouseApps\POS\
   C:\WarehouseApps\Management\
   ```

2. **Copy app files** to each folder

3. **Create different shortcuts** with window position arguments

**Setup Method 2: Use Browser for Additional Windows**

1. **Main app**: Run the installed Electron app

2. **Additional windows**: Open browser tabs
   - Open: `http://localhost:8080` (if API exposes web UI)
   - Or use remote desktop to another machine

### Scenario 3: Browser-Based Access (Future Enhancement)

Consider building a web version for easier multi-window setup:
- Main Electron app for warehouse
- Web browser for POS (fullscreen)
- Web browser for management

---

## 🔧 TROUBLESHOOTING

### Problem: Client Cannot Connect to Server

**Symptoms:**
- "Cannot connect to server" error
- Dashboard won't load
- Infinite loading spinner

**Solutions:**

1. **Check Server IP**:
   ```cmd
   # On client machine
   ping 192.168.1.100
   ```
   Should get replies. If not, network issue.

2. **Check Server API is Running**:
   ```cmd
   # On server machine
   netstat -an | findstr :3001
   ```
   Should show `LISTENING` on port 3001.

3. **Check Windows Firewall**:
   ```cmd
   # On server machine
   netsh advfirewall firewall show rule name="Warehouse API"
   ```
   Should show the rule. If not:
   ```cmd
   netsh advfirewall firewall add rule name="Warehouse API" dir=in action=allow protocol=TCP localport=3001
   ```

4. **Verify config.json**:
   ```
   # On client machine
   %APPDATA%\Warehouse Manager\config.json
   ```
   Make sure `serverIP` is correct.

5. **Test with Browser**:
   ```
   http://192.168.1.100:3001/api/health
   ```

### Problem: PostgreSQL Won't Start

**Symptoms:**
- Service shows "Stopped" in services.msc
- API shows database errors

**Solutions:**

1. **Check PostgreSQL Service**:
   ```cmd
   services.msc
   ```
   Find "postgresql-x64-15" → Start

2. **Check PostgreSQL Logs**:
   ```
   C:\Program Files\PostgreSQL\15\data\log\
   ```

3. **Try Manual Start**:
   ```cmd
   pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start
   ```

### Problem: Windows Service Won't Install

**Symptoms:**
- `install-service.js` fails
- Service not in services.msc

**Solutions:**

1. **Run as Administrator**:
   - Right-click Command Prompt
   - "Run as Administrator"

2. **Check node-windows**:
   ```cmd
   npm list node-windows
   ```
   If not found:
   ```cmd
   npm install node-windows
   ```

3. **Manual Service Creation with NSSM** (Alternative):
   - Download NSSM: https://nssm.cc/download
   - Run: `nssm install WarehouseAPI`
   - Path: `C:\Program Files\nodejs\node.exe`
   - Arguments: `C:\WarehouseSystem\backend\server.js`
   - Click "Install service"

### Problem: Data Not Showing After Migration

**Symptoms:**
- Dashboard shows 0 items/customers
- Empty lists everywhere

**Solutions:**

1. **Check Migration Ran**:
   ```cmd
   cd C:\WarehouseSystem\backend
   node database\migrate-from-excel.js
   ```

2. **Check Excel File Path**:
   - Edit `backend\database\migrate-from-excel.js`
   - Verify `excelFilePath` points to correct file

3. **Check Data in Database**:
   ```cmd
   psql -U postgres -d warehouse_db
   ```
   ```sql
   SELECT COUNT(*) FROM Items;
   SELECT COUNT(*) FROM Customers;
   ```

4. **Manual SQL Import** (if needed):
   ```sql
   \i C:/WarehouseSystem/backend/database/schema.sql
   ```

### Problem: Port 3001 Already in Use

**Symptoms:**
- Server won't start
- "EADDRINUSE" error

**Solutions:**

1. **Find What's Using Port**:
   ```cmd
   netstat -ano | findstr :3001
   ```

2. **Kill the Process**:
   ```cmd
   taskkill /PID [PID_NUMBER] /F
   ```

3. **Change API Port**:
   - Edit `backend\config.json`
   - Change `"port": 3001` to `"port": 3002`
   - Update all client configs

### Problem: Authentication Fails

**Symptoms:**
- "Invalid credentials" for known good passwords
- Users table not found

**Solutions:**

1. **Check Users Table Exists**:
   ```cmd
   psql -U postgres -d warehouse_db
   ```
   ```sql
   SELECT * FROM Users;
   ```

2. **Recreate Users** (if needed):
   ```sql
   INSERT INTO Users (Username, Password, RoleID, FullName, IsActive) VALUES
   ('admin', 'admin123', 1, 'System Administrator', TRUE),
   ('sales', 'sales123', 2, 'Sales Agent', TRUE),
   ('warehouse', 'warehouse123', 3, 'Warehouse Manager', TRUE);
   ```

### Problem: Slow Performance

**Symptoms:**
- Long loading times
- Laggy UI

**Solutions:**

1. **Check Network Speed**:
   ```cmd
   ping -t 192.168.1.100
   ```
   Should be <10ms on LAN

2. **Check Server Resources**:
   - Open Task Manager on server
   - Check CPU, RAM, Disk usage
   - Upgrade if consistently >80%

3. **Optimize Database**:
   ```sql
   VACUUM ANALYZE;
   REINDEX DATABASE warehouse_db;
   ```

4. **Reduce Query Limits**:
   - Edit API endpoints
   - Change `LIMIT 1000` to `LIMIT 200`

---

## 🔄 MAINTENANCE & UPDATES

### Regular Maintenance Tasks

#### Daily
- ✅ Check server is running (auto-starts, but verify)
- ✅ Monitor disk space on server

#### Weekly
- ✅ Backup database (see below)
- ✅ Check Windows Update on server
- ✅ Review system logs

#### Monthly
- ✅ Full database backup
- ✅ Test disaster recovery
- ✅ Update Node.js and PostgreSQL (if needed)

### Database Backup

**Automated Daily Backup** (Recommended):

1. **Create backup script** `backup-database.bat`:
   ```batch
   @echo off
   set BACKUP_DIR=C:\WarehouseBackups
   set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
   set TIMESTAMP=%TIMESTAMP: =0%
   
   if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
   
   pg_dump -U postgres -d warehouse_db > "%BACKUP_DIR%\warehouse_backup_%TIMESTAMP%.sql"
   
   echo Backup completed: %BACKUP_DIR%\warehouse_backup_%TIMESTAMP%.sql
   ```

2. **Schedule with Task Scheduler**:
   ```
   1. Open Task Scheduler (taskschd.msc)
   2. Create Basic Task → "Warehouse Backup"
   3. Trigger: Daily at 2:00 AM
   4. Action: Start a program
   5. Program: C:\WarehouseSystem\deployment\backup-database.bat
   ```

**Manual Backup**:

```cmd
pg_dump -U postgres -d warehouse_db > backup.sql
```

**Restore from Backup**:

```cmd
psql -U postgres -d warehouse_db < backup.sql
```

### Updating the System

#### Server Update:

1. **Stop the service**:
   ```cmd
   net stop WarehouseAPI
   ```

2. **Pull/copy new code**

3. **Update dependencies**:
   ```cmd
   cd C:\WarehouseSystem\backend
   npm install
   ```

4. **Run migrations** (if database schema changed):
   ```cmd
   psql -U postgres -d warehouse_db -f database/migrations/001_update.sql
   ```

5. **Start the service**:
   ```cmd
   net start WarehouseAPI
   ```

#### Client Update:

1. **Build new version** on development machine

2. **Copy new installer** to clients

3. **Run installer** (will update existing installation)

4. **No config changes needed** (preserves existing config)

### Monitoring System Health

**Server Health Check**:

```cmd
# Check API is responding
curl http://localhost:3001/api/health

# Check database connections
psql -U postgres -c "SELECT COUNT(*) FROM pg_stat_activity;"

# Check disk space
wmic logicaldisk get size,freespace,caption
```

**Set Up Email Alerts** (Advanced):

Use Windows Task Scheduler + PowerShell script to email if service stops:

```powershell
$service = Get-Service -Name "WarehouseAPI"
if ($service.Status -ne "Running") {
    Send-MailMessage -To "admin@company.com" -From "server@company.com" -Subject "Warehouse API Down" -Body "Service stopped!" -SmtpServer "smtp.company.com"
}
```

---

## 📞 SUPPORT & CONTACT

For technical support or questions:

- **System Administrator**: [Your Name]
- **Email**: [your.email@company.com]
- **Phone**: [Your Phone]

---

## 📝 CHANGE PASSWORD AFTER SETUP!

**IMPORTANT SECURITY NOTE:**

The default passwords are for initial setup only. **Change them immediately**:

```sql
-- Connect to database
psql -U postgres -d warehouse_db

-- Change passwords
UPDATE Users SET Password = 'new_secure_password_123' WHERE Username = 'admin';
UPDATE Users SET Password = 'sales_new_pass' WHERE Username = 'sales';
UPDATE Users SET Password = 'warehouse_new_pass' WHERE Username = 'warehouse';
```

In production, consider:
- Using bcrypt for password hashing
- Implementing password complexity rules
- Adding 2FA (two-factor authentication)
- Regular password rotation policy

---

## ✅ POST-DEPLOYMENT CHECKLIST

### Server Setup Complete When:
- [ ] PostgreSQL installed and running
- [ ] Node.js installed
- [ ] Database schema created
- [ ] Data migrated from Excel
- [ ] Windows Service installed and running
- [ ] Firewall rule added
- [ ] API health check returns success
- [ ] Server IP documented

### Client Setup Complete When:
- [ ] Application installed
- [ ] Server IP configured in config.json
- [ ] Login successful with all user roles
- [ ] Dashboard loads with data
- [ ] Can perform sales transaction
- [ ] Can manage inventory
- [ ] Desktop shortcut created

### System Ready For Production When:
- [ ] All clients connected successfully
- [ ] All user roles tested
- [ ] Sample transactions completed
- [ ] Reports generate correctly
- [ ] Backup system configured
- [ ] Admin trained on maintenance
- [ ] Users trained on their modules
- [ ] Default passwords changed

---

**Document Version**: 1.0  
**Last Updated**: 2024-06-14  
**Prepared By**: AI Assistant  
**System**: Warehouse Management Multi-Machine Deployment

