/**
 * Universal Hybrid POS — Delta Pull Worker
 * Downloads updated products, prices, and categories from PostgreSQL into Dexie IndexedDB
 */

import { db } from '../db';
import { syncClient } from './syncClient';

const LAST_SYNC_KEY = 'pos_last_pull_timestamp';

export interface PullResult {
  success: boolean;
  categoriesUpdated: number;
  productsUpdated: number;
  serverTimestamp: number;
  error?: string;
}

export class PullWorker {
  private isPulling: boolean = false;

  getLastSyncTimestamp(): number {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    return stored ? parseInt(stored, 10) : 0;
  }

  setLastSyncTimestamp(ts: number): void {
    localStorage.setItem(LAST_SYNC_KEY, ts.toString());
  }

  /**
   * Pull delta changes from PostgreSQL and merge atomically into Dexie
   */
  async pullChanges(): Promise<PullResult> {
    if (this.isPulling) {
      return {
        success: false,
        categoriesUpdated: 0,
        productsUpdated: 0,
        serverTimestamp: this.getLastSyncTimestamp(),
        error: 'Pull already in progress'
      };
    }

    this.isPulling = true;

    try {
      const since = this.getLastSyncTimestamp();
      console.log(`[PullWorker] Checking for cloud catalog updates since: ${new Date(since).toISOString()}`);

      const response = await syncClient.pullDelta(since);

      if (!response.success) {
        return {
          success: false,
          categoriesUpdated: 0,
          productsUpdated: 0,
          serverTimestamp: since,
          error: response.error || 'Failed to pull delta from server'
        };
      }

      let catCount = 0;
      let prodCount = 0;

      await db.transaction('rw', db.categories, db.products, async () => {
        // Merge categories
        if (Array.isArray(response.categories) && response.categories.length > 0) {
          for (const cat of response.categories) {
            await db.categories.put({
              id: cat.id,
              name: cat.name,
              icon: cat.icon,
              image: cat.image,
              color: cat.color
            });
            catCount++;
          }
        }

        // Merge products
        if (Array.isArray(response.products) && response.products.length > 0) {
          for (const prod of response.products) {
            await db.products.put({
              id: prod.id,
              name: prod.name,
              barcode: prod.barcode || '',
              sku: prod.sku || '',
              categoryId: (prod as any).category_id || prod.categoryId || '',
              price: Number(prod.price),
              cost: Number(prod.cost || 0),
              stock: Number(prod.stock || 0),
              image: prod.image
            });
            prodCount++;
          }
        }
      });

      if (response.serverTimestamp) {
        this.setLastSyncTimestamp(response.serverTimestamp);
      }

      console.log(`[PullWorker] Delta pull complete: ${catCount} categories, ${prodCount} products updated.`);

      return {
        success: true,
        categoriesUpdated: catCount,
        productsUpdated: prodCount,
        serverTimestamp: response.serverTimestamp
      };
    } catch (err: any) {
      console.error('[PullWorker] Error merging delta updates:', err);
      return {
        success: false,
        categoriesUpdated: 0,
        productsUpdated: 0,
        serverTimestamp: this.getLastSyncTimestamp(),
        error: err?.message || 'Unknown delta merge error'
      };
    } finally {
      this.isPulling = false;
    }
  }
}

export const pullWorker = new PullWorker();
