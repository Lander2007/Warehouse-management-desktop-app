// Quick script to check all users in the database
const ADODB = require('node-adodb');
const path = require('path');

const dbPath = path.join(__dirname, 'Stores_DB.accdb');
const connectionString = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};Persist Security Info=False;`;

console.log('🔍 Checking all users in database...\n');

const connection = ADODB.open(connectionString, true);

connection.query('SELECT * FROM Users')
    .then(users => {
        console.log(`📊 Found ${users.length} user(s):\n`);
        users.forEach((user, index) => {
            console.log(`User ${index + 1}:`);
            console.log(`  UserID:    ${user.UserID}`);
            console.log(`  Username:  ${user.Username}`);
            console.log(`  Password:  ${user.Password}`);
            console.log(`  FullName:  ${user.FullName}`);
            console.log(`  RoleID:    ${user.RoleID}`);
            console.log(`  IsActive:  ${user.IsActive ? 'Yes' : 'No'}`);
            console.log(`  LastLogin: ${user.LastLogin}`);
            console.log('');
        });
    })
    .catch(error => {
        console.error('❌ Error:', error.message);
    });
