import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, Bell, Wifi, WifiOff, Scan, PackageOpen, RefreshCw, AlertTriangle } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useSyncStore } from '../core/sync/syncStore';
import { db } from '../core/db';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenNotifications: () => void;
  onOpenScanner?: () => void;
  onOpenHeldOrders?: () => void;
  onOpenSyncModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenNotifications,
  onOpenScanner,
  onOpenHeldOrders,
  onOpenSyncModal,
}) => {
  const { status, pendingCount } = useSyncStore();
  const { settings } = useSettingsStore();
  const heldOrdersCount = useLiveQuery(() => db.heldOrders.count(), []) || 0;

  const flag = settings.currencyCode === 'PHP' ? '🇵🇭' : settings.currencyCode === 'USD' ? '🇺🇸' : '🇪🇺';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 select-none">
      {/* Search Input Box & Barcode Scanner Button */}
      <div className="flex items-center gap-2">
        <div className="relative w-72 lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu or scan barcode..."
            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {onOpenScanner && (
          <button
            type="button"
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition shadow-xs active:scale-95 shrink-0"
            title="Scan barcode with camera (tablet or mobile)"
          >
            <Scan className="w-4 h-4" />
            <span className="hidden sm:inline">Camera</span>
          </button>
        )}

        {/* Barcode Gun Active Pill */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold"
          title="Physical USB/Bluetooth barcode gun is always active. Just pull the trigger anytime!"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Gun Ready</span>
        </div>

        {/* Held Orders Pill Badge */}
        {heldOrdersCount > 0 && onOpenHeldOrders && (
          <button
            type="button"
            onClick={onOpenHeldOrders}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition shadow-2xs active:scale-95"
            title="View parked / held customer carts"
          >
            <PackageOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>{heldOrdersCount} Held</span>
          </button>
        )}
      </div>

      {/* Right Controls: Flag/Currency, Notification, Cashier Profile */}
      <div className="flex items-center space-x-2.5">
        {/* Cloud Sync Gateway Indicator (Clickable to open audit popover) */}
        <button
          type="button"
          onClick={onOpenSyncModal}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition active:scale-95 shadow-2xs ${
            status === 'SYNCED'
              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
              : status === 'SYNCING'
              ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
              : status === 'PAUSED'
              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
          }`}
          title="Click to view PostgreSQL Sync Gateway details & force sync"
        >
          {status === 'SYNCED' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Synced</span>
            </>
          ) : status === 'SYNCING' ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span className="hidden sm:inline">
                {pendingCount > 0 ? `Syncing (${pendingCount})...` : 'Syncing...'}
              </span>
            </>
          ) : status === 'PAUSED' ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Sync Warning</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {pendingCount > 0 ? `Offline (${pendingCount} Queued)` : 'Offline'}
              </span>
            </>
          )}
        </button>

        {/* Currency / Flag Toggle */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-md border border-slate-200 text-xs font-bold">
          <span className="text-sm leading-none">{flag}</span>
          <span className="text-slate-700">{settings.currencyCode}</span>
        </div>

        {/* Premium Notification Stack Bell Button */}
        <button
          onClick={onOpenNotifications}
          className="w-9 h-9 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition relative active:scale-95"
          title="Open Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-indigo-600 absolute top-2 right-2 ring-2 ring-white"></span>
        </button>

        {/* Cashier Avatar & Name Badge */}
        <div className="flex items-center gap-2.5 pl-2 pr-3 py-1 bg-slate-50 rounded-lg border border-slate-200 text-left">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt="Courtney Henry"
            className="w-8 h-8 rounded-md object-cover"
          />
          <div>
            <h4 className="font-bold text-xs text-slate-800 leading-tight">Courtney Henry</h4>
            <p className="text-[10px] text-slate-400 font-medium">Cashier 1st Shift</p>
          </div>
        </div>
      </div>
    </header>
  );
};
