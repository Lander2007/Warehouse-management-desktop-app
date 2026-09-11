/**
 * WINDOWS SERVICE UNINSTALLER
 * 
 * This script removes the Warehouse API Windows Service
 * 
 * Run with: node uninstall-service.js
 */

/**
 * UNINSTALL WAREHOUSE API WINDOWS SERVICE
 * 
 * This script uninstalls the Windows Service
 * 
 * Usage: node uninstall-service.js
 */

const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object (must match install-service.js)
const svc = new Service({
  name: 'WarehouseAPI',
  script: path.join(__dirname, 'server.js')
});

// Listen for the "uninstall" event
svc.on('uninstall', () => {
  console.log('✅ Service uninstalled successfully!');
  console.log('📝 Service name: WarehouseAPI has been removed.');
  process.exit(0);
});

// Listen for errors
svc.on('error', (err) => {
  console.error('❌ Service uninstallation error:', err);
  process.exit(1);
});

// Check if not installed
svc.on('alreadyuninstalled', () => {
  console.log('ℹ️  Service is not installed.');
  process.exit(0);
});

console.log('🔧 Uninstalling Warehouse API Windows Service...');
console.log('⏳ This may take a moment...\n');

// Uninstall the service
svc.uninstall();
