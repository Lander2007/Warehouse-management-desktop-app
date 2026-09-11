# 🔐 Login Credentials

## Test Users Created ✅

### Admin User (Full Access)
```
Username: admin
Password: admin123
Role:     Admin
```

### Sales User
```
Username: sales  
Password: (check database or set via backend/create-test-user.js)
Role:     Sales
```

### Warehouse User
```
Username: warehouse
Password: (check database or set via backend/create-test-user.js)
Role:     Warehouse
```

---

## How to Login

1. Open the Electron app (should be running already)
2. Enter username: `admin`
3. Enter password: `admin123`
4. Click "Sign In"
5. You should see the Admin Dashboard! 🎉

---

## If Login Still Fails

### Check Backend Logs
Look at the terminal running `npm run server` to see the error message.

### Common Issues:

**"Invalid credentials"**
- Username or password is wrong
- Try: `admin` / `admin123`

**"CORS policy blocked"**
- Backend server not running
- Run: `npm run server`

**"Connection failed"**
- Backend not responding
- Check: `curl http://localhost:3001/api/health`

**"Database error"**
- PostgreSQL not running
- Check database connection in backend/config.json

---

## Create More Users

Run this script to create/update users:
```bash
node backend/create-test-user.js
```

Or manually via SQL:
```sql
-- Connect to database:
psql -U postgres -d warehouse_db

-- Create user:
INSERT INTO users (username, password, fullname, roleid, isactive)
VALUES ('newuser', 'password', 'New User', 1, TRUE);

-- Update password:
UPDATE users SET password = 'newpassword' WHERE username = 'admin';
```

---

## Security Note ⚠️

**Current Setup:**
- Passwords are stored in PLAIN TEXT
- This is OK for development/testing
- NOT suitable for production!

**For Production:**
- Use bcrypt to hash passwords
- Implement proper authentication (JWT tokens)
- Use HTTPS
- Add rate limiting

---

**Status:** ✅ Test users created  
**Ready to login:** YES  
**Username:** admin  
**Password:** admin123
