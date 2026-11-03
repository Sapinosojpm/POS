import React from 'react';
import { Plus, Minus } from 'lucide-react';
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
  const { items, addItem, updateQuantity, currency } = useCartStore();

  const isLoading = products.length === 0 && categories.length === 0;

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  const activeCategory = categories.find((c) => c.id === selectedCategoryId);

  const getItemQuantity = (productId: string) => {
    const found = items.find((i) => i.product.id === productId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-8 py-6 select-none bg-slate-50">
      {/* Category Grid (2 rows x 4 columns) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0 mb-5">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <CategorySkeleton key={i} />)
        ) : (
          categories.map((cat) => {
            const isActive = selectedCategoryId === cat.id;
            const count = products.filter((p) => p.categoryId === cat.id).length || 12;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`p-3 rounded-lg text-left transition-all flex flex-col justify-between h-18 border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80';
                      }}
                      className={`w-7 h-7 rounded-md object-cover shrink-0 ${
                        isActive ? 'ring-2 ring-white/50' : 'ring-1 ring-slate-200'
                      }`}
                    />
                  ) : (
                    <span className="text-lg">{cat.icon || '🍽️'}</span>
                  )}
                  <span className="font-bold text-xs sm:text-sm leading-tight">{cat.name}</span>
                </div>
                <p
                  className={`text-[10px] font-medium ${
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
                className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md cursor-pointer transition-all active:scale-[0.99] flex flex-col justify-between group select-none"
              >
                {/* Top part: Image + Title + Subtitle */}
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={prod.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80'}
                    alt={prod.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80';
                    }}
                    className="w-14 h-14 rounded-md object-cover shrink-0 ring-1 ring-slate-100 group-hover:ring-blue-200 transition"
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

                {/* Bottom part: Price + Stepper */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-base font-black text-slate-900 group-hover:text-blue-600 transition">
                    {currency}{prod.price.toFixed(2)}
                  </span>

                  {/* Inline Stepper */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-md border border-slate-200 cursor-default"
                  >
                    <button
                      disabled={qty === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(prod.id, qty - 1);
                      }}
                      className={`w-6 h-6 rounded flex items-center justify-center transition ${
                        qty > 0
                          ? 'bg-white text-slate-700 shadow-xs hover:bg-slate-100 active:scale-95'
                          : 'text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-bold text-xs text-slate-800">
                      {qty}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addItem(prod);
                      }}
                      className="w-6 h-6 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs active:scale-95 transition"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </button>
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
