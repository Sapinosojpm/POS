# UI/UX Design System Specification — "Restoe" Modern Cashier UI

This document specifies the exact visual language, layout structure, component styling, and micro-interaction patterns for the Universal Hybrid POS.

---

## 1. Overall Layout Grid (3-Tier Structure)

The viewport is divided into three primary zones in a landscape tablet/desktop view:

```
+----+----------------------------------------------------+--------------------------+
|    | Top Header: [Search Your Menu...]   [Lang] [🔔] [Avatar Courtney Henry - Cashier]   |
| N  +----------------------------------------------------+--------------------------+
| A  | Category Cards (2 Rows, 4 Cols):                   | INVOICE / ORDER PANEL    |
| V  | [Breakfast]  [⭐ Lunch (Active Blue)]  [Dinner] ... | [Img] Pasta Bolognese $50|
|    +----------------------------------------------------+ [Img] Spicy Chicken   $45|
| S  | Section Title: "Lunch Menu"                        |                          |
| I  | Product Cards (3x3 Grid):                          | ------------------------ |
| D  | +-----------------------------------------------+  | Payment Summary:         |
| E  | | (O) Pasta Bolognese                           |  | Sub Total:       $131.20 |
| B  | |     Delicious beef lasagna with double chili  |  | Tax:               $5.20 |
| A  | | $50.5                     [ -  2  + ]         |  | Total Payment:   $136.40 |
| R  | +-----------------------------------------------+  |                          |
|    |                                                    | [Card] [Cash] [E-Wallet] |
|    |                                                    | [ Place An Order Button ]|
+----+----------------------------------------------------+--------------------------+
```

---

## 2. Color Palette & Design Tokens

| Token | Hex / Tailwind | Usage |
| :--- | :--- | :--- |
| **Primary Font** | **`Plus Jakarta Sans`** | Modern geometric UI font with high legibility on touch tablets |
| **Canvas Background** | `#F8FAFC` (`bg-slate-50`) | Main app background, soft and eye-friendly |
| **Card Background** | `#FFFFFF` (`bg-white`) | Category cards, product cards, invoice panel |
| **Primary Accent** | `#2563EB` (`bg-blue-600`) | Active category card, stepper (+) button, "Place An Order" button |
| **Primary Hover** | `#1D4ED8` (`hover:bg-blue-700`) | Button hover state |
| **Text Primary** | `#0F172A` (`text-slate-900`) | Headings, item names, grand total |
| **Text Muted** | `#64748B` (`text-slate-500`) | Item descriptions, category counts, item subtitles |
| **Border & Divider**| `#E2E8F0` (`border-slate-200`) | Clean, crisp, non-distracting separation lines |
| **Border Radius** | `rounded-lg` (8px), `rounded-md` (6px), `rounded-xl` (12px) | Crisp, modern enterprise corners (no excessive bubbles) |

---

## 3. Core Component Specifications

### 3.1. Slim Navigation Sidebar (Left, 84px locked width)
- **Top:** Brand Icon Badge (`w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md`).
- **Nav Items:** Vertical stack of rounded icon buttons (`w-12 h-12 rounded-2xl`):
  - 🍱 POS Catalog (`LayoutGrid`)
  - 📦 Stock & Inventory (`Package`)
  - 🧾 Order / Ticket History (`Receipt`)
  - 📅 Calendar / Shift Schedule (`Calendar`)
  - 📈 Sales Analytics & Reports (`BarChart2`)
  - 📄 Invoices & Z-Readings (`FileText`)
- **Bottom:** Shift Audit (`HelpCircle`) and Logout (`LogOut` in red).

### 3.2. Top Header Bar (Height: 64px)
- **Search Bar (Left 60%):** Rounded search input (`rounded-lg bg-slate-50 border border-slate-200 pl-10 pr-4 py-2`).
- **Controls (Right):** Offline/Online status badge, Currency toggle pill, **Premium Notification Bell**, Cashier profile.

### 3.3. Category Selector Cards (Top Center)
- Responsive grid: 4 columns x 2 rows of touchable category cards.
- **Visuals:** Uses **actual high-definition food photograph thumbnails** (`w-7 h-7 rounded-md object-cover`) instead of generic icons or emojis.
- **Normal State:** White background, subtle border, rounded-lg, containing:
  - Real food photo thumbnail on top-left (e.g., Pancakes for Breakfast, Burger for Lunch, Steak for Dinner, Salad for Appetizers).
  - Category Name (bold `text-xs sm:text-sm`).
  - Stock badge (`12 Menu In Stock`, muted `text-[10px]`).
- **Active State:** Solid vibrant blue (`bg-blue-600 text-white shadow-sm`), with a white photo ring.

### 3.4. Settings & Configuration Screen
- **Layout:** Two-column split layout adhering to the Restoe enterprise look:
  - **Left Sub-nav (Width: 220px):**
    - `Store Identity` (`Store` icon)
    - `Receipt & Printing` (`Printer` icon)
    - `Taxes & Currency` (`DollarSign` icon)
    - `Data & Backup` (`Database` icon)
  - **Right Form Container:** Crisp white panel (`rounded-lg border border-slate-200 p-6`) with organized form fieldsets.
- **Controls & Input Specs:**
  - Text fields: `rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white`.
  - Toggle Switches: Accessible toggle pill (`w-11 h-6 rounded-full transition-colors`, active `bg-blue-600`).
  - Radio Cards for Paper Width: 2 selectable cards for **58mm** and **80mm** with visual receipt diagrams.
  - Primary Action: Sticky footer bar with "Save Settings" button (`bg-blue-600 text-white font-bold px-6 py-2.5 rounded-lg shadow-sm`).

### 3.5. Camera Barcode Scanner Modal & Viewfinder (Restoe Tokens)
- **Modal Wrapper:** Full-screen backdrop with blur (`bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4`).
- **Scanner Viewfinder Card:**
  - Container: `bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full overflow-hidden text-white flex flex-col`.
  - Header: Barcode icon, "Scan Product Barcode" title, with close button (`w-9 h-9 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center`).
  - Viewfinder Area: Aspect-ratio 4:3 or square video container with relative positioning.
    - Video Element: Mirrored rear camera feed (`w-full h-full object-cover`).
    - Aiming Reticle: Centered bounding frame with 4 bold blue corner brackets (`w-56 h-44 border-2 border-blue-500 rounded-xl relative`).
    - Laser Scan Line: Horizontal glowing animated laser beam traversing vertically (`h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_8px_#38bdf8] animate-scanner-laser`).
  - Viewfinder Floating Overlay:
    - Top Controls: Flashlight/Torch toggle button (`bg-black/50 backdrop-blur-md rounded-full p-2.5 text-white hover:bg-black/70`) and Camera switcher (`Front/Rear`).
    - Success Pill: Animated floating badge when an item is detected (`bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-md animate-fade-in`).
  - Bottom Action Toolbar:
    - "Continuous Scan" toggle pill switch (`bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs`).
    - Fallback Manual Input field or "Manual Code Entry" trigger button for damaged barcodes.
- **Trigger Buttons:**
  - Header search bar scan button: `h-9 px-3 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5 text-xs font-medium`.
  - Inventory search bar scan icon: `p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600`.
  - Add/Edit Product Modal barcode field: `px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-xs font-medium border border-blue-200`.

### 3.6. Discount Modal & Cart Invoice Deductions (Restoe Tokens)
- **Cart Invoice Trigger:**
  - Dedicated "Add Discount" button in the Invoice payment summary: `flex items-center justify-between p-2 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors`.
- **Active Discount Pill:**
  - High-visibility deduction tags in the Invoice summary:
    - VAT Exemption row: `text-[11px] text-amber-700 font-semibold`.
    - Statutory / Custom Discount row: `text-xs text-rose-600 font-bold flex items-center justify-between`.
    - Quick remove button: `text-slate-400 hover:text-rose-600 transition`.
- **Discount Modal Container:**
  - Dialog: Centered modal card `rounded-2xl bg-white border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4`.
  - Segmented Tab Selector: 3 pills `[Senior/PWD (Statutory)]`, `[Percentage (%)]`, `[Fixed (₱)]` with active `bg-blue-600 text-white shadow-xs`.
  - Form Fields: `rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white`.
  - Preset Discount Grid: 4-column quick pill grid `[5%] [10%] [15%] [20%] [50%]` with subtle borders and active blue state.
  - Primary Action: Sticky modal footer with `Apply Discount` (`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-sm`).

### 3.7. Hold Order & Parked Cart UI (Restoe Tokens)
- **Invoice Panel Action Triggers:**
  - "Hold Cart" Button in Invoice Header: Compact pill button `px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold flex items-center gap-1 transition active:scale-95`.
  - "Held Carts" Counter in Top Header or Invoice: Rounded badge pill with animated amber pulse dot: `bg-slate-100 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-900 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5`.
- **Hold Prompt Modal:**
  - Compact modal dialog prompting for optional Order Tag (e.g. "Table 3 - Sir Alex", "Takeout #12").
  - Instant 1-tap quick auto-tag suggestions: `[Table #] [Takeout] [Walk-in]`.
- **Held Orders Drawer / Modal:**
  - Modal Card: `bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col`.
  - Parked Order Item Cards:
    - Card container: `p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-300 hover:shadow-sm transition-all flex flex-col gap-2`.
    - Tag & Timestamp row: Bold title with elapsed time badge (`text-[10px] text-slate-400 font-medium`).
    - Items summary preview: `text-xs text-slate-600 line-clamp-1`.
    - Action row: `[Recall Order]` in vibrant blue (`bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg`) and `[Discard]` button in muted red (`text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg`).

---

## 4. Skeleton Loading Patterns (Zero-Latency Perceived Performance)

To replace raw spinning loaders and prevent Cumulative Layout Shift (CLS), the system adheres to **9 Skeleton Loading Patterns**:

```
+-------------------------------------------------------------------------+
|                      SKELETON LOADING PATTERNS                          |
+--------------------+---------------------+------------------------------+
| 1. SHIMMER         | 2. GRADIENT         | 3. STAGGERED                 |
| Left-to-right wave | Multi-color shift   | Sequential reveal top-down   |
| (Product Catalog)  | (200% bg-size)      | (Cart / Invoice Rows)        |
+--------------------+---------------------+------------------------------+
| 4. TYPEWRITER      | 5. LAYERED          | 6. ELASTIC                   |
| Char-by-char fill  | Depth layers fade-in| Spring-in bounce reveal      |
| (Receipt preview)  | (Chart & Analytics) | (Modal popup mounts)         |
+--------------------+---------------------+------------------------------+
| 7. PULSE           | 8. CASCADE          | 9. OUTLINE                   |
| Opacity fade in/out| Per-element wave    | Wireframe -> fill reveal     |
| (Badge & Statuses) | (Category Grid)     | (Table row hydration)        |
+--------------------+---------------------+------------------------------+
```

### Pattern Implementation Details:
1. **Shimmer Pattern (`animate-shimmer`):**
   - Applied to Product Cards and Category Cards while initial indexed queries execute.
   - Uses linear gradient sweep: `linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)`.
2. **Staggered Pattern:**
   - Sequential row animation with `animation-delay: calc(var(--i) * 60ms)` for cart item hydration and tables.
3. **Pulse Pattern (`animate-pulse`):**
   - Subtle opacity transition (0.4 to 1.0) for live metric KPI tiles and badges.
4. **Cascade Pattern:**
   - Multi-element wave across the category matrix grid upon category change.
