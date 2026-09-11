# 🚀 WAREHOUSE MANAGEMENT SYSTEM
## Complete Multi-Machine Deployment Guide

---

## 📖 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Architecture](#architecture)  
3. [Server Setup](#server-setup)
4. [Client Setup](#client-setup)
5. [Configuration](#configuration)
6. [Multi-Monitor Setup](#multi-monitor-setup)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)
9. [API Reference](#api-reference)

---

## 🎯 SYSTEM OVERVIEW

This warehouse management system has been converted from a single-machine Microsoft Access application to a **multi-machine client-server architecture** running across your LAN network.

### What Changed:
- ❌ **OLD**: Single machine with Microsoft Access `.accdb` file
- ✅ **NEW**: PostgreSQL database + REST API + Multiple Electron clients

### Components:
- **PostgreSQL Database** - Central data storage on server
- **Node.js REST API** - Backend running as Windows Service (Port 3001)
- **Electron Clients** - Desktop apps on each workstation

---

## 🏗️ ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                     SERVER MACHINE                          │
│  ┌─────────────────┐        ┌──────────────────────┐      │
│  │   PostgreSQL    │◄───────┤   Node.js API        │      │
│  │   (Port 5432)   │        │   (Port 3001)        │      │
│  │   warehouse_db  │        │   Windows Service    │      │
│  └─────────────────┘        └──────────┬───────────┘      │
│                                         │                   │
└─────────────────────────────────────────┼───────────────────┘
                                         │
                    HTTP REST API over LAN
                                         │
        ┌────────────────┬───────────────┼────────────────┐
        │                │               │                │
        ▼                ▼               ▼                ▼
  ┌───────────┐    ┌───────────┐  ┌───────────┐   ┌───────────┐
  │  Client 1 │    │  Client 2 │  │  Client 3 │   │  Client N │
  │ Warehouse │    │    POS    │  │   Admin   │   │    ...    │
  │  Monitor  │    │  Monitor  │  │  Monitor  │   │           │
  └───────────┘    └───────────┘  └───────────┘   └───────────┘
```

---

## 🖥️ SERVER SETUP

### Prerequisites

- **Operating System**: Windows Server 2012+ or Windows 10/11
- **Admin Access**: Must run as Administrator
- **Network**: Static IP recommended
- **Ports**: 3001 (API), 5432 (PostgreSQL)

### Step 1: Install PostgreSQL

1. **Download** PostgreSQL 16:
   ```
   https://www.postgresql.org/download/windows/
   ```

2. **Run Installer**:
   - Accept default port: `5432`
   - Set password for `postgres` user
   - **⚠️ IMPORTANT**: Remember this password!
   - Install pgAdmin 4 (recommended)
   - Add PostgreSQL to PATH

3. **Verify Installation**:
   ```cmd
   psql --version
   ```

### Step 2: Install Node.js

1. **Download** Node.js LTS:
   ```
   https://nodejs.org/
   ```

2. **Install** with defaults

3. **Verify**:
   ```cmd
   node --version
   npm --version
   ```

### Step 3: Run Server Setup Script

1. **Open Command Prompt as Administrator**

2. **Navigate to deployment folder**:
   ```cmd
   cd "C:\Abdullah System\deployment"
   ```

3. **Run setup script**:
   ```cmd
   server-setup.bat
   ```

4. **The script will**:
   - ✓ Create `warehouse_db` database
   - ✓ Run schema.sql (tables, indexes, views)
   - ✓ Install npm dependencies
   - ✓ Migrate data from Excel (optional)
   - ✓ Install Windows Service
   - ✓ Configure firewall (port 3001)

### Step 4: Verify Server

1. **Check Service**:
   ```cmd
   services.msc
   ```
   Find "WarehouseAPI" → Status should be **"Running"**

2. **Test API**:
   - Open browser: `http://localhost:3001/api/health`
   - Should return JSON:
     ```json
     {
       "success": true,
       "message": "Warehouse API is running"
     }
     ```

3. **Find Your Server IP**:
   ```cmd
   ipconfig
   ```
   **Note the IPv4 Address** (e.g., `192.168.1.100`)
   **✏️ Write this down!** You'll need it for client setup.

---

## 💻 CLIENT SETUP

### Prerequisites

- Windows 10/11
- Network access to server
- Server IP address

### Step 1: Build Application (ONE TIME)

On development machine:

```cmd
cd "C:\Abdullah System"
npm install
npm run package:win
```

This creates the installer in `release\win-unpacked\`

### Step 2: Copy Files to Client

Copy to each client machine:
- `release\win-unpacked\` folder (entire folder)
- `deployment\client-setup.bat`

### Step 3: Run Client Setup

1. **Right-click** `client-setup.bat`
2. **Select** "Run as administrator"
3. **Enter** server IP when prompted (e.g., `192.168.1.100`)

The script will:
- ✓ Copy app to Program Files
- ✓ Create desktop shortcut
- ✓ Configure server connection
- ✓ Test connectivity

### Step 4: Launch Application

1. **Double-click** "Warehouse Manager" on desktop
2. **Login** with credentials:
   - Username: `admin` / Password: `admin123`
   - Username: `sales` / Password: `sales123`
   - Username: `warehouse` / Password: `warehouse123`

---

## ⚙️ CONFIGURATION

### Server Configuration

**File**: `backend\config.json`

```json
{
  "server": {
    "port": 3001,
    "host": "0.0.0.0"
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "database": "warehouse_db",
    "user": "postgres",
    "password": "YOUR_POSTGRES_PASSWORD",
    "max": 20,
    "idleTimeoutMillis": 30000,
    "connectionTimeoutMillis": 2000
  },
  "cors": {
    "enabled": true,
    "origins": ["*"]
  }
}
```

**After editing, restart service**:
```cmd
net stop WarehouseAPI
net start WarehouseAPI
```

### Client Configuration

**File**: `%APPDATA%\warehouse-desktop-app\config.json`

```json
{
  "serverIP": "192.168.1.100",
  "serverPort": 3001
}
```

**After editing, restart the app**.

---

## 🖼️ MULTI-MONITOR SETUP

### Option 1: Multiple Windows (Same Machine)

1. Launch app normally → Login → Drag to **Monitor 1**
2. Launch app again → Login → Drag to **Monitor 2**
3. Launch app again → Login → Drag to **Monitor 3**

Each window operates independently!

### Option 2: Different User Accounts

Create 3 Windows user accounts:
- **Warehouse User** → Auto-login → Warehouse window
- **POS User** → Auto-login → POS window
- **Admin User** → Auto-login → Admin window

Set each account to auto-start the app on their assigned monitor.

---

## 🔍 TROUBLESHOOTING

### Problem: Client Cannot Connect to Server

**Symptoms**: "Connection error", "Cannot reach server"

**Solutions**:

1. **Ping the server**:
   ```cmd
   ping 192.168.1.100
   ```
   Should get replies. If not → network problem.

2. **Check API is running**:
   ```cmd
   # On server:
   sc query WarehouseAPI
   ```
   Should show `STATE: RUNNING`

3. **Test API directly**:
   ```cmd
   # On client, open browser:
   http://192.168.1.100:3001/api/health
   ```
   Should return JSON response.

4. **Check firewall**:
   ```cmd
   # On server:
   netsh advfirewall firewall show rule name="Warehouse API"
   ```

5. **Verify config**:
   ```cmd
   notepad %APPDATA%\warehouse-desktop-app\config.json
   ```
   Ensure `serverIP` is correct.

### Problem: PostgreSQL Connection Failed

**Symptoms**: API won't start, "database connection error"

**Solutions**:

1. **Check PostgreSQL service**:
   ```cmd
   services.msc
   ```
   Find "postgresql-x64-16" → Should be **Running**

2. **Test connection manually**:
   ```cmd
   psql -U postgres -d warehouse_db
   ```
   Enter password. Should connect.

3. **Check password in config**:
   ```cmd
   notepad backend\config.json
   ```
   Verify `password` field matches PostgreSQL password.

### Problem: Port 3001 Already in Use

**Symptoms**: "EADDRINUSE :::3001"

**Solutions**:

1. **Find what's using the port**:
   ```cmd
   netstat -ano | findstr :3001
   ```

2. **Kill the process** or **change port**:
   - Edit `backend\config.json` → Change port to `3002`
   - Restart service
   - Update all client configs

### Problem: Service Won't Start

**Solutions**:

1. **Check Event Viewer**:
   ```cmd
   eventvwr.msc
   ```
   Look for errors under Application logs.

2. **Run manually to see errors**:
   ```cmd
   cd "C:\Abdullah System\backend"
   node server.js
   ```

3. **Reinstall service**:
   ```cmd
   node uninstall-service.js
   node install-service.js
   ```

---

## 🛠️ MAINTENANCE

### Windows Service Management

**View status**:
```cmd
sc query WarehouseAPI
```

**Start/Stop/Restart**:
```cmd
net stop WarehouseAPI
net start WarehouseAPI
```

**Uninstall**:
```cmd
cd "C:\Abdullah System\backend"
node uninstall-service.js
```

**Reinstall**:
```cmd
cd "C:\Abdullah System\backend"
node install-service.js
```

### Database Backup

**Manual backup**:
```cmd
pg_dump -U postgres -d warehouse_db -F c -f "C:\Backups\warehouse_backup.backup"
```

**Scheduled backup** (Windows Task Scheduler):
```cmd
pg_dump -U postgres -d warehouse_db -F c -f "C:\Backups\warehouse_%DATE%.backup"
```

**Restore**:
```cmd
net stop WarehouseAPI
pg_restore -U postgres -d warehouse_db "C:\Backups\warehouse_backup.backup"
net start WarehouseAPI
```

### Database Management

**Using psql**:
```cmd
psql -U postgres -d warehouse_db

# Example queries:
SELECT * FROM Items LIMIT 10;
SELECT * FROM Users;
SELECT COUNT(*) FROM Sales;
```

**Using pgAdmin**:
1. Open pgAdmin
2. Connect to localhost
3. Navigate to warehouse_db
4. Use Query Tool

---

## 📡 API REFERENCE

### Authentication
- `POST /api/auth/login` - User login

### Items
- `GET /api/items?search=` - List items
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Customers
- `GET /api/customers?search=` - List customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Suppliers
- `GET /api/suppliers?search=` - List suppliers
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier

### Sales & Purchases
- `GET /api/sales?limit=` - List sales
- `POST /api/sales` - Create sale (with stock update)
- `GET /api/purchases?limit=` - List purchases
- `POST /api/purchases` - Create purchase (with stock update)

### Reports
- `GET /api/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD` - Sales report
- `GET /api/reports/stock` - Stock levels report
- `GET /api/reports/debts` - Customer/supplier debts

### Stats
- `GET /api/stats` - Dashboard statistics
- `GET /api/payment-methods` - Payment methods
- `GET /api/health` - API health check

---

## 🔐 SECURITY

### Change Default Passwords

```sql
-- Connect to database:
psql -U postgres -d warehouse_db

-- Change passwords:
UPDATE Users SET Password = 'new_secure_password' WHERE Username = 'admin';
UPDATE Users SET Password = 'new_secure_password' WHERE Username = 'sales';
UPDATE Users SET Password = 'new_secure_password' WHERE Username = 'warehouse';
```

### Firewall Configuration

```cmd
# Server firewall (already done by setup script):
netsh advfirewall firewall add rule name="Warehouse API" dir=in action=allow protocol=TCP localport=3001

# Client firewall (usually not needed):
# No special rules required
```

### Network Security

1. Use static IP for server
2. Restrict CORS in `backend\config.json`
3. Use strong PostgreSQL password
4. Regular Windows updates
5. Monitor Event Viewer logs

---

## ✅ DEPLOYMENT CHECKLIST

### Server Machine
- [ ] PostgreSQL installed
- [ ] Node.js installed
- [ ] Database created
- [ ] Schema applied
- [ ] Data migrated from Excel
- [ ] Backend dependencies installed
- [ ] Windows Service installed and running
- [ ] Firewall configured
- [ ] API tested (http://localhost:3001/api/health)
- [ ] Server IP documented

### Each Client Machine
- [ ] App installed
- [ ] Desktop shortcut created
- [ ] Server IP configured
- [ ] Connection tested
- [ ] Login successful
- [ ] Can view data from server

### Post-Deployment
- [ ] All clients can connect
- [ ] Default passwords changed
- [ ] Backup system configured
- [ ] Users trained
- [ ] Documentation distributed

---

## 📞 SUPPORT

### Getting Help

1. Check Event Viewer logs (Windows Logs → Application)
2. Check PostgreSQL logs
3. Test API endpoints manually
4. Verify network connectivity
5. Review this guide

### Useful Commands

```cmd
# Check services
services.msc

# Check firewall
wf.msc

# Check network
ipconfig /all
ping <SERVER-IP>

# Test port
Test-NetConnection -ComputerName <SERVER-IP> -Port 3001

# View logs
eventvwr.msc
```

---

**🎉 Your multi-machine warehouse management system is ready!**

All machines now share the same centralized database through the REST API.
