# 🔧 Warehouse Management System - Backend API

Node.js + Express REST API server for the Warehouse Management System.

---

## 📋 Overview

This is the backend server that provides REST API endpoints for the Electron client app. It connects to PostgreSQL database and handles all business logic.

---

## 🚀 Quick Start

### Development Mode

```bash
# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Or start production server
npm start
```

Server will run on: `http://localhost:3001`

### Production Mode (Windows Service)

```bash
# Install as Windows Service
npm run install-service

# Service will auto-start on system boot
# Manage via services.msc
```

---

## 📁 File Structure

```
backend/
├── database/
│   ├── schema.sql              # PostgreSQL schema
│   └── migrate-from-excel.js   # Data migration script
├── config.json                 # Server configuration
├── server.js                   # Express app & API endpoints
├── package.json
├── install-service.js          # Windows Service installer
└── uninstall-service.js        # Service uninstaller
```

---

## ⚙️ Configuration

Edit `config.json`:

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
    "password": "your_password",
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

---

## 🌐 API Endpoints

### Health Check
```
GET /api/health
```

### Authentication
```
POST /api/auth/login
Body: { "username": "admin", "password": "admin123" }
```

### Stats
```
GET /api/stats
```

### Items
```
GET    /api/items?search=term
GET    /api/items/:id
POST   /api/items
PUT    /api/items/:id
DELETE /api/items/:id
```

### Customers
```
GET    /api/customers?search=term
POST   /api/customers
PUT    /api/customers/:id
DELETE /api/customers/:id
```

### Suppliers
```
GET    /api/suppliers?search=term
POST   /api/suppliers
PUT    /api/suppliers/:id
DELETE /api/suppliers/:id
```

### Sales
```
GET  /api/sales?limit=200
GET  /api/sales/:id
POST /api/sales
```

### Purchases
```
GET  /api/purchases?limit=200
POST /api/purchases
```

### Payment Methods
```
GET /api/payment-methods
```

### Reports
```
GET /api/reports/sales?from=2024-01-01&to=2024-12-31
GET /api/reports/stock
GET /api/reports/debts
```

---

## 💾 Database Setup

### 1. Create Database

```bash
psql -U postgres
```

```sql
CREATE DATABASE warehouse_db;
\q
```

### 2. Run Schema

```bash
psql -U postgres -d warehouse_db -f database/schema.sql
```

### 3. Migrate Data

```bash
npm run migrate
```

This will import data from the Excel file into PostgreSQL.

---

## 🧪 Testing

### Manual Test

```bash
# Check if server is running
curl http://localhost:3001/api/health

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get items
curl http://localhost:3001/api/items
```

### From Browser

Open: `http://localhost:3001/api/health`

Should see:
```json
{
  "success": true,
  "message": "Warehouse API is running",
  "timestamp": "2024-06-14T10:30:00.000Z",
  "version": "1.0.0"
}
```

---

## 🔐 Security

### Default Credentials (Change Immediately!)

```
Admin:     username=admin,     password=admin123
Sales:     username=sales,     password=sales123
Warehouse: username=warehouse, password=warehouse123
```

### Change Passwords

```sql
psql -U postgres -d warehouse_db

UPDATE Users SET Password = 'new_password' WHERE Username = 'admin';
```

**Production Recommendations:**
- Use bcrypt for password hashing
- Implement JWT authentication
- Enable HTTPS
- Restrict CORS origins
- Add rate limiting
- Implement API versioning

---

## 🔧 Windows Service Management

### Install Service

```bash
npm run install-service
```

or

```bash
node install-service.js
```

### Manage Service

```cmd
# Via Services UI
services.msc

# Via Command Line
net start WarehouseAPI
net stop WarehouseAPI
net restart WarehouseAPI

# Check status
sc query WarehouseAPI
```

### Uninstall Service

```bash
node uninstall-service.js
```

---

## 📝 Logs

### Application Logs

Logs are output to console. To capture:

```bash
# Linux/Mac
npm start > logs/app.log 2>&1

# Windows (PowerShell)
npm start *> logs/app.log
```

### Windows Service Logs

Service logs are in:
```
C:\Windows\System32\config\systemprofile\AppData\Local\Temp\WarehouseAPI.err.log
C:\Windows\System32\config\systemprofile\AppData\Local\Temp\WarehouseAPI.out.log
```

### PostgreSQL Logs

```
C:\Program Files\PostgreSQL\15\data\log\
```

---

## 🐛 Troubleshooting

### Server Won't Start

1. **Check PostgreSQL is running**:
   ```cmd
   pg_ctl status -D "C:\Program Files\PostgreSQL\15\data"
   ```

2. **Check port 3001 is free**:
   ```cmd
   netstat -ano | findstr :3001
   ```

3. **Check database credentials** in `config.json`

4. **Test database connection**:
   ```bash
   psql -U postgres -d warehouse_db -c "SELECT 1"
   ```

### Database Connection Errors

```bash
# Check PostgreSQL service
net start postgresql-x64-15

# Verify connection string
psql -U postgres -d warehouse_db

# Reset password if forgotten
psql -U postgres
ALTER USER postgres WITH PASSWORD 'new_password';
```

### Port Already In Use

```cmd
# Find process using port
netstat -ano | findstr :3001

# Kill process (replace PID)
taskkill /PID 1234 /F

# Or change port in config.json
```

---

## 📊 Performance

### Connection Pooling

Default: 20 connections  
Adjust in `config.json` → `database.max`

### Query Optimization

- Indexes on frequently searched columns
- Views for complex reports
- Pagination with LIMIT/OFFSET
- Caching for payment methods

### Monitoring

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'warehouse_db';

-- Slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;

-- Database size
SELECT pg_size_pretty(pg_database_size('warehouse_db'));
```

---

## 🔄 Maintenance

### Backup Database

```bash
# Full backup
pg_dump -U postgres warehouse_db > backup.sql

# Compressed backup
pg_dump -U postgres warehouse_db | gzip > backup.sql.gz

# Restore
psql -U postgres -d warehouse_db < backup.sql
```

### Vacuum Database

```sql
VACUUM ANALYZE;
```

### Update Dependencies

```bash
npm update
npm audit fix
```

---

## 📦 Dependencies

- **express**: Web framework
- **pg**: PostgreSQL client
- **cors**: Cross-origin resource sharing
- **helmet**: Security headers
- **morgan**: Request logging
- **compression**: Response compression
- **xlsx**: Excel file processing
- **node-windows**: Windows Service wrapper

---

## 🌐 Network Configuration

### Firewall Rules

```cmd
# Allow incoming on port 3001
netsh advfirewall firewall add rule name="Warehouse API" dir=in action=allow protocol=TCP localport=3001

# Remove rule
netsh advfirewall firewall delete rule name="Warehouse API"
```

### Find Server IP

```cmd
ipconfig | findstr IPv4
```

---

## 🚀 Deployment

See `../deployment/README-DEPLOYMENT.md` for complete deployment instructions.

---

## 📞 Support

For issues or questions, check:
1. This README
2. `../deployment/README-DEPLOYMENT.md`
3. `../MIGRATION-GUIDE.md`

---

**Version**: 1.0.0  
**Node.js**: 18+ LTS  
**PostgreSQL**: 15+

