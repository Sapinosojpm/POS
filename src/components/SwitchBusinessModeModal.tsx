import React, { useState } from 'react';
import type { BusinessType } from '../store/useSettingsStore';
import { BUSINESS_CATALOGS } from '../core/db/seedCatalogs';

interface SwitchBusinessModeModalProps {
  isOpen: boolean;
  targetMode: BusinessType | null;
  currentMode: BusinessType;
  onClose: () => void;
  onConfirm: (
    targetMode: BusinessType,
    replaceCatalog: boolean,
    updateBranding: boolean
  ) => Promise<void>;
}

export const SwitchBusinessModeModal: React.FC<SwitchBusinessModeModalProps> = ({
  isOpen,
  targetMode,
  currentMode,
  onClose,
  onConfirm,
}) => {
  const [replaceCatalog, setReplaceCatalog] = useState(true);
  const [updateBranding, setUpdateBranding] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !targetMode) return null;

  const currentProfile = BUSINESS_CATALOGS[currentMode] || BUSINESS_CATALOGS.RETAIL;
  const targetProfile = BUSINESS_CATALOGS[targetMode] || BUSINESS_CATALOGS.RETAIL;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(targetMode, replaceCatalog, updateBranding);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-slate-800 flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              POS Configuration
            </span>
            <span className="text-[10px] font-bold tracking-wider uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Confirmation Required
            </span>
          </div>
          <h3 className="font-bold text-lg text-slate-900 tracking-tight mt-1">
            Switch to {targetProfile.title}?
          </h3>
          <p className="text-xs text-slate-500">
            {targetProfile.tagline}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Transition Pill Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Current Profile</span>
              <span className="font-bold text-slate-700">{currentProfile.title}</span>
            </div>
            <span className="text-slate-400 font-bold">➔</span>
            <div className="text-right">
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">New Profile</span>
              <span className="font-bold text-blue-700">{targetProfile.title}</span>
            </div>
          </div>

          {/* Key Adaptations Checklist */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              System & Workflow Adaptations
            </label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              {targetMode === 'RESTAURANT' && (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="text-slate-700"><strong>Dine-In & Takeout tabs:</strong> Enables dining options and Table number (1-20 / VIP) tracking on invoice.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="text-slate-700"><strong>Kitchen Instructions:</strong> Special order notes (Less ice, No spicy, Extra sauce) printed on receipt slip.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="text-slate-700"><strong>Header & Slip:</strong> Configured as <em>Guest Check / Restaurant Bill</em>.</span>
                  </div>
                </>
              )}

              {targetMode === 'RETAIL' && (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="text-slate-700"><strong>Fast Counter Scanning:</strong> Dining options and table numbers hidden to eliminate counter clutter.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="text-slate-700"><strong>Barcode Priority:</strong> Supermarket inventory, stock quantities, and instant barcode lookups.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="text-slate-700"><strong>Header & Slip:</strong> Formatted as <em>Official Receipt / Retail Register</em>.</span>
                  </div>
                </>
              )}

              {targetMode === 'VAPE_SHOP' && (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="text-slate-700"><strong>18+ Age Verification:</strong> RA 11900 statutory compliance indicator on checkout invoice.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="text-slate-700"><strong>Nicotine & Flavor Presets:</strong> Quick item instruction tags (3mg, 6mg, 25mg Salt, Menthol Ice).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="text-slate-700"><strong>Header & Slip:</strong> Formatted as <em>Specialty Vape Receipt</em> with statutory health advisory.</span>
                  </div>
                </>
              )}

              {targetMode === 'SERVICES' && (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="text-slate-700"><strong>Specialist & Technician Assignment:</strong> Track assigned stylist or repair tech per transaction.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="text-slate-700"><strong>Labor & Diagnostics:</strong> Services and labor lines without strict inventory count limits.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="text-slate-700"><strong>Header & Slip:</strong> Formatted as <em>Service Invoice & Acknowledgement</em> with warranty note.</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Options Toggles */}
          <div className="space-y-2.5 pt-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Profile Switch Options
            </label>

            {/* Catalog Switch Toggle */}
            <label className="p-3 bg-white border border-slate-200 hover:border-blue-300 rounded-xl flex items-start gap-3 cursor-pointer transition">
              <input
                type="checkbox"
                checked={replaceCatalog}
                onChange={(e) => setReplaceCatalog(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <div className="flex-1 min-w-0 text-xs">
                <span className="font-bold text-slate-800 block">
                  Switch catalog to {targetProfile.title} items
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Loads {targetProfile.products.length} sample products and {targetProfile.categories.length} industry categories into your offline database.
                </p>
              </div>
            </label>

            {/* Branding Switch Toggle */}
            <label className="p-3 bg-white border border-slate-200 hover:border-blue-300 rounded-xl flex items-start gap-3 cursor-pointer transition">
              <input
                type="checkbox"
                checked={updateBranding}
                onChange={(e) => setUpdateBranding(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <div className="flex-1 min-w-0 text-xs">
                <span className="font-bold text-slate-800 block">
                  Update Store Name & Receipt Headers
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Sets name to &quot;{targetProfile.defaultStoreName}&quot; and adapts thermal receipt headers and footers.
                </p>
              </div>
            </label>
          </div>

          {/* Warning Banner */}
          <div className="p-3 bg-amber-50/80 border-l-4 border-amber-500 rounded-r-xl text-xs text-amber-900 leading-relaxed">
            <strong className="font-semibold text-amber-950">Notice:</strong> Any active items in the cashier cart will be cleared during mode transition to prevent mismatched items.
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-xs transition active:scale-[0.98] flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <span>Switching Profile…</span>
            ) : (
              <span>Confirm & Switch Mode</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
