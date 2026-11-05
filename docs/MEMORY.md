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

## Target Personas
1. **Micro / Solo User:** Standalone Android tablet running the **`.apk`** with no continuous internet. Daily operations and Z-reports are 100% self-contained on the device.
2. **Medium Business:** Multiple terminals (desktops + tablets) syncing through a centralized cloud backend with role-based cashier PINs and branch management.
