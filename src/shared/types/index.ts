export type BookClass = 
  | 'Playgroup' 
  | 'Nursery' 
  | 'Prep' 
  | 'Pre 1'
  | '1st' 
  | '2nd' 
  | '3rd' 
  | '4th' 
  | '5th' 
  | '6th' 
  | '7th' 
  | '8th' 
  | '9th' 
  | '10th' 
  | '11th' 
  | '12th' 
  | 'O/A-Level' 
  | 'General' 
  | 'Other'
  | (string & {});

export type BookCategory = 
  | 'Textbook' 
  | 'Notes' 
  | 'Guide' 
  | 'Model Papers' 
  | 'Solved Papers' 
  | 'Activity Book'
  | 'Stationery' 
  | 'Urdu Literature' 
  | 'Islamic' 
  | 'Novel' 
  | 'Other';

export type PaymentMethod = 'Cash' | 'Bank' | 'JazzCash' | 'Easypaisa' | 'Udhaar' | 'COD' | 'Card' | 'QR';

export type OrderStatus = 'New' | 'Confirmed' | 'Processing' | 'Ready' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';

export type StockMovementReason = 
  | 'Purchase' 
  | 'Shop Sale' 
  | 'Website Order' 
  | 'Website Order Delivered' 
  | 'Website Order Cancelled' 
  | 'Sale Return' 
  | 'Sale Cancelled' 
  | 'Damage' 
  | 'Loss' 
  | 'Manual Adjustment' 
  | 'Initial Stock';

export type UserRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'CASHIER' | 'MANAGER';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  email?: string;
  phone?: string;
}

export interface Book {
  id: string;
  title: string;
  urduTitle?: string;
  class: BookClass;
  subject: string;
  author: string;
  publisher: string;
  isbn: string;
  barcode: string;
  purchasePrice: number;
  salePrice: number;
  physicalStock: number; // actual items physically in shop
  reservedStock: number; // items reserved for active website orders
  availableStock: number; // physicalStock - reservedStock
  minStockAlert: number;
  rackShelf: string;
  sessionYear: string;
  image: string;
  category: BookCategory;
  description: string;
  language: 'Urdu' | 'English' | 'Bilingual' | 'Other';
  edition?: string;
  websiteVisible: boolean;
  featured: boolean;
  bestSeller: boolean;
  isActive: boolean;
  keywords?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  bookId: string;
  book: Book;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface SaleItem {
  bookId: string;
  title: string;
  urduTitle?: string;
  isbn?: string;
  barcode?: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  discount: number; // item level discount in PKR
  discountPercent?: number;
  subtotal: number;
  profit: number;
}

export interface PaymentDetails {
  method: PaymentMethod;
  amount: number;
  receivedAmount?: number;
  changeAmount?: number;
  referenceId?: string;
  authCode?: string;
  cardType?: string;
  terminalId?: string;
  qrPayload?: string;
  qrProvider?: 'Raast' | 'JazzCash' | 'Easypaisa' | 'Bank' | 'Generic';
  verificationStatus?: 'Verified' | 'Pending_Verification' | 'Manual_Approved' | 'Failed';
  verifiedAt?: string;
  notes?: string;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  date: string; // ISO string
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  itemDiscount: number;
  billDiscount: number;
  tax?: number;
  taxRate?: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  paymentDetails?: PaymentDetails;
  notes?: string;
  cashierName: string;
  cashierId?: string;
  status: 'Completed' | 'Cancelled' | 'Returned';
  createdAt: string;
}

export interface PurchaseItem {
  bookId: string;
  title: string;
  quantity: number;
  purchasePrice: number;
  discount: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  purchaseInvoiceNo: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  date: string;
  description: string;
  type: 'Debit' | 'Credit'; // Debit = Customer owes money (credit purchase), Credit = Customer paid money
  debit: number;
  credit: number;
  balanceAfter: number;
  referenceType?: 'Sale' | 'Payment' | 'Adjustment';
  referenceId?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  totalPurchases: number;
  totalPaid: number;
  totalUdhaar: number;
  remainingBalance: number; // positive means customer owes shop
  createdAt: string;
  updatedAt: string;
}

export interface SupplierTransaction {
  id: string;
  supplierId: string;
  date: string;
  description: string;
  type: 'Debit' | 'Credit'; // Credit = We owe supplier (purchase), Debit = We paid supplier
  debit: number;
  credit: number;
  balanceAfter: number;
  referenceType?: 'Purchase' | 'Payment' | 'Adjustment';
  referenceId?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  address?: string;
  notes?: string;
  totalPurchases: number;
  totalPaid: number;
  remainingPayable: number; // positive means we owe supplier
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteOrderItem {
  bookId: string;
  title: string;
  image: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface WebsiteOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  city: string;
  items: WebsiteOrderItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: 'COD' | 'Bank' | 'JazzCash' | 'Easypaisa' | 'WhatsApp';
  paymentStatus: 'Pending' | 'Paid';
  orderStatus: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  date: string;
  time: string;
  bookId: string;
  bookTitle: string;
  previousPhysicalStock: number;
  change: number; // +10, -2, etc.
  newPhysicalStock: number;
  previousAvailableStock: number;
  newAvailableStock: number;
  reason: StockMovementReason;
  userName: string;
  referenceType?: 'POS Sale' | 'Website Order' | 'Purchase' | 'Manual' | 'Order Status Change' | 'Return';
  referenceId?: string;
  notes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  action: string;
  entityType: 'Book' | 'Sale' | 'Purchase' | 'Customer' | 'Supplier' | 'Order' | 'Stock' | 'Settings';
  entityId?: string;
  details: string;
}

export interface ShopSettings {
  shopName: string;
  shopUrduName: string;
  tagline: string;
  shopLogo: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  city: string;
  currency: string;
  receiptHeader: string;
  receiptFooter: string;
  defaultLowStockThreshold: number;
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  taxRate?: number; // sales tax % if enabled
  taxEnabled?: boolean;
  bankDetails: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
  };
  jazzCashNumber: string;
  easypaisaNumber: string;
  raastId?: string;
}

export interface DashboardStats {
  todaySalesTotal: number;
  todaySalesCount: number;
  todayCashSales: number;
  todayOnlineSales: number;
  todayUdhaarSales: number;
  todayCardSales?: number;
  todayQrSales?: number;
  todayEstimatedProfit: number;
  lowStockCount: number;
  totalStockItems: number;
  totalStockValuation: number;
  totalCustomerUdhaar: number;
  totalSupplierPayables: number;
  totalWebsiteOrders: number;
  pendingWebsiteOrders: number;
  recentSales: Sale[];
  recentWebsiteOrders: WebsiteOrder[];
  lowStockBooks: Book[];
  salesByPaymentMethod: {
    method: PaymentMethod;
    amount: number;
    count: number;
  }[];
  salesTrendLast7Days: {
    date: string;
    total: number;
    profit: number;
  }[];
}

// Dedicated POS System Specific Types
export interface POSDashboardMetrics {
  todaySales: number;
  todayTransactions: number;
  totalRevenue: number;
  pendingPaymentsCount: number;
  pendingPaymentsAmount: number;
  lowStockCount: number;
  cashSalesTotal: number;
  cardSalesTotal: number;
  qrSalesTotal: number;
  khataSalesTotal: number;
  averageBasketValue: number;
  recentTransactions: Sale[];
  lowStockItems: Book[];
  topSellingToday: {
    bookId: string;
    title: string;
    quantity: number;
    total: number;
  }[];
}

export interface POSCartItem {
  book: Book;
  quantity: number;
  unitPrice: number;
  discount: number; // line discount in PKR
  discountPercent?: number;
  subtotal: number;
}

export interface ParkedCart {
  id: string;
  customerName: string;
  items: POSCartItem[];
  itemDiscount: number;
  billDiscount: number;
  customerId?: string;
  timestamp: string;
  notes?: string;
}

export interface QRPayloadValidationResult {
  raw: string;
  provider: 'Raast' | 'JazzCash' | 'Easypaisa' | 'Bank' | 'Generic';
  merchantName?: string;
  merchantId?: string;
  referenceId: string;
  amount?: number;
  expectedAmount: number;
  currency: string;
  timestamp: string;
  isValid: boolean;
  verificationStatus: 'Verified' | 'Pending_Verification' | 'Invalid' | 'Expired';
  message: string;
}
