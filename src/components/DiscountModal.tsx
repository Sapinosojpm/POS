import React, { useState, useEffect } from 'react';
import { useCartStore } from '../store/useCartStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { toast } from '../store/useToastStore';
import { playScanSuccessSound, triggerHaptic } from '../core/hardware/scannerFeedback';
import type { CartDiscount } from '../types';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({ isOpen, onClose }) => {
  const { discount, setDiscount, clearDiscount, getSubtotal, currency } = useCartStore();
  const subtotal = getSubtotal();
  const isTaxEnabled = useSettingsStore((state) => state.settings.enableTax ?? true);
  const taxRate = (useSettingsStore((state) => state.settings.taxRate ?? 12) / 100);
  const vatDivisor = 1 + taxRate;

  const [activeTab, setActiveTab] = useState<'statutory' | 'percent' | 'fixed'>('statutory');

  // Statutory form state
  const [statutoryType, setStatutoryType] = useState<'SENIOR' | 'PWD'>('SENIOR');
  const [customerName, setCustomerName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [totalGuests, setTotalGuests] = useState(1);
  const [seniorCount, setSeniorCount] = useState(1);

  // Percent form state
  const [percentVal, setPercentVal] = useState<number>(10);
  const [percentLabel, setPercentLabel] = useState('Promo Discount');

  // Fixed form state
  const [fixedVal, setFixedVal] = useState<number>(50);
  const [fixedLabel, setFixedLabel] = useState('Voucher Discount');

  // Hydrate from existing discount if present
  useEffect(() => {
    if (!isOpen) return;

    if (discount) {
      if (discount.type === 'SENIOR' || discount.type === 'PWD') {
        setActiveTab('statutory');
        setStatutoryType(discount.type);
        setCustomerName(discount.customerName || '');
        setIdNumber(discount.idNumber || '');
        setTotalGuests(discount.totalGuests || 1);
        setSeniorCount(discount.seniorCount || 1);
      } else if (discount.type === 'PERCENT') {
        setActiveTab('percent');
        setPercentVal(discount.value || 10);
        setPercentLabel(discount.label || 'Promo Discount');
      } else if (discount.type === 'FIXED') {
        setActiveTab('fixed');
        setFixedVal(discount.value || 50);
        setFixedLabel(discount.label || 'Voucher Discount');
      }
    } else {
      // Default clean values
      setCustomerName('');
      setIdNumber('');
      setTotalGuests(1);
      setSeniorCount(1);
    }
  }, [isOpen, discount]);

  if (!isOpen) return null;

  // Real-time calculation preview
  let previewSavings = 0;
  let previewVatExempt = 0;
  let previewNewTotal = subtotal;

  if (activeTab === 'statutory') {
    const guests = Math.max(1, totalGuests);
    const eligible = Math.max(1, Math.min(seniorCount, guests));
    const ratio = eligible / guests;
    const seniorGross = subtotal * ratio;
    const regularGross = subtotal - seniorGross;

    if (!isTaxEnabled) {
      const disc = Math.round(seniorGross * 0.2 * 100) / 100;
      previewSavings = disc;
      previewNewTotal = Math.max(0, Math.round((subtotal - disc) * 100) / 100);
    } else {
      const seniorNetOfVat = Math.round((seniorGross / vatDivisor) * 100) / 100;
      previewVatExempt = Math.round((seniorGross - seniorNetOfVat) * 100) / 100;
      const disc = Math.round(seniorNetOfVat * 0.2 * 100) / 100;
      previewSavings = Math.round((disc + previewVatExempt) * 100) / 100;
      const seniorDue = Math.round((seniorNetOfVat - disc) * 100) / 100;
      previewNewTotal = Math.max(0, Math.round((seniorDue + regularGross) * 100) / 100);
    }
  } else if (activeTab === 'percent') {
    const pct = Math.min(100, Math.max(0, percentVal));
    previewSavings = Math.round(((subtotal * pct) / 100) * 100) / 100;
    previewNewTotal = Math.max(0, Math.round((subtotal - previewSavings) * 100) / 100);
  } else if (activeTab === 'fixed') {
    const val = Math.max(0, fixedVal);
    previewSavings = Math.min(subtotal, val);
    previewNewTotal = Math.max(0, Math.round((subtotal - previewSavings) * 100) / 100);
  }

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'statutory') {
      if (!idNumber.trim()) {
        toast.warning('ID Required', 'Please enter Senior / PWD ID number for BIR audit compliance.');
        return;
      }

      const newDiscount: CartDiscount = {
        type: statutoryType,
        label: statutoryType === 'SENIOR' ? 'Senior Citizen (20%)' : 'PWD (20%)',
        value: 20,
        customerName: customerName.trim() || (statutoryType === 'SENIOR' ? 'Senior Guest' : 'PWD Guest'),
        idNumber: idNumber.trim(),
        totalGuests: Math.max(1, totalGuests),
        seniorCount: Math.max(1, Math.min(seniorCount, totalGuests)),
      };

      setDiscount(newDiscount);
      playScanSuccessSound();
      triggerHaptic('success');
      toast.success(
        `${newDiscount.label} Applied`,
        'Statutory discount and VAT exemption computed for audit ledger.'
      );
    } else if (activeTab === 'percent') {
      if (percentVal <= 0 || percentVal > 100) {
        toast.warning('Invalid Percentage', 'Percentage discount must be between 1% and 100%.');
        return;
      }

      const newDiscount: CartDiscount = {
        type: 'PERCENT',
        label: percentLabel.trim() || `${percentVal}% Discount`,
        value: percentVal,
      };

      setDiscount(newDiscount);
      playScanSuccessSound();
      triggerHaptic('success');
      toast.success('Discount Applied', `${percentVal}% discount applied to current cart.`);
    } else if (activeTab === 'fixed') {
      if (fixedVal <= 0) {
        toast.warning('Invalid Amount', 'Voucher amount must be greater than zero.');
        return;
      }

      const newDiscount: CartDiscount = {
        type: 'FIXED',
        label: fixedLabel.trim() || `Voucher (${currency}${fixedVal})`,
        value: fixedVal,
      };

      setDiscount(newDiscount);
      playScanSuccessSound();
      triggerHaptic('success');
      toast.success('Voucher Applied', `${currency}${fixedVal} deducted from total.`);
    }

    onClose();
  };

  const handleRemove = () => {
    clearDiscount();
    toast.info('Discount Removed', 'Cart restored to regular pricing.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-slate-800 flex flex-col">
        {/* Header - Clean Typographic Layout (No Decorative Icons) */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Statutory & Promos
              </span>
              {discount && (
                <span className="text-[10px] font-bold tracking-wider uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Active in Cart
                </span>
              )}
            </div>
            <h3 className="font-bold text-lg text-slate-900 tracking-tight mt-1">Discounts & Deductions</h3>
            <p className="text-xs text-slate-500">
              Philippine statutory benefits (RA 9994 / RA 10754) or custom store vouchers
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition"
            aria-label="Close"
          >
            Esc
          </button>
        </div>

        {/* Tab Segmented Control - Pure Typography */}
        <div className="p-2.5 bg-slate-100/80 border-b border-slate-200/70">
          <div className="grid grid-cols-3 gap-1 bg-slate-200/60 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('statutory')}
              className={`py-2 px-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'statutory'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Senior / PWD
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('percent')}
              className={`py-2 px-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'percent'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Percentage (%)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fixed')}
              className={`py-2 px-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'fixed'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fixed Voucher
            </button>
          </div>
        </div>

        {/* Tab Content Form */}
        <form onSubmit={handleApply} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* TAB 1: SENIOR CITIZEN / PWD */}
          {activeTab === 'statutory' && (
            <div className="space-y-4 animate-fade-in">
              {/* Statutory Type Switcher - Professional Cards (No Emojis) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Statutory Classification
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatutoryType('SENIOR')}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      statutoryType === 'SENIOR'
                        ? 'bg-blue-50/60 border-blue-600 ring-2 ring-blue-600/20 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Senior Citizen</span>
                      {statutoryType === 'SENIOR' && (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-100/70 px-1.5 py-0.5 rounded">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Republic Act 9994</p>
                    <p className="text-[10px] font-semibold text-emerald-700 mt-1">20% Off + VAT-Exempt</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatutoryType('PWD')}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      statutoryType === 'PWD'
                        ? 'bg-blue-50/60 border-blue-600 ring-2 ring-blue-600/20 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">PWD Discount</span>
                      {statutoryType === 'PWD' && (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-100/70 px-1.5 py-0.5 rounded">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Republic Act 10754</p>
                    <p className="text-[10px] font-semibold text-emerald-700 mt-1">20% Off + VAT-Exempt</p>
                  </button>
                </div>
              </div>

              {/* Statutory Legal Rule Callout (No Sparkles Icon) */}
              <div className="p-3 bg-amber-50/70 border-l-4 border-amber-500 rounded-r-xl">
                <p className="text-[11px] font-bold text-amber-950 uppercase tracking-wide">
                  Statutory Rule (Philippine Tax Code)
                </p>
                <p className="text-xs text-amber-900/90 mt-0.5 leading-relaxed">
                  12% VAT is extracted first from the gross amount, followed by a 20% statutory discount computed on the net VAT-exempt base.
                </p>
              </div>

              {/* ID Number & Customer Name */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      {statutoryType === 'SENIOR' ? 'Senior OSCA ID No.' : 'PWD Card ID No.'} <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIdNumber(statutoryType === 'SENIOR' ? `SC-${Date.now().toString().slice(-6)}` : `PWD-${Date.now().toString().slice(-6)}`)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Auto-Fill Walk-In ID
                    </button>
                  </div>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="Enter ID number for BIR audit trail (e.g. 1234-5678-90)"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 font-mono tracking-wide focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cardholder Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Bill Sharing / Pax Calculation (No User Icon) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800">Bill Sharing (Pax Split)</span>
                    <p className="text-[11px] text-slate-500">
                      Discount is computed proportionally for group dining
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    {Math.round((seniorCount / totalGuests) * 100)}% of Bill
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-1">
                      {statutoryType === 'SENIOR' ? 'Senior Guests' : 'PWD Guests'}
                    </label>
                    <div className="flex items-center border border-slate-300 bg-white rounded-lg overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setSeniorCount(Math.max(1, seniorCount - 1))}
                        className="w-10 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-base transition"
                      >
                        –
                      </button>
                      <span className="flex-1 text-center font-bold text-slate-900 font-mono text-sm">
                        {seniorCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = seniorCount + 1;
                          setSeniorCount(next);
                          if (next > totalGuests) setTotalGuests(next);
                        }}
                        className="w-10 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-base transition"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-1">
                      Total Group Guests
                    </label>
                    <div className="flex items-center border border-slate-300 bg-white rounded-lg overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setTotalGuests(Math.max(seniorCount, totalGuests - 1))}
                        className="w-10 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-base transition"
                      >
                        –
                      </button>
                      <span className="flex-1 text-center font-bold text-slate-900 font-mono text-sm">
                        {totalGuests}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTotalGuests(totalGuests + 1)}
                        className="w-10 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-base transition"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERCENTAGE PROMO */}
          {activeTab === 'percent' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Preset Percentage
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[5, 10, 15, 20, 50].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPercentVal(val)}
                      className={`py-2.5 text-xs font-bold rounded-lg border transition ${
                        percentVal === val
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Custom Percentage (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={percentVal}
                  onChange={(e) => setPercentVal(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Promo Reason / Campaign Label
                </label>
                <input
                  type="text"
                  value={percentLabel}
                  onChange={(e) => setPercentLabel(e.target.value)}
                  placeholder="e.g. Employee Discount, Grand Opening Promo"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition"
                />
              </div>
            </div>
          )}

          {/* TAB 3: FIXED VOUCHER */}
          {activeTab === 'fixed' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Preset Voucher Amounts
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[20, 50, 100, 200].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFixedVal(val)}
                      className={`py-2.5 text-xs font-bold rounded-lg border transition ${
                        fixedVal === val
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {currency}{val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Voucher Value ({currency})
                </label>
                <input
                  type="number"
                  min="1"
                  value={fixedVal}
                  onChange={(e) => setFixedVal(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Voucher Code / Reference
                </label>
                <input
                  type="text"
                  value={fixedLabel}
                  onChange={(e) => setFixedLabel(e.target.value)}
                  placeholder="e.g. GC-2026-50OFF"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition"
                />
              </div>
            </div>
          )}

          {/* Live Computation Preview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-500 font-medium">
              <span>Cart Subtotal (Gross)</span>
              <span className="font-mono text-slate-700">{currency}{subtotal.toFixed(2)}</span>
            </div>
            {activeTab === 'statutory' && isTaxEnabled && previewVatExempt > 0 && (
              <div className="flex items-center justify-between text-emerald-700 font-medium">
                <span>VAT Exemption (12%)</span>
                <span className="font-mono">-{currency}{previewVatExempt.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-rose-600 font-bold pt-1 border-t border-slate-200">
              <span>Estimated Savings / Deduction</span>
              <span className="font-mono text-sm">-{currency}{previewSavings.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-900 font-bold">
              <span>Payable Net Total</span>
              <span className="font-mono text-base text-blue-600">{currency}{previewNewTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            {discount && (
              <button
                type="button"
                onClick={handleRemove}
                className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs transition border border-rose-200"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={subtotal <= 0}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-xs transition active:scale-[0.98]"
            >
              {previewSavings > 0 ? `Apply (–${currency}${previewSavings.toFixed(2)})` : 'Apply Discount'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
