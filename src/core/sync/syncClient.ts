/**
 * Universal Hybrid POS — Pure HTTP Sync Client
 * Communicates with the PostgreSQL Sync Gateway via pure browser fetch.
 * Zero external cloud dependencies.
 */

import type { SyncEvent, Category, Product } from '../../types';

export interface PushResponse {
  success: boolean;
  processedCount: number;
  syncedIds: string[];
  serverTimestamp?: number;
  error?: string;
}

export interface PullResponse {
  success: boolean;
  serverTimestamp: number;
  categories: Category[];
  products: Product[];
  error?: string;
}

export class SyncClient {
  private getBaseUrl(): string {
    const envUrl = typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SYNC_SERVER_URL : undefined;
    return (
      localStorage.getItem('pos_sync_server_url') ||
      envUrl ||
      'http://localhost:3001'
    );
  }

  private getBranchId(): string {
    return (
      localStorage.getItem('pos_branch_id') ||
      '00000000-0000-0000-0000-000000000001'
    );
  }

  private getDeviceToken(): string {
    return (
      localStorage.getItem('pos_device_token') ||
      'dev_token_pos_primary_001'
    );
  }

  /**
   * Quick non-blocking health probe with 3-second timeout
   */
  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`${this.getBaseUrl()}/api/health`, {
        signal: controller.signal,
        headers: {
          'X-Device-Token': this.getDeviceToken()
        }
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Push batched outbox events to PostgreSQL sync gateway
   */
  async pushEvents(events: SyncEvent[]): Promise<PushResponse> {
    if (events.length === 0) {
      return { success: true, processedCount: 0, syncedIds: [] };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const payload = {
        branchId: this.getBranchId(),
        deviceToken: this.getDeviceToken(),
        events
      };

      const res = await fetch(`${this.getBaseUrl()}/api/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Token': this.getDeviceToken()
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Sync push failed with HTTP status ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      return {
        success: false,
        processedCount: 0,
        syncedIds: [],
        error: err?.message || 'Network error during sync push'
      };
    }
  }

  /**
   * Pull delta changes (products, prices, categories) from PostgreSQL
   */
  async pullDelta(since: number): Promise<PullResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const url = `${this.getBaseUrl()}/api/sync/pull?since=${since}`;
      const res = await fetch(url, {
        headers: {
          'X-Device-Token': this.getDeviceToken()
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Sync pull failed with HTTP status ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      return {
        success: false,
        serverTimestamp: since,
        categories: [],
        products: [],
        error: err?.message || 'Network error during sync pull'
      };
    }
  }
}

export const syncClient = new SyncClient();
