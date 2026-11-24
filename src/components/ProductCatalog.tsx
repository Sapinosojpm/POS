import React, { useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Minus, ChevronLeft, ChevronRight, ArrowUpDown, Grid, LayoutGrid } from 'lucide-react';
import type { Product, Category } from '../types';
import { useCartStore } from '../store/useCartStore';
import { toast } from '../store/useToastStore';
import { db } from '../core/db';
import { ProductCardSkeleton } from './Skeleton';

interface ProductCatalogProps {
  products: Product[];
  categories: Category[];
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  searchQuery: string;
}

type MenuSort = 'popular' | 'name' | 'priceAsc' | 'priceDesc';

const LOW_STOCK_THRESHOLD = 5;

const PLACEHOLDER_TONES = [
  'from-blue-100 to-blue-200 text-blue-600',
  'from-emerald-100 to-emerald-200 text-emerald-600',
  'from-amber-100 to-amber-200 text-amber-600',
  'from-rose-100 to-rose-200 text-rose-600',
  'from-violet-100 to-violet-200 text-violet-600',
  'from-cyan-100 to-cyan-200 text-cyan-600',
];

function placeholderTone(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PLACEHOLDER_TONES[hash % PLACEHOLDER_TONES.length];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  searchQuery,
}) => {
  const { items, addItem, updateQuantity, currency } = useCartStore();
  const chipScrollRef = useRef<HTMLDivElement>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [sortBy, setSortBy] = useState<MenuSort>('popular');
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [cardSize, setCardSize] = useState<'normal' | 'large'>(() => {
    try {
      return (localStorage.getItem('pos_card_size') as 'normal' | 'large') || 'normal';
    } catch {
      return 'normal';
    }
  });

  // Sales volume per product (drives "Best sellers first")
  const soldCounts = useLiveQuery(async () => {
    const rows = await db.orderItems.toArray();
    const map: Record<string, number> = {};
    for (const r of rows) map[r.productId] = (map[r.productId] || 0) + r.quantity;
    return map;
  }, []) || {};

  const handleSelectCategory = (catId: string) => {
    if (catId === selectedCategoryId) return;
    setIsSwitching(true);
    setSelectedCategoryId(catId);
    setTimeout(() => setIsSwitching(false), 120);
  };

  const scrollChips = (direction: 'left' | 'right') => {
    chipScrollRef.current?.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  const isLoading = products.length === 0 && categories.length === 0;

  const visibleProducts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = products.filter((p) => {
      const matchesCat = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      const matchesSearch = p.name.toLowerCase().includes(q) || p.barcode.includes(searchQuery);
      return matchesCat && matchesSearch;
    });
    const sorted = [...filtered];
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'priceAsc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'priceDesc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      default:
        sorted.sort((a, b) => (soldCounts[b.id] || 0) - (soldCounts[a.id] || 0));
    }
    return sorted;
  }, [products, selectedCategoryId, searchQuery, sortBy, soldCounts]);

  const activeCategory =
    selectedCategoryId === 'all'
      ? { id: 'all', name: 'All' }
      : categories.find((c) => c.id === selectedCategoryId);

  const getItemQuantity = (productId: string) => {
    const found = items.find((i) => i.product.id === productId);
    return found ? found.quantity : 0;
  };

  const handleAdd = (prod: Product) => {
    const qty = getItemQuantity(prod.id);
    if (prod.stock <= 0) {
      toast.error('Sold out', `${prod.name} is out of stock.`);
      return;
    }
    if (qty >= prod.stock) {
      toast.error('Stock limit reached', `Only ${prod.stock} of ${prod.name} available.`);
      return;
    }
    addItem(prod);
    setPulseId(prod.id);
    setTimeout(() => setPulseId((cur) => (cur === prod.id ? null : cur)), 280);
  };

  const chipClass = (active: boolean) =>
    `h-10 px-4 rounded-full border text-xs sm:text-sm font-bold whitespace-nowrap flex items-center gap-2 shrink-0 transition-all active:scale-95 snap-start ${
      active
        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
    }`;

  const countBadge = (active: boolean) =>
    `text-[10px] font-black px-1.5 py-0.5 rounded-full ${
      active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
    }`;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 select-none bg-slate-50">
      {/* Sticky single-row category chips (always reachable while scrolling dishes) */}
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-3 pb-3 bg-slate-50/95 backdrop-blur-md group/cats">
        <div className="relative">
          <div
            ref={chipScrollRef}
            className="flex items-center gap-2 overflow-x-auto scroll-smooth snap-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <button
              type="button"
              onClick={() => handleSelectCategory('all')}
              className={chipClass(selectedCategoryId === 'all')}
            >
              <span>All</span>
              <span className={countBadge(selectedCategoryId === 'all')}>{products.length}</span>
            </button>

            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 w-24 rounded-full bg-slate-200 animate-shimmer shrink-0" />
                ))
              : categories.map((cat) => {
                  const isActive = selectedCategoryId === cat.id;
                  const count = products.filter((p) => p.categoryId === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat.id)}
                      className={chipClass(isActive)}
                    >
                      <span>{cat.name}</span>
                      <span className={countBadge(isActive)}>{count}</span>
                    </button>
                  );
                })}
          </div>

          {/* Desktop-only arrows (touch devices swipe) */}
          <button
            type="button"
            onClick={() => scrollChips('left')}
            className="hidden lg:flex absolute -left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-md text-slate-600 hover:text-blue-600 items-center justify-center opacity-0 group-hover/cats:opacity-100 transition active:scale-90"
            title="Scroll categories left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollChips('right')}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-md text-slate-600 hover:text-blue-600 items-center justify-center opacity-0 group-hover/cats:opacity-100 transition active:scale-90"
            title="Scroll categories right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Section title + sort */}
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
            {activeCategory?.name || 'All'} Menu
          </h2>
          <p className="text-[11px] font-medium text-slate-400">{visibleProducts.length} items</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Card Size Density Toggle (Normal vs Large for small tablets) */}
          <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setCardSize('normal');
                try { localStorage.setItem('pos_card_size', 'normal'); } catch {}
              }}
              className={`p-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                cardSize === 'normal'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Standard grid view"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCardSize('large');
                try { localStorage.setItem('pos_card_size', 'large'); } catch {}
              }}
              className={`p-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                cardSize === 'large'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Large cards (best for small tablets)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Big Cards</span>
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="relative shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as MenuSort)}
              aria-label="Sort menu"
              className="appearance-none h-9 pl-8 pr-3 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="popular">Best sellers</option>
              <option value="name">Name A–Z</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product grid: adapts to cardSize preference */}
      <div
        className={
          cardSize === 'large'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4 pb-24 lg:pb-4'
            : 'grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-2.5 sm:gap-3 pb-24 lg:pb-4'
        }
      >
        {isLoading || isSwitching ? (
          Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
        ) : visibleProducts.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <p className="font-bold text-slate-700 text-sm">No dishes found</p>
            <p className="text-xs mt-1">Try another category or clear your search.</p>
          </div>
        ) : (
          visibleProducts.map((prod) => {
            const qty = getItemQuantity(prod.id);
            const soldOut = prod.stock <= 0;
            const lowStock = !soldOut && prod.stock <= LOW_STOCK_THRESHOLD;
            const atLimit = qty >= prod.stock;
            const pulsing = pulseId === prod.id;

            return (
              <div
                key={prod.id}
                onClick={() => handleAdd(prod)}
                aria-disabled={soldOut}
                className={`rounded-2xl border shadow-xs transition-all flex flex-col overflow-hidden group select-none min-w-0 ${
                  soldOut
                    ? 'bg-slate-100 border-slate-200 cursor-not-allowed'
                    : 'cursor-pointer hover:shadow-md active:scale-[0.98]'
                } ${
                  !soldOut && qty > 0
                    ? 'bg-blue-50/30 border-blue-400 ring-2 ring-blue-400/30'
                    : !soldOut
                    ? 'bg-white border-slate-200 hover:border-blue-300'
                    : ''
                } ${pulsing ? 'animate-pop' : ''}`}
              >
                {/* Image with initials placeholder underneath (never a broken icon) */}
                <div className="relative w-full aspect-[4/3] overflow-hidden">
                  <div
                    className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br text-2xl font-black tracking-tight ${placeholderTone(prod.name)}`}
                  >
                    {initials(prod.name)}
                  </div>
                  {prod.image && (
                    <img
                      src={prod.image}
                      alt=""
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                      className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                        soldOut ? 'grayscale opacity-60' : ''
                      }`}
                    />
                  )}

                  {soldOut && (
                    <span className="absolute inset-x-0 bottom-0 py-1 text-center text-[11px] font-black uppercase tracking-wider bg-slate-900/80 text-white">
                      Sold out
                    </span>
                  )}
                  {lowStock && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black shadow-sm">
                      Only {prod.stock} left
                    </span>
                  )}
                  {qty > 0 && (
                    <span
                      key={qty}
                      className="absolute top-2 right-2 min-w-[26px] h-[26px] px-1.5 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shadow-md ring-2 ring-white animate-pop"
                    >
                      {qty}
                    </span>
                  )}
                </div>

                <div className="p-2.5 sm:p-3 flex flex-col gap-2 flex-1">
                  <h3
                    className={`font-bold text-[13px] sm:text-sm line-clamp-2 break-words leading-snug min-h-[2.25rem] ${
                      soldOut ? 'text-slate-400' : 'text-slate-900'
                    }`}
                  >
                    {prod.name}
                  </h3>

                  <div className="flex items-center justify-between gap-1.5 mt-auto">
                    <span
                      className={`text-sm sm:text-base font-black tracking-tight truncate tabular-nums ${
                        soldOut ? 'text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {currency}{prod.price.toFixed(2)}
                    </span>

                    {soldOut ? null : qty > 0 ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center bg-blue-600 text-white rounded-xl shrink-0 shadow-xs"
                      >
                        <button
                          type="button"
                          onClick={() => updateQuantity(prod.id, qty - 1)}
                          className="w-8 h-8 rounded-l-xl hover:bg-blue-700 flex items-center justify-center transition active:scale-90"
                          title="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                        <span className="px-1.5 text-xs font-black min-w-[18px] text-center select-none tabular-nums">
                          {qty}
                        </span>
                        <button
                          type="button"
                          disabled={atLimit}
                          onClick={() => handleAdd(prod)}
                          className="w-8 h-8 rounded-r-xl hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center transition active:scale-90"
                          title={atLimit ? 'Stock limit reached' : 'Increase quantity'}
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 hover:bg-blue-600 hover:text-white flex items-center justify-center transition active:scale-90 shrink-0 shadow-2xs"
                        title="Add to order"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
