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

- **GitHub Release v1.3.0 Publication (Nov 25, 2026):**
  - Published release tag `v1.3.0` to both `EDGEPOINT-SOLUTIONS/POS` and `Sapinosojpm/POS`.
  - Binary assets attached: `Universal_POS_v1.3.apk` and `Universal_POS_latest.apk` (5.2 MB, built on Nov 25, 2026).
  - Delivered Pro Cashier UI/UX & Hotkeys Engine: inline cart item notes & presets, full Philippine banknote set (₱20-₱1000), cashier hotkeys (`/`, `F1`, `F2`, `F4`, `F8`, `Esc`), header sound mute/unmute toggle, cash register chime, enhanced search counter and illustrated empty state.
  - Release URL: https://github.com/EDGEPOINT-SOLUTIONS/POS/releases/tag/v1.3.0

- **GitHub Release v1.2.0 Publication (Nov 24, 2026):**
  - Published release tag `v1.2.0` to both `EDGEPOINT-SOLUTIONS/POS` and `Sapinosojpm/POS`.
  - Binary assets attached: `Universal_POS_v1.2.apk` and `Universal_POS_latest.apk` (5.2 MB, built on Nov 24, 2026).
  - Implemented comprehensive `frontend-design` UX elevation across all modules: Dashboard, Product Catalog, Cart/Invoice, Checkout Numpad, Order History, Inventory, and Top Header.
  - Release URL: https://github.com/EDGEPOINT-SOLUTIONS/POS/releases/tag/v1.2.0

- **GitHub Release v1.1.0 Publication (Nov 20, 2026):**
  - Published release tag `v1.1.0` to both `EDGEPOINT-SOLUTIONS/POS` and `Sapinosojpm/POS`.
  - Binary asset attached: `Universal_POS_v1.1.apk` (5.2 MB, built on Nov 20, 2026 with custom app launcher icons, void manager gate, paperless sharing, and real-time Dexie analytics).
  - Release URL: https://github.com/EDGEPOINT-SOLUTIONS/POS/releases/tag/v1.1.0

- **POS Brand Logo Emblem:**
  - Integrated custom POS logo emblem (dynamic shopping cart with modern blue wireless POS terminal, printed receipt, and orange speed streak).
  - Deployed to `public/logo.png`, `public/favicon.png`, and `src/assets/logo.png`.
  - Displayed in the Left Navigation Sidebar (`Sidebar.tsx`) with 12x12 rounded container, browser favicon (`index.html`), and Store Identity card in `SettingsView.tsx`.
  - Verified and bundled in Capacitor Android web assets.

- **Inventory Import/Export & Bulk Stock Operations (Phase 4.9):**
  - **Reconciliation:** Smart Upsert matching on `barcode` first, then `sku`. Matching items update prices and stock; non-matching rows generate new UUIDv4 products.
  - **Stock Movement Ledger:** Bulk restock increments write atomic entries to `stock_ledger` with reason `RESTOCK` and append events to `syncQueue` for PostgreSQL sync.
  - **Pricing & Encoding:** Decimal currency format with UTF-8 BOM encoding to ensure flawless opening in Microsoft Excel and Google Sheets without barcode distortion.

- **VAT Toggle & Custom Payment Methods (Phase 4.10):**
  - **VAT Control:** Settings toggle `enableTax: boolean`. When OFF (Non-VAT), hides "Tax (12% VAT Incl)" row in CartView, sets tax to 0.00, applies direct 20% Senior/PWD discount without VAT extraction, and formats thermal receipt as "ACKNOWLEDGEMENT RECEIPT / NON-VAT".
  - **Payment Methods:** Configurable payment options `{ cash: boolean, card: boolean, gcash: boolean, maya: boolean, paylater: boolean }`. Defaults to Cash, GCash, Maya enabled; Card and Paylater disabled by default. Invoice pills and Checkout modal dynamically render only active methods.

- **Order History Multi-Criteria Sorting Engine (Phase 4.11):**
  - **Default Sort:** Date: Newest First (`createdAt` descending) so new sales are immediately visible.
  - **Context-Aware Direction Taps:** Numerical/temporal fields (`Date & Time`, `Total Amount`) trigger `desc` on first click; nominal text fields (`Order #`, `Cashier Name`) trigger `asc` on first click. Subsequent clicks toggle direction.
  - **Dual Controls:** Synchronized Quick Sort dropdown in the toolbar (tablet-friendly) and clickable `<th>` table headers with active visual indicators (`ArrowUpDown`, `ArrowUp`, `ArrowDown`, `text-blue-600`).
  - **Performance:** Client-side memoized sorting executed in <5ms without re-querying IndexedDB or resetting active filters.

- **Standalone Android Tablet APK Package (Capacitor 7):**
  - Compiled using Android Studio JBR and Gradle 8.11 (`assembleDebug`).
  - Target Android SDK: Platform 35 / Build-Tools 34.
  - Output binary: `build-apk/Universal_POS_v1.0.apk` (~4.94 MB).
  - Standalone, offline-ready APK directly installable on any Android tablet, handheld POS, or smartphone without Play Store requirements.

- **Tablet Adaptive Layout & 360° Dual-Orientation (Phase 4.12):**
  - `android:screenOrientation="fullSensor"` enabled in `AndroidManifest.xml` for seamless physical sensor rotation.
  - **Landscape Mode (`>= lg`):** Permanent 3-pane layout with sidebar rail, 3-column dish grid catalog, and docked right-hand invoice panel.
  - **Portrait Mode (`< lg`):** Spacious 2-column dish grid catalog with floating bottom cart dock (`[🛒 N Items • Total] [Review Order →]`) and slide-up interactive cart drawer.
  - Cart items, totals, and active searches persist across orientation shifts without state loss.

- **Invoice Panel & Cart UX Polish (Phase 4.12 Follow-up):**
  - **Structured Ticket Cards:** Overhauled cart item layout into dedicated cards (`bg-slate-50/80 border border-slate-200/90 rounded-xl p-3`). Top row displays full non-truncated dish name, unit price, and total line price.
  - **High-Tactile Steppers:** Enlarged `[-] qty [+]` touch buttons (`w-8 h-7`) and trash remove icon (`w-7 h-7`), eliminating cramped 20px buttons.
  - **Offline-Safe Image Fallback:** Eliminated broken-image icons and wrapped thumbnails with graceful fallback (`Utensils` icon container with auto-hidden broken image tags) across Cart items, Product Catalog cards, and Category tabs.
  - **Grammar & Badge Alignment:** Corrected "1 Items" to "1 Item" and streamlined Hold/Clear buttons in the invoice header.

- **POS Catalog & Invoice UX Overhaul & Mobile Navigation (Phase 4.13):**
  - **Single-Row Category Chips:** Replaced cramped 2-row category grid with smooth horizontally scrollable category chips with product counts and active blue styling.
  - **Mobile Bottom Navigation (`BottomNav.tsx`):** Added ergonomic bottom navigation bar for phones/portrait screens (< md) while keeping the vertical sidebar for tablets and desktop (>= md).
  - **Order Type Switcher:** Added segmented toggle (`Dine-in` / `Takeout`) and optional Table # / Customer Name input to the invoice header, persisted into order payload and thermal receipts.
  - **Conditional Payment Summary:** Automatically hides the payment summary and ₱0.00 buttons when cart is empty, showing a welcoming empty-cart illustration instead.
  - **Stock Protection Badges:** Added "Sold Out" (disabled tap) and "Low Stock (N left)" pill badges on dish cards to prevent accidental over-ordering.
  - **Tactile Feedback:** Added `.animate-pop` CSS pulse and quick button feedback when dishes are added to the cart or scanned.
  - **Menu Sorting Selector:** Quick sorting dropdown (`Featured`, `Best Sellers`, `Name A-Z`, `Price: Low to High`, `Price: High to Low`) in catalog header.
  - **Deterministic Initial Avatar Fallbacks:** Colorful gradient avatars based on product name when images fail or are missing offline.
  - **Streamlined Header:** Cleaned up redundant currency pill in header (already manageable in Settings), upgraded sync status with human-friendly descriptions (`Online`, `Offline · N queued`), and added a 1.8s `Scanned` confirmation flash when a barcode is captured.
  - **React Stability:** Fixed double-mount race conditions in `seed.ts` via singleton re-entrancy lock and atomic transactions; fixed conditional hook crash in `CheckoutModal.tsx`.
  - **User Constraint Observed:** APK compilation deferred ("wag mo muna gawin ang apk") pending user instruction.

- **Universal POS Business Modes & Collapsible Invoice Context (Phase 4.13 Follow-up):**
  - **User Feedback Addressed:** "why have take out and dine this is universal pos na pwede kahit saan like vapeshop , grocery store at iba and lagay mo nalang sa settings kung anong type ang pos na gusto nila... pwede ba tong collapsesable"
  - **Business Profiles in Settings:** Added `businessType` selector cards (`Retail & Grocery`, `Vape Shop & Specialty`, `Restaurant & Cafe`, `Services & Salon`) plus an explicit toggle switch `enableDiningOptions: boolean`.
  - **Default Setting:** Defaults to `RETAIL` with `enableDiningOptions: false` so vape shops, grocery stores, and general retail stores have a clean, counter-sales screen with zero dining clutter.
  - **Collapsible Invoice Section in `CartView.tsx`:**
    - For Restaurants (when dining options are active): Collapses the Dine-in / Takeout tabs and Table # input into a sleek 32px pill bar (`🍽️ Dine-in • Table 4 ⌵`), expanding only when tapped. This saves ~50px of vertical height for invoice items.
    - For Retail / Vape Shop / Grocery (when dining options are inactive): Completely removes the Dine-in / Takeout tabs; provides a subtle, 1-line `+ Customer / Note (optional)` trigger that takes minimal space.
  - **Dual Collapsible Sidebars for Small Tablets (7" to 10" Tablets):**
    - Cashiers on small tablets can now collapse BOTH sidebars:
      - Left Nav Sidebar: Toggled via `[ ⇤ ]` on sidebar or `[ ☰ ]` hamburger in header (+84px width).
      - Right Invoice Sidebar: Toggled via prominent `[ ⇥ Hide ]` button on invoice (+320px width).
      - Total horizontal gain: +404px, yielding a 100% full-screen product catalog!
    - **Big Cards Mode (`ProductCatalog.tsx`):** Added a `[ ⊞ Big Cards | ▦ Grid ]` toggle in the menu toolbar. Switches from 3-4 cramped columns into 2 extra-large columns with huge photos, large dish titles, and big touch buttons tailored for small tablet screens.
  - **Thermal Receipts:** Dynamically includes order type and table/customer note only when present; suppresses empty tags for standard retail receipts.

- **Cashier & Staff PIN Authentication Gate (Phase 4.14):**
  - **Terminal Lock Screen (`LoginView.tsx`):** All users must enter a 4-digit PIN before accessing the POS catalog, orders, and settings.
  - **Dual-Mode Entry:** Cashiers can type their 4-digit PIN directly (auto-identifying who logged in) or select their staff profile first.
  - **Default Accounts & Demo Fallbacks:**
    - Courtney Henry (Cashier): PIN `1111`
    - Alexander Wright (Cashier): PIN `2222`
    - Store Manager (Manager): PIN `1234`
  - **Dynamic Cashier Attribution:** Checkout orders and receipts now record the authenticated cashier's name instead of static strings.
  - **Lock & Logout Workflows:** Tapping logout in the left sidebar or the header cashier avatar immediately locks the terminal and returns to the PIN screen.
  - **Staff Management in Settings:** Added dedicated "Staff Accounts & PIN Access" tab under SettingsView for registering new staff, changing PINs, and setting roles (`CASHIER`, `MANAGER`).

- **Void, Refund & Order Cancellation Architecture (Phase 4.15):**
  - **User Feedback Addressed:** "A. Void / Refund / Cancel Transaction (May Manager Approval) ... Button sa Order History para mag-Void o Refund. Nanghihingi ng Manager PIN ... Awtomatikong ibabalik ang stock sa inventory at babaguhin ang status sa VOIDED."
  - **Manager Security Gate (`VoidOrderModal.tsx`):**
    - High-security PIN keypad checking against `useSettingsStore.settings.managerPin` (default `1234`) and any staff user in `useAuthStore` with `MANAGER` or `ADMIN` role.
    - Prevents cashiers from unauthorized voids, eliminating cash drawer skimming and fraudulent returns.
  - **Standardized Reason Tracking:**
    - Dropdown with presets ("Cashier Punch Error", "Wrong Payment Method", "Customer Cancellation", "Defective/Returned Product", "Customer Dispute") and optional custom notes.
  - **Atomic Stock Restoral:**
    - Automatically restocks returned item quantities (`product.stock + qty`) and creates an audit entry in Dexie `stockLedger` with reason `'VOID'`.
  - **Active Shift Drawer Balancing:**
    - Adjusts active shift (`db.shifts`) by deducting voided cash or digital payments, preventing discrepancies during end-of-day drawer counts.
  - **Order History Integration:**
    - Added Status Filter Tabs (`All Orders`, `Completed`, `Voided`) with real-time counters.
    - In-row `[ 🚫 Void ]` button and detailed receipt modal trigger.
    - Prominent red `VOIDED` status badge displaying the reason.
  - **Thermal Printing:**
    - Receipts for voided transactions print with a bold `*** VOID RECEIPT ***` header, manager approval name, timestamp, and cancellation banner.

- **Real-Time Data-Driven Dashboard Engine (Phase 4.16):**
  - **User Feedback Addressed:** "itugma mo ito sa data make this better" with screenshot of localhost:3000 Dashboard showing static mock values.
  - **Data Integration:** Switched `ReportsView.tsx` from static mock numbers to live reactive IndexedDB queries via `useLiveQuery(() => db.orders, db.orderItems, db.products)`.
  - **Dynamic Period Engine:** Supports `Today`, `This Week`, `This Month`, `This Year`, and `All Time` with automatic time-series bucket resolution (hourly, daily, or monthly).
  - **KPIs & Growth:**
    - Gross Sales dynamically sums non-voided completed orders.
    - Cancelled / Voided transactions shown explicitly as an audit metric.
    - Average Ticket Value (ATV) calculated dynamically.
    - Catalog performance reflects live product count and in-stock quantities.
  - **Interactive Visualizations:**
    - Bar chart tracks relative bucket fill percentages against the peak sales volume.
    - Spline wave curve calculates the exact peak revenue point and dynamically positions the peak callout badge.
    - Donut chart computes live percentage arc slices and totals for Cash, E-Wallets (GCash/Maya), and Cards.
  - **Product Performance & CSV Export:**
    - "Product" tab aggregates units sold and gross revenue directly from `db.orderItems`.
    - 1-click "Export CSV" generates real downloadable `.csv` sales report.
  - **Cohesive Seed Orders:**
    - Seeded realistic demo orders in `seed.ts` linking real products (`Grilled Steak`, `Pasta Bolognese`, `Spicy Fried Chicken`, `Iced Lemon Tea`) so fresh databases immediately display rich, cohesive metrics.

- **Paperless Checkout & Digital E-Receipt Engine (Phase 4.17):**
  - **User Feedback Addressed:** "ang iba walang printer pano masusulosyonan ito?"
  - **Paperless Mode in Checkout:**
    - Added quick toggle `[✓] Print physical thermal receipt` in `CheckoutModal.tsx`.
    - When unchecked, the checkout button changes from `Complete & Print Receipt` to `[ ✓ Complete Order (₱XX.XX) ]` (green pill), eliminating all printer popup dialogues.
  - **Auto-Print Configuration:**
    - Surfaced `Auto-Print Thermal Receipt on Checkout` toggle switch in `SettingsView.tsx` under Hardware settings.
  - **Enhanced Celebration Screen:**
    - High-visibility `Change Due: ₱XX.XX` display.
    - Added `[ 📱 Share E-Receipt ]` utilizing Web Share API (`navigator.share`) with automatic clipboard text copy fallback.
    - Added `[ 🖨️ Print Slip ]` for optional on-demand printing.

## Target Personas
1. **Micro / Solo User:** Standalone Android tablet running the **`.apk`** with no continuous internet. Daily operations and Z-reports are 100% self-contained on the device.
2. **Medium Business:** Multiple terminals (desktops + tablets) syncing through a centralized cloud backend with role-based cashier PINs and branch management.
