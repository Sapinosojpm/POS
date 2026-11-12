/**
 * Universal Hybrid POS — CSV Product Import Modal
 * Features drag-and-drop dropzone, pre-flight preview, smart upsert,
 * and sample template download.
 */

import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { db } from '../core/db';
import { toast } from '../store/useToastStore';
import { parseProductsCsv, downloadSampleCsvTemplate, type CsvParseResult } from '../core/inventory/csvParser';
import type { Product, Category } from '../types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  onImportComplete?: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  onImportComplete
}) => {
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Invalid File', 'Please select a valid .csv file.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      const result = parseProductsCsv(text, products, categories);
      setParseResult(result);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleCommitImport = async () => {
    if (!parseResult || parseResult.rows.length === 0) return;
    setIsProcessing(true);

    try {
      await db.transaction('rw', db.products, db.stockLedger, db.syncQueue, async () => {
        for (const row of parseResult.rows) {
          const productPayload: Product = {
            id: row.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: row.name,
            barcode: row.barcode,
            sku: row.sku,
            categoryId: row.categoryId || categories[0]?.id || 'cat-general',
            price: row.price,
            cost: row.cost,
            stock: row.stock,
            image: row.image
          };

          await db.products.put(productPayload);

          // Append to local stock ledger
          await db.stockLedger.add({
            id: `stk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            productId: productPayload.id,
            delta: row.stock,
            reason: row.isUpdate ? 'ADJUSTMENT' : 'INITIAL',
            notes: `CSV Import from ${fileName || 'file'}`,
            createdAt: Date.now()
          });

          // Queue sync event for cloud PostgreSQL
          await db.syncQueue.add({
            id: `sync-prod-${productPayload.id}-${Date.now()}`,
            entity: 'product',
            action: row.isUpdate ? 'UPDATE' : 'CREATE',
            payload: productPayload,
            createdAt: Date.now(),
            synced: false
          });
        }
      });

      toast.success(
        'Catalog Imported',
        `Successfully imported ${parseResult.newCount} new items and updated ${parseResult.updateCount} existing products.`
      );

      if (onImportComplete) {
        onImportComplete();
      }
      onClose();
    } catch (err: any) {
      console.error('Import commit error:', err);
      toast.error('Import Failed', err?.message || 'Could not save imported products to database.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setParseResult(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-fade-in">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Import Products from CSV</h3>
              <p className="text-[11px] text-slate-400 font-medium">Batch catalog onboarding & smart price update</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {!parseResult ? (
            <>
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-white'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">
                    Click to browse or drag & drop CSV file
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports Microsoft Excel, Google Sheets, and standard RFC 4180 CSV exports
                  </p>
                </div>
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-2xs">
                  Select .CSV File
                </span>
              </div>

              {/* Sample Template Shortcut Banner */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-slate-800">Need a starting template?</h5>
                  <p className="text-[11px] text-slate-400">
                    Download our pre-filled template with Name, Barcode, SKU, Price, and Stock columns.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleCsvTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-blue-600 text-xs font-bold rounded-lg transition shadow-2xs active:scale-95 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Parse Summary KPI Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total In File
                  </span>
                  <span className="text-lg font-black text-slate-800">{parseResult.rows.length}</span>
                  <span className="text-[10px] text-slate-500 block">valid rows</span>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-left">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                    New Products
                  </span>
                  <span className="text-lg font-black text-emerald-700">+{parseResult.newCount}</span>
                  <span className="text-[10px] text-emerald-600 block">to be created</span>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-left">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                    Existing Matches
                  </span>
                  <span className="text-lg font-black text-blue-700">{parseResult.updateCount}</span>
                  <span className="text-[10px] text-blue-600 block">will update/upsert</span>
                </div>
              </div>

              {/* Pre-Flight Preview Table */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs text-slate-700">Preview (First 5 Items):</h5>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Choose another file
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <tr>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Product Name</th>
                        <th className="px-3 py-2">Barcode</th>
                        <th className="px-3 py-2 text-right">Price</th>
                        <th className="px-3 py-2 text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parseResult.rows.slice(0, 5).map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2">
                            {r.isUpdate ? (
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold">
                                UPDATE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                NEW
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-semibold text-slate-800">{r.name}</td>
                          <td className="px-3 py-2 font-mono text-slate-500">{r.barcode || '—'}</td>
                          <td className="px-3 py-2 text-right font-bold text-slate-800">
                            ₱{r.price.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-slate-800">{r.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {parseResult.errors.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseResult.errors.join(', ')}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition"
          >
            Cancel
          </button>

          {parseResult && (
            <button
              type="button"
              onClick={handleCommitImport}
              disabled={isProcessing || parseResult.rows.length === 0}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Importing Catalog...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm & Import ({parseResult.rows.length} Items)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
