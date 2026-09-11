/**
 * ELECTRON MAIN PROCESS (API-BASED - PostgreSQL Backend)
 * 
 * This version connects to the REST API server instead of Access database.
 * The Electron app becomes a thin client with no database dependencies.
 * 
 * Architecture:
 * - Database: PostgreSQL
 * - Backend: Node.js + Express (port 3001)
 * - Frontend: Electron + React
 */

import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

Menu.setApplicationMenu(null)

// ==========================================
// CONFIGURATION MANAGEMENT
// ==========================================

interface AppConfig {
  serverIP: string
  serverPort: number
}

const CONFIG_FILE = path.join(process.cwd(), 'config.json')

// Default configuration
const DEFAULT_CONFIG: AppConfig = {
  serverIP: 'localhost',
  serverPort: 3001
}

// Read config from file
function readConfig(): AppConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8')
      const config = JSON.parse(data)
      console.log('📋 Config loaded from:', CONFIG_FILE)
      console.log('🌐 Server:', `${config.serverIP}:${config.serverPort}`)
      return config
    }
  } catch (error: any) {
    console.error('⚠️ Failed to read config file:', error.message)
  }
  
  console.log('📋 Using default configuration')
  return DEFAULT_CONFIG
}

// Write config to file
function writeConfig(config: AppConfig): boolean {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
    console.log('✅ Config saved to:', CONFIG_FILE)
    return true
  } catch (error: any) {
    console.error('❌ Failed to save config:', error.message)
    return false
  }
}

// Current configuration
let currentConfig: AppConfig = readConfig()

// Get API base URL
function getApiBaseUrl(): string {
  return `http://${currentConfig.serverIP}:${currentConfig.serverPort}/api`
}

// ==========================================
// IPC HANDLERS FOR CONFIGURATION
// ==========================================

// CRITICAL: Synchronous get-config handler for preload script
// Must be registered BEFORE app.whenReady()
ipcMain.on('get-config', (event) => {
  event.returnValue = currentConfig
})

ipcMain.handle('app:getConfig', async () => {
  return currentConfig
})

ipcMain.handle('app:setConfig', async (_event, serverIP: string, serverPort: number) => {
  try {
    const config: AppConfig = {
      serverIP,
      serverPort: parseInt(String(serverPort))
    }
    const saved = writeConfig(config)
    if (saved) {
      currentConfig = config
      return { success: true }
    } else {
      return { success: false, error: 'Failed to save configuration' }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// ==========================================
// IPC HANDLER FOR API BASE URL
// ==========================================

ipcMain.handle('app:getApiBaseUrl', async () => {
  return getApiBaseUrl()
})

// ==========================================
// WINDOW CREATION
// ==========================================

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    backgroundColor: '#0B0F19',
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      devTools: true,
    },
    show: false,
    title: 'Warehouse Management System',
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.focus()
    
    // Log startup info
    console.log('\n╔════════════════════════════════════════════════════════════╗')
    console.log('║   WAREHOUSE MANAGEMENT SYSTEM - CLIENT                     ║')
    console.log('╚════════════════════════════════════════════════════════════╝\n')
    console.log(`✅ Client started`)
    console.log(`🌐 API Server: ${getApiBaseUrl()}`)
    console.log(`📁 Config file: ${CONFIG_FILE}\n`)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ==========================================
// APP LIFECYCLE
// ==========================================

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
