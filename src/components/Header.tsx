import React, { useRef, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, Bell, Wifi, WifiOff, Scan, PackageOpen, RefreshCw, AlertTriangle, ShoppingBag, Check, Menu, LogOut, Volume2, VolumeX } from 'lucide-react';
import { useSyncStore } from '../core/sync/syncStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { db } from '../core/db';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from '../store/useToastStore';
import { isSoundMuted, setSoundMuted } from '../core/hardware/scannerFeedback';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenNotifications: () => void;
  onOpenScanner?: () => void;
  onOpenHeldOrders?: () => void;
  onOpenSyncModal?: () => void;
  onOpenCart?: () => void;
  onToggleNav?: () => void;
  cartItemsCount?: number;
  /** True for ~2s after a hardware barcode scan was received */
  scanFlash?: boolean;
  isCartCollapsed?: boolean;
  isNavCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenNotifications,
  onOpenScanner,
  onOpenHeldOrders,
  onOpenSyncModal,
  onOpenCart,
  onToggleNav,
  cartItemsCount = 0,
  scanFlash = false,
  isCartCollapsed = false,
  isNavCollapsed = false,
}) => {
  const { status, pendingCount } = useSyncStore();
  const { currentUser, logout } = useAuthStore();
  const businessType = useSettingsStore((state) => state.settings.businessType || 'RETAIL');
  const heldOrdersCount = useLiveQuery(() => db.heldOrders.count(), []) || 0;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [muted, setMuted] = useState(() => isSoundMuted());

  const businessModeBadges: Record<string, { label: string; badgeClass: string }> = {
    RETAIL: { label: 'Retail & Grocery', badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    RESTAURANT: { label: 'Restaurant & Cafe', badgeClass: 'bg-amber-50 text-amber-900 border-amber-200' },
    VAPE_SHOP: { label: 'Vape Lounge', badgeClass: 'bg-purple-50 text-purple-900 border-purple-200' },
    SERVICES: { label: 'Services & Salon', badgeClass: 'bg-blue-50 text-blue-900 border-blue-200' },
  };
  const activeModeBadge = businessModeBadges[businessType] || businessModeBadges.RETAIL;

  // Pro Cashier Hotkey Listener: press '/' or 'F1' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputFocused = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      if ((e.key === '/' || e.key === 'F1') && !isInputFocused) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-4 lg:px-5 flex items-center justify-between shrink-0 select-none gap-2">
      {/* Search Input Box & Barcode Scanner Button */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
        {onToggleNav && (
          <button
            type="button"
            onClick={onToggleNav}
            className="hidden md:flex p-2 -ml-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition active:scale-95 shrink-0"
            title={isNavCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar for full-width products'}
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="relative flex-1 min-w-0 max-w-[260px] xl:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu or scan (/)..."
            className="w-full bg-slate-50 border border-slate-200 pl-8 sm:pl-9 pr-7 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm placeholder:text-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          ) : (
            <span className="hidden xl:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded pointer-events-none">
              /
            </span>
          )}
        </div>

        {onOpenScanner && (
          <button
            type="button"
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition shadow-xs active:scale-95 shrink-0"
            title="Scan barcode with camera (tablet or mobile)"
          >
            <Scan className="w-4 h-4" />
            <span className="hidden sm:inline">Camera</span>
          </button>
        )}

        {/* Scan confirmation: appears only briefly when a hardware scan is received */}
        {scanFlash && (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold shrink-0 animate-pop"
            role="status"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Scanned</span>
          </div>
        )}

        {/* Held Orders Pill Badge */}
        {heldOrdersCount > 0 && onOpenHeldOrders && (
          <button
            type="button"
            onClick={onOpenHeldOrders}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition shadow-2xs active:scale-95 shrink-0"
            title="View parked / held customer carts"
          >
            <PackageOpen className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">{heldOrdersCount} Held</span>
            <span className="sm:hidden">{heldOrdersCount}</span>
          </button>
        )}

        {/* Business Profile Mode Badge */}
        <div
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold shrink-0 ${activeModeBadge.badgeClass}`}
          title="Active business profile mode (configured in Settings)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
          <span>{activeModeBadge.label}</span>
        </div>
      </div>

      {/* Right Controls: Flag/Currency, Notification, Cashier Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Cart Toggle Pill (Portrait or when desktop invoice is collapsed) */}
        {onOpenCart && (
          <button
            type="button"
            onClick={onOpenCart}
            className={`${isCartCollapsed ? 'flex' : 'lg:hidden flex'} relative p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition active:scale-95 shrink-0`}
            title="View Cart Invoice"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartItemsCount > 0 && (
              <span
                key={cartItemsCount}
                className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center px-1 shadow-sm animate-pop"
              >
                {cartItemsCount}
              </span>
            )}
          </button>
        )}

        {/* Cloud Sync Gateway Indicator (Clickable to open audit popover) */}
        <button
          type="button"
          onClick={onOpenSyncModal}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 shadow-2xs shrink-0 ${
            status === 'SYNCED'
              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
              : status === 'SYNCING'
              ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
              : status === 'PAUSED'
              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
          }`}
          title="Sync status: tap for details or to force sync"
        >
          {status === 'SYNCED' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Online</span>
            </>
          ) : status === 'SYNCING' ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span className="hidden md:inline">{pendingCount > 0 ? `Syncing ${pendingCount}…` : 'Syncing…'}</span>
            </>
          ) : status === 'PAUSED' ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden md:inline">Sync issue</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{pendingCount > 0 ? `Offline · ${pendingCount} queued` : 'Offline'}</span>
            </>
          )}
        </button>

        {/* Audio Sound Feedback Mute/Unmute Toggle */}
        <button
          type="button"
          onClick={() => {
            const next = !muted;
            setMuted(next);
            setSoundMuted(next);
            toast.info(next ? 'Audio Silenced' : 'Audio Enabled', next ? 'Barcode beeps & chimes muted' : 'Scanner beeps & chimes active');
          }}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition active:scale-95 shrink-0 ${
            muted
              ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-blue-600 hover:bg-blue-50'
          }`}
          title={muted ? 'Unmute scanner & POS audio' : 'Mute scanner & POS audio'}
        >
          {muted ? <VolumeX className="w-4 h-4 text-amber-600" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Premium Notification Stack Bell Button */}
        <button
          onClick={onOpenNotifications}
          className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition relative active:scale-95 shrink-0"
          title="Open Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-indigo-600 absolute top-1.5 right-1.5 ring-2 ring-white"></span>
        </button>

        {/* Cashier Avatar & Name Badge (Clickable to Lock / Switch user) */}
        <button
          type="button"
          onClick={() => {
            logout();
            toast.info('Terminal Locked', 'Switched user / locked terminal.');
          }}
          className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-left shrink-0 transition active:scale-95 cursor-pointer"
          title="Click to lock terminal or switch cashier"
        >
          {currentUser?.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-md object-cover ring-1 ring-slate-200"
            />
          ) : (
            <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-white text-[11px] ${currentUser?.color || 'bg-blue-600'}`}>
              {(currentUser?.name || 'C').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="hidden sm:block">
            <h4 className="font-bold text-xs text-slate-800 leading-tight truncate max-w-[120px]">
              {currentUser?.name || 'Cashier'}
            </h4>
            <p className="text-[10px] text-slate-500 font-medium capitalize">
              {currentUser?.role?.toLowerCase() || 'Staff'}
            </p>
          </div>
          <LogOut className="w-3.5 h-3.5 text-slate-400 hidden sm:inline ml-0.5" />
        </button>
      </div>
    </header>
  );
};
