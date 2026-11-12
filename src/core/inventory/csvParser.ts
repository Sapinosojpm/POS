/**
 * Universal Hybrid POS — RFC 4180 CSV Parser & Template Generator
 * Handles quotes, commas, aliases, and smart catalog upsert mapping.
 */

import type { Category, Product } from '../../types';

export interface ParsedProductRow {
  id?: string;
  name: string;
  barcode: string;
  sku: string;
  categoryName: string;
  categoryId?: string;
  price: number;
  cost: number;
  stock: number;
  image?: string;
  isUpdate: boolean;
  existingProductId?: string;
}

export interface CsvParseResult {
  rows: ParsedProductRow[];
  newCount: number;
  updateCount: number;
  errors: string[];
}

/**
 * Robust RFC 4180 CSV tokenizer
 */
export function parseCsvText(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, ''); // strip BOM
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes header strings for aliasing
 */
function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Parse CSV text and compare against existing Dexie products & categories
 */
export function parseProductsCsv(
  csvText: string,
  existingProducts: Product[],
  categories: Category[]
): CsvParseResult {
  const grid = parseCsvText(csvText);
  if (grid.length < 2) {
    return { rows: [], newCount: 0, updateCount: 0, errors: ['CSV file is empty or missing data rows.'] };
  }

  const rawHeaders = grid[0];
  const headerMap: Record<string, number> = {};

  rawHeaders.forEach((h, index) => {
    const norm = normalizeHeader(h);
    if (['name', 'productname', 'item', 'itemname', 'title'].includes(norm)) headerMap.name = index;
    else if (['barcode', 'upc', 'ean', 'code'].includes(norm)) headerMap.barcode = index;
    else if (['sku', 'itemcode', 'productcode'].includes(norm)) headerMap.sku = index;
    else if (['category', 'categoryname', 'dept', 'department'].includes(norm)) headerMap.category = index;
    else if (['price', 'retailprice', 'sellingprice', 'srp', 'unitprice'].includes(norm)) headerMap.price = index;
    else if (['cost', 'unitcost', 'buyprice', 'purchaseprice'].includes(norm)) headerMap.cost = index;
    else if (['stock', 'qty', 'quantity', 'inventory', 'onhand', 'count'].includes(norm)) headerMap.stock = index;
    else if (['image', 'imageurl', 'photo'].includes(norm)) headerMap.image = index;
    else if (norm === 'id') headerMap.id = index;
  });

  if (headerMap.name === undefined) {
    return {
      rows: [],
      newCount: 0,
      updateCount: 0,
      errors: ['Missing required column: "Name" or "Product Name"']
    };
  }

  const categoryNameMap = new Map<string, string>();
  categories.forEach((c) => categoryNameMap.set(c.name.toLowerCase().trim(), c.id));

  // Map existing products by barcode and SKU for smart upsert matching
  const barcodeMap = new Map<string, Product>();
  const skuMap = new Map<string, Product>();
  existingProducts.forEach((p) => {
    if (p.barcode) barcodeMap.set(p.barcode.trim(), p);
    if (p.sku) skuMap.set(p.sku.toLowerCase().trim(), p);
  });

  const parsedRows: ParsedProductRow[] = [];
  const errors: string[] = [];
  let newCount = 0;
  let updateCount = 0;

  for (let r = 1; r < grid.length; r++) {
    const row = grid[r];
    const name = headerMap.name !== undefined ? row[headerMap.name] || '' : '';
    if (!name.trim()) continue; // Skip blank rows

    const barcode = headerMap.barcode !== undefined ? (row[headerMap.barcode] || '').replace(/^=/, '').replace(/"/g, '').trim() : '';
    const sku = headerMap.sku !== undefined ? (row[headerMap.sku] || '').trim() : '';
    const catName = headerMap.category !== undefined ? (row[headerMap.category] || '').trim() : 'General';
    const rawPrice = headerMap.price !== undefined ? row[headerMap.price] || '0' : '0';
    const rawCost = headerMap.cost !== undefined ? row[headerMap.cost] || '0' : '0';
    const rawStock = headerMap.stock !== undefined ? row[headerMap.stock] || '0' : '0';
    const image = headerMap.image !== undefined ? (row[headerMap.image] || '').trim() : '';

    const price = Math.max(0, parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 0);
    const cost = Math.max(0, parseFloat(rawCost.replace(/[^0-9.]/g, '')) || 0);
    const stock = Math.max(0, parseInt(rawStock.replace(/[^0-9-]/g, ''), 10) || 0);

    // Smart Upsert matching: Barcode first, then SKU
    let existingMatch: Product | undefined = undefined;
    if (barcode && barcodeMap.has(barcode)) {
      existingMatch = barcodeMap.get(barcode);
    } else if (sku && skuMap.has(sku.toLowerCase())) {
      existingMatch = skuMap.get(sku.toLowerCase());
    }

    const matchedCategoryId = categoryNameMap.get(catName.toLowerCase()) || categories[0]?.id || 'cat-general';

    if (existingMatch) {
      updateCount++;
      parsedRows.push({
        id: existingMatch.id,
        name,
        barcode: barcode || existingMatch.barcode,
        sku: sku || existingMatch.sku,
        categoryName: catName,
        categoryId: matchedCategoryId,
        price,
        cost,
        stock,
        image: image || existingMatch.image,
        isUpdate: true,
        existingProductId: existingMatch.id
      });
    } else {
      newCount++;
      parsedRows.push({
        id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name,
        barcode,
        sku: sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        categoryName: catName,
        categoryId: matchedCategoryId,
        price,
        cost,
        stock,
        image,
        isUpdate: false
      });
    }
  }

  return {
    rows: parsedRows,
    newCount,
    updateCount,
    errors
  };
}

/**
 * Downloads a pre-formatted Sample CSV template
 */
export function downloadSampleCsvTemplate(): void {
  const sampleContent =
    '\uFEFF' +
    [
      'Name,Barcode,SKU,Category,Price,Cost,Stock,Image',
      'Artisan Sourdough Loaf,4800016644010,BAK-001,Breakfast,180.00,90.00,25,https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=300',
      'Iced Caramel Macchiato,4800016644027,BEV-002,Coffee,165.00,65.00,50,https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=300',
      'Grilled Chicken Caesar,4800016644034,KIT-003,Lunch,220.00,110.00,15,https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300'
    ].join('\r\n');

  const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'POS-Product-Import-Template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
