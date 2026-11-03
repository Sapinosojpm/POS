import React, { useState } from 'react';
import { X, CheckCircle, Printer, CreditCard, Banknote, Smartphone, Clock } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { db } from '../core/db';
import { printerService } from '../core/hardware/printer';
import { toast } from '../store/useToastStore';
import type { Order, OrderItem, PaymentMethod } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCompleted: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onOrderCompleted }) => {
  const { items, getTotal, getSubtotal, getTax, cashierName, clearCart, currency } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [tenderedStr, setTenderedStr] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const total = getTotal();
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

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        cashierName: cashierName || 'Courtney Henry',
        shiftId: 'shift-current',
        subtotal: getSubtotal(),
        discount: 0,
        tax: getTax(),
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div>
            <h3 className="font-bold text-base text-slate-900">Checkout & Payment</h3>
            <p className="text-xs text-slate-500 mt-0.5">Order Total Due: <span className="font-bold text-slate-900">{currency}{total.toFixed(2)}</span></p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {completedOrder ? (
          /* Order Complete Celebration Screen */
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Payment Completed!</h2>
              <p className="text-xs text-slate-400 mt-1 font-mono font-medium">{completedOrder.orderNumber}</p>
            </div>

            <div className="w-full bg-slate-50 p-4 rounded-lg border border-slate-200 text-left space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Method:</span>
                <span className="font-bold text-slate-800">{completedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Tendered:</span>
                <span className="font-bold text-slate-800">{currency}{completedOrder.amountTendered.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 text-blue-600">
                <span>Change Due:</span>
                <span>{currency}{completedOrder.changeDue.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition active:scale-95"
            >
              Start Next Order
            </button>
          </div>
        ) : (
          /* Payment Methods & Numpad Screen */
          <div className="p-5 overflow-y-auto space-y-3.5 scrollbar-none">
            {/* Payment Method Selector Pills */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'CASH', label: 'Cash', icon: Banknote },
                { id: 'CARD', label: 'Card', icon: CreditCard },
                { id: 'GCASH', label: 'E-Wallet', icon: Smartphone },
                { id: 'MAYA', label: 'Paylater', icon: Clock },
              ].map(({ id, label, icon: Icon }) => (
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
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Due</span>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{currency}{total.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Change Due</span>
                <p className={`text-xl font-bold mt-0.5 ${tendered >= total ? 'text-blue-600' : 'text-slate-300'}`}>
                  {currency}{changeDue.toFixed(2)}
                </p>
              </div>
            </div>

            {paymentMethod === 'CASH' && (
              <>
                {/* Quick Cash Buttons */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleQuickCash(total)}
                    className="flex-1 py-1.5 px-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-md border border-blue-200 active:scale-95 transition"
                  >
                    Exact ({currency}{Math.ceil(total)})
                  </button>
                  {[50, 100, 500, 1000].map((bill) => (
                    <button
                      key={bill}
                      onClick={() => handleQuickCash(bill)}
                      className="flex-1 py-1.5 px-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-md border border-slate-200 active:scale-95 transition"
                    >
                      {currency}{bill}
                    </button>
                  ))}
                </div>

                {/* Amount Tendered Display Box */}
                <div className="flex items-center justify-between p-3 bg-white border border-blue-500 rounded-lg">
                  <span className="text-xs font-bold text-slate-400">Cash Received:</span>
                  <span className="text-xl font-black text-slate-900">
                    {currency}{tenderedStr || '0'}
                  </span>
                </div>

                {/* Modern Numpad */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'BACK'].map((key) => (
                    <button
                      key={key}
                      onClick={() => handleNumpad(key)}
                      className="h-11 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-base rounded-md border border-slate-200 transition active:scale-95 flex items-center justify-center"
                    >
                      {key === 'BACK' ? '⌫' : key}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Complete Payment Button */}
            <button
              disabled={!isExactOrOver || isProcessing}
              onClick={() => handleCompleteSale(true)}
              className={`w-full py-3.5 mt-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${
                !isExactOrOver || isProcessing
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
            >
              <Printer className="w-4 h-4 stroke-[2]" />
              <span>{isProcessing ? 'Processing Order...' : 'Complete & Print Receipt'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
