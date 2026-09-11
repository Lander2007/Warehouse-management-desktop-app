# 🚀 Quick Start - API Mode

## 📌 Prerequisites

1. ✅ Backend server running (PostgreSQL + Express)
2. ✅ `config.json` configured with server IP
3. ✅ Port 3001 open in firewall

## 🎯 Start in 3 Steps

### 1️⃣ Start Backend (Server Machine)

```bash
cd backend
node server.js
```

**Check:** Should see `✅ Database connected` and `🚀 Server running on http://0.0.0.0:3001`

---

### 2️⃣ Configure Client (All Machines)

Edit `config.json` in project root:

```json
{
  "serverIP": "192.168.1.100",
  "serverPort": 3001
}
```

**Replace `192.168.1.100` with your server's actual IP address**

---

### 3️⃣ Start Client (Each Machine)

Double-click `START-API.bat`

Or manually:
```bash
npm run dev
```

---

## ✅ Verify Everything Works

Run: `VERIFY-API-MODE.bat`

Should see:
```
✅ main.js exists
✅ preload.cjs exists
✅ config.json exists
✅ preload.cjs uses fetch (API mode)
✅ preload.cjs has authenticateUser
✅ main.js does NOT have node-adodb
✅ main.js has getApiBaseUrl
✅ ALL CHECKS PASSED - API MODE IS CORRECT
```

---

## 🔍 Test Connection

### From Client Machine:

**Option 1: PowerShell**
```powershell
Invoke-WebRequest -Uri http://SERVER_IP:3001/api/health
```

**Option 2: Browser**
Open: `http://SERVER_IP:3001/api/health`

Should return:
```json
{
  "status": "ok",
  "timestamp": "2026-06-14T17:00:00.000Z"
}
```

---

## 🐛 Common Issues

### ❌ "window.api is undefined"
**Fix:** 
```bash
rd /s /q dist-electron
npm run dev
```

### ❌ "Failed to fetch"
**Fix:**
1. Check backend is running
2. Check `config.json` has correct IP
3. Test: `curl http://SERVER_IP:3001/api/health`

### ❌ "Authentication Failed"
**Fix:**
1. Check backend logs
2. Open DevTools (F12) → Network tab
3. Look for POST to `/api/auth/login`

---

## 📱 Default Login

```
Username: admin
Password: 1234
```

---

## 📁 Project Structure

```
├── config.json              ← Configure server IP here
├── START-API.bat            ← Quick start script
├── VERIFY-API-MODE.bat      ← Verify setup is correct
├── electron/
│   ├── main-api.ts          ← Main process (API-based)
│   └── preload-api.js       ← Exposes window.api
└── backend/
    ├── server.js            ← Express API server
    └── config.json          ← PostgreSQL config
```

---

## 🎓 How It Works

```
Client (Electron)
    ↓ fetch()
API Server (Express:3001)
    ↓ SQL
PostgreSQL Database
```

---

## 💡 Tips

1. **Always start backend first** before clients
2. **Use actual IP** (not localhost) for network access
3. **Check firewall** if connection fails
4. **Check backend logs** if API errors occur
5. **Use DevTools** (F12) to debug frontend issues

---

## 📞 Need Help?

1. Read `README-API-MODE.md` for detailed guide
2. Read `FIXED-SUMMARY.md` for what was fixed
3. Run `VERIFY-API-MODE.bat` to check setup
4. Check backend logs for API errors
5. Check DevTools console for frontend errors

---

**Ready? Run `START-API.bat` and start using the system!** 🎉
