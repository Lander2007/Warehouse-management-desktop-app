// ZERO-DEPENDENCY PRELOAD - ONLY require('electron')
const { contextBridge, ipcRenderer } = require('electron')

console.log('🔌 Preload script loaded (zero dependencies)')

// Get config from main process via IPC
const config = ipcRenderer.sendSync('get-config') || {}
const serverIP = config.serverIP || 'localhost'
const serverPort = config.serverPort || 3001
const BASE = `http://${serverIP}:${serverPort}/api`

console.log('🌐 API Base:', BASE)

// Case mapping translation dictionary
const KEY_MAP = {
  // Items
  itemid: 'ItemID',
  itemcode: 'ItemCode',
  itemname: 'ItemName',
  unit: 'Unit',
  minstock: 'MinStock',
  currentstock: 'CurrentStock',
  saleprice: 'SalePrice',
  costprice: 'CostPrice',
  
  // Customers
  customerid: 'CustomerID',
  customercode: 'CustomerCode',
  customername: 'CustomerName',
  phone: 'Phone',
  mobile2: 'Mobile2',
  email: 'Email',
  address: 'Address',
  isactive: 'IsActive',
  
  // Suppliers
  supplierid: 'SupplierID',
  suppliercode: 'SupplierCode',
  suppliername: 'SupplierName',
  
  // Payment Methods
  paymentmethodid: 'PaymentMethodID',
  methodname: 'MethodName',
  paymentmethodname: 'PaymentMethodName',
  
  // Sales & Purchases
  saleid: 'SaleID',
  saledate: 'SaleDate',
  totalamount: 'TotalAmount',
  discount: 'Discount',
  paidamount: 'PaidAmount',
  remainingamount: 'RemainingAmount',
  notes: 'Notes',
  purchaseid: 'PurchaseID',
  purchasedate: 'PurchaseDate',
  invoiceno: 'InvoiceNo',
  
  // Roles & Users
  userid: 'UserID',
  username: 'Username',
  rolename: 'RoleName',
  role: 'Role',
  fullname: 'FullName',

  // Stats / Dashboard Properties
  totalitems: 'totalItems',
  totalcustomers: 'totalCustomers',
  totalsuppliers: 'totalSuppliers',
  totalsales: 'totalSales',
  todayrevenue: 'todayRevenue',
  lowstock: 'lowStock',
  recentsales: 'recentSales',
}

// Helper to recursively map lowercase keys to case-preserving PascalCase/camelCase keys
function mapKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(mapKeys)
  }
  if (obj !== null && typeof obj === 'object') {
    const newObj = {}
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase()
      // Map methodname to both MethodName and PaymentMethodName for component compatibility
      if (lowerKey === 'methodname') {
        newObj['MethodName'] = mapKeys(obj[key])
        newObj['PaymentMethodName'] = mapKeys(obj[key])
      } else if (lowerKey === 'saleid') {
        newObj['SaleID'] = mapKeys(obj[key])
        newObj['saleID'] = mapKeys(obj[key])
      } else if (lowerKey === 'purchaseid') {
        newObj['PurchaseID'] = mapKeys(obj[key])
        newObj['purchaseID'] = mapKeys(obj[key])
      } else {
        const mappedKey = KEY_MAP[lowerKey] || key
        newObj[mappedKey] = mapKeys(obj[key])
      }
    }
    return newObj
  }
  return obj
}

// HTTP helper using fetch — BASE is built from config.json at preload load time
async function http(path, opts) {
  opts = opts || {}
  try {
    let url = BASE + path;
    if (!opts.method || opts.method.toUpperCase() === 'GET') {
      const sep = url.includes('?') ? '&' : '?';
      url += sep + '_t=' + Date.now();
    }
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...opts
    })
    const json = await res.json()

    // Translate database lowercase keys to React expected casing
    if (json && json.hasOwnProperty('data')) {
      json.data = mapKeys(json.data)
    }
    return json
  } catch (e) {
    const serverHost = BASE.replace('/api', '')
    const message = e && e.message === 'Failed to fetch'
      ? `Cannot reach API server at ${serverHost}. Start the backend (npm run server) or update Server Settings in config.json.`
      : (e && e.message) || 'Network request failed'
    return { success: false, error: message }
  }
}

contextBridge.exposeInMainWorld('api', {
  // Configuration
  getConfig: function() {
    return ipcRenderer.invoke('app:getConfig')
  },
  
  setConfig: function(serverIP, serverPort) {
    return ipcRenderer.invoke('app:setConfig', serverIP, serverPort)
  },

  // Connection Check
  checkConnection: async function() {
    try {
      const res = await http('/health')
      return { success: res.success, data: res }
    } catch (e) {
      return { success: false, error: e.message }
    }
  },

  // Authentication
  login: function(username, password) {
    return http('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: username, password: password })
    }).then(function(res) {
      return { success: res.success, user: res.data ? res.data.user : null, error: res.error }
    })
  },
  
  authenticateUser: function(username, password) {
    return http('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: username, password: password })
    }).then(function(res) {
      return { success: res.success, user: res.data ? res.data.user : null, error: res.error }
    }).catch(function(e) {
      return { success: false, error: e.message || 'Authentication failed' }
    })
  },

  getStats: function() {
    return http('/stats')
  },

  // Items
  getItems: function(searchTerm) {
    return http(searchTerm ? '/items?search=' + encodeURIComponent(searchTerm) : '/items')
  },
  
  addItem: function(item) {
    return http('/items', { method: 'POST', body: JSON.stringify(item) })
  },
  
  updateItem: function(idOrItem, item) {
    if (item === undefined && typeof idOrItem === 'object') {
      const singleItem = idOrItem
      return http('/items/' + singleItem.ItemID, {
        method: 'PUT',
        body: JSON.stringify(singleItem)
      })
    }
    return http('/items/' + idOrItem, {
      method: 'PUT',
      body: JSON.stringify(item)
    })
  },
  
  deleteItem: function(id) {
    return http('/items/' + id, { method: 'DELETE' })
  },

  getLowStock: function() {
    return http('/items/low-stock')
  },

  // Customers
  getCustomers: function(searchTerm) {
    return http(searchTerm ? '/customers?search=' + encodeURIComponent(searchTerm) : '/customers')
  },
  
  addCustomer: function(c) {
    return http('/customers', { method: 'POST', body: JSON.stringify(c) })
  },
  
  updateCustomer: function(idOrCust, c) {
    if (c === undefined && typeof idOrCust === 'object') {
      const singleCust = idOrCust
      return http('/customers/' + singleCust.CustomerID, {
        method: 'PUT',
        body: JSON.stringify(singleCust)
      })
    }
    return http('/customers/' + idOrCust, {
      method: 'PUT',
      body: JSON.stringify(c)
    })
  },
  
  deleteCustomer: function(id) {
    return http('/customers/' + id, { method: 'DELETE' })
  },

  // Suppliers
  getSuppliers: function(searchTerm) {
    return http(searchTerm ? '/suppliers?search=' + encodeURIComponent(searchTerm) : '/suppliers')
  },
  
  addSupplier: function(s) {
    return http('/suppliers', { method: 'POST', body: JSON.stringify(s) })
  },
  
  updateSupplier: function(idOrSupp, s) {
    if (s === undefined && typeof idOrSupp === 'object') {
      const singleSupp = idOrSupp
      return http('/suppliers/' + singleSupp.SupplierID, {
        method: 'PUT',
        body: JSON.stringify(singleSupp)
      })
    }
    return http('/suppliers/' + idOrSupp, {
      method: 'PUT',
      body: JSON.stringify(s)
    })
  },
  
  deleteSupplier: function(id) {
    return http('/suppliers/' + id, { method: 'DELETE' })
  },

  // Sales
  getSales: function(limit) {
    return http(limit ? '/sales?limit=' + limit : '/sales')
  },
  
  saveSale: function(sale) {
    return http('/sales', { method: 'POST', body: JSON.stringify(sale) })
  },
  
  getSaleDetails: function(id) {
    return http('/sales/' + id + '/details')
  },

  // Purchases
  getPurchases: function(limit) {
    return http(limit ? '/purchases?limit=' + limit : '/purchases')
  },
  
  savePurchase: function(p) {
    return http('/purchases', { method: 'POST', body: JSON.stringify(p) })
  },

  getPaymentMethods: function() {
    return http('/payment-methods')
  },

  // Reports
  getSalesReport: function(from, to) {
    return http('/reports/sales?from=' + from + '&to=' + to)
  },
  
  getStockReport: function() {
    return http('/reports/stock')
  },
  
  getDebtsReport: function() {
    return http('/reports/debts')
  },

  // Stock Audit
  runStockAudit: function() {
    return http('/inventory/audit')
  },

  reconcileStock: function(items) {
    return http('/inventory/reconcile', {
      method: 'POST',
      body: JSON.stringify({ items: items })
    })
  },

  // Expenses
  getExpenses: function() {
    return http('/expenses')
  },

  addExpense: function(expense) {
    return http('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense)
    })
  },

  deleteExpense: function(id) {
    return http('/expenses/' + id, {
      method: 'DELETE'
    })
  },
})
