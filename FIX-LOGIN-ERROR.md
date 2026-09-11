# 🔧 Fix Login Error - "Spawn cscript.exe error"

## ⚠️ Problem
You're getting "Authentication Failed - Spawn C:\WINDOWS\System32\cscript.exe error" when trying to login.

## 🎯 Root Cause
The **Users table doesn't exist** in your database yet. The authentication system is trying to query a table that hasn't been created.

---

## ✅ Solution (2 Minutes)

### Step 1: Open Your Database
1. Navigate to: `c:\Abdullah System\`
2. Double-click `Stores_DB.accdb`
3. Microsoft Access will open

### Step 2: Create Query
1. Click the **"Create"** tab in the ribbon
2. Click **"Query Design"**
3. A "Show Table" dialog will appear - **Close it** (X button)
4. Click **"SQL View"** button in the ribbon (or right-click and select SQL View)

### Step 3: Run First SQL (Create Table)
Copy and paste this SQL:

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

Click the **Run button** (! icon) or press **F5**

You should see a message like "You are about to run a data-definition query..."
- Click **Yes**

### Step 4: Run Second SQL (Insert Users)
Clear the SQL window and paste this:

```sql
INSERT INTO Users (Username, Password, Role, FullName, IsActive) 
VALUES 
('admin', 'admin123', 'Admin', 'System Administrator', Yes),
('sales', 'sales123', 'Sales', 'Sales Agent', Yes),
('warehouse', 'warehouse123', 'Warehouse', 'Warehouse Manager', Yes);
```

Click the **Run button** (!) or press **F5**

You should see a message "You are about to append 3 row(s)..."
- Click **Yes**

### Step 5: Verify
1. Look in the left sidebar under **"Tables"**
2. You should now see a table called **"Users"**
3. Double-click it to open
4. Verify you see 3 users: admin, sales, warehouse

### Step 6: Close Access
1. Close the query window (don't need to save)
2. Close Microsoft Access
3. **Important:** Make sure Access is fully closed before running your app

---

## 🧪 Test Again

1. **Stop your application** if it's running
2. **Restart it:**
   ```bash
   npm run dev
   ```
3. **Try logging in** with:
   - Username: `admin`
   - Password: `admin123`

**It should work now!** ✅

---

## 🔍 Troubleshooting

### Still Getting Error?

#### Check 1: Verify Table Exists
1. Open `Stores_DB.accdb` in Access
2. Look for "Users" in the Tables list
3. Open it and verify 3 users exist

#### Check 2: Check Console Logs
1. When the error appears, press **F12** to open Developer Tools
2. Look at the **Console** tab
3. You should see detailed error messages
4. Share those messages if problem persists

#### Check 3: Database Path
1. Check the console logs for "Database path:"
2. It should show: `C:\Abdullah System\Stores_DB.accdb`
3. Verify that file exists at that location

#### Check 4: Database Not Locked
1. Make sure Access is **completely closed**
2. Look for `.laccdb` file next to your database
3. If it exists, delete it:
   ```bash
   Remove-Item "C:\Abdullah System\Stores_DB.laccdb" -Force
   ```

---

## 📝 Alternative: Use the SQL Script File

I've already created the SQL script for you:

1. Open: `c:\Abdullah System\database\CREATE_USERS_TABLE.sql`
2. Copy ALL the contents
3. Follow Steps 1-2 above (open Access, create query, SQL view)
4. Paste the entire contents
5. Click Run

This will create the table AND insert the users in one step!

---

## ✅ Expected Result

After fixing, when you login:
- **Admin** → Full dashboard with all navigation
- **Sales** → Sales terminal interface
- **Warehouse** → Warehouse control interface

Each role should see a different interface with different colors!

---

## 🆘 Still Not Working?

If you've followed all steps and it still doesn't work:

1. **Check the Electron console output:**
   - Look at the terminal where you ran `npm run dev`
   - You'll see detailed error messages there

2. **Common issues:**
   - Access Database Engine not installed (64-bit)
   - Database file corrupted
   - Wrong permissions on database file
   - Database open in Access while running app

3. **Quick test:**
   Try logging in and check the terminal output. It will show:
   ```
   🔐 Authentication attempt for user: admin
   📊 SQL Query: SELECT UserID, Username, Role, FullName FROM Users WHERE...
   📋 Query result: [...]
   ```

   If you don't see query results, that confirms the Users table issue.

---

## 📚 Related Documentation

- Full setup guide: `START-HERE.md`
- Complete RBAC guide: `RBAC-SETUP-GUIDE.md`
- Troubleshooting: `QUICK-REFERENCE.md`

---

**After creating the Users table, your login should work perfectly!** 🎉
