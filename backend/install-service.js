/**
 * WINDOWS SERVICE INSTALLER
 * 
 * This script installs the Warehouse API as a Windows Service
 * so it starts automatically when the server machine boots.
 * 
 * Run with: node install-service.js
 */

const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'WarehouseAPI',
  description: 'Warehouse Management System REST API Server',
  script: path.join(__dirname, 'server.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  env: [
    {
      name: 'NODE_ENV',
      value: 'production'
    }
  ]
});

// Listen for the "install" event
svc.on('install', () => {
  console.log('✅ Service installed successfully!');
  console.log('📝 Service name: WarehouseAPI');
  console.log('🚀 Starting service...');
  svc.start();
});

// Listen for the "start" event
svc.on('start', () => {
  console.log('✅ Service started successfully!');
  console.log('🎯 The Warehouse API will now start automatically on system boot.');
  console.log('\nℹ️  To manage the service:');
  console.log('   - Open Services (services.msc)');
  console.log('   - Find "WarehouseAPI"');
  console.log('   - Right-click to Stop/Start/Restart');
  console.log('\nℹ️  To uninstall the service:');
  console.log('   - Run: node uninstall-service.js');
  process.exit(0);
});

// Listen for errors
svc.on('error', (err) => {
  console.error('❌ Service installation error:', err);
  process.exit(1);
});

// Check if already installed
svc.on('alreadyinstalled', () => {
  console.log('⚠️  Service is already installed!');
  console.log('ℹ️  To reinstall:');
  console.log('   1. Run: node uninstall-service.js');
  console.log('   2. Run: node install-service.js');
  process.exit(1);
});

console.log('🔧 Installing Warehouse API as Windows Service...');
console.log('⏳ This may take a moment...\n');

// Install the service
svc.install();
