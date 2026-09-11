# Warehouse Management System - API Mode

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT MACHINES                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Electron App (React + TypeScript)                  │   │
│  │  - Thin client (no database)                        │   │
│  │  - Communicates via HTTP fetch()                    │   │
│  └─────────────────┬───────────────────────────────────┘   │
└────────────────────┼───────────────────────────────────────┘
                     │ HTTP Requests
                     │ (port 3001)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER MACHINE                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Node.js + Express REST API                         │   │
│  │  - Handles authentication                           │   │
│  │  - Business logic                                   │   │
│  │  - Database queries                                 │   │
│  └─────────────────┬───────────────────────────────────┘   │
│                    │                                         │
│                    ▼                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database                                │   │
│  │  - Stores all data                                  │   │
│  │  - Multi-user support                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Key Files

### Client (Electron)
- **`electron/main-api.ts`** - Main process (NO database, only HTTP config)
- **`electron/preload-api.js`** - Exposes `window.api` with fetch() calls
- **`config.json`** - Server IP configuration

### Server (Backend)
- **`backend/server.js`** - Express REST API
- **`backend/config.json`** - PostgreSQL connection settings

## 🚀 How to Start

### Step 1: Start Backend Server (ONE machine only)

```bash
cd backend
node server.js
```

Expected output:
```
✅ Database connected successfully
🚀 Server running on http://0.0.0.0:3001
```

### Step 2: Configure Client Machines

Edit `config.json` in the root folder:

```json
{
  "serverIP": "192.168.1.100",  // ← Change to server IP
  "serverPort": 3001
}
```

### Step 3: Start Client Application

Run on each client machine:

```bash
START-API.bat
```

Or manually:
```bash
npm run dev
```

## 🔧 How It Works

### 1. Preload Script (`preload-api.js`)

```javascript
// This file creates window.api that uses fetch()
contextBridge.exposeInMainWorld('api', {
  authenticateUser: async (username, password) => {
    const response = await fetch('http://SERVER_IP:3001/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
    return response.json()
  },
  // ... more methods
})
```

### 2. Main Process (`main-api.ts`)

```typescript
// NO database code here!
// Only:
// 1. Reads config.json
// 2. Provides IPC handlers for config
// 3. Creates Electron window
```

### 3. Frontend (`Login.tsx`)

```typescript
// Uses window.api (exposed by preload)
const result = await window.api.authenticateUser(username, password)
```

## ⚙️ Configuration

### config.json (Client)

```json
{
  "serverIP": "localhost",    // Change to actual server IP
  "serverPort": 3001
}
```

### backend/config.json (Server)

```json
{
  "database": {
    "host": "localhost",
    "port": 5432,
    "database": "warehouse",
    "user": "postgres",
    "password": "your_password"
  },
  "server": {
    "host": "0.0.0.0",
    "port": 3001
  }
}
```

## 🔍 Troubleshooting

### Error: "window.api is undefined"

**Cause:** Preload script not loaded

**Solutions:**
1. Check `vite.config.ts` - should copy `electron/preload-api.js` → `dist-electron/preload.cjs`
2. Check `electron/main-api.ts` - preload path should be `path.join(__dirname, 'preload.cjs')`
3. Clean rebuild:
   ```bash
   rd /s /q dist-electron
   npm run dev
   ```

### Error: "Cannot read properties of undefined (reading 'authenticateUser')"

**Cause:** `window.api.authenticateUser` doesn't exist

**Solution:**
- Open DevTools Console
- Type: `console.log(window.api)`
- Check if `authenticateUser` exists
- If not, preload script is wrong version (using ipcRenderer instead of fetch)

### Error: "Failed to fetch" or "Network Error"

**Cause:** Backend server not running or wrong IP

**Solutions:**
1. Check backend is running: `http://SERVER_IP:3001/api/health`
2. Check firewall allows port 3001
3. Verify `config.json` has correct server IP
4. Test with curl:
   ```bash
   curl http://192.168.1.100:3001/api/health
   ```

### Error: "CORS policy blocked"

**Cause:** CORS not configured in backend

**Solution:**
In `backend/server.js`, ensure:
```javascript
app.use(cors({
  origin: '*',
  credentials: true
}))
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
  ```json
  { "username": "admin", "password": "1234" }
  ```

### Stats
- `GET /api/stats` - Dashboard statistics

### Items
- `GET /api/items` - List items
- `GET /api/items?search=rice` - Search items
- `POST /api/items` - Add item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Customers
- `GET /api/customers`
- `POST /api/customers`
- `PUT /api/customers/:id`
- `DELETE /api/customers/:id`

### Suppliers
- `GET /api/suppliers`
- `POST /api/suppliers`
- `PUT /api/suppliers/:id`
- `DELETE /api/suppliers/:id`

### Sales
- `GET /api/sales`
- `POST /api/sales`

### Purchases
- `GET /api/purchases`
- `POST /api/purchases`

### Payment Methods
- `GET /api/payment-methods`

## 🔐 Security Notes

1. **Always use HTTPS in production** (not HTTP)
2. **Change default passwords** in PostgreSQL
3. **Configure firewall** to allow only specific IPs
4. **Use environment variables** for sensitive data
5. **Enable authentication tokens** (JWT) for API

## 📝 Development vs Production

### Development
- Server: `localhost:3001`
- Client: `npm run dev` (hot reload)
- DevTools: enabled

### Production
- Server: `0.0.0.0:3001` (accessible from network)
- Client: `npm run package:win` (creates .exe)
- DevTools: disabled

## 🎯 Key Differences from Database Mode

| Feature | Database Mode | API Mode |
|---------|--------------|----------|
| Database | Microsoft Access | PostgreSQL |
| Connection | node-adodb (direct) | REST API (HTTP) |
| Multi-user | ❌ No | ✅ Yes |
| Network | ❌ Not needed | ✅ Required |
| Performance | Fast (local) | Depends on network |
| Setup | Simple | More complex |

## ✅ Checklist

### Server Setup
- [ ] PostgreSQL installed and running
- [ ] Backend dependencies installed (`npm install`)
- [ ] `backend/config.json` configured
- [ ] Tables created (run migration scripts)
- [ ] Server started (`node server.js`)
- [ ] Health check works (`curl http://IP:3001/api/health`)

### Client Setup
- [ ] `config.json` has correct server IP
- [ ] Dependencies installed (`npm install`)
- [ ] Build completed (`npm run dev`)
- [ ] Electron window opens
- [ ] Login screen appears
- [ ] Can login successfully

## 🆘 Getting Help

1. **Check Console Logs** - Open DevTools (F12) and check:
   - Console tab (JavaScript errors)
   - Network tab (API requests)

2. **Check Server Logs** - In backend terminal, look for:
   - Database connection errors
   - API request logs
   - Error stack traces

3. **Test API Directly** - Use curl or Postman:
   ```bash
   curl -X POST http://SERVER_IP:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"1234"}'
   ```

---

**Made with ❤️ for Abdullah System**
