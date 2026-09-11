# 🚀 Quick Reference Card - RBAC System

## 🔑 Default Credentials

```
┌─────────────┬──────────────┬──────────────┐
│ Username    │ Password     │ Role         │
├─────────────┼──────────────┼──────────────┤
│ admin       │ admin123     │ Admin        │
│ sales       │ sales123     │ Sales        │
│ warehouse   │ warehouse123 │ Warehouse    │
└─────────────┴──────────────┴──────────────┘
```

## 📂 Database Paths

### Local (Single PC)
```json
{
  "dbPath": "C:\\App\\Stores_DB.accdb"
}
```

### Network (Multi-PC)
```json
{
  "dbPath": "\\\\Admin-PC\\SharedFolder\\Stores_DB.accdb"
}
```

### Config File Location
```
C:\Users\<Username>\AppData\Roaming\warehouse-desktop-app\config.json
```

## 👥 Role Permissions Matrix

```
┌──────────────────┬───────┬───────┬───────────┐
│ Feature          │ Admin │ Sales │ Warehouse │
├──────────────────┼───────┼───────┼───────────┤
│ Dashboard        │   ✅   │   ❌   │     ❌     │
│ Inventory CRUD   │   ✅   │   ❌   │     ✅     │
│ Create Sales     │   ✅   │   ✅   │     ❌     │
│ View Sales       │   ✅   │   ✅   │     ❌     │
│ Purchases        │   ✅   │   ❌   │     ✅     │
│ Customers CRUD   │   ✅   │   👁️   │     ❌     │
│ Suppliers CRUD   │   ✅   │   ❌   │     ❌     │
│ Reports          │   ✅   │   ❌   │     ❌     │
│ Settings         │   ✅   │   ❌   │     ❌     │
└──────────────────┴───────┴───────┴───────────┘

Legend: ✅ Full Access | 👁️ Read Only | ❌ No Access
```

## 🛠️ Common Commands

### Development
```bash
npm install              # Install dependencies
npm run dev              # Start dev server
npm run build            # Build for production
npm run package:win      # Create installer
```

### Database Setup
```sql
-- Create Users table
CREATE TABLE Users (
    UserID AUTOINCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Role VARCHAR(20) NOT NULL,
    FullName VARCHAR(100),
    IsActive YESNO DEFAULT Yes,
    CreatedDate DATETIME DEFAULT Now()
);

-- Insert default users
INSERT INTO Users (Username, Password, Role, FullName) 
VALUES 
('admin', 'admin123', 'Admin', 'System Administrator'),
('sales', 'sales123', 'Sales', 'Sales Agent'),
('warehouse', 'warehouse123', 'Warehouse', 'Warehouse Manager');
```

### Network Setup
```powershell
# Share folder
New-SmbShare -Name "WarehouseDB" -Path "C:\WarehouseDB" -FullAccess "Everyone"

# Enable file sharing firewall rule
netsh advfirewall firewall set rule group="File and Printer Sharing" new enable=Yes

# Get computer name
hostname

# Test network access
dir \\ComputerName\WarehouseDB
```

## 🎨 UI Color Codes

```
┌──────────────┬──────────┬──────────────┐
│ Role         │ Primary  │ Accent       │
├──────────────┼──────────┼──────────────┤
│ Admin        │ #6366F1  │ #3B82F6      │
│ Sales        │ #10B981  │ #34D399      │
│ Warehouse    │ #F97316  │ #FB923C      │
├──────────────┼──────────┼──────────────┤
│ Background   │ #0B0F19  │ -            │
│ Success      │ #10B981  │ ✅            │
│ Warning      │ #F59E0B  │ ⚠️            │
│ Error        │ #EF4444  │ ❌            │
└──────────────┴──────────┴──────────────┘
```

## 🗂️ File Structure

```
c:\Abdullah System\
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx          # Auth state
│   ├── components/
│   │   ├── Login.tsx                # Login UI
│   │   ├── ProtectedRoute.tsx       # Route guard
│   │   ├── AdminView.tsx            # Admin dashboard
│   │   ├── SalesView.tsx            # Sales terminal
│   │   ├── WarehouseView.tsx        # Warehouse control
│   │   └── DatabaseSettings.tsx     # Config UI
│   └── App.tsx                      # Router setup
├── electron/
│   ├── main.ts                      # Backend logic
│   └── preload.js                   # IPC bridge
├── database/
│   └── CREATE_USERS_TABLE.sql       # Setup script
├── RBAC-SETUP-GUIDE.md              # Full guide
├── IMPLEMENTATION-COMPLETE.md       # Implementation docs
├── VISUAL-DEMO-GUIDE.md             # UI walkthrough
├── DEPLOYMENT-CHECKLIST.md          # Deploy steps
└── QUICK-REFERENCE.md               # This file
```

## 🔧 Troubleshooting Quick Fixes

### Cannot Login
```bash
# Check Users table
SELECT * FROM Users WHERE IsActive = Yes;

# Verify credentials (case-sensitive)
# Clear session storage in browser console
sessionStorage.clear()
```

### Network Path Error
```powershell
# Test connectivity
ping Admin-PC

# Test share access
dir \\Admin-PC\WarehouseDB

# Use IP instead of hostname
dir \\192.168.1.100\WarehouseDB
```

### Database Locked
```bash
# Close Access if open
# Delete lock file
Remove-Item "Stores_DB.laccdb" -Force

# Restart application
```

### Access Denied Screen
```
# Verify role in database
SELECT Username, Role FROM Users WHERE Username = 'youruser';

# Logout and login again
# Check route matches role permissions
```

## 📞 Support Contacts

```
┌──────────────────┬─────────────────────┐
│ Issue Type       │ Contact             │
├──────────────────┼─────────────────────┤
│ Technical        │ IT Department       │
│ User Account     │ System Admin        │
│ Database         │ DBA Team            │
│ Network          │ Network Admin       │
│ Training         │ Training Team       │
└──────────────────┴─────────────────────┘
```

## 🔐 Security Reminders

```
⚠️  BEFORE PRODUCTION:

1. Change all default passwords
2. Implement password hashing
3. Set session timeouts
4. Enable audit logging
5. Configure automated backups
6. Review network security
7. Update firewall rules
8. Test disaster recovery
```

## 📱 Mobile Access (Future)

```
Coming Soon:
- Mobile app for inventory checks
- Barcode scanning
- Push notifications for alerts
- Real-time sync
```

## 🆘 Emergency Procedures

### System Down
1. Check network connectivity
2. Verify database accessible
3. Check firewall rules
4. Restart application
5. Contact IT if persists

### Data Loss Risk
1. Stop all operations immediately
2. Do NOT close database
3. Contact system admin
4. Use backup if available
5. Document incident

### Security Breach
1. Change all passwords immediately
2. Review audit logs
3. Disable compromised accounts
4. Notify security team
5. Investigate and document

## 📊 Performance Benchmarks

```
Target Performance:
- App startup: < 5 seconds
- Login: < 2 seconds
- Query response: < 1 second
- Network latency: < 100ms
- Database operations: < 500ms
```

## 🎯 System Requirements

### Minimum
- Windows 10 64-bit
- 4GB RAM
- 500MB disk space
- Access Database Engine 2016 (64-bit)
- Node.js 18+

### Recommended
- Windows 11 64-bit
- 8GB+ RAM
- 1GB disk space
- SSD storage
- Gigabit network (multi-PC)

## 📅 Maintenance Schedule

```
Daily:    Check logs, verify backups
Weekly:   Full database backup
Monthly:  Security audit, user review
Quarterly: Update passwords, system update
Yearly:   Major version upgrade
```

## 🔄 Version History

```
v2.0.0 - RBAC Implementation
  • Role-based access control
  • Network database support
  • Three user roles
  • Premium UI redesign
  • Config management

v1.0.0 - Initial Release
  • Basic inventory management
  • Local database only
  • Single user mode
```

## 📖 Documentation Links

- **Setup Guide**: `RBAC-SETUP-GUIDE.md`
- **Implementation**: `IMPLEMENTATION-COMPLETE.md`
- **Visual Guide**: `VISUAL-DEMO-GUIDE.md`
- **Deployment**: `DEPLOYMENT-CHECKLIST.md`
- **This Reference**: `QUICK-REFERENCE.md`

---

**Print this page and keep it near your workstation for quick access!** 📄

**Version:** 2.0.0  
**Last Updated:** June 2026  
**Support:** See documentation files
