import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CreditCard, Clock, Banknote, ArrowRight, ShoppingBag, Trash2, Plus, Minus, Award, X, PauseCircle, PackageOpen, Smartphone, Wallet } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { DiscountModal } from './DiscountModal';
import { HoldCartModal } from './HoldCartModal';
import { HeldOrdersModal } from './HeldOrdersModal';
import { db } from '../core/db';
import type { PaymentMethod } from '../types';

interface CartViewProps {
  onOpenCheckout: () => void;
}

export const CartView: React.FC<CartViewProps> = ({ onOpenCheckout }) => {
  const {
    items,
    paymentMethod,
    setPaymentMethod,
    getTotal,
    getSubtotal,
    getDiscountBreakdown,
    discount,
    clearDiscount,
    currency,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCartStore();

  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [isHeldOrdersModalOpen, setIsHeldOrdersModalOpen] = useState(false);

  const heldOrdersCount = useLiveQuery(() => db.heldOrders.count(), []) || 0;

  const breakdown = getDiscountBreakdown();
  const subtotal = getSubtotal();
  const total = getTotal();
  const { settings } = useSettingsStore();

  const enabledMethods = settings.enabledPaymentMethods || {
    cash: true,
    gcash: true,
    maya: true,
    card: false,
    paylater: false,
  };

  const allPaymentOptions: { id: PaymentMethod; label: string; icon: any; enabled: boolean }[] = [
    { id: 'CASH', label: 'Cash', icon: Banknote, enabled: enabledMethods.cash !== false },
    { id: 'GCASH', label: 'GCash', icon: Smartphone, enabled: !!enabledMethods.gcash },
    { id: 'MAYA', label: 'Maya', icon: Wallet, enabled: !!enabledMethods.maya },
    { id: 'CARD', label: 'Card', icon: CreditCard, enabled: !!enabledMethods.card },
    { id: 'PAYLATER', label: 'Paylater', icon: Clock, enabled: !!enabledMethods.paylater },
  ];

  const paymentOptions = allPaymentOptions.filter((opt) => opt.enabled);
  const activeOptions = paymentOptions.length > 0 ? paymentOptions : [allPaymentOptions[0]];

  const gridColsClass =
    activeOptions.length === 1
      ? 'grid-cols-1'
      : activeOptions.length === 2
      ? 'grid-cols-2'
      : activeOptions.length === 3
      ? 'grid-cols-3'
      : 'grid-cols-2 sm:grid-cols-4';

  return (
    <aside className="w-80 lg:w-[350px] bg-white border-l border-slate-200 p-5 flex flex-col h-full shrink-0 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Invoice</h2>
          <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
            {items.reduce((s, i) => s + i.quantity, 0)} Items
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {heldOrdersCount > 0 && (
            <button
              type="button"
              onClick={() => setIsHeldOrdersModalOpen(true)}
              className="text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-md transition flex items-center gap-1 active:scale-95 shadow-2xs"
              title="View parked / held orders"
            >
              <PackageOpen className="w-3.5 h-3.5" />
              <span>{heldOrdersCount} Held</span>
            </button>
          )}

          {items.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setIsHoldModalOpen(true)}
                className="text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-md transition flex items-center gap-1 active:scale-95"
                title="Park / Hold current cart"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Hold</span>
              </button>

              <button
                onClick={clearCart}
                className="text-[11px] font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-md transition flex items-center gap-1 active:scale-95"
                title="Clear all items from invoice"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2 scrollbar-none">
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
            <div
              key={product.id}
              className="group flex items-center justify-between gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
            >
              <img
                src={product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80'}
                alt={product.name}
                className="w-10 h-10 rounded-lg object-cover shrink-0 ring-1 ring-slate-200"
              />

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-slate-900 truncate leading-snug">
                  {product.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  {/* Inline Quantity Stepper */}
                  <div className="flex items-center bg-slate-100 rounded border border-slate-200">
                    <button
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-l transition active:scale-95"
                      title="Decrease"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="px-1.5 text-[11px] font-bold text-slate-800 min-w-[16px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-r transition active:scale-95"
                      title="Increase"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium">
                    @{currency}{product.price.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Line Price & Remove Button */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-black text-slate-900">
                  {currency}{(product.price * quantity).toFixed(2)}
                </span>
                <button
                  onClick={() => removeItem(product.id)}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition active:scale-90"
                  title="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Summary */}
      <div className="pt-3 border-t border-slate-200 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-900 tracking-wide uppercase">
            Payment Summary
          </h3>
          {discount && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
              Discount Active
            </span>
          )}
        </div>

        {/* Discount Trigger / Active Card */}
        {!discount ? (
          <button
            type="button"
            disabled={items.length === 0}
            onClick={() => setIsDiscountModalOpen(true)}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-amber-50/70 hover:bg-amber-100/90 border border-amber-200 text-amber-900 text-xs font-bold transition disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99]"
          >
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Senior / PWD / Promo</span>
            </div>
            <span className="text-[10px] text-amber-800 bg-amber-200/60 px-1.5 py-0.5 rounded font-semibold">
              + Apply
            </span>
          </button>
        ) : (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-amber-950">
              <div className="flex items-center gap-1.5 min-w-0">
                <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">{breakdown.discountLabel}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDiscountModalOpen(true)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={clearDiscount}
                  className="w-4 h-4 rounded text-slate-400 hover:text-rose-600 flex items-center justify-center transition"
                  title="Remove Discount"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
            {discount.idNumber && (
              <p className="text-[10px] font-mono text-amber-800">
                ID: {discount.idNumber} {discount.customerName ? `• ${discount.customerName}` : ''}
              </p>
            )}
          </div>
        )}

        <div className="space-y-1.5 text-xs text-slate-500 pt-1">
          <div className="flex justify-between">
            <span>Sub Total (Gross)</span>
            <span className="font-bold text-slate-800">{currency}{subtotal.toFixed(2)}</span>
          </div>

          {/* Statutory VAT Exemption */}
          {breakdown.vatExemptAmount > 0 && (
            <div className="flex justify-between text-amber-700 font-medium">
              <span>Less 12% VAT Exemption</span>
              <span className="font-bold">-{currency}{breakdown.vatExemptAmount.toFixed(2)}</span>
            </div>
          )}

          {/* Discount deduction */}
          {breakdown.discountAmount > 0 && (
            <div className="flex justify-between text-rose-600 font-medium">
              <span>Less Discount ({breakdown.discountLabel.split(' ')[0]})</span>
              <span className="font-bold">-{currency}{breakdown.discountAmount.toFixed(2)}</span>
            </div>
          )}

          {/* Regular VAT if enabled in store settings */}
          {settings.enableTax && (
            <div className="flex justify-between">
              <span>Tax ({breakdown.vatExemptAmount > 0 ? 'Regular VAT' : `${settings.taxRate || 12}% VAT Incl`})</span>
              <span className="font-bold text-slate-800">{currency}{breakdown.tax.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
            <span>Total Payment</span>
            <span className="text-base text-blue-600">{currency}{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Method Pills (Dynamically filtered from Settings) */}
        <div className={`grid ${gridColsClass} gap-1.5 pt-1.5`}>
          {activeOptions.map(({ id, label, icon: Icon }) => {
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

      {/* Discount Modal */}
      <DiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
      />

      {/* Hold Current Cart Modal */}
      <HoldCartModal
        isOpen={isHoldModalOpen}
        onClose={() => setIsHoldModalOpen(false)}
        defaultHoldNumber={heldOrdersCount + 1}
      />

      {/* Held / Parked Orders Drawer Modal */}
      <HeldOrdersModal
        isOpen={isHeldOrdersModalOpen}
        onClose={() => setIsHeldOrdersModalOpen(false)}
      />
    </aside>
  );
};
