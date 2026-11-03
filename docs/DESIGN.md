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
