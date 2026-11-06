import React, { useState, useEffect } from 'react';
import { X, PauseCircle, Bookmark } from 'lucide-react';
import { db } from '../core/db';
import { useCartStore } from '../store/useCartStore';
import { toast } from '../store/useToastStore';
import { playScanSuccessSound, triggerHaptic } from '../core/hardware/scannerFeedback';
import type { HeldOrder } from '../types';

interface HoldCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultHoldNumber: number;
}

export const HoldCartModal: React.FC<HoldCartModalProps> = ({
  isOpen,
  onClose,
  defaultHoldNumber,
}) => {
  const { items, discount, getTotal, getSubtotal, cashierName, clearCart } = useCartStore();
  const [tag, setTag] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTag(`Hold #${defaultHoldNumber}`);
    }
  }, [isOpen, defaultHoldNumber]);

  if (!isOpen) return null;

  const total = getTotal();
  const subtotal = getSubtotal();

  const handleConfirmHold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.warning('Cart Empty', 'Cannot hold an empty cart.');
      onClose();
      return;
    }

    const finalTag = tag.trim() || `Hold #${defaultHoldNumber}`;

    try {
      const heldOrder: HeldOrder = {
        id: `held-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tag: finalTag,
        cashierName: cashierName || 'Cashier',
        items: [...items],
        discount: discount ? { ...discount } : null,
        subtotal,
        total,
        createdAt: Date.now(),
      };

      await db.heldOrders.add(heldOrder);

      playScanSuccessSound();
      triggerHaptic('success');
      toast.success('Order Parked', `"${finalTag}" (${items.length} items) held successfully.`);

      clearCart();
      onClose();
    } catch (err) {
      console.error('Failed to hold order:', err);
      toast.error('Hold Failed', 'Could not save parked cart locally.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden text-slate-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-amber-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <PauseCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 tracking-wide">Hold Current Order</h3>
              <p className="text-[11px] text-slate-500">Park cart & ring up the next customer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-200/60 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleConfirmHold} className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Order Tag / Reference Name
            </label>
            <div className="relative">
              <Bookmark className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. Table 4, Sir Alex, Takeout #12"
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3.5 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Quick Preset Tag Buttons */}
          <div>
            <label className="block text-[10px] text-slate-400 font-semibold mb-1">
              Quick Suggestions:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {['Table 1', 'Table 2', 'Table 3', 'Takeout', 'Drive-thru'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTag(preset)}
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 text-[11px] font-semibold transition"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Items to Stash:</span>
              <span className="font-bold text-slate-800">{items.reduce((s, i) => s + i.quantity, 0)} items</span>
            </div>
            {discount && (
              <div className="flex justify-between text-amber-700 font-medium">
                <span>Active Discount:</span>
                <span className="font-bold">{discount.label}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-900 font-black pt-1 border-t border-slate-200">
              <span>Cart Value:</span>
              <span className="text-amber-700">₱{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <PauseCircle className="w-4 h-4" />
              <span>Confirm Hold</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
