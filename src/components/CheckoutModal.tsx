import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  Printer,
  CreditCard,
  Banknote,
  Smartphone,
  Clock,
  Wallet,
  Share2,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { db } from '../core/db';
import { printerService } from '../core/hardware/printer';
import { toast } from '../store/useToastStore';
import { useAuthStore } from '../store/useAuthStore';
import type { Order, OrderItem, PaymentMethod } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCompleted: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onOrderCompleted }) => {
  const {
    items,
    getTotal,
    getSubtotal,
    getDiscountBreakdown,
    discount,
    cashierName,
    clearCart,
    currency,
    orderType,
    tableLabel,
  } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [tenderedStr, setTenderedStr] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const { settings } = useSettingsStore();
  const { currentUser } = useAuthStore();
  const [shouldPrintReceipt, setShouldPrintReceipt] = useState<boolean>(settings.autoPrintReceipt !== false);

  useEffect(() => {
    setShouldPrintReceipt(settings.autoPrintReceipt !== false);
  }, [settings.autoPrintReceipt, isOpen]);

  const total = getTotal();
  const breakdown = getDiscountBreakdown();

  const enabledMethods = settings.enabledPaymentMethods || {
    cash: true,
    gcash: true,
    maya: true,
    card: false,
    paylater: false,
  };

  const allCheckoutOptions: { id: PaymentMethod; label: string; icon: any; enabled: boolean }[] = [
    { id: 'CASH', label: 'Cash', icon: Banknote, enabled: enabledMethods.cash !== false },
    { id: 'GCASH', label: 'GCash', icon: Smartphone, enabled: !!enabledMethods.gcash },
    { id: 'MAYA', label: 'Maya', icon: Wallet, enabled: !!enabledMethods.maya },
    { id: 'CARD', label: 'Card', icon: CreditCard, enabled: !!enabledMethods.card },
    { id: 'PAYLATER', label: 'Paylater', icon: Clock, enabled: !!enabledMethods.paylater },
  ];

  const activeCheckoutOptions = allCheckoutOptions.filter((opt) => opt.enabled);
  const optionsToRender = activeCheckoutOptions.length > 0 ? activeCheckoutOptions : [allCheckoutOptions[0]];

  useEffect(() => {
    // If current payment method is disabled, fallback to first enabled option
    if (!optionsToRender.some((opt) => opt.id === paymentMethod)) {
      setPaymentMethod(optionsToRender[0].id);
    }
  }, [optionsToRender, paymentMethod]);

  // NOTE: Must stay AFTER every hook call (Rules of Hooks).
  if (!isOpen) return null;

  const tendered = parseFloat(tenderedStr) || 0;
  const changeDue = Math.max(0, tendered - total);
  const isExactOrOver = paymentMethod !== 'CASH' || tendered >= total;

  const handleQuickCash = (amount: number) => {
    setTenderedStr(amount.toString());
  };

  const handleNumpad = (char: string) => {
    if (char === 'CLEAR') {
      setTenderedStr('');
    } else if (char === 'BACK') {
      setTenderedStr((prev) => prev.slice(0, -1));
    } else if (char === '.') {
      if (!tenderedStr.includes('.')) setTenderedStr((prev) => (prev ? prev + '.' : '0.'));
    } else {
      setTenderedStr((prev) => prev + char);
    }
  };

  const handleCompleteSale = async (autoPrint: boolean = true) => {
    if (!isExactOrOver || isProcessing) return;
    setIsProcessing(true);

    try {
      const orderId = `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

      const isDiningEnabled = settings.enableDiningOptions || settings.businessType === 'RESTAURANT';

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        cashierName: cashierName || currentUser?.name || 'Cashier',
        shiftId: 'shift-current',
        orderType: isDiningEnabled ? orderType : undefined,
        tableLabel: tableLabel.trim() || undefined,
        subtotal: getSubtotal(),
        discount: breakdown.discountAmount,
        discountType: discount?.type,
        discountCustomerName: discount?.customerName,
        discountIdNumber: discount?.idNumber,
        vatExemptAmount: breakdown.vatExemptAmount,
        seniorDiscountAmount: breakdown.discountAmount,
        tax: breakdown.tax,
        total,
        paymentMethod,
        amountTendered: paymentMethod === 'CASH' ? tendered : total,
        changeDue: paymentMethod === 'CASH' ? changeDue : 0,
        status: 'COMPLETED',
        createdAt: Date.now(),
        synced: false,
      };

      const orderItems: OrderItem[] = items.map((item) => ({
        id: `item-${Date.now()}-${item.product.id}`,
        orderId,
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
      }));

      await db.transaction('rw', db.orders, db.orderItems, db.products, db.syncQueue, async () => {
        await db.orders.add(newOrder);
        await db.orderItems.bulkAdd(orderItems);

        for (const it of items) {
          const prod = await db.products.get(it.product.id);
          if (prod) {
            await db.products.update(it.product.id, {
              stock: Math.max(0, prod.stock - it.quantity),
            });
          }
        }

        await db.syncQueue.add({
          id: `sync-${orderId}`,
          entity: 'order',
          action: 'CREATE',
          payload: { order: newOrder, items: orderItems },
          createdAt: Date.now(),
          synced: false,
        });
      });

      setCompletedOrder(newOrder);

      if (autoPrint) {
        await printerService.printReceipt(newOrder, orderItems);
      }

      onOrderCompleted(newOrder);
    } catch (err) {
      console.error('Failed to complete sale:', err);
      toast.error('Sale Failed', 'Error recording sale to local storage.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinish = () => {
    clearCart();
    setCompletedOrder(null);
    setTenderedStr('');
    onClose();
  };

  const handleShareReceipt = async () => {
    if (!completedOrder) return;
    const itemsSummary = items
      .map((i) => `${i.quantity}x ${i.product.name} (${currency}${(i.product.price * i.quantity).toFixed(2)})`)
      .join('\n');
    const shareText = `🏪 ${settings.storeName}\n🧾 Order: ${completedOrder.orderNumber}\n📅 Date: ${new Date(completedOrder.createdAt).toLocaleString()}\n\nItems:\n${itemsSummary}\n\nTotal Paid: ${currency}${completedOrder.total.toFixed(2)} (${completedOrder.paymentMethod})\nChange Due: ${currency}${completedOrder.changeDue.toFixed(2)}\n\nThank you for your purchase!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt ${completedOrder.orderNumber}`,
          text: shareText,
        });
        toast.success('E-Receipt Shared', 'Receipt shared via device share dialog');
        return;
      } catch (err) {
        // User cancelled or share dismissed
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('E-Receipt Copied!', 'Text receipt copied to clipboard. Ready to paste into SMS or chat!');
    } catch {
      toast.info('E-Receipt Info', shareText);
    }
  };

  const handleManualPrint = async () => {
    if (!completedOrder) return;
    const orderItems: OrderItem[] = items.map((item) => ({
      id: `item-${Date.now()}-${item.product.id}`,
      orderId: completedOrder.id,
      productId: item.product.id,
      productName: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
    }));
    try {
      await printerService.printReceipt(completedOrder, orderItems);
      toast.success('Receipt Printed', `Sent invoice ${completedOrder.orderNumber} to printer`);
    } catch (err) {
      console.error(err);
      toast.error('Printer Not Available', 'Could not output to printer. Ensure device is paired.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div>
            <h3 className="font-bold text-base text-slate-900">Checkout & Payment</h3>
            <p className="text-xs text-slate-500 mt-0.5">Order Total Due: <span className="font-bold text-slate-900 tabular-nums">{currency}{total.toFixed(2)}</span></p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition active:scale-95"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {completedOrder ? (
          /* Order Complete Celebration Screen */
          <div className="p-6 sm:p-7 flex flex-col items-center justify-center text-center space-y-3.5">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100 shadow-2xs">
              <CheckCircle className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900">Payment Completed!</h2>
              <p className="text-xs text-slate-400 mt-0.5 font-mono font-medium">{completedOrder.orderNumber}</p>
            </div>

            {/* Change Due Highlight Box */}
            {completedOrder.paymentMethod === 'CASH' && (
              <div className="w-full bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Change Due</span>
                <span className="text-2xl font-black text-blue-600">
                  {currency}{completedOrder.changeDue.toFixed(2)}
                </span>
              </div>
            )}

            {/* Digital Receipt Breakdown Card */}
            <div className="w-full bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Payment Method:</span>
                <span className="font-bold text-slate-800">{completedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Amount Tendered:</span>
                <span className="font-bold text-slate-800">{currency}{completedOrder.amountTendered.toFixed(2)}</span>
              </div>
              {completedOrder.discount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Discount Saved:</span>
                  <span>-{currency}{completedOrder.discount.toFixed(2)}</span>
                </div>
              )}
              {completedOrder.vatExemptAmount && completedOrder.vatExemptAmount > 0 ? (
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>VAT Exemption:</span>
                  <span>-{currency}{completedOrder.vatExemptAmount.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 text-slate-900">
                <span>Total Paid:</span>
                <span className="text-blue-600 font-black">{currency}{completedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons: Next Order, Share E-Receipt, Print Receipt */}
            <div className="w-full space-y-2 pt-1">
              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Start Next Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={handleShareReceipt}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition active:scale-95 flex items-center justify-center gap-1.5"
                  title="Share digital slip via SMS, Messenger, or copy to clipboard"
                >
                  <Share2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Share E-Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={handleManualPrint}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition active:scale-95 flex items-center justify-center gap-1.5"
                  title="Print paper receipt"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print Slip</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Payment Methods & Numpad Screen */
          <div className="p-5 overflow-y-auto space-y-3.5 scrollbar-none">
            {/* Payment Method Selector Pills (Dynamic from Settings) */}
            <div className={`grid ${optionsToRender.length <= 3 ? `grid-cols-${optionsToRender.length}` : 'grid-cols-2 sm:grid-cols-4'} gap-2`}>
              {optionsToRender.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    setPaymentMethod(id as PaymentMethod);
                    if (id !== 'CASH') setTenderedStr(total.toString());
                  }}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg border text-xs font-bold transition-all active:scale-95 ${
                    paymentMethod === id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1 stroke-[2]" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Total Due & Change Summary Card */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/90">
              <div>
                <span className="text-xs font-semibold text-slate-500">Total Due</span>
                <p className="text-2xl font-black text-slate-900 mt-0.5 tabular-nums">
                  {currency}{total.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-500">Change Due</span>
                <p className={`text-2xl font-black mt-0.5 tabular-nums ${tendered >= total && changeDue > 0 ? 'text-blue-600' : tendered >= total ? 'text-emerald-600' : 'text-slate-300'}`}>
                  {currency}{changeDue.toFixed(2)}
                </p>
              </div>
            </div>

            {paymentMethod === 'CASH' && (
              <>
                {/* Quick Cash Denomination Buttons */}
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(total)}
                    className="flex-1 h-9 px-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg border border-blue-200/90 active:scale-95 transition shadow-2xs tabular-nums"
                  >
                    Exact ({currency}{Math.ceil(total)})
                  </button>
                  {[50, 100, 500, 1000].map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => handleQuickCash(bill)}
                      className="flex-1 h-9 px-1 bg-slate-100 hover:bg-slate-200/90 text-slate-700 font-bold text-xs rounded-lg border border-slate-200/80 active:scale-95 transition shadow-2xs tabular-nums"
                    >
                      {currency}{bill}
                    </button>
                  ))}
                </div>

                {/* Amount Tendered Display Box */}
                <div className="flex items-center justify-between px-4 py-3 bg-white border-2 border-blue-500 rounded-xl shadow-xs">
                  <span className="text-xs font-bold text-slate-500">Cash Received:</span>
                  <span className="text-2xl font-black text-slate-900 tabular-nums">
                    {currency}{tenderedStr || '0'}
                  </span>
                </div>

                {/* Modern Tactile POS Numpad */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'BACK'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleNumpad(key)}
                      className="h-12 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-lg rounded-xl border border-slate-200/90 transition-all active:scale-95 flex items-center justify-center shadow-2xs"
                    >
                      {key === 'BACK' ? '⌫' : key}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Paperless Mode / Thermal Receipt Toggle Switch */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition">
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={shouldPrintReceipt}
                  onChange={(e) => setShouldPrintReceipt(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 transition cursor-pointer"
                />
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print physical thermal receipt</span>
                </div>
              </label>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  shouldPrintReceipt
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {shouldPrintReceipt ? 'Printer ON' : 'Paperless Mode'}
              </span>
            </div>

            {/* Complete Payment Button */}
            <button
              disabled={!isExactOrOver || isProcessing}
              onClick={() => handleCompleteSale(shouldPrintReceipt)}
              className={`w-full py-3.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${
                !isExactOrOver || isProcessing
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : shouldPrintReceipt
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : shouldPrintReceipt ? (
                <Printer className="w-4 h-4 stroke-[2]" />
              ) : (
                <CheckCircle className="w-4 h-4 stroke-[2]" />
              )}
              <span>
                {isProcessing
                  ? 'Processing Order...'
                  : shouldPrintReceipt
                  ? 'Complete & Print Receipt'
                  : `Complete Order (${currency}${total.toFixed(2)})`}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
