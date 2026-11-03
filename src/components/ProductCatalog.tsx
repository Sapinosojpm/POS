import React, { useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import type { Product, Category } from '../types';
import { useCartStore } from '../store/useCartStore';
import { ProductCardSkeleton, CategorySkeleton } from './Skeleton';

interface ProductCatalogProps {
  products: Product[];
  categories: Category[];
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  searchQuery: string;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  searchQuery,
}) => {
  const { items, addItem, currency } = useCartStore();
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const isLoading = products.length === 0 && categories.length === 0;

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  const activeCategory =
    selectedCategoryId === 'all'
      ? { id: 'all', name: 'All' }
      : categories.find((c) => c.id === selectedCategoryId);

  const getItemQuantity = (productId: string) => {
    const found = items.find((i) => i.product.id === productId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-8 py-6 select-none bg-slate-50">
      {/* Category Section with Horizontal Swipe Carousel (2-row grid flowing horizontally) */}
      <div className="relative mb-5 shrink-0 group/cats">
        <div
          ref={categoryScrollRef}
          className="grid grid-rows-2 grid-flow-col auto-cols-[165px] sm:auto-cols-[190px] gap-2.5 overflow-x-auto scroll-smooth snap-x scrollbar-none pb-1"
        >
          {/* "ALL MENU" BUTTON */}
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between h-[72px] border snap-start active:scale-95 ${
              selectedCategoryId === 'all'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                  selectedCategoryId === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-50 text-blue-600 ring-1 ring-blue-100'
                }`}
              >
                <LayoutGrid className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="font-bold text-xs sm:text-sm leading-tight truncate">
                All Menu
              </span>
            </div>
            <p
              className={`text-[10px] font-semibold ${
                selectedCategoryId === 'all' ? 'text-blue-100' : 'text-slate-400'
              }`}
            >
              {products.length} Products Total
            </p>
          </button>

          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <CategorySkeleton key={i} />)
          ) : (
            categories.map((cat) => {
              const isActive = selectedCategoryId === cat.id;
              const count = products.filter((p) => p.categoryId === cat.id).length || 0;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between h-[72px] border snap-start active:scale-95 ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80';
                        }}
                        className={`w-7 h-7 rounded-md object-cover shrink-0 ${
                          isActive ? 'ring-2 ring-white/60' : 'ring-1 ring-slate-200'
                        }`}
                      />
                    ) : (
                      <span className="text-lg">{cat.icon || '🍽️'}</span>
                    )}
                    <span className="font-bold text-xs sm:text-sm leading-tight truncate">
                      {cat.name}
                    </span>
                  </div>
                  <p
                    className={`text-[10px] font-semibold ${
                      isActive ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {count} Menu In Stock
                  </p>
                </button>
              );
            })
          )}
        </div>

        {/* Scroll Left Button */}
        <button
          onClick={() => scrollCategories('left')}
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 border border-slate-200 shadow-md text-slate-600 hover:text-blue-600 hover:bg-white flex items-center justify-center transition active:scale-90 opacity-0 group-hover/cats:opacity-100 focus:opacity-100 z-10"
          title="Scroll categories left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scroll Right Button */}
        <button
          onClick={() => scrollCategories('right')}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 border border-slate-200 shadow-md text-slate-600 hover:text-blue-600 hover:bg-white flex items-center justify-center transition active:scale-90 opacity-0 group-hover/cats:opacity-100 focus:opacity-100 z-10"
          title="Scroll categories right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Section Title */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          {activeCategory?.name || 'All'} Menu
        </h2>
        <span className="text-xs font-medium text-slate-400">
          Showing {filteredProducts.length} items
        </span>
      </div>

      {/* Product Cards Grid (3 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading ? (
          Array.from({ length: 9 }).map((_, i) => <ProductCardSkeleton key={i} />)
        ) : (
          filteredProducts.map((prod) => {
            const qty = getItemQuantity(prod.id);

            return (
              <div
                key={prod.id}
                onClick={() => addItem(prod)}
                className={`p-3.5 rounded-xl border shadow-xs hover:border-blue-400 hover:shadow-md cursor-pointer transition-all active:scale-[0.99] flex flex-col justify-between group select-none ${
                  qty > 0
                    ? 'bg-blue-50/20 border-blue-300 ring-1 ring-blue-400/30'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Top part: Image + Title + Subtitle */}
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={prod.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80'}
                    alt={prod.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80';
                    }}
                    className="w-14 h-14 rounded-lg object-cover shrink-0 ring-1 ring-slate-100 group-hover:ring-blue-200 transition"
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate leading-snug group-hover:text-blue-600 transition">
                      {prod.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-normal">
                      Delicious chef recipe with fresh ingredients and authentic herbs.
                    </p>
                  </div>
                </div>

                {/* Bottom part: Price + In-Cart Badge / Add Indicator */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                  <span className="text-base font-black text-slate-900 group-hover:text-blue-600 transition">
                    {currency}{prod.price.toFixed(2)}
                  </span>

                  {qty > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs animate-in fade-in zoom-in-95 duration-150">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                      <span>{qty} in cart</span>
                    </span>
                  ) : (
                    <span className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-blue-600 text-slate-400 group-hover:text-white flex items-center justify-center transition active:scale-90">
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
