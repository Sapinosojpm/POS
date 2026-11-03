import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Printer,
  CreditCard,
  Banknote,
  Smartphone,
  Clock,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { db } from '../core/db';
import { useCartStore } from '../store/useCartStore';
import { printerService } from '../core/hardware/printer';
import { toast } from '../store/useToastStore';
import type { Order, OrderItem, PaymentMethod } from '../types';
import { TableRowSkeleton } from './Skeleton';

interface OrderWithItems extends Order {
  itemSummary?: string;
  items?: OrderItem[];
}

export const OrderHistoryView: React.FC = () => {
  const { currency } = useCartStore();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | PaymentMethod>('ALL');
  const [statusFilter] = useState<'ALL' | 'COMPLETED' | 'VOIDED'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const handlePaymentFilterChange = (method: 'ALL' | PaymentMethod) => {
    if (paymentFilter === method) return;
    setPaymentFilter(method);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 160);
  };

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const dbOrders = await db.orders.reverse().toArray();
      const dbItems = await db.orderItems.toArray();

      // Combine real orders with rich mock historical data for demonstration
      const MOCK_ORDERS: OrderWithItems[] = [
        {
          id: 'ord-mock-1008',
          orderNumber: 'ORD-20261103-1008',
          cashierName: 'Courtney Henry',
          shiftId: 'shift-1',
          subtotal: 420.0,
          discount: 0,
          tax: 50.4,
          total: 420.0,
          paymentMethod: 'GCASH',
          amountTendered: 420.0,
          changeDue: 0,
          status: 'COMPLETED',
          createdAt: Date.now() - 1000 * 60 * 12, // 12 mins ago
          synced: true,
          itemSummary: '2x Grilled Steak, 1x Iced Lemon Tea',
          items: [
            {
              id: 'it-1',
              orderId: 'ord-mock-1008',
              productId: 'p-1',
              productName: 'Grilled Steak',
              price: 80.0,
              quantity: 2,
              subtotal: 160.0,
            },
            {
              id: 'it-2',
              orderId: 'ord-mock-1008',
              productId: 'p-2',
              productName: 'Crispy Buffalo Wings (6pcs)',
              price: 38.0,
              quantity: 1,
              subtotal: 38.0,
            },
            {
              id: 'it-3',
              orderId: 'ord-mock-1008',
              productId: 'p-3',
              productName: 'Iced Lemon Tea',
              price: 35.0,
              quantity: 2,
              subtotal: 70.0,
            },
          ],
        },
        {
          id: 'ord-mock-1007',
          orderNumber: 'ORD-20261103-1007',
          cashierName: 'Juan Dela Cruz',
          shiftId: 'shift-1',
          subtotal: 185.0,
          discount: 0,
          tax: 22.2,
          total: 185.0,
          paymentMethod: 'CASH',
          amountTendered: 200.0,
          changeDue: 15.0,
          status: 'COMPLETED',
          createdAt: Date.now() - 1000 * 60 * 45, // 45 mins ago
          synced: true,
          itemSummary: '1x Spicy Fried Chicken, 1x Truffle Fries',
          items: [
            {
              id: 'it-4',
              orderId: 'ord-mock-1007',
              productId: 'p-4',
              productName: 'Spicy Fried Chicken',
              price: 45.7,
              quantity: 2,
              subtotal: 91.4,
            },
            {
              id: 'it-5',
              orderId: 'ord-mock-1007',
              productId: 'p-5',
              productName: 'Crispy French Fries',
              price: 18.0,
              quantity: 1,
              subtotal: 18.0,
            },
          ],
        },
        {
          id: 'ord-mock-1006',
          orderNumber: 'ORD-20261103-1006',
          cashierName: 'Courtney Henry',
          shiftId: 'shift-1',
          subtotal: 340.0,
          discount: 0,
          tax: 40.8,
          total: 340.0,
          paymentMethod: 'MAYA',
          amountTendered: 340.0,
          changeDue: 0,
          status: 'COMPLETED',
          createdAt: Date.now() - 1000 * 60 * 110, // ~2 hrs ago
          synced: true,
          itemSummary: '2x Spaghetti Carbonara, 2x Garlic Bread',
        },
        {
          id: 'ord-mock-1005',
          orderNumber: 'ORD-20261103-1005',
          cashierName: 'Courtney Henry',
          shiftId: 'shift-1',
          subtotal: 512.0,
          discount: 25.0,
          tax: 61.4,
          total: 487.0,
          paymentMethod: 'CARD',
          amountTendered: 487.0,
          changeDue: 0,
          status: 'COMPLETED',
          createdAt: Date.now() - 1000 * 60 * 180, // 3 hrs ago
          synced: true,
          itemSummary: '3x Classic Caesar Chicken Salad, 2x Fresh Lemonade',
        },
        {
          id: 'ord-mock-1004',
          orderNumber: 'ORD-20261103-1004',
          cashierName: 'Juan Dela Cruz',
          shiftId: 'shift-1',
          subtotal: 95.0,
          discount: 0,
          tax: 11.4,
          total: 95.0,
          paymentMethod: 'CASH',
          amountTendered: 100.0,
          changeDue: 5.0,
          status: 'VOIDED',
          createdAt: Date.now() - 1000 * 60 * 240, // 4 hrs ago
          synced: false,
          itemSummary: '1x Pasta Bolognese (Customer Cancelled)',
        },
      ];

      // Merge real orders from IndexedDB with mock ones
      const mappedDbOrders: OrderWithItems[] = dbOrders.map((ord) => {
        const relatedItems = dbItems.filter((i) => i.orderId === ord.id);
        const itemSummary = relatedItems.length
          ? relatedItems.map((i) => `${i.quantity}x ${i.productName}`).join(', ')
          : 'Items purchased';
        return {
          ...ord,
          itemSummary,
          items: relatedItems,
        };
      });

      setOrders([...mappedDbOrders, ...MOCK_ORDERS]);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 200);
    }
  };

  const handleReprintReceipt = async (order: OrderWithItems) => {
    try {
      const itemsToPrint: OrderItem[] = order.items && order.items.length > 0
        ? order.items
        : [
            {
              id: 'it-gen-1',
              orderId: order.id,
              productId: 'prod-gen',
              productName: order.itemSummary || 'Item Order',
              price: order.total,
              quantity: 1,
              subtotal: order.total,
            },
          ];

      await printerService.printReceipt(order, itemsToPrint);
      toast.success('Receipt Printed', `Reprinted invoice ${order.orderNumber}`);
    } catch (err) {
      console.error(err);
      toast.error('Reprint Error', 'Could not output receipt to printer.');
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.cashierName.toLowerCase().includes(search.toLowerCase()) ||
      (o.itemSummary && o.itemSummary.toLowerCase().includes(search.toLowerCase()));
    const matchesPayment = paymentFilter === 'ALL' || o.paymentMethod === paymentFilter;
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesPayment && matchesStatus;
  });

  // KPI Calculations
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const totalCash = completedOrders
    .filter((o) => o.paymentMethod === 'CASH')
    .reduce((sum, o) => sum + o.total, 0);
  const totalDigital = totalRevenue - totalCash;
  const avgOrderValue = completedOrders.length ? totalRevenue / completedOrders.length : 0;

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'CASH':
        return <Banknote className="w-3.5 h-3.5 text-emerald-600" />;
      case 'GCASH':
      case 'MAYA':
        return <Smartphone className="w-3.5 h-3.5 text-blue-600" />;
      case 'CARD':
        return <CreditCard className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <Banknote className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-6 py-5 select-none bg-slate-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            <span>Order & Transaction History</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Audit daily receipts, customer payment methods, and reprint thermal slips
          </p>
        </div>

        <button
          onClick={() => {
            const csv = 'OrderNumber,Date,Cashier,PaymentMethod,Total,Status\n' +
              filteredOrders.map(o => `${o.orderNumber},${new Date(o.createdAt).toLocaleString()},${o.cashierName},${o.paymentMethod},${o.total},${o.status}`).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Orders_Export_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            toast.success('Export Successful', 'Order history exported as CSV file.');
          }}
          className="self-start sm:self-auto px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition active:scale-95"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Revenue Today
          </span>
          <p className="text-2xl font-black text-blue-600 mt-1 tracking-tight">
            {currency}{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{completedOrders.length} Paid Invoices</span>
            <span className="text-emerald-600 font-bold">100% Offline Ready</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Cash Collected
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            {currency}{totalCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>In Cash Drawer</span>
            <span className="text-slate-600 font-medium">Physical Bills</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Digital / E-Wallet Sales
          </span>
          <p className="text-2xl font-black text-indigo-600 mt-1 tracking-tight">
            {currency}{totalDigital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>GCash, Maya & Card</span>
            <span className="text-indigo-600 font-bold">Direct Payout</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Average Ticket Value
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            {currency}{avgOrderValue.toFixed(2)}
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Per Transaction</span>
            <span className="text-slate-500 font-medium">Healthy Basket</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4 shrink-0 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order #, Cashier, or Dish..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md hover:bg-slate-200 text-slate-400 flex items-center justify-center transition"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Payment Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {(['ALL', 'CASH', 'GCASH', 'MAYA', 'CARD'] as const).map((method) => {
            const isSelected = paymentFilter === method;
            return (
              <button
                key={method}
                onClick={() => handlePaymentFilterChange(method)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {method === 'ALL' ? 'All Payments' : method}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-5">Order ID & Time</th>
                <th className="py-3 px-3">Cashier</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Total Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="font-bold text-slate-700 text-sm">No transaction records found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Completed checkout invoices will appear here automatically.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const dateStr = new Date(ord.createdAt);
                  const timeFormatted = dateStr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateFormatted = dateStr.toLocaleDateString([], { month: 'short', day: 'numeric' });

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Order Number & Timestamp */}
                      <td className="py-3 px-5">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {ord.orderNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{dateFormatted} • {timeFormatted}</span>
                        </div>
                      </td>

                      {/* Cashier Name */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-700">{ord.cashierName}</span>
                      </td>

                      {/* Items Summary */}
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                        {ord.itemSummary || 'Item details'}
                      </td>

                      {/* Payment Method Badge */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {getPaymentIcon(ord.paymentMethod)}
                          <span>{ord.paymentMethod}</span>
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-3">
                        <span className="font-black text-sm text-slate-900">
                          {currency}{ord.total.toFixed(2)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            ord.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {ord.status === 'COMPLETED' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                          )}
                          <span>{ord.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="View Receipt Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReprintReceipt(ord)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                            title="Reprint Thermal Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Receipt Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Receipt Details</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 font-sans text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Order Number:</span>
                <span className="font-mono font-bold text-slate-900">{selectedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Cashier:</span>
                <span className="font-bold text-slate-800">{selectedOrder.cashierName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Date & Time:</span>
                <span className="text-slate-700">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Payment Method:</span>
                <span className="font-bold text-blue-600">{selectedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Subtotal:</span>
                <span className="text-slate-700">{currency}{selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Tax / VAT (12%):</span>
                <span className="text-slate-700">{currency}{selectedOrder.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-black border-b border-slate-200">
                <span className="text-slate-900">Total Paid:</span>
                <span className="text-blue-600">{currency}{selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleReprintReceipt(selectedOrder);
                  setSelectedOrder(null);
                }}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Reprint Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
