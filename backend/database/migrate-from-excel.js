/**
 * MIGRATION SCRIPT: Import data from Excel to PostgreSQL
 * 
 * This script reads the existing Excel file (مخازن_شهر_يونيو.xlsx)
 * and imports all data into the PostgreSQL database
 */

const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Load database configuration
const configPath = path.join(__dirname, '../config.json');
let dbConfig;

try {
  dbConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('❌ Failed to load config.json. Please create it first.');
  console.log('Expected format:');
  console.log(JSON.stringify({
    database: {
      host: 'localhost',
      port: 5432,
      database: 'warehouse_db',
      user: 'postgres',
      password: 'your_password'
    }
  }, null, 2));
  process.exit(1);
}

// Create PostgreSQL connection pool
const pool = new Pool(dbConfig.database);

// Excel file path (adjust if needed)
const excelFilePath = path.join(__dirname, '../../مخازن شهر يونيو_٠٨٥٤٢٦.xlsx');

async function migrateData() {
  console.log('🚀 Starting migration from Excel to PostgreSQL...\n');

  if (!fs.existsSync(excelFilePath)) {
    console.error(`❌ Excel file not found: ${excelFilePath}`);
    process.exit(1);
  }

  try {
    // Read Excel file
    console.log('📖 Reading Excel file:', excelFilePath);
    const workbook = XLSX.readFile(excelFilePath);

    // Get connection
    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // ==========================================
      // 1. MIGRATE ITEMS
      // ==========================================
      const itemsSheetName = workbook.SheetNames.find(s => 
        s === 'Items' || s === 'الاصناف' || s === 'اكواد الاصناف' || s.includes('Item') || s.includes('صنف') || s.includes('اصناف')
      );
      
      if (itemsSheetName) {
        console.log(`\n📦 Migrating Items from sheet: "${itemsSheetName}"`);
        const sheet = workbook.Sheets[itemsSheetName];
        const items = XLSX.utils.sheet_to_json(sheet);

        let itemCount = 0;
        for (const item of items) {
          try {
            const itemCode = String(item['كود الصنف'] || item['ItemCode'] || item['Code'] || `ITEM-${itemCount + 1}`).trim();
            const itemName = String(item['اسم الصنف'] || item['ItemName'] || item['Name'] || 'Unknown Item').trim();
            const unit = String(item['الوحدة'] || item['Unit'] || 'PCS').trim();
            const currentStock = parseFloat(item['الرصيد'] || item['CurrentStock'] || item['Stock'] || 0);
            const minStock = parseFloat(item['الحد الادنى'] || item['MinStock'] || 0);
            const salePrice = parseFloat(item['سعر البيع'] || item['SalePrice'] || item['Price'] || 0);
            const costPrice = parseFloat(item['التكلفة'] || item['CostPrice'] || item['Cost'] || 0);

            await client.query(
              `INSERT INTO Items (ItemCode, ItemName, Unit, CurrentStock, MinStock, SalePrice, CostPrice)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (ItemCode) DO UPDATE
               SET ItemName = EXCLUDED.ItemName,
                   Unit = EXCLUDED.Unit,
                   CurrentStock = EXCLUDED.CurrentStock,
                   MinStock = EXCLUDED.MinStock,
                   SalePrice = EXCLUDED.SalePrice,
                   CostPrice = EXCLUDED.CostPrice`,
              [itemCode, itemName, unit, currentStock, minStock, salePrice, costPrice]
            );
            itemCount++;
          } catch (err) {
            console.error(`   ⚠️ Failed to insert item:`, err.message);
          }
        }
        console.log(`   ✅ Migrated ${itemCount} items`);
      }

      // ==========================================
      // 2. MIGRATE CUSTOMERS
      // ==========================================
      const customersSheetName = workbook.SheetNames.find(s => 
        s === 'Customers' || s === 'العملاء' || s === 'سجل العملاء' || s.includes('Customer') || s.includes('عميل') || s.includes('عملاء')
      );
      
      if (customersSheetName) {
        console.log(`\n👥 Migrating Customers from sheet: "${customersSheetName}"`);
        const sheet = workbook.Sheets[customersSheetName];
        const customers = XLSX.utils.sheet_to_json(sheet);

        let customerCount = 0;
        for (const customer of customers) {
          try {
            const customerCode = String(customer['كود العميل'] || customer['CustomerCode'] || customer['Code'] || `CUST-${customerCount + 1}`).trim();
            const customerName = String(customer['اسم العميل'] || customer['CustomerName'] || customer['Name'] || 'Unknown Customer').trim();
            const phone = String(customer['رقم الهاتف'] || customer['التليفون'] || customer['Phone'] || customer['Tel'] || '').trim();
            const mobile2 = String(customer['موبايل 2'] || customer['Mobile2'] || '').trim();
            const email = String(customer['البريد'] || customer['Email'] || '').trim();
            const address = String(customer['العنوان'] || customer['Address'] || '').trim();
            const isActive = customer['نشط'] !== false && customer['IsActive'] !== false;

            await client.query(
              `INSERT INTO Customers (CustomerCode, CustomerName, Phone, Mobile2, Email, Address, IsActive)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (CustomerCode) DO UPDATE
               SET CustomerName = EXCLUDED.CustomerName,
                   Phone = EXCLUDED.Phone,
                   Mobile2 = EXCLUDED.Mobile2,
                   Email = EXCLUDED.Email,
                   Address = EXCLUDED.Address,
                   IsActive = EXCLUDED.IsActive`,
              [customerCode, customerName, phone, mobile2, email, address, isActive]
            );
            customerCount++;
          } catch (err) {
            console.error(`   ⚠️ Failed to insert customer:`, err.message);
          }
        }
        console.log(`   ✅ Migrated ${customerCount} customers`);
      }

      // ==========================================
      // 3. MIGRATE SUPPLIERS
      // ==========================================
      const suppliersSheetName = workbook.SheetNames.find(s => 
        s === 'Suppliers' || s === 'الموردين' || s === 'سجل الموردين' || s.includes('Supplier') || s.includes('مورد') || s.includes('موردين')
      );
      
      if (suppliersSheetName) {
        console.log(`\n🏢 Migrating Suppliers from sheet: "${suppliersSheetName}"`);
        const sheet = workbook.Sheets[suppliersSheetName];
        const suppliers = XLSX.utils.sheet_to_json(sheet);

        let supplierCount = 0;
        for (const supplier of suppliers) {
          try {
            const supplierCode = String(supplier['كود المورد'] || supplier['SupplierCode'] || supplier['Code'] || `SUPP-${supplierCount + 1}`).trim();
            const supplierName = String(supplier['اسم المورد'] || supplier['SupplierName'] || supplier['Name'] || 'Unknown Supplier').trim();
            const phone = String(supplier['رقم الهاتف'] || supplier['التليفون'] || supplier['Phone'] || '').trim();
            const email = String(supplier['البريد'] || supplier['Email'] || '').trim();
            const address = String(supplier['العنوان'] || supplier['Address'] || '').trim();
            const isActive = supplier['نشط'] !== false && supplier['IsActive'] !== false;

            await client.query(
              `INSERT INTO Suppliers (SupplierCode, SupplierName, Phone, Email, Address, IsActive)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT (SupplierCode) DO UPDATE
               SET SupplierName = EXCLUDED.SupplierName,
                   Phone = EXCLUDED.Phone,
                   Email = EXCLUDED.Email,
                   Address = EXCLUDED.Address,
                   IsActive = EXCLUDED.IsActive`,
              [supplierCode, supplierName, phone, email, address, isActive]
            );
            supplierCount++;
          } catch (err) {
            console.error(`   ⚠️ Failed to insert supplier:`, err.message);
          }
        }
        console.log(`   ✅ Migrated ${supplierCount} suppliers`);
      }

      // ==========================================
      // 4. MIGRATE EXPENSES
      // ==========================================
      const expenseSheetName = workbook.SheetNames.find(s => 
        s === 'Expenses' || s === 'المصروفات' || s === 'اجمالي المصروفات' || s.includes('Expense') || s.includes('مصروف')
      );

      if (expenseSheetName) {
        console.log(`\n💸 Migrating Expenses from sheet: "${expenseSheetName}"`);
        const sheet = workbook.Sheets[expenseSheetName];
        const expenses = XLSX.utils.sheet_to_json(sheet);

        let expenseCount = 0;
        for (const exp of expenses) {
          try {
            const desc = String(exp['المصروفات'] || exp['Description'] || '').trim();
            const amount = parseFloat(exp['__EMPTY_2'] || exp['Amount'] || exp['Value'] || 0);
            if (!desc && amount === 0) continue;

            let expDate = new Date();
            const dateSerial = exp['التاريخ'] || exp['Date'];
            if (dateSerial && !isNaN(dateSerial)) {
              expDate = new Date((dateSerial - 25569) * 86400 * 1000);
            }

            await client.query(
              `INSERT INTO Expenses (Description, Amount, ExpenseDate)
               VALUES ($1, $2, $3)`,
              [desc || 'مصروف عام', amount, expDate]
            );
            expenseCount++;
          } catch (err) {
            console.error(`   ⚠️ Failed to insert expense:`, err.message);
          }
        }
        console.log(`   ✅ Migrated ${expenseCount} expenses`);
      }

      // Commit transaction
      await client.query('COMMIT');
      console.log('\n✅ Migration completed successfully!');

      // Show summary
      const itemsResult = await client.query('SELECT COUNT(*) FROM Items');
      const customersResult = await client.query('SELECT COUNT(*) FROM Customers');
      const suppliersResult = await client.query('SELECT COUNT(*) FROM Suppliers');

      console.log('\n📊 Database Summary:');
      console.log(`   Items: ${itemsResult.rows[0].count}`);
      console.log(`   Customers: ${customersResult.rows[0].count}`);
      console.log(`   Suppliers: ${suppliersResult.rows[0].count}`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
migrateData();
