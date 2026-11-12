# Product Requirements Document (PRD) — Universal Hybrid POS

## 1. Executive Summary
A modern, touch-optimized, **offline-first hybrid Point of Sale (POS)** designed to serve two distinct business tiers:
1. **Tier 1 (Micro / Solo Shop):** Tablet-only, intermittent or zero internet, standalone local operation, Bluetooth thermal printer.
2. **Tier 2 (Medium Multi-Branch Business):** Multiple terminals (tablets + Windows/Mac desktops), high-speed barcode scanning, multi-branch inventory, real-time cloud analytics, and role-based access.

---

## 2. Target Personas & Use Cases

### Persona A: "The Solo Vendor / Food Stall / Kiosk" (No/Low Internet, Android Tablet / APK)
- **Profile:** Pop-up store, food stall, kiosk, sari-sari store, cafe.
- **Hardware:** 8"–11" Android tablet, dedicated handheld Android POS (Sunmi, iMin, Telpo), or mobile phone. Bluetooth 58mm/80mm ESC/POS thermal printer.
- **Delivery Format:** **Native Android APK** (easy sideload via flash drive / download link, no internet required after install).
- **Environment:** No steady Wi-Fi. Might turn on a phone hotspot once a day/week to sync or back up.
- **Needs:**
  - 100% functionality without internet.
  - Large touch buttons, fast cash calculations (quick cash change).
  - Standalone local data backup/export (JSON / CSV).

### Persona B: "The Growing Retail / F&B Chain" (Medium Company)
- **Profile:** Supermarket, restaurant, retail chain with 1–10 branches.
- **Hardware:** Mix of Windows desktop registers (USB barcode scanner + cash drawer + high-speed LAN thermal printer) and handheld tablet terminals.
- **Environment:** Dedicated Wi-Fi/LAN, cloud-connected.
- **Needs:**
  - Multiple cashiers ringing up sales simultaneously in the same store.
  - Multi-branch inventory tracking and stock transfers.
  - Owner web/mobile dashboard for live sales, margins, and employee shift audits (X/Z reading).
  - Role-based permissions (Cashier, Supervisor, Manager, Owner).

---

## 3. Core Feature Requirements

### 3.1. Register & Checkout UI (Restoe-Inspired Design)
- **Visual Style:** Modern card-driven restaurant/retail layout with soft shadows, rounded-2xl pills, and vibrant blue primary accents (`#2563EB`).
- **Slim Icon Navigation:** Dedicated vertical toolbar (POS catalog, order history, analytics, shifts, logout).
- **Category Matrix:** Multi-card category selector grid (e.g. Breakfast, Lunch, Dinner, Beverages) with item counters.
- **Product Cards:** Circular food/item thumbnails, item descriptions, bold price, and an inline quantity stepper (`[-] 2 [+]`).
- **Right Invoice Panel:** Clean order summary with customized line notes, subtotal, tax calculation, payment method pills, and a prominent "Place An Order" button.

### 3.2. Hardware Abstraction Layer
- **Receipt Printing:** Thermal printers via ESC/POS protocol across:
  - Bluetooth (Tablets)
  - USB / Serial (Desktops)
  - Network / LAN (Kitchen & shared receipt printers)
- **Barcode Scanning:**
  - Hardware scanner via HID keyboard wedge emulation.
  - Tablet camera barcode scanning fallback.
- **Cash Drawer:** Kick-drawer trigger via printer RJ11/RJ12 port.

### 3.3. Offline-First Sync & Data Architecture
- **Local Master DB:** Device holds its own database. All sales write locally first.
- **Event-Driven Sync Queue:** Every action (OrderCreated, StockAdjusted) is recorded as an immutable sync event.
- **Resilient Background Sync:** Auto-detects network; pushes pending transactions when online.
- **Conflict Handling:** Client-generated UUIDs; append-only sales log (no overwrite conflicts).

### 3.4. Offline Inventory Management & Cost Tracking
- **Real-Time Stock Depletion:** Sales automatically deduct stock in Dexie IndexedDB.
- **KPI Summary Cards:** Total Products, Low-Stock Alert Count (`stock <= 5`), Out of Stock Count (`stock === 0`), and Total Inventory Asset Value (`sum(stock * cost)`).
- **1-Click Restocking:** Instant `[+5]`, `[+10]`, `[+25]` quick restock buttons per item.
- **Profit Margin Analytics:** Auto-computes margin percentage `((Price - Cost) / Price * 100)%` for every product.
- **Product CRUD:** Offline modal to add, edit, or delete items, assign SKUs, barcodes, categories, and images.

### 3.5. Store Settings & Hardware Configuration
- **Feature Overview:** Comprehensive local configuration module allowing store owners to customize business identity, financial rules, thermal receipt hardware, and local data backups.
- **Target Persona:** Store Owner, General Manager, System Administrator.
- **User Story:**
  > *As a Store Owner, I want to configure my business details, currency, tax rates, printer paper size, and backup options, so that my POS reflects my brand identity and operates seamlessly with my physical peripherals.*
- **Resolved Clarifications & Technical Constraints:**
  - **Printer Width Standard:** Defaults to **58mm (32 characters per line)** for portable Bluetooth thermal printers and Sunmi/iMin POS terminals; configurable to 80mm (42 columns) in Settings.
  - **Currency Handling:** Dynamic **Multi-Currency Switcher** (`₱` PHP, `$` USD, `€` EUR) with live symbol and rate propagation across all views.
  - **Data Safety Protocol:** Export creates an unencrypted, standardized `.json` snapshot. Database Wipe / Factory Reset is strictly locked behind a **4-digit Manager PIN (`1234` default)** to prevent accidental loss by cashiers.
- **Functional Requirements:**
  1. **Store Identity:** Business Name, Branch Name, Store Address, Contact Number, TIN / Tax Registration Number.
  2. **Receipt Customization:** Customizable receipt header text, thank-you footer message, toggle store logo on receipt, and toggle cashier name visibility.
  3. **Financial & Tax Rules:** Dynamic currency selector (`₱`, `$`, `€`), default VAT/Tax rate (e.g. 12%), tax-inclusive vs tax-exclusive toggle.
  4. **Hardware & Peripherals:**
     - Paper width selector: **58mm default** vs **80mm option**.
     - Auto-print receipt toggle upon sale completion.
     - Auto-kick cash drawer signal toggle via ESC/POS RJ11 port.
  5. **Data Management & Backup (For Offline Users):**
     - 1-Click **"Export Database Backup (JSON)"** to safeguard all local sales, shifts, and inventory to a flash drive or tablet storage.
     - **"Import Database"** to restore from backup or transfer to a replacement tablet.
     - Factory reset with 4-digit Manager PIN verification.
- **Acceptance Criteria:**
  - [ ] Changes to Store Name, Address, and TIN immediately reflect on all newly printed thermal receipts.
  - [ ] Changing currency updates all catalog item prices, cart subtotals, and reports without rounding errors.
  - [ ] 58mm vs 80mm toggle correctly adjusts character width columns (32 chars for 58mm vs 42 chars for 80mm).
  - [ ] Exporting produces a valid downloadable JSON file containing all IndexedDB tables.
  - [ ] Database wipe is rejected if the Manager PIN does not match.
  - [ ] Settings persist across app relaunches in local IndexedDB.

### 3.6. Comprehensive Barcode Scanner System (Hardware Wedge & Live Camera Scanner)
- **Feature Title:** Unified Barcode Scanning Engine (Hardware USB/Bluetooth Wedge + Tablet/Phone Camera Scanner)
- **Target Personas:**
  - **Solo Cashier / Mobile Vendor:** Ringing up sales on a tablet or phone without external handheld guns; relies on the built-in rear camera scanner.
  - **Retail Checkout Cashier:** Ringing up items high-speed using physical USB/Bluetooth barcode guns (keyboard-wedge mode).
  - **Inventory Clerk:** Receiving and auditing stock by scanning barcodes in the stock table or product modal.
- **User Stories:**
  - *As a Cashier on a tablet*, I want to tap a "Scan Barcode" camera button to instantly point my tablet at product packaging, so that products are added to the cart without manual search or purchasing extra hardware.
  - *As a High-Speed Cashier with a barcode gun*, I want to scan items continuously from any screen state without clicking an input box first, hearing an instant positive audio chime, so that checkout lines move fast.
  - *As an Inventory Manager*, I want to scan a product barcode when creating or editing an item in the catalog, so that I don't introduce manual barcode typos.
- **Resolved Clarifications & Behavior Protocol:**
  - **Cart Duplication Protocol:** When a barcode is scanned and the item is already present in the cart, the system automatically increments the quantity by `+1`, triggers an instant `880Hz` positive beep, and shows a quick confirmation toast.
  - **Continuous Batch Scanning:** The Camera Barcode Scanner modal opens by default in **Continuous Batch Scan** mode with an active **1.2-second debounce** on the exact same barcode to prevent accidental runaway increments while keeping the camera open to scan multiple items quickly.
  - **Unregistered Barcode Flow:** When an unknown barcode is scanned, the system plays an alert buzz (`220Hz`) and surfaces an actionable toast: `"Barcode not found: [Code]"` with a direct action button: `[+ Add New Product]`. Clicking it opens the Product Modal with the barcode pre-filled.
- **Functional Requirements:**
  1. **Dual Scanner Input Architecture:**
     - **Mode A: Hardware HID Keyboard Wedge:** Global window listener captures rapid bursts of key strokes (<50ms between keys) ending in `Enter`. Smart focus detection prevents scanner input from corrupting user-edited text fields.
     - **Mode B: Interactive Touch Camera Scanner:** Built-in modal viewfinder utilizing device camera (via HTML5 Camera / Barcode Detection API / ZXing) with automatic barcode recognition for common retail standards (EAN-13, EAN-8, UPC-A, Code 128, QR Code).
  2. **Camera Scanner Viewfinder UX:**
     - Clean, dark-mode focused overlay with transparent targeting reticle and glowing laser sweep animation.
     - **Camera Controls:** Rear/Front camera switcher (defaulting to environment/rear camera), and Torch/Flashlight toggle for low-light shop environments.
     - **Scan Modes:**
       - *Continuous Batch Scan (Default):* Viewfinder stays open; each scan rings up the item, beeps, flashes a success pill, and allows ringing up the next item without disruption.
       - *Single Scan:* Scans once, rings up item in cart, and automatically closes viewfinder.
  3. **Visual & Auditory Feedback Engine:**
     - Web Audio API synthesizer generates an instant, offline-capable positive high-pitch chime (`880Hz` 80ms tone) on valid scan.
     - Low-pitch double buzz (`220Hz`) on barcode not found.
     - Device haptic feedback (`navigator.vibrate([40])`) on Android tablets and phones.
     - Non-intrusive floating success toast: `"Added: [Product Name] (₱XX.XX) to cart"`.
  4. **Touch Integration Points:**
     - **POS Register Top Bar:** Scan Barcode camera button beside the search input.
     - **Inventory Management:** Scan Barcode button inside the inventory search bar for instant stock lookup.
     - **Add/Edit Product Modal:** Scan icon inside the Barcode/EAN field to scan and auto-populate existing packaging codes.
  5. **Hardware Scanner Diagnostics & Settings:**
     - Scanner test zone in Settings to verify gun prefix/suffix and scan speed.
     - Audio feedback volume / mute toggle in Settings.
- **Acceptance Criteria:**
  - [ ] Camera scanner recognizes standard barcodes (EAN-13, UPC, Code 128) in under 300ms under standard lighting.
  - [ ] Scanned product increments existing cart quantity or creates a new order line item.
  - [ ] Unregistered barcode triggers negative audio alert and displays actionable toast: `"Barcode not found: [Code] — Add to Catalog?"`.
  - [ ] Continuous scan mode permits ringing up multiple items in succession without closing the camera view with 1.2s debounce on identical code.
  - [ ] Torch/Flashlight toggle illuminates camera flash if supported by device hardware.
  - [ ] Camera stream strictly terminates (stops all tracks) immediately upon modal close or route change to save battery.
  - [ ] Hardware barcode scanner gun input triggers cart add without requiring focus on any input box.

---

### 3.7. Senior Citizen, PWD & Statutory Discounts Engine
- **Feature Title:** Philippine Statutory Discounts (Senior Citizen & PWD) and Custom Cart Promos
- **Target Personas:**
  - **Solo Cashier / Kiosk Attendant:** Quickly applying 20% statutory discount for elderly or disabled customers with minimal clicks.
  - **F&B Server / Cashier:** Handling mixed dining groups where a portion of the bill is eligible for Senior/PWD discount (pax sharing computation).
  - **Store Manager / Owner:** Verifying daily audit reports and BIR compliance records for sales deductions.
- **User Stories:**
  - *As a Cashier*, I want to tap a "Discount" button in the cart to select "Senior Citizen" or "PWD", enter their ID number and name, so that the 12% VAT is automatically removed and 20% discount is deducted according to Philippine law.
  - *As a Cashier*, I want to apply custom percentage (`10%`, `15%`, `50%`) or fixed amount (`₱50`, `₱100`) coupon discounts to reward loyal customers or promotions.
  - *As a Store Owner*, I want the printed ESC/POS thermal receipt to explicitly show the VAT-exempt sales, 20% discount amount, Senior/PWD Name, ID number, and signature line for BIR tax compliance.
- **Statutory Computation Rules (Philippine Standard):**
  1. **VAT Removal:** `Net_of_VAT = Gross_Eligible_Total / 1.12`
  2. **VAT Relief:** `VAT_Exempt = Gross_Eligible_Total - Net_of_VAT`
  3. **Senior/PWD 20% Discount:** `Statutory_Discount = Net_of_VAT * 0.20`
  4. **Pax Sharing Rule (F&B / Multi-Guest):** If party of $N$ guests has $S$ Seniors/PWDs, eligible portion is `(Gross_Total / N) * S`. Default is 1 Senior out of 1 Guest (100% eligible).
  5. **Final Total:** `Final_Total = Gross_Total - VAT_Exempt - Statutory_Discount`
- **Resolved Clarifications & Business Protocols:**
  - **No Double Discounting Rule:** Stacking is strictly prohibited per Philippine law (DTI/DA/DOE JAO No. 10-02 & RA 9994). A cart can have either a Senior/PWD discount OR a promo voucher, never both simultaneously.
  - **Cart Scope Default:** Default calculation covers **100% of the current cart** (1 Pax / 1 Senior), with optional Stepper controls (`[-] 1 [+] Seniors out of [-] 4 [+] Guests`) for split group dining.
  - **ID Compliance:** Senior/PWD ID Number is required for BIR audit logging, with a quick 1-tap fallback button `[Use NA/Walk-in]` if the cashier is dealing with an extreme rush.
- **Functional Requirements:**
  1. **Discount Selector Modal:**
     - Quick Tabs: **Senior Citizen / PWD (Statutory)**, **Percentage (%) Discount**, **Fixed (₱) Voucher**.
     - Senior/PWD Form: Full Name, Senior/PWD ID Number, Total Guest Count, Senior Guest Count.
     - Preset Percentage Buttons: `5%`, `10%`, `15%`, `20%`, `50% Employee`.
     - Fixed Amount Input with quick pills: `₱20`, `₱50`, `₱100`.
  2. **Invoice Panel Live Breakdown:**
     - Displays line item deductions in soft red/amber pills.
     - `Subtotal: ₱XXX.XX`
     - `Less VAT (12%): -₱XX.XX`
     - `Senior Discount (20%): -₱XX.XX`
     - `Total Amount Due: ₱XXX.XX`
     - 1-Click `[✕ Remove Discount]` badge to easily reset back to standard pricing.
  3. **Thermal Receipt Generation:**
     - Formatted receipt section:
       ```
       VATable Sales:        ₱0.00
       VAT-Exempt Sales:     ₱XXX.XX
       Less 12% VAT:        -₱XX.XX
       Less 20% SC/PWD Disc:-₱XX.XX
       ----------------------------
       TOTAL DUE:            ₱XXX.XX
       Customer: [Name]
       SC/PWD ID: [ID Number]
       Signature: ________________
       ```
- **Acceptance Criteria:**
  - [ ] Entering a ₱112.00 VAT-inclusive item correctly computes `Net of VAT = ₱100.00`, `VAT Exemption = ₱12.00`, `20% Discount = ₱20.00`, leaving `Total Due = ₱80.00`.
  - [ ] Split party calculation accurately discounts only the senior's proportional share when guest count > 1.
  - [ ] Senior Citizen / PWD name and ID number persist on the saved `order` in IndexedDB.
  - [ ] ESC/POS thermal receipt prints the required statutory details and signature line.
  - [ ] Custom percentage and fixed discounts calculate accurately without floating point rounding errors.
  - [ ] Cashier can clear or update the discount at any time before completing payment.

### 3.8. Hold Order & Parked Cart System (Layaway / Multi-Cart Stash)
- **Feature Title:** Hold Order & Parked Cart Engine (Multi-Ticket Stashing & 1-Click Recall)
- **Target Personas:**
  - **Solo Cashier / Counter Attendant:** Managing high-traffic checkout lines when a customer steps away to grab an extra item, forgot their cash in the car, or needs time to unlock their GCash app.
  - **F&B Server:** Juggling multiple open tables or takeout customers simultaneously before payment.
- **User Stories:**
  - *As a Cashier*, I want to park the current customer's order with an optional customer name or table tag, so that I can immediately ring up the next waiting customer without deleting the cart.
  - *As a Cashier*, I want to see a live badge of all parked orders in the header, and open a drawer or modal to recall any held cart with 1 tap.
  - *As a Cashier*, I want parked carts to survive app relaunches or battery power-offs, so that no customer order is lost.
- **Resolved Clarifications & Business Protocols:**
  - **Stock Deductions:** Stock is deducted **ONLY** when a sale is finalized and completed at checkout. Parked orders do not hold artificial inventory reservations; abandoned or discarded parked orders never skew inventory ledger counts.
  - **Hold Prompt UX:** Fast dialog with an automatic auto-numbered tag (e.g. `Hold #1`, `Hold #2`), with 1-tap focus allowing the cashier to immediately rename to `Table 4` or `Sir John` if desired.
  - **Zero-Loss Collision Swap:** If the cashier recalls a held order while an active cart currently has items, the system automatically parks the active cart first (as `Hold #(N+1)`), then restores the selected order. No customer items are ever lost or discarded by accident.
- **Functional Requirements:**
  1. **Hold Cart Trigger:**
     - Prominent "Hold Order" icon button in the Invoice panel header beside the Clear button.
     - Quick dialog allowing optional label entry (e.g. `Table #5`, `John Doe`, or defaults to auto-assigned `Hold #1, #2`).
  2. **Local Persistence (Dexie IndexedDB):**
     - Stored in a local master `held_orders` table to guarantee resilience against tab closes, crashes, or power outages.
     - Payload: `id` (UUIDv4), `tag`, `items` (products, quantities, notes), `discount` (statutory or promo), `subtotal`, `createdAt` timestamp, `cashierName`.
  3. **Held Orders Recall Drawer/Modal:**
     - High-visibility pill badge in Top Header or Invoice header: `[📦 2 Held Orders]`.
     - Clicking opens a clean slide-over or modal with cards for each held order showing:
       - Tag / Identifier, Time held (relative: "5m ago"), Item list preview, Total value.
       - Primary Action: `[Recall Order]` to restore all items and discounts directly into the active register.
       - Secondary Action: `[Discard]` with confirmation.
  4. **Active Cart Conflict Safety:**
     - If the cashier attempts to recall a held order while items already occupy the active cart, the system seamlessly parks the active cart first, then restores the chosen order.
- **Acceptance Criteria:**
  - [ ] Clicking "Hold Order" parks current cart (including applied Senior/PWD discounts) and clears the register instantly.
  - [ ] Held order badge dynamically displays the current count of parked carts.
  - [ ] Recalling an order restores all products, item quantities, and statutory discounts exactly as they were parked.
  - [ ] Held orders persist in IndexedDB across browser reloads and device restarts.
  - [ ] Recalling into a non-empty cart safely allows parking the active cart first without losing any customer's items.

### 3.9. Cloud Backend Infrastructure & Sync Gateway (Phase 5)
- **Feature Title:** Centralized Cloud Backend & Resilient Bi-Directional Sync Gateway
- **Target Personas:**
  - **Store Owner / Executive:** Accessing real-time consolidated sales, gross margins, and branch analytics from anywhere on laptop or smartphone.
  - **Branch Manager:** Pushing product catalog and price updates centrally from headquarters to all store registers without visiting each tablet.
  - **Offline Cashier:** Seamlessly operating without internet all day, with automatic batch synchronization when Wi-Fi or cellular hotspot connects.
- **User Stories:**
  - *As a Store Owner*, I want all sales, shift audits, and inventory movements to sync to a secure cloud database (Supabase / PostgreSQL), so that I can monitor revenue and branch performance in real time.
  - *As a Cashier*, I want the POS to silently queue sales offline and automatically push them when network connection is restored, without slowing down my register or interrupting active transactions.
  - *As a Store Owner*, I want to change product prices or add new menu items in the cloud backend and have all cashier registers automatically download the updates.
- **Resolved Clarifications & Technical Protocols:**
  - **Backend Architecture (PostgreSQL):** Self-contained PostgreSQL schema with reproducible DDL migrations (`sql/postgres_schema.sql`). Direct REST Gateway (`/api/sync/push` and `/api/sync/pull`) using native browser `fetch` (zero third-party cloud SDK dependencies). Idempotent tables (`branches`, `devices`, `categories`, `products`, `orders`, `order_items`, `shifts`, `stock_ledger`).
  - **Device / Terminal Authentication:** Headless Machine Identity via Branch API Key & Terminal Device UUID. POS terminals require zero cashier credentials to sync; cashiers log in using fast local 4-digit PINs completely offline.
  - **Pull Synchronization Frequency:** Smart Delta Polling strategy. Automatically syncs on app boot, on network reconnect, on a background 5-minute interval timer when idle, and immediately when the cashier taps `Force Sync Now`. Conserves battery and avoids excessive mobile data consumption on Android tablets.
- **Functional Requirements:**
  1. **Centralized Cloud Database (PostgreSQL / Supabase Schema):**
     - Master tables: `branches`, `profiles` (Roles: Owner, Manager, Cashier), `categories`, `products`, `orders`, `order_items`, `shifts`, `stock_ledger`, `sync_events`.
     - Row Level Security (RLS) and branch isolation: registers are bound to specific `branch_id`.
  2. **Bi-Directional Sync Gateway:**
     - **Push Pipeline (Local ➔ Cloud):**
       - Background worker monitors `sync_queue` table in Dexie IndexedDB.
       - Flushes pending events in batches of 50 via transactional `POST /api/sync/push`.
       - Idempotent upserts via client-generated UUIDv4/UUIDv7 primary keys to prevent duplicate entries on retry.
       - Acknowledged IDs are cleared or marked `synced: true` locally.
     - **Pull Pipeline (Cloud ➔ Local):**
       - Delta polling via `GET /api/sync/pull?since={lastSyncTimestamp}`.
       - Transmits newly created products, price revisions, and deactivated items.
       - Atomically merges updates into local Dexie IndexedDB tables.
  3. **Network Resilience & Connection State Engine:**
     - Real-time online/offline detector with exponential backoff retry (2s, 5s, 15s, 30s).
     - Non-blocking async queue: checkout and thermal printing NEVER wait for network responses.
  4. **Cloud Analytics & Management Endpoints:**
     - `GET /api/analytics/summary`: Daily gross revenue, net sales, VAT breakdown, total transactions, average ticket size.
     - `GET /api/analytics/top-products`: Sales volume and gross profit margin ranking.
     - `GET /api/inventory/low-stock`: Critical alerts across all branches.
- **Acceptance Criteria:**
  - [ ] Terminal successfully processes sales while 100% offline and accumulates pending transactions in `sync_queue`.
  - [ ] When connectivity is restored, all offline sales batch-upload to cloud PostgreSQL within <5 seconds.
  - [ ] Network interruption mid-sync does not cause duplicate orders or partial receipts (idempotency verified).
  - [ ] Price changes committed in the cloud backend reflect on local cashier catalog upon next pull cycle.
  - [ ] Header sync indicator accurately reflects live states: `Online (Synced)`, `Syncing (N Pending)`, or `Offline (N Queued)`.

### 3.10. Inventory Import/Export & Bulk Stock Adjustment Engine
- **Feature Title:** Product CSV Import/Export & Multi-Item Bulk Stock Engine
- **Target Personas:**
  - **Store Owner / Inventory Manager:** Onboards large product catalogs (hundreds of items) in minutes using spreadsheets, or backs up catalog to CSV.
  - **Warehouse / Receiving Clerk:** Receives batch shipments and applies stock additions across multiple products simultaneously.
  - **Store Auditor:** Reconciles physical counts against digital ledger via batch overrides.
- **User Stories:**
  - *As an Inventory Manager*, I want to export my entire product catalog to CSV so that I can review stock values in Excel or Google Sheets.
  - *As an Inventory Manager*, I want to import products from a CSV file with automatic upsert (match by barcode or SKU) and a pre-import validation modal showing row previews.
  - *As a Receiving Clerk*, I want to select multiple products in the inventory table and apply bulk restock additions (`+5`, `+10`, `+25`, `+50`) with a single click.
- **Resolved Clarifications & Business Protocols:**
  - **Smart Upsert Reconciliation:** Matches CSV rows against existing products first by `barcode`, then by `sku`. Matching items update price, cost, stock, and category. Non-matching rows generate a new client UUIDv4 and are inserted as new products.
  - **Stock Movement Ledger Tracking:** Bulk stock adjustments write an atomic batch into `stock_ledger` with reason `RESTOCK` or `ADJUSTMENT` and queue corresponding `syncQueue` events so cloud PostgreSQL stays 100% in sync.
  - **Pricing Format:** All CSV import/export prices use standard decimal format (e.g. `₱150.00` or `150.00`), automatically parsed into standard numeric values without scientific notation errors.
- **Functional Requirements:**
  1. **CSV Export Engine:**
     - Generates clean RFC 4180 CSV with UTF-8 BOM encoding for seamless Microsoft Excel and spreadsheet compatibility.
     - Columns: `id`, `name`, `barcode`, `sku`, `category`, `price`, `cost`, `stock`, `image`.
     - Automatic timestamped filename: `POS-Inventory-YYYYMMDD.csv`.
  2. **CSV Import Modal & Parser:**
     - Drag-and-drop dropzone or file selector supporting `.csv`.
     - Client-side parser with field mapping tolerance (supports common aliases like `Product Name`, `Item`, `Barcode`, `UPC`, `Price`, `Cost`, `Quantity`).
     - Pre-flight preview card: Displays count of new items to create vs existing items to update.
     - 1-click Download Sample CSV Template button with pre-filled example items.
     - Atomic batch upsert into Dexie IndexedDB with immediate UI refresh and toast notification.
  3. **Bulk Stock Adjustment Toolbar:**
     - Checkbox selection on inventory table (with "Select All" toggle).
     - Floating or header bulk action bar when $\ge 1$ item is selected:
       - Shows `N items selected` with 1-click Clear Selection.
       - Quick increment buttons: `+5`, `+10`, `+25`, `+50`, `+100`.
       - Custom quantity input with options to Add (`+`) or Set Exact (`=`).
       - Bulk Delete with protective confirmation prompt.
- **Acceptance Criteria:**
  - [ ] Clicking "Export CSV" immediately downloads a complete, valid CSV file containing all products.
  - [ ] Barcodes with leading zeros or long numeric digits export as text to prevent Excel auto-formatting corruption.
  - [ ] Dragging and dropping a CSV file parses valid rows and presents a pre-import preview modal.
  - [ ] Items with matching barcodes or SKUs update existing product data (upsert) without creating duplicate catalog records.
  - [ ] Checking multiple products and clicking `+10` increments stock on all selected items in a single atomic transaction.
  - [ ] "Select All" correctly selects only currently filtered products when search or category filters are active.

### 3.11. Configurable VAT Toggle & Customizable Payment Methods (Settings)
- **Feature Title:** Dynamic VAT / Tax Toggle & Accepted Payment Method Visibility Controls
- **Target Personas:**
  - **Non-VAT Store Owner / Micro Retailer:** Operating below the BIR VAT registration threshold (₱3M) who does not charge 12% VAT and wants a clean invoice without confusing tax lines.
  - **Cash & GCash Only Merchant:** Does not accept credit cards or paylater and wants to hide unused payment buttons to prevent cashier misclicks.
- **User Stories:**
  - *As a Store Owner*, I want to toggle OFF VAT in Settings so that my cashier invoice panel and receipts do not display "Tax (12% VAT Incl)".
  - *As a Cashier*, I want the payment buttons in the Invoice panel and Checkout modal to display ONLY the payment options our store supports (e.g. Cash and GCash only).
- **Resolved Clarifications & Business Protocols:**
  - **Non-VAT Senior/PWD Computation:** When VAT is turned OFF, the statutory formula bypasses 12% VAT removal and directly computes a clean **20% discount on the gross eligible total** (`Discount = Total * 0.20`), eliminating negative or phantom tax line items.
  - **Default Payment Presets:** New installations default to **Cash, GCash (E-Wallet), and Maya** enabled. Credit Card and Paylater are disabled by default until toggled ON in Settings.
  - **Thermal Receipt Non-VAT Compliance:** When VAT is OFF, the printed receipt header changes to **"ACKNOWLEDGEMENT RECEIPT / NON-VAT"** and suppresses the VATable/VAT-Exempt sales table.
- **Functional Requirements:**
  1. **VAT / Tax Enable Switch in Settings:**
     - Toggle: `Enable Tax / VAT Calculation` (ON / OFF).
     - When OFF (Non-VAT Store):
       - "Tax (12% VAT Incl)" row is completely hidden from `CartView.tsx` and Checkout summary.
       - Tax is set to `0.00`.
       - Thermal receipts omit the VAT breakdown and show pure Gross/Net total.
     - When ON (VAT-Registered Store):
       - Displays tax rate input (default `12%`), Tax-Inclusive switch, and live VAT deduction pills.
  2. **Payment Method Visibility Controls in Settings:**
     - Checkbox / Toggle group in `SettingsView.tsx`:
       - `Cash` (Default ON, primary fallback)
       - `GCash / E-Wallet` (Default ON)
       - `Maya` (Default ON)
       - `Credit / Debit Card` (Default ON)
       - `Paylater / Store Credit` (Default OFF)
     - Dynamic UI Rendering:
       - `CartView.tsx` Invoice pills render **ONLY** the enabled payment methods.
       - Grid layout adjusts dynamically (`grid-cols-1`, `grid-cols-2`, `grid-cols-3`, `grid-cols-4`).
       - `CheckoutModal.tsx` payment selector pills automatically filter to enabled options.
- **Acceptance Criteria:**
  - [ ] Toggling OFF "Enable Tax / VAT" immediately removes the "Tax (12% VAT Incl)" line from the Invoice panel.
  - [ ] Toggling OFF Credit Card and Paylater removes their buttons from CartView and CheckoutModal.
  - [ ] Toggling ON GCash displays the GCash pill with custom E-Wallet icon.
  - [ ] Settings persist across restarts via `useSettingsStore` and `localStorage`.

### 3.12. Order History Multi-Criteria Sorting Engine
- **Feature Title:** Multi-Field Order History Sorting & Clickable Column Sort Engine
- **Target Personas:**
  - **Store Manager / Auditor:** Auditing shift receipts, reviewing top-spending tickets, or verifying chronological transaction sequences.
  - **Cashier:** Quickly locating a specific morning receipt or sorting by highest ticket total.
- **User Stories:**
  - *As a Store Auditor*, I want to sort orders by Total Amount (Highest First) so that I can inspect our largest sales transactions.
  - *As a Cashier*, I want to click table column headers or pick from a quick sort menu to organize orders by Date (Newest/Oldest), Amount (High/Low), or Order Number.
- **Resolved Clarifications & Technical Protocols:**
  - **Default Sort Order:** Default to **Date: Newest First** (`createdAt` descending) so cashiers and auditors immediately see their latest transactions upon entering the history view.
  - **Context-Aware Column Header Taps:**
    - `Date & Time` & `Total Amount`: 1st click sorts **Descending** (Newest first / Highest value first); 2nd click reverses to Ascending.
    - `Order Number` & `Cashier Name`: 1st click sorts **Ascending** (0-9 sequential / A-Z alphabetical); 2nd click reverses to Descending.
    - Active column header is highlighted in `text-blue-600` with directional chevron/arrow (`ArrowUp` / `ArrowDown`), while inactive columns show subtle dual arrows (`ArrowUpDown`).
  - **Dual-Trigger Control Surface:** Provide both an accessible **Quick Sort Dropdown** in the filter toolbar (optimized for tablet touch taps) and **Clickable Column Headers** on the table (`<th>`).
- **Functional Requirements:**
  1. **Sort Dimensions & Fields:**
     - `Date & Time` (`createdAt`): Newest First (`desc`, default) vs Oldest First (`asc`).
     - `Total Amount` (`total`): Highest First (`desc`) vs Lowest First (`asc`).
     - `Order Number` (`orderNumber`): Natural alphanumeric sort (`asc` / `desc`).
     - `Cashier Name` (`cashierName`): Alphabetical sort A–Z / Z–A.
  2. **Dual-Trigger UI Controls:**
     - **Quick Sort Selector:** Dropdown / pill menu in the filter bar with readable presets (`Date: Newest First`, `Date: Oldest First`, `Amount: High to Low`, `Amount: Low to High`).
     - **Clickable Table Headers (`<th>`):** Clicking `Order #`, `Date & Time`, `Total Amount`, or `Cashier` toggles between `asc` and `desc` with animated sort direction icons (`ArrowUpDown`, `ArrowUp`, `ArrowDown`).
  3. **Seamless Filter Compatibility:**
     - Sorting operates on filtered subsets (preserving active search terms, payment method filters, and date ranges) with zero latency (<5ms) using client-side memoized sorting.
- **Acceptance Criteria:**
  - [ ] Opening Order History defaults to `Date: Newest First`.
  - [ ] Selecting "Amount: High to Low" immediately displays the largest orders at the top of the table.
  - [ ] Clicking the "Date & Time" header switches from Newest First to Oldest First with an up-arrow icon.
  - [ ] Clicked column header displays an active accent color (`text-blue-600`) and the active sort indicator.
  - [ ] Search and payment method filters remain fully intact while switching sort orders.

---

## 4. Non-Functional Requirements
- **Reliability:** The POS must NEVER freeze or reject a sale due to network timeout.
- **Platform Agnostic:** Runs identically in Web Browser, PWA (Android/iOS), or Native Desktop wrapper (Tauri/Electron).
- **Data Safety:** Automatic local snapshots + encrypted cloud sync.
