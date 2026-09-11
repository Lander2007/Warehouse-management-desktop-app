
const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const configPath = path.join(__dirname, 'config.json');
const dbConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const pool = new Pool(dbConfig.database);

const excelFilePath = path.join(__dirname, '../مخازن شهر يونيو_٠٨٥٤٢٦.xlsx');

async function compare() {
  console.log('📊 Comparing Excel "اكواد الاصناف" vs Database "Items"...\n');
  
  const workbook = XLSX.readFile(excelFilePath);
  const sheet = workbook.Sheets['اكواد الاصناف'];
  const excelData = XLSX.utils.sheet_to_json(sheet);
  
  const client = await pool.connect();
  const dbData = await client.query('SELECT ItemCode, ItemName, CurrentStock FROM Items');
  const dbMap = new Map(dbData.rows.map(r => [String(r.itemcode).trim(), r]));

  console.log(`Excel total items: ${excelData.length}`);
  console.log(`DB total items:    ${dbData.rows.length}`);

  let missingInDb = [];
  let diffStock = [];

  excelData.forEach(row => {
    const code = String(row['كود الصنف'] || row['ItemCode'] || '').trim();
    if (!code) return;

    const dbItem = dbMap.get(code);
    if (!dbItem) {
      missingInDb.push(code);
    } else {
      const excelStock = parseFloat(row['الرصيد'] || 0);
      const dbStock = parseFloat(dbItem.currentstock);
      if (Math.abs(excelStock - dbStock) > 0.001) {
        diffStock.push({ code, excel: excelStock, db: dbStock });
      }
    }
  });

  console.log(`\nItems missing in DB: ${missingInDb.length}`);
  if (missingInDb.length > 0) {
    console.log('Sample missing codes:', missingInDb.slice(0, 5));
  }

  console.log(`Items with stock mismatch: ${diffStock.length}`);
  if (diffStock.length > 0) {
    console.log('Sample mismatches (Code: Excel vs DB):');
    diffStock.slice(0, 5).forEach(d => {
      console.log(`  ${d.code}: ${d.excel} vs ${d.db}`);
    });
  }

  client.release();
  await pool.end();
}

compare();
