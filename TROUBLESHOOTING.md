# 🔧 Troubleshooting Guide - API Mode

## 🎯 Quick Diagnostics

Run this first:
```bash
VERIFY-API-MODE.bat
```

If all checks pass ✅ → Your build is correct, check runtime issues below.
If checks fail ❌ → Rebuild: `rd /s /q dist-electron` then `npm run dev`

---

## Common Errors & Solutions

### 1. ❌ "window.api is undefined"

**Error in DevTools Console:**
```
Cannot read properties of undefined (reading 'authenticateUser')
```

**Cause:** Preload script didn't load

**Diagnosis:**
1. Open DevTools (F12)
2. Type in console: `console.log(window.api)`
3. If `undefined` → preload failed to load

**Solutions:**

**A. Check preload.cjs exists:**
```bash
dir dist-electron\preload.cjs
```
If missing → rebuild

**B. Verify preload content:**
```bash
findstr "authenticateUser" dist-electron\preload.cjs
```
Should show "authenticateUser: (username, password) =>"

**C. Check main.js preload path:**
```bash
findstr "preload.cjs" dist-electron\main.js
```
Should show `path.join(__dirname, 'preload.cjs')`

**D. Clean rebuild:**
```bash
rd /s /q dist-electron
rd /s /q dist
npm run dev
```

---

### 2. ❌ "Failed to fetch" / "Network Error"

**Error:**
```
Failed to fetch
TypeError: Failed to fetch
```

**Cause:** Cannot reach backend server

**Diagnosis Steps:**

**A. Check backend is running:**
```bash
# In backend terminal, you should see:
✅ Database connected successfully
🚀 Server running on http://0.0.0.0:3001
```

**B. Test API health endpoint:**
```bash
# From client machine:
curl http://SERVER_IP:3001/api/health

# Or in browser:
http://SERVER_IP:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-06-14T..."
}
```

**C. Check config.json:**
```json
{
  "serverIP": "localhost",  ← Must match server IP!
  "serverPort": 3001        ← Must match server port!
}
```

**D. Check firewall:**
```powershell
# Windows - check if port 3001 is blocked
Test-NetConnection -ComputerName SERVER_IP -Port 3001
```

**E. Check network connectivity:**
```bash
ping SERVER_IP
```

**Solutions:**

1. **Start backend first:**
   ```bash
   cd backend
   node server.js
   ```

2. **Fix config.json IP:**
   - For local testing: use `"localhost"`
   - For network: use actual IP like `"192.168.1.100"`

3. **Allow port in firewall:**
   ```bash
   # Windows Firewall
   netsh advfirewall firewall add rule name="Warehouse API" dir=in action=allow protocol=TCP localport=3001
   ```

4. **Check backend logs** for errors

---

### 3. ❌ "Authentication Failed"

**Error:**
```
Authentication Failed
Invalid username or password
```

**Cause:** Backend authentication issue

**Diagnosis:**

**A. Check backend terminal logs:**
Look for:
```
🔐 POST /api/auth/login
```

**B. Check DevTools Network tab:**
1. Open DevTools (F12)
2. Go to Network tab
3. Try to login
4. Look for POST to `/api/auth/login`
5. Click on it and check:
   - **Request:** username and password sent correctly?
   - **Response:** what error is returned?

**C. Test API directly:**
```bash
curl -X POST http://SERVER_IP:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"1234"}'
```

**Solutions:**

1. **Check PostgreSQL has users:**
   ```sql
   SELECT * FROM users;
   ```

2. **Reset admin password:**
   ```sql
   UPDATE users SET password='1234' WHERE username='admin';
   ```

3. **Check backend database connection:**
   ```bash
   # In backend terminal, should see:
   ✅ Database connected successfully
   ```

4. **Verify backend/config.json has correct credentials**

---

### 4. ❌ Backend Won't Start

**Error:**
```
❌ Database connection failed: connect ECONNREFUSED
```

**Cause:** PostgreSQL not running or wrong config

**Solutions:**

**A. Check PostgreSQL is running:**
```bash
# Windows
services.msc
# Look for "postgresql-x64-14" (or your version)
# Should be "Running"
```

**B. Start PostgreSQL:**
```bash
# Windows
net start postgresql-x64-14
```

**C. Check backend/config.json:**
```json
{
  "database": {
    "host": "localhost",     ← PostgreSQL server
    "port": 5432,            ← Default PostgreSQL port
    "database": "warehouse", ← Database name
    "user": "postgres",      ← Username
    "password": "secret"     ← Password
  }
}
```

**D. Test PostgreSQL connection:**
```bash
psql -U postgres -d warehouse
```

**E. Check PostgreSQL logs:**
```bash
# Windows
C:\Program Files\PostgreSQL\14\data\pg_log\
```

---

### 5. ❌ Build Errors

**Error:**
```
Could not resolve entry module "electron/main-api.ts"
```

**Cause:** File not found or vite config wrong

**Solutions:**

**A. Check file exists:**
```bash
dir electron\main-api.ts
```

**B. Check vite.config.ts:**
Should have:
```typescript
electron([
  {
    entry: 'electron/main-api.ts',
    // ...
  }
])
```

**C. Clean node_modules:**
```bash
rd /s /q node_modules
rd /s /q package-lock.json
npm install
```

**D. Check TypeScript config:**
```bash
type electron\tsconfig.json
```

---

### 6. ❌ "CORS policy blocked"

**Error in DevTools:**
```
Access to fetch at 'http://...' has been blocked by CORS policy
```

**Cause:** Backend not configured for CORS

**Solution:**

Check `backend/server.js` has:
```javascript
const cors = require('cors')

app.use(cors({
  origin: '*',        // Allow all origins
  credentials: true
}))
```

---

### 7. ❌ Electron Window Crashes Immediately

**Symptom:** Window opens then closes instantly

**Diagnosis:**

**A. Check console output:**
Look for error messages when running `npm run dev`

**B. Check main.js errors:**
```bash
findstr "Error" dist-electron\main.js
```

**C. Run with error logging:**
```bash
npm run dev 2>&1 | tee error.log
```

**Solutions:**

1. **Check __dirname path issues:**
   ```typescript
   // In main-api.ts
   preload: path.join(__dirname, 'preload.cjs')
   ```

2. **Check process.cwd() returns correct path:**
   Add logging:
   ```typescript
   console.log('CWD:', process.cwd())
   console.log('__dirname:', __dirname)
   ```

3. **Check config.json is readable:**
   ```typescript
   console.log('Config exists:', fs.existsSync('config.json'))
   ```

---

### 8. ❌ "preload.cjs uses wrong version"

**Symptom:** Verification shows preload doesn't use fetch()

**Diagnosis:**
```bash
findstr "fetch" dist-electron\preload.cjs
```
If no matches → wrong file copied

**Solution:**

**A. Check vite.config.ts:**
```typescript
{
  name: 'copy-preload-api',
  buildStart() {
    copyFileSync('electron/preload-api.js', 'dist-electron/preload.cjs')
    //            ^^^^^^^^^^^^^^^^^^^       ^^^^^^^^^^^^^^^^^^^^^^^^^
    //            Source (API version)      Destination
  }
}
```

**B. Manually copy correct file:**
```bash
copy electron\preload-api.js dist-electron\preload.cjs /Y
```

**C. Verify copy worked:**
```bash
findstr "API-based preload" dist-electron\preload.cjs
```
Should show: "API-based preload script loaded"

---

## 🔍 Debugging Tools

### DevTools Console (F12)

**Check window.api:**
```javascript
console.log(window.api)
console.log(Object.keys(window.api))
```

**Test API call directly:**
```javascript
window.api.authenticateUser('admin', '1234')
  .then(r => console.log('Success:', r))
  .catch(e => console.error('Error:', e))
```

**Check fetch directly:**
```javascript
fetch('http://localhost:3001/api/health')
  .then(r => r.json())
  .then(d => console.log('Health:', d))
```

---

### Backend Debugging

**Add request logging:**
```javascript
// In server.js
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body)
  next()
})
```

**Check database queries:**
```javascript
// Before pool.query
console.log('SQL:', queryText, queryParams)
```

---

### Network Debugging

**Test with curl:**
```bash
# Health check
curl http://localhost:3001/api/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"1234"}'

# Get items
curl http://localhost:3001/api/items
```

**Test with Postman:**
1. Import API endpoints
2. Test each endpoint
3. Check responses

---

## 📊 Verification Checklist

Before asking for help, verify:

- [ ] `VERIFY-API-MODE.bat` shows all checks passed
- [ ] Backend server is running (check terminal)
- [ ] PostgreSQL is running (check services)
- [ ] `config.json` has correct server IP
- [ ] Port 3001 is open in firewall
- [ ] Can access `http://SERVER_IP:3001/api/health` from client
- [ ] DevTools console shows no errors
- [ ] Backend terminal shows no errors
- [ ] `window.api` is defined in console
- [ ] `window.api.authenticateUser` exists

---

## 🆘 Still Not Working?

### Collect Diagnostic Info:

1. **Run verification:**
   ```bash
   VERIFY-API-MODE.bat > verify.txt
   ```

2. **Check DevTools console:**
   - Press F12
   - Go to Console tab
   - Copy all errors

3. **Check backend logs:**
   - Copy terminal output

4. **Test API directly:**
   ```bash
   curl http://SERVER_IP:3001/api/health > health.txt
   ```

5. **Check file structure:**
   ```bash
   dir dist-electron
   ```

### Reset Everything:

```bash
# Stop all processes
taskkill /F /IM electron.exe /T
taskkill /F /IM node.exe /T

# Clean build
rd /s /q dist-electron
rd /s /q dist
rd /s /q node_modules

# Reinstall
npm install

# Rebuild
npm run dev
```

---

## 📞 Getting Help

When reporting an issue, provide:

1. ✅ Output of `VERIFY-API-MODE.bat`
2. ✅ DevTools console errors (F12)
3. ✅ Backend terminal output
4. ✅ What you were trying to do
5. ✅ What actually happened
6. ✅ Your `config.json` (hide sensitive data)

---

**Most issues are solved by:**
1. ✅ Running `VERIFY-API-MODE.bat`
2. ✅ Clean rebuild (`rd /s /q dist-electron` then `npm run dev`)
3. ✅ Checking backend is running
4. ✅ Verifying `config.json` has correct IP

Good luck! 🍀
