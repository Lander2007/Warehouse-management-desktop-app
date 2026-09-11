// Type definitions for Electron API (HTTP-based)

export interface User {
  UserID: number
  Username: string
  Role: 'Admin' | 'Sales' | 'Warehouse'
  FullName?: string
}

export interface Item {
  ItemID: number
  ItemCode: string
  ItemName: string
  Unit: string
  MinStock: number
  CurrentStock: number
  SalePrice: number
  CostPrice: number
  CreatedDate?: string
  UpdatedDate?: string
}

export interface Customer {
  CustomerID: number
  CustomerCode: string
  CustomerName: string
  Phone?: string
  Mobile2?: string
  Email?: string
  Address?: string
  Notes?: string
  IsActive: boolean
  CreatedDate?: string
}

export interface Supplier {
  SupplierID: number
  SupplierCode: string
  SupplierName: string
  Phone?: string
  Email?: string
  Address?: string
  IsActive: boolean
  CreatedDate?: string
}

export interface PaymentMethod {
  PaymentMethodID: number
  MethodName: string
  IsActive: boolean
}

export interface Sale {
  SaleID: number
  SaleDate: string
  CustomerID?: number
  CustomerName?: string
  PaymentMethodID?: number
  TotalAmount: number
  Discount: number
  PaidAmount: number
  RemainingAmount: number
  Notes?: string
}

export interface SaleItem {
  itemID: number
  quantity: number
  unitPrice: number
  discount: number
  lineTotal: number
}

export interface Purchase {
  PurchaseID: number
  InvoiceNo: string
  PurchaseDate: string
  SupplierID?: number
  SupplierName?: string
  PaymentMethodID?: number
  TotalAmount: number
  PaidAmount: number
  RemainingAmount: number
}

export interface PurchaseItem {
  itemID: number
  quantity: number
  unitCost: number
  lineTotal: number
}

export interface DashboardStats {
  totalItems: number
  totalCustomers: number
  totalSuppliers: number
  totalSales: number
  todayRevenue: number
  totalExpenses?: number
  lowStock: Array<{
    ItemCode: string
    ItemName: string
    CurrentStock: number
    MinStock: number
  }>
  recentSales: Array<{
    SaleID: number
    SaleDate: string
    CustomerName: string
    TotalAmount: number
    PaidAmount: number
    RemainingAmount: number
  }>
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

declare global {
  interface Window {
    api: {
      // Configuration
      getConfig: () => Promise<{ serverIP: string; serverPort: number }>
      setConfig: (serverIP: string, serverPort: number) => Promise<ApiResponse>

      // Authentication
      authenticateUser: (username: string, password: string) => Promise<ApiResponse<{ user: User }>>

      // Stats
      getStats: () => Promise<ApiResponse<DashboardStats>>

      // Items
      getItems: (searchTerm?: string) => Promise<ApiResponse<Item[]>>
      addItem: (item: Partial<Item>) => Promise<ApiResponse>
      updateItem: (item: Partial<Item> & { ItemID: number }) => Promise<ApiResponse>
      deleteItem: (id: number) => Promise<ApiResponse>

      // Customers
      getCustomers: (searchTerm?: string) => Promise<ApiResponse<Customer[]>>
      addCustomer: (customer: Partial<Customer>) => Promise<ApiResponse>
      updateCustomer: (customer: Partial<Customer> & { CustomerID: number }) => Promise<ApiResponse>
      deleteCustomer: (id: number) => Promise<ApiResponse>

      // Suppliers
      getSuppliers: (searchTerm?: string) => Promise<ApiResponse<Supplier[]>>
      addSupplier: (supplier: Partial<Supplier>) => Promise<ApiResponse>
      updateSupplier: (supplier: Partial<Supplier> & { SupplierID: number }) => Promise<ApiResponse>
      deleteSupplier: (id: number) => Promise<ApiResponse>

      // Sales
      getSales: (limit?: number) => Promise<ApiResponse<Sale[]>>
      saveSale: (saleData: {
        customerID: number
        paymentMethodID: number
        totalAmount: number
        discount: number
        paidAmount: number
        remainingAmount: number
        notes?: string
        items: SaleItem[]
      }) => Promise<ApiResponse<{ saleID: number }>>

      // Purchases
      getPurchases: (limit?: number) => Promise<ApiResponse<Purchase[]>>
      savePurchase: (purchaseData: {
        invoiceNo: string
        supplierID: number
        paymentMethodID: number
        totalAmount: number
        paidAmount: number
        remainingAmount: number
        items: PurchaseItem[]
      }) => Promise<ApiResponse<{ purchaseID: number }>>

      // Payment Methods
      getPaymentMethods: () => Promise<ApiResponse<PaymentMethod[]>>

      // Check connection
      checkConnection: () => Promise<ApiResponse>

      // Reports
      getSalesReport: (from: string, to: string) => Promise<ApiResponse>
      getStockReport: () => Promise<ApiResponse>
      getDebtsReport: () => Promise<ApiResponse>

      // Stock Audit
      runStockAudit: () => Promise<ApiResponse>
      reconcileStock: (items: Array<{ itemID: number; excelStock: number }>) => Promise<ApiResponse>

      // Expenses
      getExpenses: () => Promise<ApiResponse<any[]>>
      addExpense: (expense: { description: string; amount: number; date: string }) => Promise<ApiResponse>
      deleteExpense: (id: number) => Promise<ApiResponse>
    }
  }
}

export {}
