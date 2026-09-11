
const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const configPath = path.join(__dirname, '../config.json');
const dbConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const pool = new Pool(dbConfig.database);

const excelFilePath = path.join(__dirname, '../../مخازن شهر يونيو_٠٨٥٤٢٦.xlsx');

function parseExcelDate(val) {
  if (!val) return new Date();
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val;
  }
  if (typeof val === 'number') {
    return new Date((val - 25569) * 86400 * 1000);
  }
  const num = Number(val);
  if (!isNaN(num) && num > 0) {
    return new Date((num - 25569) * 86400 * 1000);
  }
  const parsed = new Date(val);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  return new Date();
}

async function migrate() {
  console.log('🚀 Starting STOCK-FIX migration...');
  
  if (!fs.existsSync(excelFilePath)) {
    console.error('❌ Excel file not found');
    process.exit(1);
  }

  const workbook = XLSX.readFile(excelFilePath, { cellDates: true });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🗑️ Clearing existing data...');
    await client.query('TRUNCATE SaleDetails, PurchaseDetails, Sales, Purchases, Items, Customers, Suppliers, Expenses RESTART IDENTITY CASCADE');

    // 1. MIGRATE ITEMS
    console.log('📦 Migrating Items...');
    const itemCodesSheet = workbook.Sheets['اكواد الاصناف'];
    const itemsData = XLSX.utils.sheet_to_json(itemCodesSheet);
    
    const itemsMap = new Map();

    // Initialize with Master Catalog
    itemsData.forEach(item => {
      const code = String(item['كود الصنف'] || '').trim();
      if (!code) return;
      
      itemsMap.set(code, {
        code,
        name: String(item['اسم الصنف'] || '').trim(),
        unit: String(item['الوحدة'] || 'PCS').trim(),
        salePrice: 0,
        costPrice: 0,
        minStock: 0,
        currentStock: 0
      });
    });

    // Update Stock from 'رصيد المخازن'
    const stockSheet = workbook.Sheets['رصيد المخازن'];
    const stockData = XLSX.utils.sheet_to_json(stockSheet, { header: 1 }).slice(2);

    stockData.forEach(row => {
      const code = String(row[0] || '').trim();
      if (!code || code === 'كود الصنف') return;
      
      const stock = parseFloat(row[5] || 0);
      
      if (itemsMap.has(code)) {
        itemsMap.get(code).currentStock = stock;
      } else {
        itemsMap.set(code, {
          code,
          name: String(row[1] || 'Unknown Item').trim(),
          unit: String(row[2] || 'PCS').trim(),
          salePrice: 0,
          costPrice: 0,
          minStock: 0,
          currentStock: stock
        });
      }
    });

    // Derive Sale Prices from Sales History
    const salesSheet = workbook.Sheets['سجل المبيعات'];
    const salesData = XLSX.utils.sheet_to_json(salesSheet);
    salesData.forEach(row => {
      const code = String(row['كود الصنف'] || '').trim();
      const price = parseFloat(row['السعر'] || 0);
      if (code && price > 0 && itemsMap.has(code)) {
        const item = itemsMap.get(code);
        if (item.salePrice === 0) item.salePrice = price;
      }
    });

    for (const item of itemsMap.values()) {
      await client.query(
        `INSERT INTO Items (ItemCode, ItemName, Unit, MinStock, CurrentStock, SalePrice, CostPrice)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [item.code, item.name, item.unit, item.minStock, item.currentStock, item.salePrice, item.costPrice]
      );
    }
    console.log(`✅ ${itemsMap.size} items migrated with stock levels.`);

    // 2. MIGRATE CUSTOMERS
    console.log('👥 Migrating Customers...');
    const custSheet = workbook.Sheets['سجل العملاء'];
    const customers = XLSX.utils.sheet_to_json(custSheet);
    for (const c of customers) {
      const code = String(c['كود العميل'] || '').trim();
      if (!code) continue;
      await client.query(
        `INSERT INTO Customers (CustomerCode, CustomerName, Phone, Mobile2, Email, Address)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (CustomerCode) DO NOTHING`,
        [code, String(c['اسم العميل'] || '').trim(), String(c['رقم الهاتف'] || '').trim(), String(c['موبايل 2'] || '').trim(), '', '']
      );
    }

    // 3. MIGRATE SUPPLIERS
    console.log('🏢 Migrating Suppliers...');
    const suppSheet = workbook.Sheets['سجل الموردين'];
    const suppliers = XLSX.utils.sheet_to_json(suppSheet);
    for (const s of suppliers) {
      const code = String(s['كود المورد'] || '').trim();
      if (!code) continue;
      await client.query(
        `INSERT INTO Suppliers (SupplierCode, SupplierName, Phone)
         VALUES ($1, $2, $3)
         ON CONFLICT (SupplierCode) DO NOTHING`,
        [code, String(s['اسم المورد'] || '').trim(), String(s['رقم الهاتف'] || '').trim()]
      );
    }

    // Refresh lookups
    const itemLookupRes = await client.query('SELECT ItemID, ItemCode FROM Items');
    const itemLookup = itemLookupRes.rows.reduce((acc, r) => { acc[String(r.itemcode).trim()] = r.itemid; return acc; }, {});
    const custLookupRes = await client.query('SELECT CustomerID, CustomerName FROM Customers');
    const custLookup = custLookupRes.rows.reduce((acc, r) => { acc[String(r.customername).trim()] = r.customerid; return acc; }, {});
    const suppLookupRes = await client.query('SELECT SupplierID, SupplierName FROM Suppliers');
    const suppLookup = suppLookupRes.rows.reduce((acc, r) => { acc[String(r.suppliername).trim()] = r.supplierid; return acc; }, {});

    // 4. MIGRATE SALES
    console.log('💰 Migrating Sales invoices...');
    const invoices = new Map();
    salesData.forEach(row => {
      if (!row['اسم الصنف'] && !row['كود الصنف']) return;
      const invNo = String(row['رقم فاتورة البيع'] || 'TEMP-' + Math.random()).trim();
      if (!invoices.has(invNo)) invoices.set(invNo, []);
      invoices.get(invNo).push(row);
    });

    let salesCount = 0;
    for (const [invNo, rows] of invoices.entries()) {
      const firstRow = rows[0];
      const customerID = custLookup[String(firstRow['اسم العميل'] || '').trim()] || null;
      const totalAmount = rows.reduce((sum, r) => sum + parseFloat(r['القيمة'] || 0), 0);
      
      // Handle Excel Date
      const saleDate = parseExcelDate(firstRow['__EMPTY']);

      const validDetails = rows.filter(r => {
         const code = String(r['كود الصنف'] || '').trim();
         return itemLookup[code] || itemLookup[String(parseInt(code))];
      });

      if (validDetails.length === 0) continue;

      const saleRes = await client.query(
        `INSERT INTO Sales (SaleDate, CustomerID, PaymentMethodID, TotalAmount, PaidAmount, RemainingAmount, Notes)
         VALUES ($1, $2, 1, $3, $3, 0, $4)
         RETURNING SaleID`,
        [saleDate, customerID, totalAmount, `Excel Import - Inv #${invNo}`]
      );
      const saleID = saleRes.rows[0].saleid;

      for (const r of validDetails) {
        let code = String(r['كود الصنف'] || '').trim();
        let itemID = itemLookup[code] || itemLookup[String(parseInt(code))];
        await client.query(
          `INSERT INTO SaleDetails (SaleID, ItemID, Quantity, UnitPrice, LineTotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [saleID, itemID, parseFloat(r['الكمية'] || 0), parseFloat(r['السعر'] || 0), parseFloat(r['القيمة'] || 0)]
        );
      }
      salesCount++;
    }
    console.log(`✅ ${salesCount} sales invoices migrated.`);

    // 5. MIGRATE PURCHASES
    console.log('🛒 Migrating Purchases...');
    const purchaseSheet = workbook.Sheets['سجل الوارد '];
    const purchaseData = XLSX.utils.sheet_to_json(purchaseSheet);
    let purchaseCount = 0;
    for (const r of purchaseData) {
      if (!r['اسم الصنف'] && !r['كود الصنف']) continue;
      const code = String(r['كود الصنف'] || '').trim();
      let itemID = itemLookup[code] || itemLookup[String(parseInt(code))];
      if (!itemID) continue;

      const supplierID = suppLookup[String(r['اسم المورد'] || '').trim()] || null;
      const quantity = parseFloat(r['الكمية'] || 0);
      const value = parseFloat(r['القيمة'] || 0);

      const purRes = await client.query(
        `INSERT INTO Purchases (PurchaseDate, SupplierID, PaymentMethodID, TotalAmount, PaidAmount, RemainingAmount, InvoiceNo)
         VALUES (CURRENT_DATE, $1, 1, $2, $2, 0, 'Excel Import')
         RETURNING PurchaseID`,
        [supplierID, value]
      );
      const purID = purRes.rows[0].purchaseid;

      await client.query(
        `INSERT INTO PurchaseDetails (PurchaseID, ItemID, Quantity, UnitCost, LineTotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [purID, itemID, quantity, quantity > 0 ? value / quantity : 0, value]
      );
      purchaseCount++;
    }
    console.log(`✅ ${purchaseCount} purchase records migrated.`);

    // 6. MIGRATE EXPENSES
    console.log('💸 Migrating Expenses...');
    const expenseSheet = workbook.Sheets['اجمالي المصروفات'];
    if (expenseSheet) {
      const expenseData = XLSX.utils.sheet_to_json(expenseSheet);
      let expenseCount = 0;
      for (const r of expenseData) {
        const desc = String(r['المصروفات'] || '').trim();
        const amount = parseFloat(r['__EMPTY_2'] || 0);
        if (!desc && amount === 0) continue;
        
        const expDate = parseExcelDate(r['التاريخ']);
        
        await client.query(
          `INSERT INTO Expenses (Description, Amount, ExpenseDate)
           VALUES ($1, $2, $3)`,
          [desc || 'مصروف عام', amount, expDate]
        );
        expenseCount++;
      }
      console.log(`✅ ${expenseCount} expense records migrated.`);
    }

    await client.query('COMMIT');
    console.log('\n✨ MIGRATION WITH STOCK COMPLETED SUCCESSFULLY!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', e);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
