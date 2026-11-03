# Universal Hybrid Point of Sale (POS)

A modern, touch-optimized, **offline-first hybrid Point of Sale (POS)** designed for both standalone mobile tablets (Android APK) and multi-terminal desktop setups. Built with zero cloud dependency for mission-critical reliability—allowing micro-merchants, retail kiosks, cafes, and restaurants to ring up sales and print thermal receipts seamlessly with zero or intermittent internet.

---

## 🌟 Key Features

- **⚡ 100% Offline-First Architecture:**
  - Local database powered by **Dexie.js (IndexedDB)** with instantaneous (<5ms) indexed queries.
  - No network latency during checkout or order placement.
  - Automatic event-driven outbox queue for future background synchronization.

- **📱 Touch-Optimized Restoe UI:**
  - Slim icon navigation bar with smooth hover micro-tooltips.
  - 2-row category grid with real-time stock counters.
  - Responsive 3-column product cards with circular photo thumbnails, descriptions, bold pricing, and inline `[-] qty [+]` touch steppers.
  - Dynamic invoice summary panel with line notes, subtotal, tax calculations, and fast checkout triggers.

- **🖨️ ESC/POS Thermal Receipt Hardware Engine:**
  - Integrated support for **58mm (32 characters)** and **80mm (42 characters)** thermal paper formats.
  - Built-in **Web Bluetooth pairing bridge** for portable wireless thermal printers, Sunmi, and iMin handheld POS devices.
  - Real-time simulated receipt paper-roll preview in settings.

- **📦 Inventory & Stock Control:**
  - Interactive KPI summary cards (Total Products, Low Stock Alerts `≤ 5`, Out of Stock alerts, Total Inventory Valuation).
  - 1-click filter by stock status.
  - Quick restock shortcuts (`+5`, `+10`, `+25` units).
  - Automated profit margin percentage computations (`% profit`).
  - Offline product CRUD modal (barcode, SKU, cost, selling price, categories).

- **🇵🇭 Multi-Currency & Philippine Tax Support:**
  - Default **Philippine Peso (`₱` / PHP)** with dynamic multi-currency switcher (`$`, `€`).
  - Configurable VAT rate (default 12%) with VAT-inclusive and VAT-exclusive computation modes.
  - Cash quick-bills in common denominations (₱50, ₱100, ₱500, ₱1000) with automatic change computation.

- **💾 Data Portability & Safety:**
  - 1-Click unencrypted **JSON Database Export** to backup all sales, inventory, and shifts to a flash drive or local storage.
  - Instant **JSON Database Restore** to transfer data between devices or recover snapshots.
  - Factory reset / database wipe strictly protected by a **4-digit Manager PIN (`1234`)**.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/) | Type-safe UI components, reactive state |
| **Build Tool** | [Vite 6](https://vite.dev/) | Ultra-fast Hot Module Replacement (HMR) & production bundle |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/) | Modern touch-friendly layout & animations |
| **Local DB** | [Dexie.js (IndexedDB)](https://dexie.org/) | Client-side ACID storage, offline persistence |
| **State** | [Zustand](https://zustand-demo.pmnd.rs/) | Lightweight global state for cart, currency, settings |
| **Icons** | [Lucide React](https://lucide.dev/) | Consistent, clean icon set |
| **Mobile Wrapper** | [Capacitor 7](https://capacitorjs.com/) | Native Android APK compilation & device hardware bridges |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- [Android Studio](https://developer.android.com/studio) (Optional, for building the native `.apk`)

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/EDGEPOINT-SOLUTIONS/POS.git
cd POS

# Install project dependencies
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### 3. Production Build
```bash
npm run build
```

---

## 📱 Building the Native Android APK

To build a standalone installable Android application (`.apk`) for tablets or dedicated handheld POS terminals:

```bash
# 1. Compile web assets
npm run build

# 2. Sync web assets with Capacitor Android project
npx cap sync

# 3. Open project in Android Studio to run or export signed APK
npx cap open android
```

---

## 📁 Project Structure

```text
├── android/                 # Native Capacitor Android project & Gradle configs
├── docs/                    # Spec-Driven Development (SDD) Documentation
│   ├── ARCHITECTURE.md      # Data schemas, offline queue, sync protocol
│   ├── DESIGN.md            # Restoe design tokens, typography, skeleton loaders
│   ├── PRD.md               # Product Requirements Document & Persona specs
│   ├── RULES.md             # Development principles (offline-first, 48px touch)
│   ├── TASKS.md             # Granular task tracking checklist
│   └── MEMORY.md            # Key architectural decisions log
├── src/
│   ├── components/          # React UI components (Catalog, Cart, Inventory, Settings, Modals)
│   ├── core/
│   │   ├── db/              # Dexie IndexedDB schemas & initial demo seeds
│   │   └── hardware/        # ESC/POS thermal printer & Bluetooth abstraction
│   ├── store/               # Zustand stores (Cart, Toast, Store Settings)
│   ├── types/               # TypeScript interfaces & domain models
│   ├── App.tsx              # Main layout & hardware barcode listener
│   └── main.tsx             # Application bootstrap
├── capacitor.config.ts      # Capacitor native packaging configuration
├── tailwind.config.js       # Custom design tokens & Plus Jakarta Sans typography
└── package.json             # Dependencies and build scripts
```

---

## 📄 License
Private and Proprietary — Developed for **EDGEPOINT SOLUTIONS**.
