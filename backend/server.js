/**
 * WAREHOUSE MANAGEMENT SYSTEM - REST API SERVER
 * 
 * Express.js server that provides REST API endpoints for the warehouse
 * management Electron app. Connects to PostgreSQL database.
 * 
 * Default port: 3001
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
const { Pool, types } = require('pg');
const XLSX = require('xlsx');
// Configure pg to automatically parse NUMERIC (OID 1700) as floats
types.setTypeParser(1700, val => parseFloat(val));
const fs = require('fs');
const path = require('path');

// Load configuration
const configPath = path.join(__dirname, 'config.json');
let config;

try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('❌ Failed to load config.json');
  console.error('Please create config.json with database settings');
  process.exit(1);
}

// Create Express app
const app = express();
const PORT = config.server.port || 3001;
const HOST = config.server.host || '0.0.0.0';

// Create PostgreSQL connection pool
const pool = new Pool(config.database);

// Test database connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Please check your PostgreSQL configuration');
  } else {
    console.log('✅ Database connected successfully');
    console.log(`   Server time: ${res.rows[0].now}`);
  }
});

// ==========================================
// MIDDLEWARE
// ==========================================

// Security headers
app.use(helmet());

// CORS - allow all origins in development (adjust in production)
if (config.cors.enabled) {
  const corsOptions = {
    origin: '*', // Allow all origins (config.cors.origins has ["*"])
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false // Must be false when origin is '*'
  };
  
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions)); // Handle preflight requests
}

// Compression
app.use(compression());

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(morgan('combined'));

// Disable caching for all API responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Send success response
function sendSuccess(res, data, message = 'Success') {
  res.json({
    success: true,
    message,
    data
  });
}

// Send error response
function sendError(res, error, statusCode = 500) {
  console.error('API Error:', error);
  res.status(statusCode).json({
    success: false,
    error: error.message || 'Internal server error'
  });
}

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Warehouse API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ==========================================
// AUTHENTICATION
// ==========================================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return sendError(res, new Error('Username and password are required'), 400);
    }

    const result = await pool.query(
      `SELECT u.UserID, u.Username, u.FullName, u.IsActive, r.RoleName AS Role
       FROM Users u
       LEFT JOIN Roles r ON u.RoleID = r.RoleID
       WHERE u.Username = $1 AND u.Password = $2 AND u.IsActive = TRUE`,
      [username, password]
    );

    if (result.rows.length === 0) {
      return sendError(res, new Error('Invalid credentials'), 401);
    }

    const user = result.rows[0];
    sendSuccess(res, {
      user: {
        UserID: user.userid,
        Username: user.username,
        Role: user.role || 'Sales',
        FullName: user.fullname || user.username
      }
    }, 'Login successful');

  } catch (error) {
    sendError(res, error);
  }
});

// ==========================================
// STATS (Dashboard)
// ==========================================

app.get('/api/stats', async (req, res) => {
  try {
    // Get all stats in parallel for performance
    const [itemsCount, customersCount, suppliersCount, salesCount, todayRevenue, lowStock, recentSales, totalExpenses] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM Items'),
      pool.query('SELECT COUNT(*) FROM Customers WHERE IsActive = TRUE'),
      pool.query('SELECT COUNT(*) FROM Suppliers WHERE IsActive = TRUE'),
      pool.query('SELECT COUNT(*) FROM Sales'),
      pool.query(`SELECT COALESCE(SUM(TotalAmount), 0) AS revenue FROM Sales WHERE SaleDate = CURRENT_DATE`),
      pool.query('SELECT ItemCode, ItemName, CurrentStock, MinStock FROM Items WHERE CurrentStock < MinStock ORDER BY ItemCode LIMIT 20'),
      pool.query(`
        SELECT s.SaleID, s.SaleDate, c.CustomerName, s.TotalAmount, s.PaidAmount, s.RemainingAmount
        FROM Sales s
        LEFT JOIN Customers c ON s.CustomerID = c.CustomerID
        ORDER BY s.SaleID DESC
        LIMIT 5
      `),
      pool.query('SELECT COALESCE(SUM(Amount), 0) AS total FROM Expenses')
    ]);

    sendSuccess(res, {
      totalItems: parseInt(itemsCount.rows[0].count),
      totalCustomers: parseInt(customersCount.rows[0].count),
      totalSuppliers: parseInt(suppliersCount.rows[0].count),
      totalSales: parseInt(salesCount.rows[0].count),
      todayRevenue: parseFloat(todayRevenue.rows[0].revenue),
      lowStock: lowStock.rows,
      recentSales: recentSales.rows,
      totalExpenses: parseFloat(totalExpenses.rows[0].total)
    });

  } catch (error) {
    sendError(res, error);
  }
});

// ==========================================
// ITEMS CRUD
// ==========================================

// Get all items (with optional search)
app.get('/api/items', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM Items';
    let params = [];

    if (search) {
      query += ' WHERE ItemCode ILIKE $1 OR ItemName ILIKE $1';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY ItemCode LIMIT 1000';

    const result = await pool.query(query, params);
    sendSuccess(res, result.rows);

  } catch (error) {
    sendError(res, error);
  }
});

// Get low stock items
app.get('/api/items/low-stock', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Items WHERE CurrentStock < MinStock ORDER BY ItemCode');
    sendSuccess(res, result.rows);
  } catch (error) {
    sendError(res, error);
  }
});

// Get single item
app.get('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM Items WHERE ItemID = $1', [id]);

    if (result.rows.length === 0) {
      return sendError(res, new Error('Item not found'), 404);
    }

    sendSuccess(res, result.rows[0]);

  } catch (error) {
    sendError(res, error);
  }
});

// Create item
app.post('/api/items', async (req, res) => {
  try {
    const { ItemCode, ItemName, Unit, MinStock, CurrentStock, SalePrice, CostPrice } = req.body;

    const result = await pool.query(
      `INSERT INTO Items (ItemCode, ItemName, Unit, MinStock, CurrentStock, SalePrice, CostPrice)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [ItemCode, ItemName, Unit || 'PCS', MinStock || 0, CurrentStock || 0, SalePrice || 0, CostPrice || 0]
    );

    sendSuccess(res, result.rows[0], 'Item created successfully');

  } catch (error) {
    if (error.code === '23505') { // Unique violation
      sendError(res, new Error('Item code already exists'), 409);
    } else {
      sendError(res, error);
    }
  }
});

// Update item
app.put('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ItemCode, ItemName, Unit, MinStock, CurrentStock, SalePrice, CostPrice } = req.body;

    const result = await pool.query(
      `UPDATE Items 
       SET ItemCode = $1, ItemName = $2, Unit = $3, MinStock = $4, 
           CurrentStock = $5, SalePrice = $6, CostPrice = $7
       WHERE ItemID = $8
       RETURNING *`,
      [ItemCode, ItemName, Unit, MinStock, CurrentStock, SalePrice, CostPrice, id]
    );

    if (result.rows.length === 0) {
      return sendError(res, new Error('Item not found'), 404);
    }

    sendSuccess(res, result.rows[0], 'Item updated successfully');

  } catch (error) {
    sendError(res, error);
  }
});

// Delete item
app.delete('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM Items WHERE ItemID = $1 RETURNING ItemID', [id]);

    if (result.rows.length === 0) {
      return sendError(res, new Error('Item not found'), 404);
    }

    sendSuccess(res, null, 'Item deleted successfully');

  } catch (error) {
    sendError(res, error);
  }
});

// ==========================================
// STOCK AUDIT & RECONCILIATION
// ==========================================

// Run stock audit (Compare Excel vs DB)
app.get('/api/inventory/audit', async (req, res) => {
  try {
    const excelFilePath = path.join(__dirname, '../مخازن شهر يونيو_٠٨٥٤٢٦.xlsx');
    
    if (!fs.existsSync(excelFilePath)) {
      return sendError(res, new Error('Audit Excel file not found. Please ensure the file exists in the root directory.'), 404);
    }

    const workbook = XLSX.readFile(excelFilePath);
    const sheet = workbook.Sheets['اكواد الاصناف'];
    if (!sheet) {
      return sendError(res, new Error('Sheet "اكواد الاصناف" not found in Excel file.'), 400);
    }

    const excelData = XLSX.utils.sheet_to_json(sheet);
    
    // Get actual stock levels from the 'رصيد المخازن' sheet
    const stockSheet = workbook.Sheets['رصيد المخازن'];
    const excelStockMap = new Map();
    if (stockSheet) {
      // Skip 2 header rows as per migration logic
      const stockRows = XLSX.utils.sheet_to_json(stockSheet, { header: 1 }).slice(2);
      stockRows.forEach(row => {
        const code = String(row[0] || '').trim();
        if (code) {
          excelStockMap.set(code, parseFloat(row[5] || 0));
        }
      });
    }

    const dbData = await pool.query('SELECT ItemID, ItemCode, ItemName, CurrentStock FROM Items');
    const dbMap = new Map(dbData.rows.map(r => [String(r.itemcode).trim(), r]));

    const mismatches = [];
    const missingInDb = [];

    excelData.forEach(row => {
      const code = String(row['كود الصنف'] || row['ItemCode'] || '').trim();
      if (!code) return;

      const dbItem = dbMap.get(code);
      const excelStock = excelStockMap.has(code) ? excelStockMap.get(code) : 0;

      if (!dbItem) {
        missingInDb.push({
          code,
          name: row['اسم الصنف'] || row['ItemName'] || 'Unknown',
          excelStock
        });
      } else {
        const dbStock = parseFloat(dbItem.currentstock);
        if (Math.abs(excelStock - dbStock) > 0.001) {
          mismatches.push({
            itemID: dbItem.itemid,
            code,
            name: dbItem.itemname,
            dbStock,
            excelStock,
            difference: excelStock - dbStock
          });
        }
      }
    });

    sendSuccess(res, {
      mismatches,
      missingInDb,
      totalExcelItems: excelData.length,
      totalDbItems: dbData.rows.length
    });

  } catch (error) {
    sendError(res, error);
  }
});

// Reconcile stock (Update DB to match Excel)
app.post('/api/inventory/reconcile', async (req, res) => {
  const client = await pool.connect();
  try {
    const { items } = req.body; // Array of { itemID, excelStock }

    if (!items || !Array.isArray(items)) {
      return sendError(res, new Error('Invalid request data. Expected array of items.'), 400);
    }

    await client.query('BEGIN');

    for (const item of items) {
      await client.query(
        'UPDATE Items SET CurrentStock = $1, UpdatedDate = CURRENT_TIMESTAMP WHERE ItemID = $2',
        [item.excelStock, item.itemID]
      );
    }

    await client.query('COMMIT');
    sendSuccess(res, null, `Successfully reconciled ${items.length} items.`);

  } catch (error) {
    await client.query('ROLLBACK');
    sendError(res, error);
  } finally {
    client.release();
  }
});

// ==========================================
// CUSTOMERS CRUD
// ==========================================

app.get('/api/customers', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM Customers';
    let params = [];

    if (search) {
      query += ' WHERE CustomerCode ILIKE $1 OR CustomerName ILIKE $1 OR Phone ILIKE $1';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY CustomerName LIMIT 1000';

    const result = await pool.query(query, params);
    sendSuccess(res, result.rows);

  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { CustomerCode, CustomerName, Phone, Mobile2, Email, Address, IsActive } = req.body;

    const result = await pool.query(
      `INSERT INTO Customers (CustomerCode, CustomerName, Phone, Mobile2, Email, Address, IsActive)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [CustomerCode, CustomerName, Phone || '', Mobile2 || '', Email || '', Address || '', IsActive !== false]
    );

    sendSuccess(res, result.rows[0], 'Customer created successfully');

  } catch (error) {
    if (error.code === '23505') {
      sendError(res, new Error('Customer code already exists'), 409);
    } else {
      sendError(res, error);
    }
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { CustomerCode, CustomerName, Phone, Mobile2, Email, Address, IsActive } = req.body;

    const result = await pool.query(
      `UPDATE Customers 
       SET CustomerCode = $1, CustomerName = $2, Phone = $3, Mobile2 = $4, 
           Email = $5, Address = $6, IsActive = $7
       WHERE CustomerID = $8
       RETURNING *`,
      [CustomerCode, CustomerName, Phone, Mobile2, Email, Address, IsActive, id]
    );

    if (result.rows.length === 0) {
      return sendError(res, new Error('Customer not found'), 404);
    }

    sendSuccess(res, result.rows[0], 'Customer updated successfully');

  } catch (error) {
    sendError(res, error);
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM Customers WHERE CustomerID = $1 RETURNING CustomerID', [id]);

    if (result.rows.length === 0) {
      return sendError(res, new Error('Customer not found'), 404);
    }

    sendSuccess(res, null, 'Customer deleted successfully');

  } catch (error) {
    sendError(res, error);
  }
});

// ==========================================
// SUPPLIERS CRUD
// ==========================================

app.get('/api/suppliers', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM Suppliers';
    let params = [];

    if (search) {
      query += ' WHERE SupplierCode ILIKE $1 OR SupplierName ILIKE $1 OR Phone ILIKE $1';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY SupplierName LIMIT 1000';

    const result = await pool.query(query, params);
    sendSuccess(res, result.rows);

  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const { SupplierCode, SupplierName, Phone, Email, Address, IsActive } = req.body;

    const result = await pool.query(
      `INSERT INTO Suppliers (SupplierCode, SupplierName, Phone, Email, Address, IsActive)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [SupplierCode, SupplierName, Phone || '', Email || '', Address || '', IsActive !== false]
    );

    sendSuccess(res, result.rows[0], 'Supplier created successfully');

  } catch (error) {
    if (error.code === '23505') {
      sendError(res, new Error('Supplier code already exists'), 409);
    } else {
      sendError(res, error);
    }
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { SupplierCode, SupplierName, Phone, Email, Address, IsActive } = req.body;

    const result = await pool.query(
      `UPDATE Suppliers 
       SET SupplierCode = $1, SupplierName = $2, Phone = $3, Email = $4, 
           Address = $5, IsActive = $6
       WHERE SupplierID = $7
       RETURNING *`,
      [SupplierCode, SupplierName, Phone, Email, Address, IsActive, id]
    );

    if (result.rows.length === 0) {
      return sendError(res, new Error('Supplier not found'), 404);
    }

    sendSuccess(res, result.rows[0], 'Supplier updated successfully');

  } catch (error) {
    sendError(res, error);
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM Suppliers WHERE SupplierID = $1 RETURNING SupplierID', [id]);

    if (result.rows.length === 0) {
      return sendError(res, new Error('Supplier not found'), 404);
    }

    sendSuccess(res, null, 'Supplier deleted successfully');

  } catch (error) {
    sendError(res, error);
  }
});

// ==========================================
// SALES
// ==========================================

app.get('/api/sales', async (req, res) => {
  try {
    const { limit = 200 } = req.query;

    const result = await pool.query(
      `SELECT s.SaleID, s.SaleDate, c.CustomerName, s.TotalAmount, s.Discount, 
              s.PaidAmount, s.RemainingAmount, s.Notes
       FROM Sales s
       LEFT JOIN Customers c ON s.CustomerID = c.CustomerID
       ORDER BY s.SaleID DESC
       LIMIT $1`,
      [parseInt(limit)]
    );

    sendSuccess(res, result.rows);

  } catch (error) {
    sendError(res, error);
  }
});

// Get sale details (explicit endpoint)
app.get('/api/sales/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT sd.*, i.ItemCode, i.ItemName
       FROM SaleDetails sd
       JOIN Items i ON sd.ItemID = i.ItemID
       WHERE sd.SaleID = $1`,
      [id]
    );
    sendSuccess(res, result.rows);
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/sales/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get sale header
    const saleResult = await pool.query(
      `SELECT s.*, c.CustomerName, pm.MethodName AS PaymentMethod
       FROM Sales s
       LEFT JOIN Customers c ON s.CustomerID = c.CustomerID
       LEFT JOIN PaymentMethods pm ON s.PaymentMethodID = pm.PaymentMethodID
       WHERE s.SaleID = $1`,
      [id]
    );

    if (saleResult.rows.length === 0) {
      return sendError(res, new Error('Sale not found'), 404);
    }

    // Get sale details
    const detailsResult = await pool.query(
      `SELECT sd.*, i.ItemCode, i.ItemName
       FROM SaleDetails sd
       JOIN Items i ON sd.ItemID = i.ItemID
       WHERE sd.SaleID = $1`,
      [id]
    );

    sendSuccess(res, {
      ...saleResult.rows[0],
      details: detailsResult.rows
    });

  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/sales', async (req, res) => {
  const client = await pool.connect();

  try {
    const { customerID, paymentMethodID, totalAmount, discount, paidAmount, remainingAmount, notes, items } = req.body;

    await client.query('BEGIN');

    // Insert sale
    const saleResult = await client.query(
      `INSERT INTO Sales (SaleDate, CustomerID, PaymentMethodID, TotalAmount, Discount, PaidAmount, RemainingAmount, Notes)
       VALUES (CURRENT_DATE, $1, $2, $3, $4, $5, $6, $7)
       RETURNING SaleID`,
      [customerID, paymentMethodID, totalAmount, discount || 0, paidAmount, remainingAmount, notes || '']
    );

    const saleID = saleResult.rows[0].saleid;

    // Insert sale details and update stock
    for (const item of items) {
      await client.query(
        `INSERT INTO SaleDetails (SaleID, ItemID, Quantity, UnitPrice, Discount, LineTotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [saleID, item.itemID, item.quantity, item.unitPrice, item.discount || 0, item.lineTotal]
      );

      await client.query(
        'UPDATE Items SET CurrentStock = CurrentStock - $1 WHERE ItemID = $2',
        [item.quantity, item.itemID]
      );
    }

    await client.query('COMMIT');
    sendSuccess(res, { saleID }, 'Sale completed successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    sendError(res, error);
  } finally {
    client.release();
  }
});

// ==========================================
// PURCHASES
// ==========================================

app.get('/api/purchases', async (req, res) => {
  try {
    const { limit = 200 } = req.query;

    const result = await pool.query(
      `SELECT p.PurchaseID, p.InvoiceNo, p.PurchaseDate, s.SupplierName, 
              p.TotalAmount, p.PaidAmount, p.RemainingAmount
       FROM Purchases p
       LEFT JOIN Suppliers s ON p.SupplierID = s.SupplierID
       ORDER BY p.PurchaseID DESC
       LIMIT $1`,
      [parseInt(limit)]
    );

    sendSuccess(res, result.rows);

  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/purchases', async (req, res) => {
  const client = await pool.connect();

  try {
    const { invoiceNo, supplierID, paymentMethodID, totalAmount, paidAmount, remainingAmount, items } = req.body;

    await client.query('BEGIN');

    // Insert purchase
    const purchaseResult = await client.query(
      `INSERT INTO Purchases (InvoiceNo, PurchaseDate, SupplierID, PaymentMethodID, TotalAmount, PaidAmount, RemainingAmount)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6)
       RETURNING PurchaseID`,
      [invoiceNo, supplierID, paymentMethodID, totalAmount, paidAmount, remainingAmount]
    );

    const purchaseID = purchaseResult.rows[0].purchaseid;

    // Insert purchase details and update stock + cost
    for (const item of items) {
      await client.query(
        `INSERT INTO PurchaseDetails (PurchaseID, ItemID, Quantity, UnitCost, LineTotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [purchaseID, item.itemID, item.quantity, item.unitCost, item.lineTotal]
      );

      await client.query(
        'UPDATE Items SET CurrentStock = CurrentStock + $1, CostPrice = $2 WHERE ItemID = $3',
        [item.quantity, item.unitCost, item.itemID]
      );
    }

    await client.query('COMMIT');
    sendSuccess(res, { purchaseID }, 'Purchase completed successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    sendError(res, error);
  } finally {
    client.release();
  }
});

// ==========================================
// PAYMENT METHODS
// ==========================================

app.get('/api/payment-methods', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM PaymentMethods WHERE IsActive = TRUE ORDER BY PaymentMethodID');
    sendSuccess(res, result.rows);
  } catch (error) {
    sendError(res, error);
  }
});

// ==========================================
// REPORTS
// ==========================================

app.get('/api/reports/sales', async (req, res) => {
  try {
    const { from, to } = req.query;

    let query = `
      SELECT s.SaleID, s.SaleDate, c.CustomerName, s.TotalAmount, s.PaidAmount, s.RemainingAmount
      FROM Sales s
      LEFT JOIN Customers c ON s.CustomerID = c.CustomerID
      WHERE 1=1
    `;
    const params = [];

    if (from) {
      params.push(from);
      query += ` AND s.SaleDate >= $${params.length}`;
    }

    if (to) {
      params.push(to);
      query += ` AND s.SaleDate <= $${params.length}`;
    }

    query += ' ORDER BY s.SaleDate DESC';

    const result = await pool.query(query, params);
    sendSuccess(res, result.rows);

  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/reports/stock', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ItemCode, ItemName, Unit, CurrentStock, MinStock, SalePrice, CostPrice,
             (CurrentStock * CostPrice) AS StockValue
      FROM Items
      ORDER BY ItemCode
    `);
    sendSuccess(res, result.rows);
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/reports/debts', async (req, res) => {
  try {
    // Customer debts
    const customerDebts = await pool.query(`
      SELECT c.CustomerID, c.CustomerName, c.Phone, 
             COALESCE(SUM(s.RemainingAmount), 0) AS TotalDebt
      FROM Customers c
      LEFT JOIN Sales s ON c.CustomerID = s.CustomerID
      WHERE s.RemainingAmount > 0
      GROUP BY c.CustomerID, c.CustomerName, c.Phone
      ORDER BY TotalDebt DESC
    `);

    // Supplier debts
    const supplierDebts = await pool.query(`
      SELECT s.SupplierID, s.SupplierName, s.Phone, 
             COALESCE(SUM(p.RemainingAmount), 0) AS TotalDebt
      FROM Suppliers s
      LEFT JOIN Purchases p ON s.SupplierID = p.SupplierID
      WHERE p.RemainingAmount > 0
      GROUP BY s.SupplierID, s.SupplierName, s.Phone
      ORDER BY TotalDebt DESC
    `);

    sendSuccess(res, {
      customerDebts: customerDebts.rows,
      supplierDebts: supplierDebts.rows
    });

  } catch (error) {
    sendError(res, error);
  }
});

// ==========================================
// EXPENSES CRUD
// ==========================================

app.get('/api/expenses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Expenses ORDER BY ExpenseDate DESC, ExpenseID DESC LIMIT 1000');
    sendSuccess(res, result.rows);
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { description, amount, date } = req.body;
    if (!description || amount === undefined) {
      return sendError(res, new Error('Description and amount are required'), 400);
    }
    const expenseDate = date ? new Date(date) : new Date();
    const result = await pool.query(
      `INSERT INTO Expenses (Description, Amount, ExpenseDate)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [description, parseFloat(amount), expenseDate]
    );
    sendSuccess(res, result.rows[0], 'Expense created successfully');
  } catch (error) {
    sendError(res, error);
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM Expenses WHERE ExpenseID = $1 RETURNING ExpenseID', [id]);
    if (result.rows.length === 0) {
      return sendError(res, new Error('Expense not found'), 404);
    }
    sendSuccess(res, null, 'Expense deleted successfully');
  } catch (error) {
    sendError(res, error);
  }
});

// ==========================================
// ERROR HANDLERS
// ==========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, HOST, () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   WAREHOUSE MANAGEMENT SYSTEM - REST API SERVER           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Server running on: http://${HOST}:${PORT}`);
  console.log(`✅ Health check: http://${HOST}:${PORT}/api/health`);
  console.log(`✅ Database: ${config.database.host}:${config.database.port}/${config.database.database}`);
  console.log('\n📝 Available endpoints:');
  console.log('   POST   /api/auth/login');
  console.log('   GET    /api/stats');
  console.log('   GET    /api/items');
  console.log('   POST   /api/items');
  console.log('   PUT    /api/items/:id');
  console.log('   DELETE /api/items/:id');
  console.log('   GET    /api/customers');
  console.log('   POST   /api/customers');
  console.log('   PUT    /api/customers/:id');
  console.log('   DELETE /api/customers/:id');
  console.log('   GET    /api/suppliers');
  console.log('   POST   /api/suppliers');
  console.log('   GET    /api/sales');
  console.log('   POST   /api/sales');
  console.log('   GET    /api/purchases');
  console.log('   POST   /api/purchases');
  console.log('   GET    /api/payment-methods');
  console.log('   GET    /api/reports/sales?from=&to=');
  console.log('   GET    /api/reports/stock');
  console.log('   GET    /api/reports/debts');
  console.log('\n🔧 Press Ctrl+C to stop the server\n');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down server...');
  await pool.end();
  console.log('✅ Database connections closed');
  process.exit(0);
});
