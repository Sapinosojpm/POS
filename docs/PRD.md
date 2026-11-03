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

---

## 4. Non-Functional Requirements
- **Reliability:** The POS must NEVER freeze or reject a sale due to network timeout.
- **Platform Agnostic:** Runs identically in Web Browser, PWA (Android/iOS), or Native Desktop wrapper (Tauri/Electron).
- **Data Safety:** Automatic local snapshots + encrypted cloud sync.
