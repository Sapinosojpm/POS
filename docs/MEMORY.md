# Project Memory & Decisions Log (MEMORY.md)

## Store Settings & Hardware Decisions
- **Paper Width:** Default to **58mm (32 characters)** for portable Bluetooth printers and Sunmi/iMin handheld POS devices, with 80mm available.
- **Currency Engine:** Unified across the entire app to Philippine Peso (`₱` / `PHP`) by default via `useCartStore` (`currency: '₱'`). All views—Product Catalog, Cart/Invoice summary, Checkout modal, and Inventory view—now dynamically render `{currency}` (₱).
- **Z-Reading Status:** Removed / disabled from active navigation (sidebar and cashier badge) per user request to streamline operations.
- **Backup & Factory Reset Security:** Plain JSON export for portable flash drive backups; Factory Reset / Demo wipe locked behind a **4-digit Manager PIN (`1234`)**.
- **Design Inspiration:** "Restoe" modern restaurant/retail cashier interface.
  - Slim vertical icon navigation sidebar on the left.
  - Rounded category grid cards (Breakfast, Lunch, Dinner, Soup, etc.) with active vibrant blue selection.
  - 3-column product cards with circular food thumbnails, item subtitles, and inline `[-] qty [+]` steppers.
  - Right-side rounded "Invoice" cart panel with subtotal, tax, payment pills (`Credit Card`, `Paylater`, `Cash Payout`), and "Place An Order" button.
- **Color Accent:** Vibrant blue (`#2563EB`) on soft slate-50 canvas.
- **System Model:** Hybrid (Local-First / Offline-First). No checkout action ever depends on network availability.
- **Client Technology:** React + Vite + TypeScript + Tailwind CSS.
- **Mobile/Tablet Packaging:** **Capacitor (`@capacitor/android`)** to build installable **`.apk`** binaries for standalone Android tablets and handheld POS devices (Sunmi, iMin, etc.).
- **Local Storage Engine:** Dexie.js (IndexedDB) running inside Android WebView and Desktop browsers for zero-dependency, instantaneous (<5ms) indexed queries.
- **Sync Protocol:** Outbox pattern with client-generated UUIDv4/UUIDv7 keys. Append-only ledger to prevent overwrite race conditions.
- **Hardware Strategy:** Standard ESC/POS commands via Bluetooth Serial (Capacitor/Web Bluetooth for Android APK) and Web Serial/USB (for desktop terminals).
- **Barcode Scanner Architecture & Decisions:**
  - **Cart Auto-Increment:** Scanning an existing cart item automatically increments quantity by `+1` with instant audio confirmation.
  - **Default Camera Mode:** Opens in **Continuous Batch Scan** mode with an active **1.2-second debounce** on identical barcodes to allow fast, uninterrupted scanning without duplicate runaway counts.
  - **Unregistered Barcode Flow:** Emits low-tone buzz (`220Hz`) and actionable toast with `[+ Add New Product]` shortcut to pre-fill the barcode into the product modal.
  - **Audio/Haptics:** Synthesized client-side via Web Audio API (`880Hz` 80ms beep for success, `220Hz` buzz for miss) + `navigator.vibrate(40)`. Zero asset downloads, 100% offline.
  - **Touch Points:** Integrated into Top Header Bar, Inventory Search Bar, and Add/Edit Product Modal.
  - **Implementation Verification:** Barcode engine bundled using `@zxing/library` + native `BarcodeDetector` fallback, verified with `npm run build` and synced to Android via `npx cap sync`.

- **Discount & Statutory Rules (RA 9994 & RA 10754):**
  - **No Double Discounting:** Stacking is prohibited by law. Customer can apply either a Senior/PWD discount OR a promo voucher.
  - **Statutory Formula:** Strip 12% VAT (`Net of VAT = Gross / 1.12`), then apply 20% discount on the Net of VAT.
  - **Default Coverage:** 100% of current cart by default, with stepper support for group bill sharing.
  - **BIR Audit:** Senior/PWD Name, ID Number, and calculated VAT-exempt sales recorded in order payload and thermal receipt.
  - **Implementation Verification:** Verified statutory formula, live breakdown in CartView, thermal receipt generation, and synced to Capacitor Android.

- **Hold Order & Parked Cart Architecture:**
  - **Stock Deductions:** Deducted ONLY on completed checkout; parked orders never deduct or skew inventory.
  - **Auto-Tagging UX:** Dialog pre-fills auto-incrementing tag (`Hold #1`, `Hold #2`), editable to customer name or table number with 1 tap.
  - **Collision Safety:** Recalling a held order into a non-empty cart seamlessly auto-parks the active cart first to prevent losing items.
  - **Persistence:** Stored in Dexie IndexedDB `held_orders` table to survive browser refreshes and tablet reboots.
  - **Implementation Verification:** Created `HoldCartModal`, `HeldOrdersModal`, live query badge in `Header` and `CartView`, verified with `npm run build` and synced to Android via `npx cap sync`.

- **Backend & Sync Gateway Architecture (Phase 5 - PostgreSQL):**
  - **User Mandate:** "this is offline dont use supabase, use postgres". Zero external cloud SDKs or proprietary vendor lock-in.
  - **Database:** Pure PostgreSQL schema (`sql/postgres_schema.sql`) with idempotent UUID tables (`branches`, `devices`, `categories`, `products`, `orders`, `order_items`, `shifts`, `stock_ledger`).
  - **Client Protocol:** Pure native `fetch`-based REST client (`src/core/sync/syncClient.ts`) communicating with `/api/sync/push` and `/api/sync/pull`.
  - **Machine Authentication:** POS terminals authenticate using a persistent Device Token and Branch ID. Cashiers remain 100% offline using local 4-digit PINs; register operations are never blocked by network outages.
  - **Pull Synchronization:** Smart Delta Polling strategy (on startup, on reconnect, 5-minute background intervals, and manual 'Force Sync' trigger) to conserve tablet battery and cellular bandwidth.
  - **Outbox Push Engine:** Dexie `sync_queue` background worker flushing batches of 50 events using client-generated UUIDv4 idempotency keys.

- **POS Brand Logo Emblem:**
  - Integrated custom POS logo emblem (dynamic shopping cart with modern blue wireless POS terminal, printed receipt, and orange speed streak).
  - Deployed to `public/logo.png`, `public/favicon.png`, and `src/assets/logo.png`.
  - Displayed in the Left Navigation Sidebar (`Sidebar.tsx`) with 12x12 rounded container, browser favicon (`index.html`), and Store Identity card in `SettingsView.tsx`.
  - Verified and bundled in Capacitor Android web assets.

- **Inventory Import/Export & Bulk Stock Operations (Phase 4.9):**
  - **Reconciliation:** Smart Upsert matching on `barcode` first, then `sku`. Matching items update prices and stock; non-matching rows generate new UUIDv4 products.
  - **Stock Movement Ledger:** Bulk restock increments write atomic entries to `stock_ledger` with reason `RESTOCK` and append events to `syncQueue` for PostgreSQL sync.
  - **Pricing & Encoding:** Decimal currency format with UTF-8 BOM encoding to ensure flawless opening in Microsoft Excel and Google Sheets without barcode distortion.

## Target Personas
1. **Micro / Solo User:** Standalone Android tablet running the **`.apk`** with no continuous internet. Daily operations and Z-reports are 100% self-contained on the device.
2. **Medium Business:** Multiple terminals (desktops + tablets) syncing through a centralized cloud backend with role-based cashier PINs and branch management.
