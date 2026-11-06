# Implementation Roadmap (TASKS.md)

## Phase 1: Project Foundation & Offline Core
- [x] Initialize React + Vite + TypeScript + Tailwind CSS workspace.
- [x] Setup Capacitor for Android (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`).
- [x] Configure `capacitor.config.ts` (app ID, app name, webDir).
- [x] Install UI primitives (`lucide-react`, `clsx`, `tailwind-merge`).
- [x] Implement local-first database schema using Dexie.js (IndexedDB) with models:
  - `products`, `categories`, `orders`, `order_items`, `shifts`, `sync_queue`.
- [x] Create seed data generator for fast demo testing (26 retail/grocery products with barcodes & open shift).

## Phase 2: Restoe-Inspired Touch POS Register & Cart UI
- [x] Slim vertical icon navigation bar (POS, Inventory, Orders, Shifts, Reports, Logout).
- [x] Top header bar with search input, cashier badge, and sync status indicator.
- [x] 2-row category card grid with icons, stock counts, and active blue selection.
- [x] 3-column product card grid with circular thumbnails, descriptions, bold prices, and inline `[-] qty [+]` stepper.
- [x] Right-side Invoice panel with order items, payment summary, payment selector pills, and "Place An Order" button.
- [x] Global barcode scanner listener (captures rapid keyboard-wedge scanner inputs < 50ms).
- [x] Dedicated Offline Inventory Management View:
  - 4 KPI summary cards (Total Products, Low Stock Warning, Out of Stock, Total Asset Value).
  - Search & Category filter table.
  - Quick-restock actions (`+5`, `+10`, `+25`).
  - Profit margin calculation badge (`% profit`).
  - Add / Edit product modal directly saving to Dexie IndexedDB.
- [x] Implement 9 Skeleton Loading Patterns (Shimmer, Staggered, Pulse, Cascade) for seamless LCP performance.

## Phase 3: Checkout & ESC/POS Thermal Printing
- [x] Build Touch Numpad & Quick-Cash checkout modal:
  - One-tap buttons for exact cash and common denominations (₱50, ₱100, ₱500, ₱1000).
  - Automatic change calculation in real time.
- [x] Build ESC/POS receipt generator:
  - Header (Store name, TIN/VAT, Date, Order #, Cashier name).
  - Itemized rows and total breakdown.
- [x] Integrate Web Bluetooth print bridge & simulated thermal receipt preview.

## Phase 4: Cashier Shifts & Offline Reports (X/Z-Read)
- [x] Shift summary workflow (starting cash float vs current cash in drawer).
- [-] Z-Reading audit report removed from active navigation per user request.

## Phase 4.5: Store Settings & Hardware Configuration (PRD 3.5)
- [x] Dedicated Settings tab in navigation sidebar with smooth tooltips.
- [x] Store Identity management (Store Name, Branch, Address, Contact, TIN).
- [x] Thermal Printer hardware configuration (58mm 32-char vs 80mm 42-char layout).
- [x] Web Bluetooth thermal printer pairing bridge.
- [x] Live interactive thermal receipt simulation paper roll preview.
- [x] Dynamic Multi-Currency switcher (`₱` PHP, `$` USD, `€` EUR) with VAT tax rate settings.
- [x] 1-Click offline JSON database backup export and restore.
- [x] Factory Reset / Wipe database securely protected by 4-digit Manager PIN (`1234`).
- [x] Manager PIN update dialog.

## Phase 4.6: Comprehensive Barcode Scanner System (PRD 3.6)
- [x] Implement offline sound & haptic utility (`playScanSuccessSound`, `playScanErrorSound`, `triggerHaptic`) using Web Audio API and `navigator.vibrate`.
- [x] Build touch-optimized `BarcodeScannerModal` with live camera video feed, aiming reticle, laser animation, torch toggle, and front/rear camera switcher.
- [x] Implement client-side offline barcode decoding with fallback (HTML5 BarcodeDetector / ZXing).
- [x] Implement Continuous Batch Scan mode with 1.2s debounce on identical barcodes and Single Scan mode.
- [x] Enhance global hardware keyboard-wedge scanner listener with audio feedback and auto-increment cart quantity.
- [x] Add floating toast feedback with quick action to add new product when barcode is not found.
- [x] Integrate camera scan buttons into Header search bar, Inventory search bar, and Add/Edit Product modal.
- [x] Add Barcode Scanner diagnostics and test pad in Settings screen.

## Phase 4.7: Senior Citizen, PWD & Statutory Discounts Engine (PRD 3.7)
- [x] Define TypeScript discount interfaces & types (`DiscountType`, `CartDiscount`, `DiscountCalculation`).
- [x] Update `useCartStore` with discount state, statutory calculations (12% VAT exemption, 20% Senior/PWD discount, pax sharing, percentage, and fixed amount), and clear action.
- [x] Build touch-friendly `DiscountModal` with tabs for Senior Citizen / PWD, Percentage Promos, and Fixed Vouchers.
- [x] Integrate Discount button and live deduction breakdown rows (Subtotal, Less VAT, Less Discount, Grand Total) in `CartView` Invoice panel.
- [x] Update checkout transaction creation in `CheckoutModal` to persist statutory discount data to IndexedDB orders.
- [x] Update ESC/POS thermal receipt template (`printer.ts`) and on-screen receipt simulation to print BIR-compliant Senior/PWD lines and customer signature area.

## Phase 4.8: Hold Order & Parked Cart System (PRD 3.8)
- [x] Define `HeldOrder` interface in `src/types/index.ts` and add `heldOrders` table to Dexie DB schema in `src/core/db/index.ts`.
- [x] Implement store actions in `useCartStore` for holding an order, recalling an order, and seamless cart swapping.
- [x] Build `HoldCartModal` allowing fast 1-tap tagging (auto-assigned `Hold #1, #2` or custom name/table).
- [x] Build `HeldOrdersModal` (drawer/modal) displaying all parked carts with item preview, elapsed time, total, and 1-tap Recall / Discard buttons.
- [x] Add "Hold" button and live "Held Carts" badge pill in `CartView` and `Header`.
- [x] Verify build (`npm run build`) and sync outputs to Android (`npx cap sync`).

## Phase 5: Cloud Sync Gateway & Outbox Engine
- [ ] Implement background Outbox sync worker (`sync_queue` table).
- [ ] Build online/offline connection listener with real-time UI indicator pill.
- [ ] Setup cloud database backend (Supabase / PostgreSQL).
- [ ] Implement incremental pull: download new products and price changes from cloud.

## Phase 6: Medium Company Multi-Branch & Dashboard
- [ ] Multi-terminal live testing in same store (prevent duplicate offline invoice numbers).
- [ ] Cloud owner analytics dashboard (gross sales, peak hours, inventory reorder alerts).
- [ ] Multi-branch inventory transfer and stock adjustment ledger.
