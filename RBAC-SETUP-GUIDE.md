# 🚀 Role-Based Access Control (RBAC) Setup Guide

## Overview
This guide walks you through setting up Role-Based Access Control and network database capabilities for the Warehouse Management System.

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Network Configuration](#network-configuration)
4. [User Roles](#user-roles)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- ✅ **Microsoft Access Database Engine 2016 (64-bit)**
  - Download: https://www.microsoft.com/en-us/download/details.aspx?id=54920
  - **IMPORTANT**: Must be 64-bit version to match Node.js architecture
  
- ✅ **Node.js 18+ (64-bit)**
  - Download: https://nodejs.org/

### Network Requirements (for multi-PC setup)
- All computers must be on the same network
- Windows File Sharing must be enabled
- Shared folder with read/write permissions

---

## 🗄️ Database Setup

### Step 1: Create Users Table

1. Open `Stores_DB.accdb` in **Microsoft Access**

2. Go to **Create** → **Query Design**

3. Close the "Show Table" dialog

4. Click **SQL View** button (in ribbon)

5. Copy and paste the following SQL:

```sql
CREATE TABLE Users (
    UserID AUTOINCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Role VARCHAR(20) NOT NULL,
    FullName VARCHAR(100),
    IsActive YESNO DEFAULT Yes,
    CreatedDate DATETIME DEFAULT Now()
);
```

6. Click **Run** (! icon) to execute

7. Insert demo users with this SQL:

```sql
INSERT INTO Users (Username, Password, Role, FullName, IsActive) 
VALUES 
('admin', 'admin123', 'Admin', 'System Administrator', Yes),
('sales', 'sales123', 'Sales', 'Sales Agent', Yes),
('warehouse', 'warehouse123', 'Warehouse', 'Warehouse Manager', Yes);
```

8. Click **Run** again

9. Close and **Save** the query (or just close without saving)

### Step 2: Verify Table Creation

1. In Access, look in the left sidebar under **Tables**
2. You should see a new table called **Users**
3. Open it to verify the 3 demo users exist

---

## 🌐 Network Configuration

### Scenario A: Admin PC (Database Host)

This is the PC where the database will be stored and shared.

#### 1. Create Shared Folder

```powershell
# Create folder for database
mkdir C:\WarehouseDB

# Copy database to shared folder
copy "Stores_DB.accdb" "C:\WarehouseDB\Stores_DB.accdb"
```

#### 2. Share the Folder

1. Right-click `C:\WarehouseDB` → **Properties**
2. Go to **Sharing** tab
3. Click **Advanced Sharing**
4. Check **Share this folder**
5. Set Share name: `WarehouseDB`
6. Click **Permissions**
7. Grant **Full Control** to "Everyone" (or specific users)
8. Click **OK** to save

#### 3. Note Your Computer Name

```powershell
# Run this command to get your computer name
hostname
```

Example output: `ADMIN-PC`

#### 4. Configure Application

1. Run the application
2. If you're logged in as Admin, you can access Settings
3. Or create a `config.json` manually:

```json
{
  "dbPath": "C:\\WarehouseDB\\Stores_DB.accdb"
}
```

Save this file to:
- Windows: `C:\Users\<YourUsername>\AppData\Roaming\warehouse-desktop-app\config.json`

### Scenario B: Sales/Warehouse PC (Client)

These PCs will connect to the shared database over the network.

#### 1. Test Network Access

```powershell
# Replace ADMIN-PC with actual computer name from Step 3 above
dir \\ADMIN-PC\WarehouseDB
```

If successful, you'll see the database file listed.

#### 2. Configure Application

Create `config.json` with network path:

```json
{
  "dbPath": "\\\\ADMIN-PC\\WarehouseDB\\Stores_DB.accdb"
}
```

Save to:
- Windows: `C:\Users\<YourUsername>\AppData\Roaming\warehouse-desktop-app\config.json`

**OR** use the Database Settings UI in the application (Admin role only).

---

## 👥 User Roles

### Admin Role
**Username:** `admin`  
**Password:** `admin123`

**Permissions:**
- ✅ Full dashboard with analytics
- ✅ Inventory management (add/edit/delete items)
- ✅ Sales management (create invoices, view history)
- ✅ Purchase management (receive stock)
- ✅ Customer & Supplier management
- ✅ Reports & analytics
- ✅ Database configuration

**Landing Page:** Admin Dashboard with full navigation

---

### Sales Role
**Username:** `sales`  
**Password:** `sales123`

**Permissions:**
- ✅ Point of Sale (POS) interface
- ✅ Create sales invoices
- ✅ View sales history
- ✅ View customer list (read-only)
- ❌ No inventory management
- ❌ No purchase management
- ❌ No reports access
- ❌ No system settings

**Landing Page:** Sales Terminal (POS focused interface)

---

### Warehouse Role
**Username:** `warehouse`  
**Password:** `warehouse123`

**Permissions:**
- ✅ Inventory management (add/edit items)
- ✅ Receive stock (purchases)
- ✅ View stock levels and alerts
- ✅ Stock audit tools (future)
- ❌ No sales access
- ❌ No customer management
- ❌ No reports access
- ❌ No system settings

**Landing Page:** Warehouse Control (inventory focused interface)

---

## 🧪 Testing

### Test 1: Local Database Access

1. Ensure `Stores_DB.accdb` is in project root
2. Run application: `npm run dev`
3. Login with: `admin` / `admin123`
4. Verify you see the Admin Dashboard
5. Test adding an inventory item
6. Logout and login as `sales` / `sales123`
7. Verify you see the Sales Terminal (different interface)

### Test 2: Network Database Access

**On Admin PC:**
1. Share folder as described above
2. Run application
3. Login and verify functionality

**On Sales PC:**
1. Update `config.json` with network path
2. Run application
3. Login as `sales` / `sales123`
4. Create a sale and verify it saves
5. Check on Admin PC that the sale appears

**On Warehouse PC:**
1. Update `config.json` with network path
2. Run application
3. Login as `warehouse` / `warehouse123`
4. Add/update inventory items
5. Verify changes appear on other PCs

### Test 3: Role Restrictions

1. Login as `sales`
2. Try to navigate to `/admin` route
3. Should see "Access Denied" message

4. Login as `warehouse`
5. Try to access Sales features
6. Should not see sales navigation

---

## 🔧 Troubleshooting

### Issue: Cannot Login

**Symptoms:**
- "Invalid username or password" error
- All credentials fail

**Solutions:**
1. Verify Users table exists in database
2. Check that demo users were inserted correctly:
   ```sql
   SELECT * FROM Users WHERE IsActive = Yes;
   ```
3. Ensure passwords match exactly (case-sensitive)
4. Check database connection in console logs

---

### Issue: Network Path Not Found

**Symptoms:**
- `\\ADMIN-PC\WarehouseDB\Stores_DB.accdb` cannot be accessed
- Connection timeout

**Solutions:**
1. Verify File Sharing is enabled on Admin PC:
   - Control Panel → Network and Sharing Center
   - Change advanced sharing settings
   - Turn on file sharing

2. Check firewall settings:
   ```powershell
   # Allow File Sharing through firewall
   netsh advfirewall firewall set rule group="File and Printer Sharing" new enable=Yes
   ```

3. Verify share permissions:
   - Right-click shared folder → Properties → Sharing
   - Ensure permissions are set correctly

4. Test with direct IP instead of hostname:
   ```
   \\192.168.1.100\WarehouseDB\Stores_DB.accdb
   ```

5. Ensure both PCs are on same network/workgroup

---

### Issue: "Database is locked" Error

**Symptoms:**
- Error when multiple users try to access
- Write operations fail

**Solutions:**
1. Ensure database is NOT open in Microsoft Access
2. Check file permissions on shared folder
3. Close all instances of the application
4. Delete `Stores_DB.laccdb` lock file if it exists
5. Restart application

---

### Issue: Access Database Engine Not Found

**Symptoms:**
- "Provider cannot be found" error
- "ADODB connection failed"

**Solutions:**
1. Download and install Access Database Engine 2016 (64-bit):
   https://www.microsoft.com/en-us/download/details.aspx?id=54920

2. Verify installation:
   - Look for `C:\Program Files\Microsoft Office\root\VFS\ProgramFilesCommonX64\Microsoft Shared\Office16\`

3. If 32-bit is installed, uninstall it first
4. Restart computer after installation

---

### Issue: Role Not Redirecting Correctly

**Symptoms:**
- User logs in but sees wrong dashboard
- Navigation doesn't match role

**Solutions:**
1. Clear browser storage:
   ```javascript
   sessionStorage.clear()
   ```
2. Logout and login again
3. Verify Role field in database is exactly: `Admin`, `Sales`, or `Warehouse` (case-sensitive)
4. Check console for errors

---

## 🔒 Security Best Practices

### For Production Deployment:

1. **Hash Passwords**
   - Current implementation uses plain text (DEMO ONLY)
   - Implement bcrypt hashing for production
   - Update authentication logic in `main.ts`

2. **Change Default Passwords**
   ```sql
   UPDATE Users SET Password = 'NewSecurePassword123!' WHERE Username = 'admin';
   ```

3. **Network Security**
   - Use VPN for remote access
   - Implement Windows authentication
   - Use HTTPS if exposing over internet

4. **Regular Backups**
   - Schedule automatic database backups
   - Store backups in secure location
   - Test restore procedures

5. **Access Logging**
   - Log all login attempts
   - Track database modifications
   - Monitor for suspicious activity

---

## 📞 Support

If you encounter issues not covered here:

1. Check application logs in console (F12)
2. Review `electron-main.log` in app data folder
3. Verify all prerequisites are installed correctly
4. Test with local database first before network setup

---

## 🎯 Quick Reference

### Config File Location
```
Windows: C:\Users\<Username>\AppData\Roaming\warehouse-desktop-app\config.json
```

### Default Credentials
```
Admin:     admin / admin123
Sales:     sales / sales123
Warehouse: warehouse / warehouse123
```

### Network Path Format
```
\\ComputerName\ShareName\Stores_DB.accdb
\\192.168.1.100\WarehouseDB\Stores_DB.accdb
```

### Local Path Format
```
C:\WarehouseDB\Stores_DB.accdb
C:\App\Stores_DB.accdb
```

---

**Last Updated:** 2024  
**Version:** 2.0.0
