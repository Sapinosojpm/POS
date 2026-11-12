/**
 * Universal Hybrid POS — Sync State Store (Zustand)
 */

import { create } from 'zustand';

export type SyncStatus = 'SYNCED' | 'SYNCING' | 'OFFLINE' | 'PAUSED';

interface SyncStoreState {
  status: SyncStatus;
  isOnline: boolean;
  pendingCount: number;
  lastSyncedAt: number | null;
  serverUrl: string;
  error: string | null;

  setStatus: (status: SyncStatus) => void;
  setIsOnline: (online: boolean) => void;
  setPendingCount: (count: number) => void;
  setLastSyncedAt: (ts: number | null) => void;
  setServerUrl: (url: string) => void;
  setError: (err: string | null) => void;
}

export const useSyncStore = create<SyncStoreState>((set) => ({
  status: typeof navigator !== 'undefined' && navigator.onLine ? 'SYNCED' : 'OFFLINE',
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingCount: 0,
  lastSyncedAt: null,
  serverUrl:
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('pos_sync_server_url') || 'http://localhost:3001'
      : 'http://localhost:3001',
  error: null,

  setStatus: (status) => set({ status }),
  setIsOnline: (isOnline) => set({ isOnline }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
  setServerUrl: (serverUrl) => {
    localStorage.setItem('pos_sync_server_url', serverUrl);
    set({ serverUrl });
  },
  setError: (error) => set({ error })
}));
