import React, { useState } from 'react';
import {
  ShieldAlert,
  X,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Lock,
  Printer,
  PackageCheck,
  Delete,
} from 'lucide-react';
import { db } from '../core/db';
import { useCartStore } from '../store/useCartStore';
import { useSettingsStore } from './../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { printerService } from '../core/hardware/printer';
import { playScanSuccessSound, playScanErrorSound, triggerHaptic } from '../core/hardware/scannerFeedback';
import { toast } from '../store/useToastStore';
import type { Order, OrderItem } from '../types';

interface OrderWithItems extends Order {
  itemSummary?: string;
  items?: OrderItem[];
}

interface VoidOrderModalProps {
  order: OrderWithItems;
  onClose: () => void;
  onVoidSuccess: (voidedOrder: OrderWithItems) => void;
}

const VOID_REASONS = [
  'Cashier Punch Error (Wrong item / qty)',
  'Wrong Payment Method (e.g. Cash vs GCash)',
  'Customer Cancellation / Walkout',
  'Defective / Expired / Returned Product',
  'Customer Dispute / Return',
  'Other / Manual Manager Override',
];

export const VoidOrderModal: React.FC<VoidOrderModalProps> = ({
  order,
  onClose,
  onVoidSuccess,
}) => {
  const { currency } = useCartStore();
  const { settings } = useSettingsStore();
  const { users } = useAuthStore();

  const [pin, setPin] = useState('');
  const [selectedReason, setSelectedReason] = useState<string>(VOID_REASONS[0]);
  const [customNote, setCustomNote] = useState('');
  const [restockInventory, setRestockInventory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [voidCompleted, setVoidCompleted] = useState<OrderWithItems | null>(null);

  const handleKeypadPress = (val: string) => {
    triggerHaptic();
    if (pin.length < 4) {
      setPin((prev) => prev + val);
      setPinError(false);
      setErrorMessage('');
    }
  };

  const handleBackspace = () => {
    triggerHaptic();
    setPin((prev) => prev.slice(0, -1));
    setPinError(false);
    setErrorMessage('');
  };

  const handleClearPin = () => {
    triggerHaptic();
    setPin('');
    setPinError(false);
    setErrorMessage('');
  };

  const verifyManagerPin = (inputPin: string): { valid: boolean; managerName: string } => {
    // 1. Check against Settings Manager PIN (default 1234)
    if (settings.managerPin && inputPin === settings.managerPin) {
      return { valid: true, managerName: 'Store Manager' };
    }

    // 2. Check against any Staff with MANAGER or ADMIN role
    const matchedUser = users.find(
      (u) => (u.role === 'MANAGER' || u.role === 'ADMIN') && u.pin === inputPin
    );
    if (matchedUser) {
      return { valid: true, managerName: matchedUser.name };
    }

    // Fallback: if user is Courtney/demo and role is manager
    return { valid: false, managerName: '' };
  };

  const handleExecuteVoid = async () => {
    if (pin.length !== 4) {
      setPinError(true);
      setErrorMessage('Please enter a 4-digit Manager PIN');
      playScanErrorSound();
      triggerHaptic('error');
      return;
    }

    const { valid, managerName } = verifyManagerPin(pin);
    if (!valid) {
      setPinError(true);
      setErrorMessage('Invalid Manager PIN. Manager authorization required.');
      playScanErrorSound();
      triggerHaptic('error');
      setPin('');
      return;
    }

    setIsSubmitting(true);
    const finalReason = customNote.trim()
      ? `${selectedReason} - ${customNote.trim()}`
      : selectedReason;
    const voidedAt = Date.now();

    try {
      // Fetch fresh items if missing
      let itemsToProcess = order.items || [];
      if (itemsToProcess.length === 0) {
        itemsToProcess = await db.orderItems.where('orderId').equals(order.id).toArray();
      }

      // 1. Check if order exists in IndexedDB
      const existingOrder = await db.orders.get(order.id);

      if (existingOrder) {
        // Execute atomic database transactions for real orders
        await db.transaction('rw', [db.orders, db.products, db.stockLedger, db.shifts, db.syncQueue], async () => {
          // Update Order Status to VOIDED
          await db.orders.update(order.id, {
            status: 'VOIDED',
            voidReason: finalReason,
            voidedAt,
            voidedBy: managerName,
            synced: false,
          });

          // Restock Inventory if selected
          if (restockInventory && itemsToProcess.length > 0) {
            for (const item of itemsToProcess) {
              const product = await db.products.get(item.productId);
              if (product) {
                const currentStock = typeof product.stock === 'number' ? product.stock : 0;
                const newStock = currentStock + item.quantity;
                await db.products.update(item.productId, { stock: newStock });

                // Append to Stock Movement Ledger
                await db.stockLedger.add({
                  id: crypto.randomUUID ? crypto.randomUUID() : `stk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                  productId: item.productId,
                  delta: item.quantity,
                  reason: 'VOID',
                  orderId: order.id,
                  notes: `Voided Order ${order.orderNumber}: ${finalReason}`,
                  createdAt: voidedAt,
                });
              }
            }
          }

          // Adjust Active Shift Financials if order belongs to currently open shift
          const activeShift = await db.shifts.where('status').equals('OPEN').first();
          if (activeShift && (order.shiftId === activeShift.id || !order.shiftId)) {
            const shiftUpdates: Partial<typeof activeShift> = {};
            if (order.paymentMethod === 'CASH') {
              shiftUpdates.totalCashSales = Math.max(0, (activeShift.totalCashSales || 0) - order.total);
              shiftUpdates.expectedCashInDrawer = Math.max(
                activeShift.startingFloat,
                (activeShift.expectedCashInDrawer || 0) - order.total
              );
            } else {
              shiftUpdates.totalNonCashSales = Math.max(0, (activeShift.totalNonCashSales || 0) - order.total);
            }
            await db.shifts.update(activeShift.id, shiftUpdates);
          }

          // Queue sync event for cloud PostgreSQL gateway
          await db.syncQueue.add({
            id: crypto.randomUUID ? crypto.randomUUID() : `sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            entity: 'order',
            action: 'UPDATE',
            payload: {
              id: order.id,
              status: 'VOIDED',
              voidReason: finalReason,
              voidedAt,
              voidedBy: managerName,
            },
            createdAt: voidedAt,
            synced: false,
          });
        });
      }

      playScanSuccessSound();
      triggerHaptic('success');

      const updatedOrder: OrderWithItems = {
        ...order,
        status: 'VOIDED',
        voidReason: finalReason,
        voidedAt,
        voidedBy: managerName,
        items: itemsToProcess,
      };

      setVoidCompleted(updatedOrder);
      toast.success(`Order ${order.orderNumber} successfully VOIDED by ${managerName}`);
      onVoidSuccess(updatedOrder);
    } catch (err) {
      console.error('Failed to void order:', err);
      toast.error('Failed to execute void transaction. Please try again.');
      setErrorMessage('Database error occurred while voiding order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintVoidReceipt = async () => {
    if (!voidCompleted) return;
    try {
      const items = voidCompleted.items || [];
      await printerService.printReceipt(voidCompleted, items);
      toast.success('Void receipt sent to thermal printer');
    } catch (err) {
      console.error('Failed to print void receipt:', err);
      toast.error('Printer not connected or failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-rose-50 border-b border-rose-100 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-slate-900">
                  {voidCompleted ? 'Order Voided Successfully' : 'Void / Refund Transaction'}
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  Manager PIN Required
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {voidCompleted
                  ? `Order ${order.orderNumber} is now marked as VOIDED`
                  : `Approving cancellation of ${order.orderNumber} (${currency}${order.total.toFixed(2)})`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white/80 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {voidCompleted ? (
          /* Success Screen with Print Void Receipt */
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-black text-slate-900">Transaction Voided</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Order <span className="font-mono font-bold text-slate-900">{voidCompleted.orderNumber}</span> has been voided and cancelled.
                {restockInventory && ' All product stock has been restored back to inventory.'}
              </p>
            </div>

            {/* Void Summary Card */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Approving Manager:</span>
                <span className="font-bold text-slate-800">{voidCompleted.voidedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Void Reason:</span>
                <span className="font-bold text-rose-600">{voidCompleted.voidReason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Original Amount:</span>
                <span className="font-black text-slate-900">{currency}{voidCompleted.total.toFixed(2)} ({voidCompleted.paymentMethod})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stock Restocked:</span>
                <span className="font-bold text-emerald-600">
                  {restockInventory ? '✓ Returned to shelves' : 'No stock changes'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handlePrintVoidReceipt}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
              >
                <Printer className="w-4 h-4 text-rose-400" />
                <span>Print Void Slip</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Void Form */
          <div className="p-4 sm:p-5 space-y-4">
            {/* Warning Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <span className="font-bold">Managerial Audit Warning:</span> Voiding this sale will cancel the transaction, deduct the amount from active shift cash drawers, and record a permanent audit entry.
              </div>
            </div>

            {/* Order Items Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 border-b border-slate-200/80 pb-1.5">
                <span>Items in Order ({order.items?.length || 0})</span>
                <span className="font-mono text-slate-900">{order.paymentMethod} • {currency}{order.total.toFixed(2)}</span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 text-xs text-slate-700 pr-1">
                {order.items && order.items.length > 0 ? (
                  order.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center py-0.5">
                      <span className="truncate pr-2">
                        <span className="font-bold text-slate-900">{it.quantity}x</span> {it.productName}
                      </span>
                      <span className="font-medium text-slate-600 shrink-0">
                        {currency}{it.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 italic">
                    {order.itemSummary || 'Item details recorded in order log'}
                  </div>
                )}
              </div>
            </div>

            {/* Void Reason Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Reason for Cancellation / Void *</span>
                <span className="text-[11px] font-normal text-slate-400">Required</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500 transition cursor-pointer"
              >
                {VOID_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Note */}
            <div>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Optional explanation notes (e.g. customer returned defective pod)"
                className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500 transition placeholder:text-slate-400"
              />
            </div>

            {/* Restock Inventory Toggle */}
            <label className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition cursor-pointer">
              <input
                type="checkbox"
                checked={restockInventory}
                onChange={(e) => setRestockInventory(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 transition cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Return items to inventory stock</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Quantities will automatically be added back to shelf stock with ledger entry 'VOID'.
                </div>
              </div>
            </label>

            {/* Manager PIN Keypad Gate */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  <span>Enter 4-Digit Manager PIN</span>
                </div>
                <span className="text-[11px] text-slate-400">Default: 1234</span>
              </div>

              {/* PIN Indicator Dots */}
              <div className="flex items-center justify-center gap-3 py-1">
                {[0, 1, 2, 3].map((idx) => {
                  const filled = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full transition-all duration-150 ${
                        filled
                          ? 'bg-rose-600 scale-110 shadow-xs'
                          : 'bg-slate-200 border border-slate-300'
                      } ${pinError ? 'animate-shake bg-rose-400' : ''}`}
                    />
                  );
                })}
              </div>

              {errorMessage && (
                <div className="text-center text-xs font-bold text-rose-600 animate-in fade-in">
                  {errorMessage}
                </div>
              )}

              {/* On-Screen Numeric Keypad */}
              <div className="grid grid-cols-3 gap-1.5 max-w-[260px] mx-auto pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 font-bold text-sm text-slate-800 transition flex items-center justify-center shadow-2xs"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClearPin}
                  className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition flex items-center justify-center"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 font-bold text-sm text-slate-800 transition flex items-center justify-center shadow-2xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition flex items-center justify-center"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pin.length !== 4 || isSubmitting}
                onClick={handleExecuteVoid}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 transition active:scale-95"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>{isSubmitting ? 'Voiding...' : 'Authorize & Void Order'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
