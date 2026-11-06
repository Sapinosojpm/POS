import React, { useState, useEffect } from 'react';
import { X, Award, Percent, Tag, Users, Check, Sparkles } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
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
        customerName: customerName.trim() || 'Senior / PWD Guest',
        idNumber: idNumber.trim(),
        totalGuests: Math.max(1, totalGuests),
        seniorCount: Math.max(1, Math.min(seniorCount, totalGuests)),
      };

      setDiscount(newDiscount);
      playScanSuccessSound();
      triggerHaptic('success');
      toast.success(
        `${newDiscount.label} Applied`,
        '12% VAT exemption and 20% statutory discount computed.'
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden text-slate-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 tracking-wide">Discounts & Promos</h3>
              <p className="text-[11px] text-slate-500">
                Philippine Statutory (RA 9994 / 10754) or Custom Promos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-200/60 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Segmented Control */}
        <div className="p-3 bg-slate-100/70 border-b border-slate-200/80 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('statutory')}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'statutory'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Senior / PWD</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('percent')}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'percent'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Percent (%)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fixed')}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'fixed'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Fixed Voucher</span>
          </button>
        </div>

        {/* Tab Content Form */}
        <form onSubmit={handleApply} className="p-5 space-y-4">
          {/* TAB 1: SENIOR CITIZEN / PWD */}
          {activeTab === 'statutory' && (
            <div className="space-y-3.5 animate-fade-in">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatutoryType('SENIOR')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    statutoryType === 'SENIOR'
                      ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-400/30'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>👴 Senior Citizen</span>
                  {statutoryType === 'SENIOR' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </button>
                <button
                  type="button"
                  onClick={() => setStatutoryType('PWD')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    statutoryType === 'PWD'
                      ? 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-400/30'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>♿ PWD Discount</span>
                  {statutoryType === 'PWD' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              </div>

              {/* Legal Note Pill */}
              <div className="p-2.5 bg-amber-50/60 border border-amber-200/70 rounded-xl flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-900 leading-tight">
                  <strong className="font-semibold">Statutory Rule:</strong> 12% VAT is removed first,
                  followed by 20% discount on the net amount.
                </p>
              </div>

              {/* ID Number & Name */}
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      {statutoryType === 'SENIOR' ? 'Senior OSCA ID No.' : 'PWD Card ID No.'} *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIdNumber(`SC-${Date.now().toString().slice(-6)}`)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      + Quick Walk-In ID
                    </button>
                  </div>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="e.g. 1234-5678-90"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Customer Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Shared Dining Stepper (Pax calculation) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    Bill Sharing / Pax Calculation
                  </span>
                  <span className="text-[11px] text-blue-600 font-semibold">
                    {Math.round((seniorCount / totalGuests) * 100)}% of Bill
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-medium mb-1">
                      Senior Guests
                    </label>
                    <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setSeniorCount(Math.max(1, seniorCount - 1))}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center font-bold text-slate-800">
                        {seniorCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = seniorCount + 1;
                          setSeniorCount(next);
                          if (next > totalGuests) setTotalGuests(next);
                        }}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-medium mb-1">
                      Total Group Guests
                    </label>
                    <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setTotalGuests(Math.max(seniorCount, totalGuests - 1))}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center font-bold text-slate-800">
                        {totalGuests}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTotalGuests(totalGuests + 1)}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold"
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
            <div className="space-y-3.5 animate-fade-in">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Preset Percentages
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[5, 10, 15, 20, 50].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPercentVal(val)}
                      className={`py-2 text-xs font-bold rounded-lg border transition ${
                        percentVal === val
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Custom Percentage (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={percentVal}
                  onChange={(e) => setPercentVal(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Promo Reason / Label
                </label>
                <input
                  type="text"
                  value={percentLabel}
                  onChange={(e) => setPercentLabel(e.target.value)}
                  placeholder="e.g. Employee Discount, Grand Opening Promo"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* TAB 3: FIXED VOUCHER */}
          {activeTab === 'fixed' && (
            <div className="space-y-3.5 animate-fade-in">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Preset Voucher Amounts
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[20, 50, 100, 200].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFixedVal(val)}
                      className={`py-2 text-xs font-bold rounded-lg border transition ${
                        fixedVal === val
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {currency}{val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Voucher Value ({currency})
                </label>
                <input
                  type="number"
                  min="1"
                  value={fixedVal}
                  onChange={(e) => setFixedVal(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Voucher Code / Reference
                </label>
                <input
                  type="text"
                  value={fixedLabel}
                  onChange={(e) => setFixedLabel(e.target.value)}
                  placeholder="e.g. GC-2024-50OFF"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            {discount && (
              <button
                type="button"
                onClick={handleRemove}
                className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs transition"
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
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-sm transition active:scale-95"
            >
              Apply Discount
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
