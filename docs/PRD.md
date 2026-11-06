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

---

## 4. Non-Functional Requirements
- **Reliability:** The POS must NEVER freeze or reject a sale due to network timeout.
- **Platform Agnostic:** Runs identically in Web Browser, PWA (Android/iOS), or Native Desktop wrapper (Tauri/Electron).
- **Data Safety:** Automatic local snapshots + encrypted cloud sync.
