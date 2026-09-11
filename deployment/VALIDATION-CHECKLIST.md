# ✅ DEPLOYMENT VALIDATION CHECKLIST

Use this checklist to verify your warehouse management system is properly deployed and functioning.

---

## 📋 PRE-DEPLOYMENT VALIDATION

### Server Machine Prerequisites

- [ ] Windows Server 2012+ or Windows 10/11 installed
- [ ] Has administrator access
- [ ] Has stable network connection
- [ ] Network has static IP or DHCP reservation configured
- [ ] At least 4GB RAM available
- [ ] At least 20GB disk space available
- [ ] PostgreSQL 16 installer downloaded
- [ ] Node.js LTS installer downloaded
- [ ] Excel data file available (if migrating data)

### Network Prerequisites

- [ ] Server machine has fixed/static IP address
- [ ] All client machines are on same LAN subnet
- [ ] No network firewall blocking port 3001
- [ ] Gigabit network switches (recommended)
- [ ] All machines can ping each other

---

## 🖥️ SERVER DEPLOYMENT VALIDATION

### PostgreSQL Installation

- [ ] PostgreSQL service is running
  ```cmd
  services.msc → Find "postgresql-x64-16" → Status: Running
  ```

- [ ] psql command works
  ```cmd
  psql --version
  # Should show: psql (PostgreSQL) 16.x
  ```

- [ ] Can connect to PostgreSQL
  ```cmd
  psql -U postgres
  # Enter password, should connect
  ```

- [ ] Database `warehouse_db` exists
  ```sql
  \l
  # Should list warehouse_db
  ```

### Node.js Installation

- [ ] Node.js is installed
  ```cmd
  node --version
  # Should show: v20.x.x or similar
  ```

- [ ] npm is available
  ```cmd
  npm --version
  # Should show: 10.x.x or similar
  ```

### Backend Setup

- [ ] Backend dependencies installed
  ```cmd
  cd backend
  dir node_modules
  # Should show many folders
  ```

- [ ] Config file exists and is correct
  ```cmd
  notepad backend\config.json
  # Verify database password
  ```

- [ ] Database schema created
  ```sql
  psql -U postgres -d warehouse_db
  \dt
  # Should list: Items, Customers, Suppliers, Sales, etc.
  ```

- [ ] Default users exist
  ```sql
  SELECT Username, RoleName FROM Users 
  JOIN Roles ON Users.RoleID = Roles.RoleID;
  # Should show: admin, sales, warehouse
  ```

- [ ] Data migrated (if applicable)
  ```sql
  SELECT COUNT(*) FROM Items;
  SELECT COUNT(*) FROM Customers;
  SELECT COUNT(*) FROM Suppliers;
  # Should show your data counts
  ```

### Windows Service

- [ ] Service is installed
  ```cmd
  sc query WarehouseAPI
  # Should show service details
  ```

- [ ] Service is running
  ```cmd
  sc query WarehouseAPI
  # STATE should be: RUNNING
  ```

- [ ] Service starts automatically
  ```cmd
  sc qc WarehouseAPI
  # START_TYPE should be: AUTO_START
  ```

### API Testing

- [ ] Health endpoint responds (localhost)
  ```cmd
  curl http://localhost:3001/api/health
  # Or open in browser
  ```

- [ ] Health endpoint returns correct JSON
  ```json
  {
    "success": true,
    "message": "Warehouse API is running",
    "version": "1.0.0"
  }
  ```

- [ ] Stats endpoint works
  ```cmd
  curl http://localhost:3001/api/stats
  ```

- [ ] Login endpoint works
  ```cmd
  curl -X POST http://localhost:3001/api/auth/login ^
    -H "Content-Type: application/json" ^
    -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
  ```

### Firewall

- [ ] Windows Firewall rule exists
  ```cmd
  netsh advfirewall firewall show rule name="Warehouse API"
  # Should show rule details
  ```

- [ ] Port 3001 is open
  ```cmd
  netstat -an | findstr :3001
  # Should show: 0.0.0.0:3001 LISTENING
  ```

### Network Access

- [ ] Health endpoint responds from another machine
  ```cmd
  # From any other computer on LAN:
  curl http://192.168.1.100:3001/api/health
  # Replace with actual server IP
  ```

- [ ] Server IP is documented
  ```cmd
  ipconfig
  # Note IPv4 Address
  ```

### Server Summary

Server IP: `________________` (fill in)

- [ ] PostgreSQL running ✓
- [ ] Node.js API running ✓
- [ ] Windows Service installed ✓
- [ ] Firewall configured ✓
- [ ] Accessible from network ✓

---

## 💻 CLIENT DEPLOYMENT VALIDATION

### For Each Client Machine:

#### Application Installation

- [ ] Application copied to `C:\Program Files\Warehouse Manager\`
  ```cmd
  dir "C:\Program Files\Warehouse Manager"
  # Should show Warehouse Manager.exe
  ```

- [ ] Desktop shortcut created
  ```cmd
  dir "%USERPROFILE%\Desktop\Warehouse Manager.lnk"
  ```

#### Configuration

- [ ] Config file exists
  ```cmd
  dir "%APPDATA%\warehouse-desktop-app\config.json"
  ```

- [ ] Config has correct server IP
  ```cmd
  notepad %APPDATA%\warehouse-desktop-app\config.json
  # Verify serverIP matches server
  ```

#### Network Connectivity

- [ ] Can ping server
  ```cmd
  ping 192.168.1.100
  # Replace with actual server IP
  # Should get replies
  ```

- [ ] Can reach API
  ```cmd
  curl http://192.168.1.100:3001/api/health
  # Or open in browser
  # Should return JSON
  ```

#### Application Launch

- [ ] Application launches without errors
- [ ] Login screen appears
- [ ] Can login with admin credentials
  - Username: `admin`
  - Password: `admin123`

#### Functionality Testing

- [ ] Dashboard loads and shows data
- [ ] Can view Items (Inventory)
- [ ] Can view Customers
- [ ] Can view Suppliers
- [ ] Can view Sales
- [ ] Can view Purchases
- [ ] Can create new item
- [ ] Can edit item
- [ ] Can delete item
- [ ] Stock updates reflect immediately

#### Performance

- [ ] Dashboard loads in < 2 seconds
- [ ] Item list loads in < 2 seconds
- [ ] Search is responsive
- [ ] No lag when typing
- [ ] No connection errors in console

### Client Summary

Machine Name: `________________` (fill in)

- [ ] App installed ✓
- [ ] Can reach server ✓
- [ ] Login works ✓
- [ ] All features work ✓
- [ ] Performance is good ✓

---

## 🔄 MULTI-CLIENT VALIDATION

### Concurrent Access Testing

- [ ] Two clients can login simultaneously
- [ ] Both clients can view same data
- [ ] Changes made on Client 1 reflect on Client 2
- [ ] Changes made on Client 2 reflect on Client 1
- [ ] No database lock errors
- [ ] No connection timeout errors

### Data Sync Testing

#### Test 1: Item Creation
- [ ] Create item on Client 1
- [ ] Refresh item list on Client 2
- [ ] New item appears on Client 2 ✓

#### Test 2: Item Update
- [ ] Edit item on Client 1
- [ ] View same item on Client 2
- [ ] Changes reflect on Client 2 ✓

#### Test 3: Sale Transaction
- [ ] Create sale on Client 1
- [ ] Check stock on Client 2
- [ ] Stock decreased correctly ✓

#### Test 4: Purchase Transaction
- [ ] Create purchase on Client 1
- [ ] Check stock on Client 2
- [ ] Stock increased correctly ✓

---

## 🖼️ MULTI-MONITOR VALIDATION

- [ ] Can launch app on Monitor 1
- [ ] Can launch app again on Monitor 2
- [ ] Can launch app again on Monitor 3
- [ ] All three instances work independently
- [ ] Can login to different roles on each
- [ ] All show live data
- [ ] Changes sync across all monitors

---

## 📊 REPORTING VALIDATION

### Dashboard Statistics

- [ ] Total Items count is correct
- [ ] Total Customers count is correct
- [ ] Total Suppliers count is correct
- [ ] Total Sales count is correct
- [ ] Today's Revenue shows correctly
- [ ] Low Stock items display
- [ ] Recent Sales display

### Reports

- [ ] Sales report generates
- [ ] Sales report filters by date range
- [ ] Stock report shows all items
- [ ] Stock report shows correct quantities
- [ ] Debt report shows customer debts
- [ ] Debt report shows supplier debts
- [ ] Reports can be exported/printed

---

## 🔐 SECURITY VALIDATION

### Authentication

- [ ] Cannot access without login
- [ ] Invalid credentials are rejected
- [ ] Valid credentials are accepted
- [ ] Session persists after restart
- [ ] Logout works correctly

### Authorization

- [ ] Admin can access all features
- [ ] Sales user has limited access
- [ ] Warehouse user has limited access
- [ ] Users cannot escalate privileges

### Passwords

- [ ] Default passwords changed
  ```sql
  -- Check password is NOT default:
  SELECT Username, Password FROM Users;
  -- admin should NOT be "admin123"
  ```

---

## 🛠️ MAINTENANCE VALIDATION

### Backups

- [ ] Backup directory created
  ```cmd
  mkdir C:\Backups
  ```

- [ ] Manual backup works
  ```cmd
  pg_dump -U postgres -d warehouse_db -F c -f C:\Backups\test.backup
  ```

- [ ] Backup file created successfully
  ```cmd
  dir C:\Backups\test.backup
  ```

- [ ] Can restore from backup
  ```cmd
  pg_restore -U postgres -d warehouse_db_test C:\Backups\test.backup
  ```

- [ ] Automated backup scheduled (Task Scheduler)

### Service Management

- [ ] Can stop service
  ```cmd
  net stop WarehouseAPI
  ```

- [ ] Can start service
  ```cmd
  net start WarehouseAPI
  ```

- [ ] Service restarts automatically after reboot
  - Restart server machine
  - Wait for boot
  - Check service is running

### Logs

- [ ] Can view Event Viewer logs
  ```cmd
  eventvwr.msc
  # Windows Logs → Application
  # Source: WarehouseAPI
  ```

- [ ] Logs show startup messages
- [ ] No critical errors in logs

---

## 📈 PERFORMANCE VALIDATION

### Response Times (should be fast on LAN)

- [ ] API health check: < 50ms
- [ ] Dashboard load: < 2 seconds
- [ ] Item list load: < 2 seconds
- [ ] Customer list load: < 2 seconds
- [ ] Search results: < 1 second
- [ ] Create item: < 500ms
- [ ] Create sale: < 1 second

### Load Testing

- [ ] 5 users can work simultaneously without issues
- [ ] 10 users can work simultaneously without issues
- [ ] Database handles 100+ transactions without slowdown
- [ ] No memory leaks after 1 hour of use
- [ ] No connection pool exhaustion

### Resource Usage

- [ ] Server CPU usage < 50% under normal load
- [ ] Server RAM usage < 2GB
- [ ] PostgreSQL RAM usage < 1GB
- [ ] Client RAM usage < 500MB per instance
- [ ] Disk I/O is reasonable

---

## ✅ FINAL VALIDATION

### Documentation

- [ ] Server IP documented
- [ ] PostgreSQL password documented (securely)
- [ ] Default user credentials documented
- [ ] Network configuration documented
- [ ] Backup location documented
- [ ] All staff trained

### Operational Readiness

- [ ] Server is stable (no crashes)
- [ ] All clients are stable (no crashes)
- [ ] Data accuracy verified
- [ ] Transactions work correctly
- [ ] Reports are accurate
- [ ] Backups are working
- [ ] Users are trained

### Acceptance Criteria

- [ ] System is faster than old Access version
- [ ] All old features still work
- [ ] New multi-machine features work
- [ ] No data loss during migration
- [ ] Users can perform their daily tasks
- [ ] Management approves the new system

---

## 🎉 DEPLOYMENT SIGN-OFF

### Server Deployment

Deployed by: `________________`
Date: `________________`
Server IP: `________________`

**Status**: [ ] PASS  [ ] FAIL  [ ] NEEDS WORK

**Notes**:
```
_________________________________________________________

_________________________________________________________

_________________________________________________________
```

### Client Deployments

#### Client 1
Machine: `________________`
Deployed by: `________________`
Date: `________________`
Status: [ ] PASS  [ ] FAIL

#### Client 2
Machine: `________________`
Deployed by: `________________`
Date: `________________`
Status: [ ] PASS  [ ] FAIL

#### Client 3
Machine: `________________`
Deployed by: `________________`
Date: `________________`
Status: [ ] PASS  [ ] FAIL

*(Add more as needed)*

### System Acceptance

Tested by: `________________`
Date: `________________`

**Final Status**: [ ] APPROVED FOR PRODUCTION  [ ] NEEDS WORK  [ ] REJECTED

**Signature**: `________________`

---

## 📝 ISSUE LOG

Use this section to track any issues found during validation:

### Issue #1
- **Description**: 
- **Severity**: [ ] Critical  [ ] High  [ ] Medium  [ ] Low
- **Status**: [ ] Open  [ ] In Progress  [ ] Resolved
- **Resolution**: 

### Issue #2
- **Description**: 
- **Severity**: [ ] Critical  [ ] High  [ ] Medium  [ ] Low
- **Status**: [ ] Open  [ ] In Progress  [ ] Resolved
- **Resolution**: 

*(Add more as needed)*

---

**Validation Complete!** 🎊

If all checks pass, your system is ready for production use!
