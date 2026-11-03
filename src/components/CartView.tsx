import React from 'react';
import { CreditCard, Clock, Banknote, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import type { PaymentMethod } from '../types';

interface CartViewProps {
  onOpenCheckout: () => void;
}

export const CartView: React.FC<CartViewProps> = ({ onOpenCheckout }) => {
  const { items, paymentMethod, setPaymentMethod, getTotal, getSubtotal, getTax, currency } = useCartStore();

  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();

  const paymentOptions = [
    { id: 'CARD', label: 'Credit Card', icon: CreditCard },
    { id: 'MAYA', label: 'Paylater', icon: Clock },
    { id: 'CASH', label: 'Cash Payout', icon: Banknote },
  ];

  return (
    <aside className="w-80 lg:w-[350px] bg-white border-l border-slate-200 p-5 flex flex-col h-full shrink-0 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Invoice</h2>
        <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
          {items.reduce((s, i) => s + i.quantity, 0)} Items
        </span>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 scrollbar-none">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center p-6">
            <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center mb-2">
              <ShoppingBag className="w-6 h-6 text-slate-300 stroke-1" />
            </div>
            <p className="font-bold text-slate-700 text-sm">No items in invoice</p>
            <p className="text-xs text-slate-400 mt-1">
              Select dishes from the menu to start an order.
            </p>
          </div>
        ) : (
          items.map(({ product, quantity }) => (
            <div key={product.id} className="flex items-center justify-between gap-3 p-1.5 rounded-md hover:bg-slate-50 transition">
              <img
                src={product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80'}
                alt={product.name}
                className="w-10 h-10 rounded-md object-cover shrink-0 ring-1 ring-slate-200"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-slate-900 truncate leading-snug">
                  {product.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {quantity}x &nbsp; Don't Add Vegetables
                </p>
              </div>
              <span className="text-xs font-black text-slate-900 shrink-0">
                {currency}{(product.price * quantity).toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Payment Summary */}
      <div className="pt-3 border-t border-slate-200 shrink-0 space-y-2">
        <h3 className="font-bold text-xs text-slate-900 tracking-wide uppercase">
          Payment Summary
        </h3>

        <div className="space-y-1.5 text-xs text-slate-500">
          <div className="flex justify-between">
            <span>Sub Total</span>
            <span className="font-bold text-slate-800">{currency}{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (12% Incl)</span>
            <span className="font-bold text-slate-800">{currency}{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
            <span>Total Payment</span>
            <span className="text-base text-blue-600">{currency}{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Method Pills */}
        <div className="grid grid-cols-3 gap-1.5 pt-2">
          {paymentOptions.map(({ id, label, icon: Icon }) => {
            const isSelected = paymentMethod === id;
            return (
              <button
                key={id}
                onClick={() => setPaymentMethod(id as PaymentMethod)}
                className={`py-2 px-1 rounded-md text-[11px] font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Place An Order Button */}
        <button
          disabled={items.length === 0}
          onClick={onOpenCheckout}
          className={`w-full py-3 mt-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${
            items.length === 0
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
          }`}
        >
          <span>Place An Order</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </aside>
  );
};
