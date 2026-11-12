/**
 * Universal Hybrid POS — Outbox Push Worker
 * Scans Dexie IndexedDB syncQueue table and pushes batches of 50 to PostgreSQL
 */

import { db } from '../db';
import { syncClient } from './syncClient';
import type { SyncEvent } from '../../types';

export interface PushResult {
  success: boolean;
  pushedCount: number;
  remainingCount: number;
  error?: string;
}

export class SyncWorker {
  private isRunning: boolean = false;

  /**
   * Get all pending (un-synced) events from Dexie
   */
  async getPendingEvents(limit: number = 50): Promise<SyncEvent[]> {
    try {
      const allEvents = await db.syncQueue.toArray();
      const pending = allEvents.filter((ev) => !ev.synced);
      return pending.slice(0, limit);
    } catch (err) {
      console.error('[SyncWorker] Error querying pending sync events:', err);
      return [];
    }
  }

  /**
   * Get total count of un-synced events
   */
  async getPendingCount(): Promise<number> {
    try {
      const allEvents = await db.syncQueue.toArray();
      return allEvents.filter((ev) => !ev.synced).length;
    } catch {
      return 0;
    }
  }

  /**
   * Flush pending outbox batch to PostgreSQL
   */
  async flushQueue(): Promise<PushResult> {
    if (this.isRunning) {
      return { success: false, pushedCount: 0, remainingCount: await this.getPendingCount(), error: 'Worker already busy' };
    }

    this.isRunning = true;

    try {
      const pending = await this.getPendingEvents(50);
      if (pending.length === 0) {
        return { success: true, pushedCount: 0, remainingCount: 0 };
      }

      console.log(`[SyncWorker] Flushing ${pending.length} pending events to PostgreSQL gateway...`);
      const response = await syncClient.pushEvents(pending);

      if (!response.success || response.syncedIds.length === 0) {
        return {
          success: false,
          pushedCount: 0,
          remainingCount: await this.getPendingCount(),
          error: response.error || 'Server rejected batch'
        };
      }

      // Mark acknowledged IDs as synced in Dexie
      await db.transaction('rw', db.syncQueue, db.orders, async () => {
        for (const syncedId of response.syncedIds) {
          const ev = pending.find((p) => p.id === syncedId);
          await db.syncQueue.update(syncedId, { synced: true });

          // If this was an order event, also flag the order record as synced
          if (ev?.entity === 'order') {
            const orderId = ev.payload?.order?.id || ev.payload?.id;
            if (orderId) {
              await db.orders.update(orderId, { synced: true });
            }
          }
        }
      });

      const remaining = await this.getPendingCount();
      console.log(`[SyncWorker] Successfully pushed ${response.syncedIds.length} events. ${remaining} remaining.`);

      return {
        success: true,
        pushedCount: response.syncedIds.length,
        remainingCount: remaining
      };
    } catch (err: any) {
      console.error('[SyncWorker] Fatal error during queue flush:', err);
      return {
        success: false,
        pushedCount: 0,
        remainingCount: await this.getPendingCount(),
        error: err?.message || 'Unknown flush error'
      };
    } finally {
      this.isRunning = false;
    }
  }
}

export const syncWorker = new SyncWorker();
