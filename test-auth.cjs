// Quick test script to check authentication without Electron
const fs = require('fs');
const path = require('path');

console.log('===== AUTHENTICATION TEST =====\n');

// Check if preload.cjs exists and contains authenticateUser
const preloadPath = path.join(__dirname, 'dist-electron', 'preload.cjs');
if (fs.existsSync(preloadPath)) {
  const content = fs.readFileSync(preloadPath, 'utf-8');
  
  if (content.includes('authenticateUser')) {
    console.log('✅ preload.cjs contains authenticateUser');
  } else {
    console.log('❌ preload.cjs MISSING authenticateUser!');
  }
  
  if (content.includes('db:authenticateUser')) {
    console.log('✅ preload.cjs calls db:authenticateUser handler');
  } else {
    console.log('❌ preload.cjs MISSING db:authenticateUser call!');
  }
} else {
  console.log('❌ preload.cjs file not found!');
}

// Check if main.js has the authentication handler
const mainPath = path.join(__dirname, 'dist-electron', 'main.js');
if (fs.existsSync(mainPath)) {
  const content = fs.readFileSync(mainPath, 'utf-8');
  
  if (content.includes('db:authenticateUser')) {
    console.log('✅ main.js has db:authenticateUser handler');
  } else {
    console.log('❌ main.js MISSING db:authenticateUser handler!');
  }
  
  if (content.includes('ipcMain.handle')) {
    console.log('✅ main.js uses ipcMain.handle');
  } else {
    console.log('❌ main.js MISSING ipcMain.handle!');
  }
} else {
  console.log('❌ main.js file not found!');
}

console.log('\n===== TEST COMPLETE =====');
