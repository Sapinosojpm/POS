import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CreditCard, Clock, Banknote, ArrowRight, ShoppingBag, Trash2, Plus, Minus, Award, X, PauseCircle, PackageOpen, Smartphone, Wallet, Utensils, ChevronDown, ChevronUp, User, PanelRightClose } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { DiscountModal } from './DiscountModal';
import { HoldCartModal } from './HoldCartModal';
import { HeldOrdersModal } from './HeldOrdersModal';
import { db } from '../core/db';
import type { PaymentMethod } from '../types';

interface CartViewProps {
  onOpenCheckout: () => void;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}

export const CartView: React.FC<CartViewProps> = ({ onOpenCheckout, onClose, onToggleCollapse }) => {
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
    orderType,
    setOrderType,
    tableLabel,
    setTableLabel,
  } = useCartStore();

  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [isHeldOrdersModalOpen, setIsHeldOrdersModalOpen] = useState(false);

  const heldOrdersCount = useLiveQuery(() => db.heldOrders.count(), []) || 0;

  const breakdown = getDiscountBreakdown();
  const subtotal = getSubtotal();
  const total = getTotal();
  const { settings } = useSettingsStore();
  const isDiningEnabled = settings.enableDiningOptions || settings.businessType === 'RESTAURANT';
  const [isOrderInfoExpanded, setIsOrderInfoExpanded] = useState(false);

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
    <aside className="w-full lg:w-72 xl:w-80 2xl:w-[330px] bg-white border-l border-slate-200 p-3.5 sm:p-4 flex flex-col h-full shrink-0 select-none">
      {/* Header with Zero Truncation */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0 gap-2">
        {/* Left: Title + Count Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight shrink-0">Invoice</h2>
          <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full shrink-0">
            {items.reduce((s, i) => s + i.quantity, 0)} {items.reduce((s, i) => s + i.quantity, 0) === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Right: Compact Action Buttons (never truncated) */}
        <div className="flex items-center gap-1 shrink-0">
          {heldOrdersCount > 0 && (
            <button
              type="button"
              onClick={() => setIsHeldOrdersModalOpen(true)}
              className="h-8 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1 active:scale-95 transition shadow-2xs"
              title={`${heldOrdersCount} held / parked orders`}
            >
              <PackageOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>{heldOrdersCount}</span>
            </button>
          )}

          {items.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setIsHoldModalOpen(true)}
                className="h-8 px-2 sm:px-2.5 rounded-lg bg-slate-50 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200 border border-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1 active:scale-95 transition"
                title="Hold / Park this active order"
              >
                <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Hold</span>
              </button>

              <button
                type="button"
                onClick={clearCart}
                className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200 text-slate-400 flex items-center justify-center active:scale-95 transition"
                title="Clear all items from invoice"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-slate-200 text-slate-500 flex items-center justify-center active:scale-95 transition"
              title="Collapse invoice to make products larger"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center active:scale-95 transition"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Order Context & Dining Options (Configurable in Settings) */}
      {isDiningEnabled ? (
        // RESTAURANT / DINING MODE: Collapsible Dine-in / Takeout + Table Info
        <div className="pt-2.5 shrink-0">
          {!isOrderInfoExpanded ? (
            // Collapsed Single-Line Bar
            <button
              type="button"
              onClick={() => setIsOrderInfoExpanded(true)}
              className="w-full h-8 px-2.5 rounded-lg bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 text-xs flex items-center justify-between transition active:scale-[0.99] text-left cursor-pointer"
              title="Click to change Dine-in / Takeout or Table #"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {orderType === 'DINE_IN' ? (
                  <Utensils className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                ) : (
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                )}
                <span className="font-bold text-slate-800 text-[11px]">
                  {orderType === 'DINE_IN' ? 'Dine-in' : 'Takeout'}
                </span>
                {tableLabel ? (
                  <span className="text-slate-600 font-semibold truncate text-[11px]">
                    • {tableLabel}
                  </span>
                ) : (
                  <span className="text-slate-400 text-[10px] truncate">
                    • Tap to add table / details
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-slate-400 shrink-0">
                <span className="text-[10px] font-bold text-slate-500 hidden sm:inline">Edit</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </button>
          ) : (
            // Expanded Card
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Utensils className="w-3 h-3 text-blue-600" />
                  <span>Order Type & Table</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsOrderInfoExpanded(false)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 active:scale-95 cursor-pointer"
                >
                  <span>Done</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/70 rounded-lg" role="tablist" aria-label="Order type">
                {([
                  { id: 'DINE_IN', label: 'Dine-in', icon: Utensils },
                  { id: 'TAKEOUT', label: 'Takeout', icon: ShoppingBag },
                ] as const).map(({ id, label, icon: Icon }) => {
                  const active = orderType === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setOrderType(id)}
                      className={`h-8 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                        active ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={tableLabel}
                onChange={(e) => setTableLabel(e.target.value)}
                maxLength={30}
                placeholder={orderType === 'DINE_IN' ? 'Table no. or name (optional)' : 'Customer name (optional)'}
                className="w-full h-8 px-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      ) : (
        // RETAIL / VAPE SHOP / SERVICES / GROCERY MODE: No Dine-in/Takeout tabs!
        // Slim, clean collapsible Customer / Reference note
        <div className="pt-2 shrink-0">
          {!isOrderInfoExpanded ? (
            <button
              type="button"
              onClick={() => setIsOrderInfoExpanded(true)}
              className="w-full h-8 px-2.5 rounded-lg bg-slate-50 hover:bg-blue-50/50 border border-slate-200/90 hover:border-blue-200 text-xs flex items-center justify-between text-slate-600 transition active:scale-[0.99] cursor-pointer shadow-2xs"
              title="Attach optional customer name or transaction note"
            >
              <div className="flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className={`truncate text-[11px] font-semibold ${tableLabel ? 'text-slate-800 font-bold' : 'text-slate-400 font-medium'}`}>
                  {tableLabel ? tableLabel : '+ Customer / Note (optional)'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
          ) : (
            // Expanded Customer Note Input
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-in fade-in duration-150 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-blue-600" />
                  <span>Customer Name or Note</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsOrderInfoExpanded(false)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 active:scale-95 cursor-pointer"
                >
                  <span>Done</span>
                  <ChevronUp className="w-3 h-3" />
                </button>
              </div>
              <input
                type="text"
                value={tableLabel}
                onChange={(e) => setTableLabel(e.target.value)}
                maxLength={40}
                placeholder="e.g. Suki Customer / Order note..."
                autoFocus
                className="w-full h-8 px-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2 scrollbar-none">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-center mb-3 text-blue-500 shadow-2xs">
              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
            </div>
            <p className="font-bold text-slate-800 text-sm">No items in invoice</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">
              Tap any dish from the catalog or scan a barcode to begin.
            </p>
          </div>
        ) : (
          items.map(({ product, quantity }) => (
            <div
              key={product.id}
              className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 rounded-xl p-3 transition space-y-2.5 shadow-2xs"
            >
              {/* Top Row: Thumbnail + Full Item Name + Line Total Price */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  {/* Offline-Safe Rounded Thumbnail with Fallback Icon */}
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/90 flex items-center justify-center shrink-0 overflow-hidden relative shadow-2xs">
                    {product.image && (
                      <img
                        src={product.image}
                        alt=""
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <Utensils className="w-4 h-4 text-slate-300 absolute pointer-events-none -z-0" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug break-words">
                      {product.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                      {currency}{product.price.toFixed(2)} each
                    </p>
                  </div>
                </div>

                {/* Line Total */}
                <span className="text-sm font-black text-slate-900 shrink-0 tracking-tight">
                  {currency}{(product.price * quantity).toFixed(2)}
                </span>
              </div>

              {/* Bottom Row: Tactile Quantity Stepper + Remove Trash Button */}
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60">
                {/* Stepper with comfortable >= 32px touch buttons */}
                <div className="inline-flex items-center bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="w-8 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-l-lg transition active:scale-90"
                    title="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                  <span className="px-3 text-xs font-black text-slate-900 min-w-[24px] text-center select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    className="w-8 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-r-lg transition active:scale-90"
                    title="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>

                {/* Remove item button */}
                <button
                  type="button"
                  onClick={() => removeItem(product.id)}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition active:scale-90"
                  title="Remove from invoice"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Summary (collapsed to a compact total while the cart is empty) */}
      <div className="pt-3 border-t border-slate-200 shrink-0 space-y-2">
        {items.length === 0 ? (
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total</span>
            <span className="text-base font-black text-slate-300">{currency}0.00</span>
          </div>
        ) : (
        <>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-800 tracking-tight">
            Payment Summary
          </h3>
          {discount && (
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
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
            <span className="text-base text-blue-600 tabular-nums">{currency}{total.toFixed(2)}</span>
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
                className={`py-2 px-1 rounded-md text-[11px] font-bold flex flex-col items-center justify-center gap-1 border transition-all active:scale-95 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-xs ring-1 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        </>
        )}

        {/* Place An Order Button */}
        <button
          disabled={items.length === 0}
          onClick={onOpenCheckout}
          className={`w-full py-3 mt-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${
            items.length === 0
              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 cursor-pointer'
          }`}
        >
          <span>
            {items.length === 0
              ? 'Add items to order'
              : `Place An Order • ${currency}${total.toFixed(2)}`}
          </span>
          {items.length > 0 && <ArrowRight className="w-4 h-4 stroke-[2.5]" />}
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
