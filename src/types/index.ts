export interface Category {
  id: string;
  name: string;
  icon?: string;
  image?: string;
  color?: string;
}

export interface Product {
  id: string;
  name: string;
  barcode: string;
  sku: string;
  categoryId: string;
  price: number; // in minor units (e.g., PHP or Cents)
  cost: number;
  stock: number;
  image?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // custom discount per line
  notes?: string;
}

export type PaymentMethod = 'CASH' | 'GCASH' | 'MAYA' | 'CARD' | 'PAYLATER';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export type DiscountType = 'NONE' | 'SENIOR' | 'PWD' | 'PERCENT' | 'FIXED';

export interface CartDiscount {
  type: DiscountType;
  label: string;
  value: number; // percentage (e.g. 20) or fixed amount (e.g. 50)
  customerName?: string;
  idNumber?: string;
  totalGuests?: number;
  seniorCount?: number;
}

export interface HeldOrder {
  id: string; // UUIDv4
  tag: string; // e.g. "Hold #1" or "Table 4"
  cashierName: string;
  items: CartItem[];
  discount: CartDiscount | null;
  subtotal: number;
  total: number;
  createdAt: number; // timestamp
}

export interface Order {
  id: string; // UUIDv4
  orderNumber: string; // e.g. ORD-20261103-0001
  cashierName: string;
  shiftId: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  discountType?: DiscountType;
  discountCustomerName?: string;
  discountIdNumber?: string;
  vatExemptAmount?: number;
  seniorDiscountAmount?: number;
  paymentMethod: PaymentMethod;
  amountTendered: number;
  changeDue: number;
  status: 'COMPLETED' | 'VOIDED' | 'REFUNDED';
  createdAt: number; // timestamp
  synced: boolean;
}

export interface Shift {
  id: string;
  cashierName: string;
  openedAt: number;
  closedAt?: number;
  startingFloat: number;
  totalCashSales: number;
  totalNonCashSales: number;
  expectedCashInDrawer: number;
  actualCashCounted?: number;
  discrepancy?: number;
  status: 'OPEN' | 'CLOSED';
}

export interface SyncEvent {
  id: string;
  entity: 'order' | 'product' | 'shift' | 'stock';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  createdAt: number;
  synced: boolean;
}

export interface StockMovement {
  id: string; // UUIDv4
  productId: string;
  delta: number;
  reason: 'RESTOCK' | 'ADJUSTMENT' | 'SALE' | 'INITIAL' | 'VOID';
  orderId?: string;
  notes?: string;
  createdAt: number;
}
