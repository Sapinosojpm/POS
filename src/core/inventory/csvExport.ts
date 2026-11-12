/**
 * Universal Hybrid POS — CSV Export Utility
 * Exports product catalog to RFC 4180 CSV with UTF-8 BOM for Microsoft Excel & Google Sheets compatibility.
 */

import type { Product, Category } from '../../types';

function escapeCsvField(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportProductsToCsv(products: Product[], categories: Category[]): void {
  const categoryMap = new Map<string, string>();
  categories.forEach((c) => categoryMap.set(c.id, c.name));

  const headers = ['ID', 'Name', 'Barcode', 'SKU', 'Category', 'Price', 'Cost', 'Stock', 'Image'];
  const rows: string[] = [];

  // Header row
  rows.push(headers.join(','));

  // Data rows
  for (const p of products) {
    const categoryName = categoryMap.get(p.categoryId) || p.categoryId || 'Uncategorized';
    const row = [
      escapeCsvField(p.id),
      escapeCsvField(p.name),
      // Escape barcode in quotes to prevent Excel scientific notation
      escapeCsvField(p.barcode),
      escapeCsvField(p.sku),
      escapeCsvField(categoryName),
      p.price.toFixed(2),
      (p.cost || 0).toFixed(2),
      p.stock.toString(),
      escapeCsvField(p.image || '')
    ];
    rows.push(row.join(','));
  }

  // Prepend UTF-8 Byte Order Mark (BOM) so Excel opens UTF-8 properly
  const csvContent = '\uFEFF' + rows.join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `POS-Inventory-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
