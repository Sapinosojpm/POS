import React, { useState } from 'react';
import { X, Plus, Package, Scan } from 'lucide-react';
import { db } from '../core/db';
import { toast } from '../store/useToastStore';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import type { Category, Product } from '../types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  editingProduct?: Product | null;
  initialBarcode?: string;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  categories,
  editingProduct,
  initialBarcode,
}) => {
  const [name, setName] = useState(editingProduct?.name || '');
  const [categoryId, setCategoryId] = useState(editingProduct?.categoryId || categories[0]?.id || 'cat-lunch');
  const [price, setPrice] = useState(editingProduct?.price?.toString() || '');
  const [cost, setCost] = useState(editingProduct?.cost?.toString() || '');
  const [stock, setStock] = useState(editingProduct?.stock?.toString() || '10');
  const [barcode, setBarcode] = useState(editingProduct?.barcode || initialBarcode || '');
  const [sku, setSku] = useState(editingProduct?.sku || '');
  const [image, setImage] = useState(editingProduct?.image || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      toast.warning('Missing Required Fields', 'Please fill in product name and retail price.');
      return;
    }

    setIsSubmitting(true);
    try {
      const prodId = editingProduct?.id || `prod-${Date.now()}`;
      const newProduct: Product = {
        id: prodId,
        name,
        categoryId,
        price: parseFloat(price) || 0,
        cost: parseFloat(cost) || 0,
        stock: parseInt(stock, 10) || 0,
        barcode: barcode || `BC-${Date.now().toString().slice(-8)}`,
        sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
        image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80',
      };

      await db.products.put(newProduct);
      toast.success(editingProduct ? 'Product Updated' : 'Product Added to Inventory', `"${name}" has been saved.`);
      onClose();
    } catch (err) {
      console.error('Error saving product:', err);
      toast.error('Save Failed', 'Failed to save product in local database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">Saved directly to local offline storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto max-h-[80vh]">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grilled Chicken Salad"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Initial Stock Qty *
              </label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="e.g. 25"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Selling Price (₱) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="45.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Cost Price (₱)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="25.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Barcode / EAN
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="e.g. 480000000001"
                  className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="px-2.5 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border border-blue-200 rounded-lg flex items-center justify-center transition-colors shrink-0"
                  title="Scan barcode with camera"
                >
                  <Scan className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                SKU Code
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. LUN-010"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Image URL (Optional)
            </label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 mt-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 active:scale-95 transition text-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{isSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product to Inventory'}</span>
          </button>
        </form>

        {/* Embedded Barcode Scanner Modal */}
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={(scannedCode) => {
            setBarcode(scannedCode);
            setIsScannerOpen(false);
          }}
          title="Scan Product Packaging"
          subtitle="Point camera at product barcode to auto-fill"
          defaultContinuous={false}
        />
      </div>
    </div>
  );
};
