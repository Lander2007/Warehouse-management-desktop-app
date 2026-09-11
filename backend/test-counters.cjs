
const { Pool } = require('pg');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const pool = new Pool(config.database);

async function test() {
  try {
    const res1 = await pool.query('SELECT COUNT(*) FROM Customers WHERE IsActive = TRUE');
    console.log('Original Count:', res1.rows[0].count);

    await pool.query("INSERT INTO Customers (CustomerCode, CustomerName, IsActive) VALUES ('TEST-X', 'Test', true)");
    
    const res2 = await pool.query('SELECT COUNT(*) FROM Customers WHERE IsActive = TRUE');
    console.log('Count after Add:', res2.rows[0].count);

    await pool.query("DELETE FROM Customers WHERE CustomerCode = 'TEST-X'");
    
    const res3 = await pool.query('SELECT COUNT(*) FROM Customers WHERE IsActive = TRUE');
    console.log('Count after Delete:', res3.rows[0].count);
  } finally {
    await pool.end();
  }
}

test();
