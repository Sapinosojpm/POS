/**
 * Universal Hybrid POS — Standalone PostgreSQL Sync Gateway Server
 * Runs with pure Node.js (or pg pool when DATABASE_URL is provided).
 */

import http from 'node:http';
import { URL } from 'node:url';

const PORT = process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pos_db';

// In-memory fallback ledger when raw PostgreSQL socket is disconnected in offline/dev testing
const fallbackStore = {
  branches: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      code: 'MAIN-BRANCH',
      name: 'Universal POS Flagship Store',
      tin: '123-456-789-000'
    }
  ],
  categories: [],
  products: [],
  orders: new Map(),
  shifts: new Map(),
  stockLedger: []
};

// Optional pg client loading
let pgPool = null;
try {
  const { default: pg } = await import('pg');
  pgPool = new pg.Pool({ connectionString: DATABASE_URL });
  console.log('[Sync Gateway] Connecting to PostgreSQL at:', DATABASE_URL);
} catch {
  console.log('[Sync Gateway] Running in pure standalone HTTP sync mode (pg module optional).');
}

/**
 * Handle POST /api/sync/push
 * Batch ingestion of terminal outbox events
 */
async function handleSyncPush(body) {
  const { branchId, deviceToken, events } = body;
  if (!Array.isArray(events)) {
    return { error: 'Invalid payload: "events" must be an array', status: 400 };
  }

  const syncedIds = [];

  for (const event of events) {
    const { id, entity, action, payload, createdAt } = event;
    try {
      if (pgPool) {
        // Idempotent upsert into PostgreSQL
        if (entity === 'order') {
          const order = payload.order || payload;
          const items = payload.items || order.items || [];

          await pgPool.query(
            `INSERT INTO orders (
              id, branch_id, order_number, cashier_name, shift_id, subtotal, discount,
              tax, total, discount_type, discount_customer_name, discount_id_number,
              vat_exempt_amount, senior_discount_amount, payment_method, amount_tendered,
              change_due, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            ON CONFLICT (id) DO NOTHING`,
            [
              order.id,
              branchId || '00000000-0000-0000-0000-000000000001',
              order.orderNumber,
              order.cashierName,
              order.shiftId || null,
              order.subtotal,
              order.discount || 0,
              order.tax || 0,
              order.total,
              order.discountType || null,
              order.discountCustomerName || null,
              order.discountIdNumber || null,
              order.vatExemptAmount || 0,
              order.seniorDiscountAmount || 0,
              order.paymentMethod,
              order.amountTendered,
              order.changeDue || 0,
              order.status || 'COMPLETED',
              order.createdAt || createdAt
            ]
          );

          if (Array.isArray(items)) {
            for (const item of items) {
              await pgPool.query(
                `INSERT INTO order_items (id, order_id, product_id, product_name, price, quantity, subtotal)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (id) DO NOTHING`,
                [
                  item.id,
                  order.id,
                  item.productId,
                  item.productName,
                  item.price,
                  item.quantity,
                  item.subtotal
                ]
              );
            }
          }
                `INSERT INTO order_items (id, order_id, product_id, product_name, price, quantity, subtotal)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (id) DO NOTHING`,
                [
                  item.id,
                  payload.id,
                  item.productId,
                  item.productName,
                  item.price,
                  item.quantity,
                  item.subtotal
                ]
              );
            }
          }
        } else if (entity === 'shift') {
          await pgPool.query(
            `INSERT INTO shifts (
              id, branch_id, cashier_name, opened_at, closed_at, starting_float,
              total_cash_sales, total_non_cash_sales, expected_cash_in_drawer,
              actual_cash_counted, discrepancy, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (id) DO UPDATE SET
              closed_at = EXCLUDED.closed_at,
              total_cash_sales = EXCLUDED.total_cash_sales,
              total_non_cash_sales = EXCLUDED.total_non_cash_sales,
              expected_cash_in_drawer = EXCLUDED.expected_cash_in_drawer,
              actual_cash_counted = EXCLUDED.actual_cash_counted,
              discrepancy = EXCLUDED.discrepancy,
              status = EXCLUDED.status,
              updated_at = NOW()`,
            [
              payload.id,
              branchId || '00000000-0000-0000-0000-000000000001',
              payload.cashierName,
              payload.openedAt,
              payload.closedAt || null,
              payload.startingFloat,
              payload.totalCashSales,
              payload.totalNonCashSales,
              payload.expectedCashInDrawer,
              payload.actualCashCounted || null,
              payload.discrepancy || null,
              payload.status
            ]
          );
        } else if (entity === 'stock') {
          await pgPool.query(
            `INSERT INTO stock_ledger (id, branch_id, product_id, delta, reason, order_id, client_timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO NOTHING`,
            [
              id,
              branchId || '00000000-0000-0000-0000-000000000001',
              payload.productId,
              payload.delta,
              payload.reason || 'SALE',
              payload.orderId || null,
              createdAt
            ]
          );
        }
      } else {
        // In-memory fallback
        if (entity === 'order') {
          fallbackStore.orders.set(payload.id, payload);
        } else if (entity === 'shift') {
          fallbackStore.shifts.set(payload.id, payload);
        } else if (entity === 'stock') {
          fallbackStore.stockLedger.push({ id, ...payload, createdAt });
        }
      }

      syncedIds.push(id);
    } catch (err) {
      console.error(`[Sync Gateway] Failed to process event ${id}:`, err);
    }
  }

  return {
    success: true,
    processedCount: syncedIds.length,
    syncedIds,
    serverTimestamp: Date.now()
  };
}

/**
 * Handle GET /api/sync/pull?since={timestamp}
 * Delta fetch of updated products and categories
 */
async function handleSyncPull(url) {
  const sinceParam = url.searchParams.get('since');
  const since = sinceParam ? parseInt(sinceParam, 10) : 0;
  const sinceDate = new Date(since).toISOString();

  let categories = [];
  let products = [];

  if (pgPool) {
    try {
      const catRes = await pgPool.query(
        'SELECT * FROM categories WHERE updated_at > $1 ORDER BY updated_at ASC',
        [sinceDate]
      );
      categories = catRes.rows;

      const prodRes = await pgPool.query(
        'SELECT * FROM products WHERE updated_at > $1 ORDER BY updated_at ASC',
        [sinceDate]
      );
      products = prodRes.rows;
    } catch (err) {
      console.error('[Sync Gateway] Error during delta pull:', err);
    }
  } else {
    categories = fallbackStore.categories;
    products = fallbackStore.products;
  }

  return {
    success: true,
    serverTimestamp: Date.now(),
    categories,
    products
  };
}

const server = http.createServer(async (req, res) => {
  // CORS Headers for hybrid POS tablet/PWA access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Device-Token');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && parsedUrl.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', database: pgPool ? 'postgres' : 'offline-mock', time: Date.now() }));
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/api/sync/pull') {
    const data = await handleSyncPull(parsedUrl);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/sync/push') {
    let bodyText = '';
    req.on('data', chunk => { bodyText += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(bodyText);
        const result = await handleSyncPush(payload);
        res.writeHead(result.error ? result.status : 200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Malformed JSON payload' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Route not found' }));
});

server.listen(PORT, () => {
  console.log(`[Universal POS] PostgreSQL Sync Gateway running on port ${PORT}`);
});
