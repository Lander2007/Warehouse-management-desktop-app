# 🎯 START HERE - Complete Setup Guide

## ✅ What Has Been Fixed

All issues have been resolved! The application now works in **API Mode** with PostgreSQL backend.

**Fixed:**
1. ✅ ERROR: "Unable to load preload script" → **FIXED**
2. ✅ ERROR: "Cannot read properties of undefined (reading 'authenticateUser')" → **FIXED**
3. ✅ Preload script now uses `fetch()` for HTTP calls → **CORRECT**
4. ✅ Main process has no database dependencies → **CORRECT**
5. ✅ Login component has null checks → **SAFE**

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Verify Setup ✅

Run this to check everything is correct:

```bash
VERIFY-API-MODE.bat
```

You should see:
```
✅ ALL CHECKS PASSED - API MODE IS CORRECT
```

---

### Step 2: Start Backend Server 🖥️

Open **Terminal 1** (on server machine):

```bash
cd backend
node server.js
```

**Expected Output:**
```
✅ Database connected successfully
   Server time: 2026-06-14T17:00:00.000Z
🚀 Server running on http://0.0.0.0:3001
```

**Leave this terminal running!**

---

### Step 3: Configure Client IP 📝

Edit `config.json` in project root:

**For testing on same machine:**
```json
{
  "serverIP": "localhost",
  "serverPort": 3001
}
```

**For network use (change to your server's IP):**
```json
{
  "serverIP": "192.168.1.100",
  "serverPort": 3001
}
```

---

### Step 4: Start Client Application 💻

Open **Terminal 2** (on each client machine):

**Option A: Using batch file**
```bash
START-API.bat
```

**Option B: Manual**
```bash
npm run dev
```

**Expected Output:**
```
✅ Copied preload-api.js → dist-electron/preload.cjs
VITE v6.4.3 ready in ...
dist-electron/main.js ... built
✅ Client started
🌐 API Server: http://localhost:3001/api
```

---

### Step 5: Login and Test 🎉

1. Electron window should open automatically
2. Login screen should appear
3. Login with default credentials:
   - **Username:** `admin`
   - **Password:** `1234`

**If login succeeds → Everything works!** 🎊

---

## 🔍 Troubleshooting

### ❌ Problem: "window.api is undefined"

**Cause:** Preload script not loaded correctly

**Fix:**
```bash
# Clean rebuild
rd /s /q dist-electron
npm run dev
```

---

### ❌ Problem: "Failed to fetch" or "Network Error"

**Cause:** Backend not running or wrong IP

**Fix:**

1. **Check backend is running:**
   ```bash
   curl http://localhost:3001/api/health
   ```
   
2. **Check config.json has correct IP:**
   ```json
   {
     "serverIP": "localhost",  ← Check this!
     "serverPort": 3001
   }
   ```

3. **Test from client machine:**
   ```bash
   curl http://192.168.1.100:3001/api/health
   ```

4. **Check firewall allows port 3001**

---

### ❌ Problem: Backend won't start

**Cause:** PostgreSQL not running or wrong credentials

**Fix:**

1. **Check PostgreSQL is running:**
   ```bash
   # Windows
   services.msc
   # Look for "postgresql-x64-14" service
   ```

2. **Check `backend/config.json`:**
   ```json
   {
     "database": {
       "host": "localhost",
       "port": 5432,
       "database": "warehouse",
       "user": "postgres",
       "password": "your_password"  ← Check this!
     }
   }
   ```

3. **Test PostgreSQL connection:**
   ```bash
   psql -U postgres -d warehouse
   ```

---

### ❌ Problem: Build fails

**Cause:** Old dependencies or corrupted node_modules

**Fix:**
```bash
# Clean install
rd /s /q node_modules
rd /s /q package-lock.json
npm install
npm run dev
```

---

## 📁 Important Files

| File | Purpose | Location |
|------|---------|----------|
| `config.json` | Server IP config | Project root |
| `vite.config.ts` | Build configuration | Project root |
| `electron/main-api.ts` | Main process (API mode) | electron/ |
| `electron/preload-api.js` | Window.api exposure | electron/ |
| `backend/server.js` | Express API server | backend/ |
| `backend/config.json` | PostgreSQL config | backend/ |

---

## 📚 Documentation Files

- **`QUICK-START.md`** - Fast 3-step guide
- **`README-API-MODE.md`** - Complete API mode documentation
- **`FIXED-SUMMARY.md`** - What was fixed and how
- **`MODE-COMPARISON.md`** - Database vs API mode comparison
- **`VERIFY-API-MODE.bat`** - Automated verification script

---

## 🎓 Understanding the System

### Architecture

```
Client Machines                Server Machine
┌──────────────┐              ┌──────────────┐
│  Electron 1  │─────┐        │  Express API │
└──────────────┘     │        │  Port 3001   │
                     ├───────▶│              │
┌──────────────┐     │        └──────┬───────┘
│  Electron 2  │─────┘               │
└──────────────┘          HTTP       │
                                     ▼
┌──────────────┐              ┌──────────────┐
│  Electron 3  │──────────────│  PostgreSQL  │
└──────────────┘              │  warehouse   │
                              └──────────────┘
```

### Data Flow

```
1. User enters credentials
   ↓
2. Login.tsx calls window.api.authenticateUser()
   ↓
3. preload-api.js uses fetch() to call API
   ↓
4. Express receives POST /api/auth/login
   ↓
5. Query PostgreSQL users table
   ↓
6. Return user data
   ↓
7. Login success!
```

---

## ✅ Post-Setup Checklist

- [ ] Backend server running and shows "✅ Database connected"
- [ ] `VERIFY-API-MODE.bat` shows all checks passed
- [ ] `config.json` has correct server IP
- [ ] Client starts without errors
- [ ] Electron window opens
- [ ] Login screen appears
- [ ] Can login successfully with admin/1234
- [ ] Dashboard loads with data
- [ ] Can navigate between sections

**All checked?** Congratulations! 🎉 Your system is ready!

---

## 🆘 Still Having Issues?

1. **Read the logs carefully** - errors usually tell you what's wrong
2. **Check DevTools Console** - Press F12 in Electron
3. **Check backend terminal** - Look for error messages
4. **Run verification** - `VERIFY-API-MODE.bat`
5. **Test API directly** - Use curl or Postman
6. **Clean rebuild** - Delete dist-electron and rebuild

---

## 📞 Common Questions

**Q: Can I use this without network?**
A: No, API mode requires network connection to backend server.

**Q: How many users can use it simultaneously?**
A: Unlimited! PostgreSQL supports hundreds of concurrent users.

**Q: Is my data safe?**
A: Yes, PostgreSQL has ACID compliance and transaction support.

**Q: Can I use HTTPS instead of HTTP?**
A: Yes, you need to setup SSL/TLS certificates and configure Express.

**Q: What if backend server goes down?**
A: Clients will show "Failed to fetch" error. Restart backend.

**Q: Can I run backend on different port?**
A: Yes, change `serverPort` in config.json (both client and backend).

---

## 🎯 Next Steps

1. ✅ **Test locally** - Make sure everything works on one machine
2. 🌐 **Test network** - Connect from another machine
3. 👥 **Add users** - Create accounts for your team
4. 📦 **Package for production** - Use `npm run package:win:api`
5. 🚀 **Deploy** - Setup backend on dedicated server
6. 🔒 **Add security** - Setup HTTPS, JWT tokens, etc.

---

**You're all set! Start using your Warehouse Management System!** 🎊

---

**Last Updated:** June 14, 2026
**Status:** ✅ FULLY WORKING - API MODE
**Support:** Check documentation files or backend logs
