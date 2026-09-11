/**
 * Create Test User for Warehouse System
 * Run: node backend/create-test-user.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load config
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

// Create PostgreSQL connection
const pool = new Pool(config.database);

async function createTestUser() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 Checking existing users...\n');
    
    // Check existing users
    const usersResult = await client.query(`
      SELECT u.userid, u.username, u.fullname, r.rolename 
      FROM users u 
      LEFT JOIN roles r ON u.roleid = r.roleid
      LIMIT 10
    `);
    
    if (usersResult.rows.length > 0) {
      console.log('✅ Found existing users:');
      console.table(usersResult.rows);
      console.log('\n💡 Try logging in with one of these usernames.');
      console.log('   If you don\'t know the password, continue to create a test user.\n');
    } else {
      console.log('⚠️  No users found in database.\n');
    }
    
    // Ask to create test user
    console.log('📝 Creating test user...\n');
    
    // Check if admin role exists
    const roleCheck = await client.query(`SELECT roleid FROM roles WHERE rolename = 'Admin' LIMIT 1`);
    
    let adminRoleId;
    if (roleCheck.rows.length === 0) {
      // Create roles if they don't exist
      console.log('   Creating roles...');
      await client.query(`
        INSERT INTO roles (rolename, isactive) 
        VALUES ('Admin', TRUE), ('Sales', TRUE), ('Warehouse', TRUE)
        ON CONFLICT DO NOTHING
      `);
      const newRoleResult = await client.query(`SELECT roleid FROM roles WHERE rolename = 'Admin' LIMIT 1`);
      adminRoleId = newRoleResult.rows[0].roleid;
    } else {
      adminRoleId = roleCheck.rows[0].roleid;
    }
    
    // Create test admin user
    const testUsername = 'admin';
    const testPassword = 'admin123'; // Plain text for testing
    const testFullName = 'Test Administrator';
    
    // Check if user exists
    const userExists = await client.query(
      `SELECT userid FROM users WHERE username = $1`,
      [testUsername]
    );
    
    if (userExists.rows.length > 0) {
      // Update existing user
      await client.query(
        `UPDATE users SET password = $1, fullname = $2, roleid = $3, isactive = TRUE WHERE username = $4`,
        [testPassword, testFullName, adminRoleId, testUsername]
      );
      console.log(`✅ Updated existing user: ${testUsername}`);
    } else {
      // Create new user
      await client.query(
        `INSERT INTO users (username, password, fullname, roleid, isactive) 
         VALUES ($1, $2, $3, $4, TRUE)`,
        [testUsername, testPassword, testFullName, adminRoleId]
      );
      console.log(`✅ Created new user: ${testUsername}`);
    }
    
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   TEST USER CREDENTIALS                ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`   Username: ${testUsername}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   Role:     Admin`);
    console.log('\n✅ You can now login with these credentials!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure PostgreSQL is running');
    console.error('2. Check backend/config.json for correct database settings');
    console.error('3. Make sure the database "warehouse_db" exists');
    console.error('4. Make sure tables "users" and "roles" exist');
  } finally {
    client.release();
    await pool.end();
  }
}

createTestUser();
