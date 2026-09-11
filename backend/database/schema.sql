-- ==========================================
-- POSTGRESQL DATABASE SCHEMA
-- ==========================================
-- Complete schema migration from Microsoft Access to PostgreSQL
-- Run this script to create all tables

-- Drop existing tables if they exist (for clean install)
DROP TABLE IF EXISTS SaleDetails CASCADE;
DROP TABLE IF EXISTS PurchaseDetails CASCADE;
DROP TABLE IF EXISTS Sales CASCADE;
DROP TABLE IF EXISTS Purchases CASCADE;
DROP TABLE IF EXISTS Items CASCADE;
DROP TABLE IF EXISTS Customers CASCADE;
DROP TABLE IF EXISTS Suppliers CASCADE;
DROP TABLE IF EXISTS PaymentMethods CASCADE;
DROP TABLE IF EXISTS Roles CASCADE;
DROP TABLE IF EXISTS Users CASCADE;
DROP TABLE IF EXISTS Expenses CASCADE;

-- ==========================================
-- ROLES TABLE
-- ==========================================
CREATE TABLE Roles (
    RoleID SERIAL PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL UNIQUE,
    Description VARCHAR(255),
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO Roles (RoleName, Description) VALUES
('Admin', 'Full system access - can manage all modules'),
('Sales', 'Point of Sale and sales management'),
('Warehouse', 'Inventory and stock management');

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE Users (
    UserID SERIAL PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    RoleID INTEGER NOT NULL REFERENCES Roles(RoleID),
    FullName VARCHAR(100),
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default users (IMPORTANT: In production, hash these passwords!)
INSERT INTO Users (Username, Password, RoleID, FullName, IsActive) VALUES
('admin', 'admin123', 1, 'System Administrator', TRUE),
('sales', 'sales123', 2, 'Sales Agent', TRUE),
('warehouse', 'warehouse123', 3, 'Warehouse Manager', TRUE);

-- ==========================================
-- ITEMS TABLE
-- ==========================================
CREATE TABLE Items (
    ItemID SERIAL PRIMARY KEY,
    ItemCode VARCHAR(50) NOT NULL UNIQUE,
    ItemName VARCHAR(255) NOT NULL,
    Unit VARCHAR(20) DEFAULT 'PCS',
    MinStock NUMERIC(18, 3) DEFAULT 0,
    CurrentStock NUMERIC(18, 3) DEFAULT 0,
    SalePrice NUMERIC(18, 2) DEFAULT 0,
    CostPrice NUMERIC(18, 2) DEFAULT 0,
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster searches
CREATE INDEX idx_items_code ON Items(ItemCode);
CREATE INDEX idx_items_name ON Items(ItemName);
CREATE INDEX idx_items_stock ON Items(CurrentStock);

-- ==========================================
-- CUSTOMERS TABLE
-- ==========================================
CREATE TABLE Customers (
    CustomerID SERIAL PRIMARY KEY,
    CustomerCode VARCHAR(50) NOT NULL UNIQUE,
    CustomerName VARCHAR(255) NOT NULL,
    Phone VARCHAR(50),
    Mobile2 VARCHAR(50),
    Email VARCHAR(100),
    Address TEXT,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_code ON Customers(CustomerCode);
CREATE INDEX idx_customers_name ON Customers(CustomerName);

-- ==========================================
-- SUPPLIERS TABLE
-- ==========================================
CREATE TABLE Suppliers (
    SupplierID SERIAL PRIMARY KEY,
    SupplierCode VARCHAR(50) NOT NULL UNIQUE,
    SupplierName VARCHAR(255) NOT NULL,
    Phone VARCHAR(50),
    Email VARCHAR(100),
    Address TEXT,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suppliers_code ON Suppliers(SupplierCode);
CREATE INDEX idx_suppliers_name ON Suppliers(SupplierName);

-- ==========================================
-- PAYMENT METHODS TABLE
-- ==========================================
CREATE TABLE PaymentMethods (
    PaymentMethodID SERIAL PRIMARY KEY,
    MethodName VARCHAR(50) NOT NULL UNIQUE,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default payment methods
INSERT INTO PaymentMethods (MethodName, IsActive) VALUES
('Cash', TRUE),
('Credit', TRUE),
('Visa/Mastercard', TRUE),
('Bank Transfer', TRUE);

-- ==========================================
-- SALES TABLE
-- ==========================================
CREATE TABLE Sales (
    SaleID SERIAL PRIMARY KEY,
    SaleDate DATE NOT NULL DEFAULT CURRENT_DATE,
    CustomerID INTEGER REFERENCES Customers(CustomerID),
    PaymentMethodID INTEGER REFERENCES PaymentMethods(PaymentMethodID),
    TotalAmount NUMERIC(18, 2) DEFAULT 0,
    Discount NUMERIC(18, 2) DEFAULT 0,
    PaidAmount NUMERIC(18, 2) DEFAULT 0,
    RemainingAmount NUMERIC(18, 2) DEFAULT 0,
    Notes TEXT,
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_date ON Sales(SaleDate);
CREATE INDEX idx_sales_customer ON Sales(CustomerID);

-- ==========================================
-- SALE DETAILS TABLE
-- ==========================================
CREATE TABLE SaleDetails (
    SaleDetailID SERIAL PRIMARY KEY,
    SaleID INTEGER NOT NULL REFERENCES Sales(SaleID) ON DELETE CASCADE,
    ItemID INTEGER NOT NULL REFERENCES Items(ItemID),
    Quantity NUMERIC(18, 3) NOT NULL,
    UnitPrice NUMERIC(18, 2) NOT NULL,
    Discount NUMERIC(18, 2) DEFAULT 0,
    LineTotal NUMERIC(18, 2) NOT NULL
);

CREATE INDEX idx_saledetails_sale ON SaleDetails(SaleID);
CREATE INDEX idx_saledetails_item ON SaleDetails(ItemID);

-- ==========================================
-- PURCHASES TABLE
-- ==========================================
CREATE TABLE Purchases (
    PurchaseID SERIAL PRIMARY KEY,
    InvoiceNo VARCHAR(100),
    PurchaseDate DATE NOT NULL DEFAULT CURRENT_DATE,
    SupplierID INTEGER REFERENCES Suppliers(SupplierID),
    PaymentMethodID INTEGER REFERENCES PaymentMethods(PaymentMethodID),
    TotalAmount NUMERIC(18, 2) DEFAULT 0,
    PaidAmount NUMERIC(18, 2) DEFAULT 0,
    RemainingAmount NUMERIC(18, 2) DEFAULT 0,
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchases_date ON Purchases(PurchaseDate);
CREATE INDEX idx_purchases_supplier ON Purchases(SupplierID);
CREATE INDEX idx_purchases_invoice ON Purchases(InvoiceNo);

-- ==========================================
-- PURCHASE DETAILS TABLE
-- ==========================================
CREATE TABLE PurchaseDetails (
    PurchaseDetailID SERIAL PRIMARY KEY,
    PurchaseID INTEGER NOT NULL REFERENCES Purchases(PurchaseID) ON DELETE CASCADE,
    ItemID INTEGER NOT NULL REFERENCES Items(ItemID),
    Quantity NUMERIC(18, 3) NOT NULL,
    UnitCost NUMERIC(18, 2) NOT NULL,
    LineTotal NUMERIC(18, 2) NOT NULL
);

CREATE INDEX idx_purchasedetails_purchase ON PurchaseDetails(PurchaseID);
CREATE INDEX idx_purchasedetails_item ON PurchaseDetails(ItemID);

-- ==========================================
-- TRIGGERS FOR UPDATED_DATE
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.UpdatedDate = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_updated_date
BEFORE UPDATE ON Items
FOR EACH ROW
EXECUTE FUNCTION update_updated_date();

-- ==========================================
-- VIEWS FOR REPORTING
-- ==========================================

-- View: Sales with Customer Info
CREATE OR REPLACE VIEW v_sales_summary AS
SELECT 
    s.SaleID,
    s.SaleDate,
    c.CustomerName,
    c.Phone,
    pm.MethodName AS PaymentMethod,
    s.TotalAmount,
    s.Discount,
    s.PaidAmount,
    s.RemainingAmount,
    s.Notes
FROM Sales s
LEFT JOIN Customers c ON s.CustomerID = c.CustomerID
LEFT JOIN PaymentMethods pm ON s.PaymentMethodID = pm.PaymentMethodID;

-- View: Purchases with Supplier Info
CREATE OR REPLACE VIEW v_purchases_summary AS
SELECT 
    p.PurchaseID,
    p.InvoiceNo,
    p.PurchaseDate,
    s.SupplierName,
    s.Phone,
    pm.MethodName AS PaymentMethod,
    p.TotalAmount,
    p.PaidAmount,
    p.RemainingAmount
FROM Purchases p
LEFT JOIN Suppliers s ON p.SupplierID = s.SupplierID
LEFT JOIN PaymentMethods pm ON p.PaymentMethodID = pm.PaymentMethodID;

-- View: Low Stock Items
CREATE OR REPLACE VIEW v_low_stock_items AS
SELECT 
    ItemID,
    ItemCode,
    ItemName,
    Unit,
    CurrentStock,
    MinStock,
    (MinStock - CurrentStock) AS StockDeficit
FROM Items
WHERE CurrentStock < MinStock
ORDER BY (MinStock - CurrentStock) DESC;

-- ==========================================
-- EXPENSES TABLE
-- ==========================================
CREATE TABLE Expenses (
    ExpenseID SERIAL PRIMARY KEY,
    Description VARCHAR(255) NOT NULL,
    Amount NUMERIC(18, 2) NOT NULL,
    ExpenseDate DATE NOT NULL DEFAULT CURRENT_DATE,
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_date ON Expenses(ExpenseDate);

-- ==========================================
-- GRANT PERMISSIONS (adjust username as needed)
-- ==========================================
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO warehouse_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO warehouse_user;

-- ==========================================
-- SCHEMA CREATION COMPLETE
-- ==========================================

