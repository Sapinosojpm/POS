/**
 * Universal Hybrid POS — Reactive Sync Manager Hook
 * Orchestrates online/offline detection, background 5-minute polling,
 * and outbox flush triggers.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useSyncStore } from './syncStore';
import { syncClient } from './syncClient';
import { syncWorker } from './syncWorker';
import { pullWorker } from './pullWorker';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export function useSyncManager() {
  const {
    status,
    isOnline,
    pendingCount,
    lastSyncedAt,
    serverUrl,
    error,
    setStatus,
    setIsOnline,
    setPendingCount,
    setLastSyncedAt,
    setError
  } = useSyncStore();

  const isSyncingRef = useRef(false);

  // Refresh pending count from Dexie
  const refreshPendingCount = useCallback(async () => {
    const count = await syncWorker.getPendingCount();
    setPendingCount(count);
    return count;
  }, [setPendingCount]);

  /**
   * Primary bi-directional sync cycle
   */
  const triggerSync = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const currentPending = await refreshPendingCount();

      // Check if browser is reported offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOnline(false);
        setStatus('OFFLINE');
        return;
      }

      // Probe PostgreSQL sync gateway health
      const isGatewayHealthy = await syncClient.checkHealth();
      if (!isGatewayHealthy) {
        setIsOnline(false);
        setStatus('OFFLINE');
        setError('Cannot reach PostgreSQL sync gateway');
        return;
      }

      setIsOnline(true);
      setError(null);

      // Only enter SYNCING state if there's actual work or pulling
      setStatus('SYNCING');

      // 1. Flush Outbox Queue (Local ➔ Cloud)
      if (currentPending > 0) {
        const pushRes = await syncWorker.flushQueue();
        if (!pushRes.success && pushRes.error) {
          console.warn('[SyncManager] Push flush warning:', pushRes.error);
        }
      }

      // 2. Pull Delta (Cloud ➔ Local)
      const pullRes = await pullWorker.pullChanges();
      if (!pullRes.success && pullRes.error) {
        console.warn('[SyncManager] Pull delta warning:', pullRes.error);
      }

      // 3. Finalize state
      const remaining = await refreshPendingCount();
      const now = Date.now();
      setLastSyncedAt(now);

      if (remaining === 0) {
        setStatus('SYNCED');
      } else {
        setStatus('OFFLINE');
      }
    } catch (err: any) {
      console.error('[SyncManager] Sync cycle failure:', err);
      setStatus('PAUSED');
      setError(err?.message || 'Sync cycle error');
    } finally {
      isSyncingRef.current = false;
    }
  }, [refreshPendingCount, setIsOnline, setStatus, setError, setLastSyncedAt]);

  // Set up event listeners for network transitions and 5-min timer
  useEffect(() => {
    const handleOnline = () => {
      console.log('[SyncManager] Network reconnected to ONLINE');
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      console.log('[SyncManager] Network disconnected to OFFLINE');
      setIsOnline(false);
      setStatus('OFFLINE');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial pending count scan and sync
    refreshPendingCount().then((count) => {
      if (navigator.onLine) {
        triggerSync();
      } else {
        setStatus('OFFLINE');
        setPendingCount(count);
      }
    });

    // 5-minute background delta polling interval
    const intervalId = setInterval(() => {
      if (navigator.onLine && !isSyncingRef.current) {
        triggerSync();
      }
    }, FIVE_MINUTES_MS);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [triggerSync, setIsOnline, setStatus, refreshPendingCount, setPendingCount]);

  return {
    status,
    isOnline,
    pendingCount,
    lastSyncedAt,
    serverUrl,
    error,
    triggerSync,
    refreshPendingCount
  };
}
