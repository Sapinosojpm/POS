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

export type PaymentMethod = 'CASH' | 'GCASH' | 'MAYA' | 'CARD';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
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
