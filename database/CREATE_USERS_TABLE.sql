-- ==========================================
-- RBAC USERS TABLE CREATION SCRIPT
-- ==========================================
-- Run this SQL in Microsoft Access to create the Users table

CREATE TABLE Users (
    UserID AUTOINCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Role VARCHAR(20) NOT NULL,
    FullName VARCHAR(100),
    IsActive YESNO DEFAULT Yes,
    CreatedDate DATETIME DEFAULT Now()
);

-- ==========================================
-- INSERT DEFAULT USERS (DEMO DATA)
-- ==========================================
-- IMPORTANT: In production, passwords should be hashed!
-- These are plain text for demonstration only.

INSERT INTO Users (Username, Password, Role, FullName, IsActive) 
VALUES 
('admin', 'admin123', 'Admin', 'System Administrator', Yes),
('sales', 'sales123', 'Sales', 'Sales Agent', Yes),
('warehouse', 'warehouse123', 'Warehouse', 'Warehouse Manager', Yes);

-- ==========================================
-- USAGE INSTRUCTIONS
-- ==========================================
-- 1. Open Stores_DB.accdb in Microsoft Access
-- 2. Go to "Create" > "Query Design"
-- 3. Close the "Show Table" dialog
-- 4. Click "SQL View" button
-- 5. Paste this entire script
-- 6. Click "Run" (! icon)
-- 7. Close and save the query (optional)

-- ==========================================
-- DEFAULT CREDENTIALS
-- ==========================================
-- Admin User:
--   Username: admin
--   Password: admin123
--   Access: Full system control

-- Sales User:
--   Username: sales
--   Password: sales123
--   Access: Point of Sale & Sales history

-- Warehouse User:
--   Username: warehouse
--   Password: warehouse123
--   Access: Inventory & Stock receiving

-- ==========================================
-- SECURITY NOTE
-- ==========================================
-- In a production environment, you should:
-- 1. Use bcrypt or similar to hash passwords
-- 2. Implement password complexity requirements
-- 3. Add password reset functionality
-- 4. Log authentication attempts
-- 5. Implement session timeouts
-- 6. Use HTTPS for network database access
