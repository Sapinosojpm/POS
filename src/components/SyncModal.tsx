/**
 * Universal Hybrid POS — PostgreSQL Sync Gateway Audit & Config Modal
 * Conforms to Restoe design tokens.
 */

import React, { useState } from 'react';
import { RefreshCw, Database, Server, CheckCircle2, AlertTriangle, Wifi, WifiOff, X } from 'lucide-react';
import { useSyncStore } from '../core/sync/syncStore';
import { useSyncManager } from '../core/sync/useSyncManager';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose }) => {
  const { status, isOnline, pendingCount, lastSyncedAt, serverUrl, error, setServerUrl } = useSyncStore();
  const { triggerSync } = useSyncManager();

  const [inputUrl, setInputUrl] = useState(serverUrl);
  const [isSaved, setIsSaved] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setServerUrl(inputUrl);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    await triggerSync();
    setIsManualSyncing(false);
  };

  const formatLastSync = (ts: number | null) => {
    if (!ts) return 'Never synced';
    const diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 60) return `${diffSec} seconds ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    return new Date(ts).toLocaleTimeString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">PostgreSQL Sync Gateway</h3>
              <p className="text-[11px] text-slate-400 font-medium">Offline-First Delta Outbox</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {/* Status KPI Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status === 'SYNCED' ? (
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : status === 'SYNCING' || isManualSyncing ? (
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : status === 'PAUSED' ? (
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                  <WifiOff className="w-6 h-6" />
                </div>
              )}

              <div>
                <h4 className="font-bold text-xs text-slate-800">
                  {status === 'SYNCED'
                    ? 'All Transactions Synced'
                    : status === 'SYNCING' || isManualSyncing
                    ? 'Flushing Outbox Batch...'
                    : status === 'PAUSED'
                    ? 'Sync Warning / Backoff'
                    : 'Terminal Offline'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {pendingCount === 0
                    ? 'No queued outbox records'
                    : `${pendingCount} event${pendingCount > 1 ? 's' : ''} stored safely in local Dexie`}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  isOnline
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Sync Stats Breakdown */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Pending Outbox
              </span>
              <span className="text-lg font-black text-slate-800">{pendingCount}</span>
              <span className="text-[10px] text-slate-500 block">transactions queued</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Last Sync Time
              </span>
              <span className="text-sm font-bold text-slate-800 mt-1 block">
                {formatLastSync(lastSyncedAt)}
              </span>
              <span className="text-[10px] text-slate-500 block">cloud heartbeat</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Gateway Endpoint Configuration */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-600" />
              PostgreSQL Sync Server Endpoint
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="http://localhost:3001 or LAN IP"
                className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={handleSave}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
              >
                {isSaved ? 'Saved!' : 'Save'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              Cashiers operate 100% offline. The register auto-syncs when this endpoint is reachable.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isManualSyncing}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
            <span>{isManualSyncing ? 'Syncing Now...' : 'Force Sync Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
