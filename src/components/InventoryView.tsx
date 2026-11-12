import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  XCircle,
  Coins,
  Plus,
  Search,
  Edit2,
  Trash2,
  TrendingUp,
  CheckCircle2,
  X,
  Filter,
  RefreshCw,
  Scan,
  Download,
  Upload,
  CheckSquare,
  Square,
  Layers,
  PackagePlus,
} from 'lucide-react';
import { db } from '../core/db';
import { toast } from '../store/useToastStore';
import { useCartStore } from '../store/useCartStore';
import type { Product, Category } from '../types';
import { AddProductModal } from './AddProductModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { CsvImportModal } from './CsvImportModal';
import { exportProductsToCsv } from '../core/inventory/csvExport';

interface InventoryViewProps {
  products: Product[];
  categories: Category[];
}

export const InventoryView: React.FC<InventoryViewProps> = ({ products, categories }) => {
  const { currency } = useCartStore();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Bulk Operations & CSV State
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCustomBulkOpen, setIsCustomBulkOpen] = useState(false);
  const [customStockValue, setCustomStockValue] = useState<number>(10);
  const [customStockMode, setCustomStockMode] = useState<'ADD' | 'SET'>('ADD');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Stats calculation
  const totalItemsCount = products.length;
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= 5);
  const outOfStockProducts = products.filter((p) => p.stock === 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + p.stock * p.cost, 0);

  // Helper for category counts
  const getCategoryCount = (catId: string) => {
    if (catId === 'all') return products.length;
    return products.filter((p) => p.categoryId === catId).length;
  };

  // Quick Restock action
  const handleQuickRestock = async (product: Product, addAmount: number) => {
    try {
      await db.products.update(product.id, {
        stock: product.stock + addAmount,
      });
      toast.success(
        'Stock Added',
        `Added +${addAmount} units to "${product.name}". New stock: ${product.stock + addAmount}`
      );
    } catch (err) {
      console.error('Failed to restock product:', err);
      toast.error('Restock Failed', 'Could not update local inventory.');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (confirm(`Are you sure you want to delete "${product.name}" from inventory?`)) {
      await db.products.delete(product.id);
      toast.info('Product Deleted', `"${product.name}" was removed from your catalog.`);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCat === 'all' || p.categoryId === selectedCat;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesStock =
      stockFilter === 'all'
        ? true
        : stockFilter === 'low'
        ? p.stock > 0 && p.stock <= 5
        : p.stock === 0;
    return matchesCat && matchesSearch && matchesStock;
  });

  // Multi-Select Handlers
  const isAllSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedProductIds.has(p.id));

  const handleToggleSelect = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProductIds((prev) => {
        const next = new Set(prev);
        filteredProducts.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedProductIds((prev) => {
        const next = new Set(prev);
        filteredProducts.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  // Bulk Restock Handler
  const handleBulkStock = async (amount: number, mode: 'ADD' | 'SET' = 'ADD') => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;
    setIsBulkProcessing(true);

    try {
      await db.transaction('rw', db.products, db.stockLedger, db.syncQueue, async () => {
        for (const id of ids) {
          const prod = await db.products.get(id);
          if (!prod) continue;
          const newStock = mode === 'ADD' ? Math.max(0, prod.stock + amount) : Math.max(0, amount);
          const effectiveDelta = newStock - prod.stock;

          await db.products.update(id, { stock: newStock });

          await db.stockLedger.add({
            id: `stk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            productId: id,
            delta: effectiveDelta,
            reason: 'RESTOCK',
            notes: `Bulk ${mode === 'ADD' ? `+${amount}` : `set to ${amount}`}`,
            createdAt: Date.now(),
          });

          await db.syncQueue.add({
            id: `sync-stk-${id}-${Date.now()}`,
            entity: 'stock',
            action: 'CREATE',
            payload: { productId: id, delta: effectiveDelta, reason: 'RESTOCK' },
            createdAt: Date.now(),
            synced: false,
          });
        }
      });

      toast.success(
        'Bulk Stock Updated',
        `Adjusted stock for ${ids.length} products (${mode === 'ADD' ? `+${amount}` : `set to ${amount}`}).`
      );
      setSelectedProductIds(new Set());
      setIsCustomBulkOpen(false);
    } catch (err: any) {
      console.error('Bulk restock error:', err);
      toast.error('Restock Failed', err?.message || 'Could not update stock.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Bulk Delete Handler
  const handleBulkDelete = async () => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${ids.length} selected products from your catalog?`)) return;

    try {
      await db.transaction('rw', db.products, db.syncQueue, async () => {
        for (const id of ids) {
          await db.products.delete(id);
          await db.syncQueue.add({
            id: `sync-del-${id}-${Date.now()}`,
            entity: 'product',
            action: 'DELETE',
            payload: { id },
            createdAt: Date.now(),
            synced: false,
          });
        }
      });

      toast.info('Products Deleted', `Removed ${ids.length} products from your catalog.`);
      setSelectedProductIds(new Set());
    } catch (err: any) {
      console.error('Bulk delete error:', err);
      toast.error('Delete Failed', 'Could not delete selected products.');
    }
  };

  const handleExport = () => {
    exportProductsToCsv(products, categories);
    toast.success('Inventory Exported', 'Downloaded complete product catalog to CSV.');
  };

  const clearAllFilters = () => {
    setSearch('');
    setSelectedCat('all');
    setStockFilter('all');
  };

  const hasActiveFilters = search !== '' || selectedCat !== 'all' || stockFilter !== 'all';

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-6 py-5 select-none bg-slate-50">
      {/* Top Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stock & Inventory Management</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Track stock levels, bulk restock shipments, and import/export CSV catalogs
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExport}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 active:scale-95 transition"
            title="Export all products to CSV format for Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Import CSV Button */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 active:scale-95 transition"
            title="Import or update products from CSV file"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import CSV</span>
          </button>

          {/* Add New Product Button */}
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 active:scale-95 transition"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Modern Interactive KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5 shrink-0">
        {/* Total Products */}
        <div
          onClick={() => setStockFilter('all')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md relative overflow-hidden ${
            stockFilter === 'all' && selectedCat === 'all' && !search
              ? 'border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Products
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
                {totalItemsCount}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center ring-1 ring-blue-100 shrink-0">
              <Package className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 font-semibold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3 h-3" /> All active SKUs
            </span>
            <span className="text-slate-400 font-medium">{categories.length} categories</span>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div
          onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md relative overflow-hidden ${
            stockFilter === 'low'
              ? 'border-amber-400 ring-2 ring-amber-500/20 bg-amber-50/20 shadow-xs'
              : 'border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Low Stock Warning
              </span>
              <p className={`text-2xl font-black mt-1 tracking-tight ${lowStockProducts.length > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                {lowStockProducts.length}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center ring-1 ring-amber-100 shrink-0">
              <AlertTriangle className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              ≤ 5 units remaining
            </span>
            <span className="text-amber-600 font-bold">
              {stockFilter === 'low' ? 'Filtering active' : 'Click to filter'}
            </span>
          </div>
        </div>

        {/* Out of Stock */}
        <div
          onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md relative overflow-hidden ${
            stockFilter === 'out'
              ? 'border-rose-400 ring-2 ring-rose-500/20 bg-rose-50/20 shadow-xs'
              : 'border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Out of Stock
              </span>
              <p className={`text-2xl font-black mt-1 tracking-tight ${outOfStockProducts.length > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                {outOfStockProducts.length}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center ring-1 ring-rose-100 shrink-0">
              <XCircle className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
              0 units left
            </span>
            <span className="text-rose-600 font-bold">
              {stockFilter === 'out' ? 'Filtering active' : 'Click to filter'}
            </span>
          </div>
        </div>

        {/* Total Asset Value (Peso Coins Icon, no Dollar sign) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-200 hover:shadow-md transition-all relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Inventory Value
              </span>
              <p className="text-2xl font-black text-emerald-600 mt-1 tracking-tight">
                {currency}{totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100 shrink-0">
              <Coins className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              <TrendingUp className="w-3 h-3" /> Cost Valuation
            </span>
            <span className="text-slate-400 font-medium">PHP (₱)</span>
          </div>
        </div>
      </div>

      {/* Modern Filter, Search, and Category Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4 shrink-0 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input and barcode scan button */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU, or barcode..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition shadow-xs active:scale-95 shrink-0"
            title="Scan barcode to lookup item"
          >
            <Scan className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scan</span>
          </button>
        </div>

        {/* Category Pills & Filter Indicator */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {/* All Categories capsule */}
          <button
            onClick={() => setSelectedCat('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
              selectedCat === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <span>All Categories</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedCat === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {getCategoryCount('all')}
            </span>
          </button>

          {/* Individual Category capsules */}
          {categories.map((c) => {
            const isSelected = selectedCat === c.id;
            const count = getCategoryCount(c.id);
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                <span>{c.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Active filter reset button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition whitespace-nowrap ml-1"
              title="Reset all filters"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Status Bar (When filtering by Stock or Search) */}
      {(stockFilter !== 'all' || search) && (
        <div className="flex items-center justify-between px-3 py-2 bg-blue-50/70 border border-blue-200 rounded-lg text-xs mb-3 text-blue-900">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>
              Showing <strong className="font-bold">{filteredProducts.length}</strong> of {products.length} products
              {stockFilter === 'low' && ' (Filter: Low Stock)'}
              {stockFilter === 'out' && ' (Filter: Out of Stock)'}
              {search && ` (Search: "${search}")`}
            </span>
          </div>
          <button
            onClick={clearAllFilters}
            className="text-blue-600 hover:text-blue-800 font-bold underline text-xs"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-slate-400 hover:text-blue-600 transition flex items-center justify-center mx-auto"
                    title={isAllSelected ? 'Deselect All' : 'Select All'}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Cost Price</th>
                <th className="py-3 px-3">Retail Price</th>
                <th className="py-3 px-3">Margin</th>
                <th className="py-3 px-3">In Stock</th>
                <th className="py-3 px-3">Quick Restock</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                      <Package className="w-6 h-6 stroke-1" />
                    </div>
                    <p className="font-bold text-slate-700 text-sm">No products found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your search query or category filters.
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="mt-3 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const category = categories.find((c) => c.id === p.categoryId);
                  const marginPercent =
                    p.price > 0 ? (((p.price - p.cost) / p.price) * 100).toFixed(0) : '0';
                  const isChecked = selectedProductIds.has(p.id);

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(p.id)}
                          className="text-slate-400 hover:text-blue-600 transition flex items-center justify-center mx-auto"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Image & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              p.image ||
                              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={p.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80';
                            }}
                            className="w-10 h-10 rounded-lg object-cover shrink-0 ring-1 ring-slate-200"
                          />
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                              {p.name}
                            </h4>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {p.sku} • {p.barcode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 font-semibold text-slate-600">
                        {category?.name || 'General'}
                      </td>

                      {/* Cost Price */}
                      <td className="py-3 px-3 font-semibold text-slate-500">
                        {currency}{p.cost.toFixed(2)}
                      </td>

                      {/* Retail Price */}
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {currency}{p.price.toFixed(2)}
                      </td>

                      {/* Profit Margin */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                          {marginPercent}% profit
                        </span>
                      </td>

                      {/* Stock Status Badge */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-xs ${
                            p.stock === 0
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : p.stock <= 5
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.stock === 0
                                ? 'bg-rose-500'
                                : p.stock <= 5
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          {p.stock} units
                        </span>
                      </td>

                      {/* Quick Restock Buttons */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleQuickRestock(p, 5)}
                            className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-[11px] font-bold rounded-md transition active:scale-95"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => handleQuickRestock(p, 10)}
                            className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-[11px] font-bold rounded-md transition active:scale-95"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => handleQuickRestock(p, 25)}
                            className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-[11px] font-bold rounded-md transition active:scale-95"
                          >
                            +25
                          </button>
                        </div>
                      </td>

                      {/* Edit & Delete Action Buttons */}
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5 stroke-[2]" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bulk Action Dock (When items are selected) */}
      {selectedProductIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-4 animate-in slide-in-from-bottom duration-200 select-none">
          {/* Selected Count Badge */}
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">
              {selectedProductIds.size}
            </span>
            <span className="text-xs font-bold text-slate-200 whitespace-nowrap">
              {selectedProductIds.size === 1 ? 'Product selected' : 'Products selected'}
            </span>
            <button
              type="button"
              onClick={() => setSelectedProductIds(new Set())}
              className="text-[11px] text-slate-400 hover:text-white underline ml-1"
            >
              Clear
            </button>
          </div>

          <div className="w-px h-6 bg-slate-700" />

          {/* Quick Increment Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Bulk Add:
            </span>
            {[5, 10, 25, 50].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleBulkStock(amt, 'ADD')}
                disabled={isBulkProcessing}
                className="px-2.5 py-1 bg-slate-800 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg border border-slate-700 transition active:scale-95"
              >
                +{amt}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-slate-700" />

          {/* Custom / Set Exact */}
          <button
            type="button"
            onClick={() => {
              setCustomStockValue(10);
              setCustomStockMode('ADD');
              setIsCustomBulkOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-lg border border-slate-700 transition active:scale-95"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Custom / Exact</span>
          </button>

          {/* Bulk Delete */}
          <button
            type="button"
            onClick={handleBulkDelete}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition"
            title="Delete Selected Products"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Custom Bulk Stock Modal */}
      {isCustomBulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <PackagePlus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Bulk Stock Adjustment</h4>
                  <p className="text-[11px] text-slate-400">
                    Applying to {selectedProductIds.size} selected products
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomBulkOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setCustomStockMode('ADD')}
                className={`py-1.5 rounded-lg transition ${
                  customStockMode === 'ADD'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                + Add To Stock
              </button>
              <button
                type="button"
                onClick={() => setCustomStockMode('SET')}
                className={`py-1.5 rounded-lg transition ${
                  customStockMode === 'SET'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                = Set Exact Count
              </button>
            </div>

            {/* Quantity Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                {customStockMode === 'ADD' ? 'Units to Add (+)' : 'Exact Stock Count'}
              </label>
              <input
                type="number"
                min={0}
                value={customStockValue}
                onChange={(e) => setCustomStockValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCustomBulkOpen(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleBulkStock(customStockValue, customStockMode)}
                disabled={isBulkProcessing}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-sm"
              >
                {isBulkProcessing ? 'Updating...' : `Apply (${selectedProductIds.size} Items)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        products={products}
        categories={categories}
      />

      {/* Add / Edit Modal */}
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        categories={categories}
        editingProduct={editingProduct}
      />

      {/* Barcode Scanner Modal for Inventory Filter */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(scannedCode) => {
          setSearch(scannedCode);
          setIsScannerOpen(false);
          toast.info('Barcode Filtered', `Showing inventory records matching "${scannedCode}"`);
        }}
        title="Scan to Lookup Inventory"
        subtitle="Point camera at product barcode to filter stock records"
        defaultContinuous={false}
      />
    </div>
  );
};
