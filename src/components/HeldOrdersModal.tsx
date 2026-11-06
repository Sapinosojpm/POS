import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, PackageOpen, Play, Trash2, Clock, Award, ArrowRightLeft } from 'lucide-react';
import { db } from '../core/db';
import { useCartStore } from '../store/useCartStore';
import { toast } from '../store/useToastStore';
import { playScanSuccessSound, triggerHaptic } from '../core/hardware/scannerFeedback';
import type { HeldOrder } from '../types';

interface HeldOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HeldOrdersModal: React.FC<HeldOrdersModalProps> = ({ isOpen, onClose }) => {
  const { items, discount, getTotal, getSubtotal, cashierName, restoreCart, currency } = useCartStore();
  const heldOrders = useLiveQuery(() => db.heldOrders.orderBy('createdAt').reverse().toArray(), []) || [];

  if (!isOpen) return null;

  const formatRelativeTime = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours}h ago`;
  };

  const handleRecallOrder = async (held: HeldOrder) => {
    try {
      // Zero-loss collision safety: if active cart already has items, auto-stash them first
      if (items.length > 0) {
        const autoStashTag = `Hold #${Date.now().toString().slice(-4)}`;
        const autoHeld: HeldOrder = {
          id: `held-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          tag: autoStashTag,
          cashierName: cashierName || 'Cashier',
          items: [...items],
          discount: discount ? { ...discount } : null,
          subtotal: getSubtotal(),
          total: getTotal(),
          createdAt: Date.now(),
        };

        await db.heldOrders.add(autoHeld);
        toast.info('Active Cart Parked', `Previous items auto-saved as "${autoStashTag}".`);
      }

      // Restore selected order into active register
      restoreCart(held.items, held.discount);

      // Remove from held orders
      await db.heldOrders.delete(held.id);

      playScanSuccessSound();
      triggerHaptic('success');
      toast.success('Order Recalled', `"${held.tag}" restored to register.`);

      onClose();
    } catch (err) {
      console.error('Failed to recall order:', err);
      toast.error('Recall Failed', 'Could not restore parked order.');
    }
  };

  const handleDiscardOrder = async (held: HeldOrder) => {
    try {
      await db.heldOrders.delete(held.id);
      toast.info('Order Discarded', `"${held.tag}" was removed.`);
    } catch (err) {
      console.error('Failed to discard order:', err);
      toast.error('Error', 'Failed to remove held order.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-slate-800 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <PackageOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 tracking-wide">Parked / Held Orders</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  {heldOrders.length} Held
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Recall any stashed order back to active register</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-200/60 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {heldOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
                <PackageOpen className="w-7 h-7 stroke-1" />
              </div>
              <h4 className="font-bold text-sm text-slate-700">No Parked Orders</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                When a customer steps away, click "Hold" in the invoice to park their cart and serve the next customer.
              </p>
            </div>
          ) : (
            heldOrders.map((held) => (
              <div
                key={held.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all space-y-2.5"
              >
                {/* Header row: Tag & Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs">
                      {held.tag}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(held.createdAt)}
                    </span>
                  </div>
                  <span className="font-black text-sm text-slate-900">
                    {currency}{held.total.toFixed(2)}
                  </span>
                </div>

                {/* Items preview */}
                <div className="text-xs text-slate-600 line-clamp-2">
                  {held.items.map((i) => `${i.quantity}x ${i.product.name}`).join(' • ')}
                </div>

                {/* Badges & Actions row */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {held.items.reduce((s, i) => s + i.quantity, 0)} items
                    </span>
                    {held.discount && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                        <Award className="w-3 h-3 text-amber-600" />
                        {held.discount.label}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDiscardOrder(held)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Discard this held order"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRecallOrder(held)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition active:scale-95"
                    >
                      {items.length > 0 ? (
                        <>
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Swap to Register</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Recall Order</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200/70 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
