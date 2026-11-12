import Dexie, { type Table } from 'dexie';
import type { Category, Product, Order, OrderItem, Shift, SyncEvent, HeldOrder, StockMovement } from '../../types';

export class POSDatabase extends Dexie {
  categories!: Table<Category, string>;
  products!: Table<Product, string>;
  orders!: Table<Order, string>;
  orderItems!: Table<OrderItem, string>;
  shifts!: Table<Shift, string>;
  syncQueue!: Table<SyncEvent, string>;
  heldOrders!: Table<HeldOrder, string>;
  stockLedger!: Table<StockMovement, string>;

  constructor() {
    super('UniversalHybridPOS_DB');

    this.version(1).stores({
      categories: 'id, name',
      products: 'id, name, barcode, sku, categoryId, price',
      orders: 'id, orderNumber, cashierName, shiftId, createdAt, synced, status',
      orderItems: 'id, orderId, productId',
      shifts: 'id, cashierName, openedAt, status',
      syncQueue: 'id, entity, action, createdAt, synced'
    });

    this.version(2).stores({
      categories: 'id, name',
      products: 'id, name, barcode, sku, categoryId, price',
      orders: 'id, orderNumber, cashierName, shiftId, createdAt, synced, status',
      orderItems: 'id, orderId, productId',
      shifts: 'id, cashierName, openedAt, status',
      syncQueue: 'id, entity, action, createdAt, synced',
      heldOrders: 'id, tag, cashierName, createdAt'
    });

    this.version(3).stores({
      categories: 'id, name',
      products: 'id, name, barcode, sku, categoryId, price',
      orders: 'id, orderNumber, cashierName, shiftId, createdAt, synced, status',
      orderItems: 'id, orderId, productId',
      shifts: 'id, cashierName, openedAt, status',
      syncQueue: 'id, entity, action, createdAt, synced',
      heldOrders: 'id, tag, cashierName, createdAt',
      stockLedger: 'id, productId, reason, createdAt'
    });
  }
}

export const db = new POSDatabase();
