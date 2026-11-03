# Coding & Architectural Rules — Universal Hybrid POS

## 1. Golden Rules of Offline-First POS
1. **Never Block on Network:** No register operation (product search, cart add, checkout, receipt printing) may await an HTTP/network request. All writes hit the local database immediately.
2. **Client-Generated UUIDs Only:** Every entity primary key must be a client-generated UUID (UUIDv4 or UUIDv7). Never rely on server-assigned sequential IDs.
3. **Immutable Transactions:** Completed orders are immutable. Never run a SQL `DELETE` or `UPDATE` on a completed sale. Returns and voids are recorded as new compensating transactions (`REFUND` / `VOID`).
4. **Exact Currency Arithmetic:** Never use floating-point numbers (`0.1 + 0.2 !== 0.3`) for prices or totals. Store amounts in minor currency units (cents/centavos: `1000` = $10.00) or use an exact library like `decimal.js`.

---

## 2. Touch & Tablet UI Constraints
1. **Touch Target Size:** Every interactive element (buttons, tabs, row items) must have a minimum clickable area of **48px x 48px** for easy finger taps on 7"–11" screens.
2. **No Hover Dependencies:** Do not build critical features behind CSS `:hover` states, as tablets and touch monitors do not support hover.
3. **Quick Cash Buttons:** The checkout screen must always provide one-tap common cash denominations (e.g., exact amount, next round ten, fifty, hundred) to eliminate manual numpad typing.
4. **Keyboard-Friendly Barcode Scanning:** The application must have a global listener for barcode scanners operating in keyboard-wedge mode, capturing scans within 30-50ms regardless of which input currently has focus.
5. **Skeleton Loaders Only (No Raw Spinners):** Never show raw blank screens or basic full-screen loading spinners during data transitions. Always use Skeleton Shimmer Loading states to preserve layout stability (prevent Cumulative Layout Shift - CLS) and improve Largest Contentful Paint (LCP).

---

## 3. Code Quality & Architecture Standards
1. **TypeScript Strict Mode:** `"strict": true` in `tsconfig.json`. Use explicit types and interfaces; `any` is strictly prohibited.
2. **Separation of Concerns:**
   - `src/core/db/` — Local database queries and schema.
   - `src/core/hardware/` — Hardware drivers (printers, scanners, drawer).
   - `src/core/sync/` — Sync worker, outbox processor, conflict resolvers.
   - `src/features/` — Domain-driven UI components (register, inventory, shifts, settings).
3. **Defensive Error Handling:** Hardware disconnections (printer out of paper, Bluetooth link dropped) must produce actionable UI prompts without crashing the app.
