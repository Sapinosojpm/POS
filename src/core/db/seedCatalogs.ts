import { db } from './index';
import type { Category, Product } from '../../types';
import type { BusinessType } from '../../store/useSettingsStore';

export interface BusinessCatalogProfile {
  id: BusinessType;
  title: string;
  tagline: string;
  defaultStoreName: string;
  defaultBranch: string;
  receiptHeader: string;
  receiptFooter: string;
  enableDining: boolean;
  categories: Category[];
  products: Product[];
}

export const BUSINESS_CATALOGS: Record<BusinessType, BusinessCatalogProfile> = {
  RETAIL: {
    id: 'RETAIL',
    title: 'Retail & Grocery',
    tagline: 'Supermarket, Minimart, Sari-Sari & Retail stores',
    defaultStoreName: 'UNIVERSAL SUPERMARKET & GROCERY',
    defaultBranch: 'Main Branch',
    receiptHeader: 'OFFICIAL RECEIPT / RETAIL REGISTER',
    receiptFooter: 'THANK YOU FOR SHOPPING WITH US!\nITEMS SOLD ARE SUBJECT TO STORE RETURN POLICY.\nPLEASE KEEP THIS SLIP.',
    enableDining: false,
    categories: [
      { id: 'cat-ret-beverages', name: 'Beverages & Drinks', image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=120&auto=format&fit=crop&q=80' },
      { id: 'cat-ret-snacks', name: 'Chips & Snacks', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=120&auto=format&fit=crop&q=80' },
      { id: 'cat-ret-canned', name: 'Canned Goods & Instant', image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=120&auto=format&fit=crop&q=80' },
      { id: 'cat-ret-pantry', name: 'Pantry & Condiments', image: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=120&auto=format&fit=crop&q=80' },
      { id: 'cat-ret-household', name: 'Household & Cleaning', image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=120&auto=format&fit=crop&q=80' },
      { id: 'cat-ret-personal', name: 'Personal Care & Hygiene', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=120&auto=format&fit=crop&q=80' },
    ],
    products: [
      { id: 'ret-001', name: 'Coca-Cola 1.5L PET Bottle', barcode: '4800016644400', sku: 'RET-BEV-001', categoryId: 'cat-ret-beverages', price: 75.0, cost: 62.0, stock: 48, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&auto=format&fit=crop&q=80' },
      { id: 'ret-002', name: 'San Miguel Pale Pilsen 330ml Can', barcode: '4800011122334', sku: 'RET-BEV-002', categoryId: 'cat-ret-beverages', price: 65.0, cost: 52.0, stock: 72, image: 'https://images.unsplash.com/photo-1608270190589-9b936e768ba2?w=200&auto=format&fit=crop&q=80' },
      { id: 'ret-003', name: 'Nature Spring Mineral Water 500ml', barcode: '4800014455667', sku: 'RET-BEV-003', categoryId: 'cat-ret-beverages', price: 20.0, cost: 13.0, stock: 120, image: 'https://images.unsplash.com/photo-1559839914-ba2a5c5317aa?w=200&auto=format&fit=crop&q=80' },
      { id: 'ret-004', name: 'Piattos Cheese Flavored Chips 85g', barcode: '4800016677889', sku: 'RET-SNK-001', categoryId: 'cat-ret-snacks', price: 38.0, cost: 30.0, stock: 45, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200&auto=format&fit=crop&q=80' },
      { id: 'ret-005', name: 'Chippy Barbecue Corn Chips 110g', barcode: '4800016688990', sku: 'RET-SNK-002', categoryId: 'cat-ret-snacks', price: 36.0, cost: 28.0, stock: 50, image: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=200&auto=format&fit=crop&q=80' },
      { id: 'ret-006', name: 'Lucky Me Pancit Canton Kalamansi', barcode: '4807770270014', sku: 'RET-CAN-001', categoryId: 'cat-ret-canned', price: 16.5, cost: 13.0, stock: 150, image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=200&auto=format&fit=crop&q=80' },
      { id: 'ret-007', name: 'Purefoods Corned Beef 210g', barcode: '4800049720010', sku: 'RET-CAN-002', categoryId: 'cat-ret-canned', price: 89.0, cost: 74.0, stock: 32, image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=200&auto=format&fit=crop&q=80' },
      { id: 'ret-008', name: 'Century Tuna Flakes in Oil 155g', barcode: '4800110022201', sku: 'RET-CAN-003', categoryId: 'cat-ret-canned', price: 39.5, cost: 31.0, stock: 65, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&auto=format&fit=crop&q=80' },
      { id: 'ret-009', name: 'Argentina Meat Loaf 150g', barcode: '4800049733321', sku: 'RET-CAN-004', categoryId: 'cat-ret-canned', price: 28.5, cost: 22.0, stock: 40, image: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=200&auto=format&fit=crop&q=80' },
      { id: 'ret-010', name: 'Datu Puti White Vinegar 1 Liter', barcode: '4800010044455', sku: 'RET-PAN-001', categoryId: 'cat-ret-pantry', price: 42.0, cost: 33.0, stock: 28, image: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=200&auto=format&fit=crop&q=80' },
      { id: 'ret-011', name: 'Silver Swan Soy Sauce 1 Liter', barcode: '4800010055566', sku: 'RET-PAN-002', categoryId: 'cat-ret-pantry', price: 45.0, cost: 35.0, stock: 30, image: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=200&auto=format&fit=crop&q=80' },
      { id: 'ret-012', name: 'Magnolia Cheezee Block 165g', barcode: '4800010066677', sku: 'RET-PAN-003', categoryId: 'cat-ret-pantry', price: 62.0, cost: 48.0, stock: 25, image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200&auto=format&fit=crop&q=80' },
      { id: 'ret-013', name: 'Nescafe Classic 100g Jar', barcode: '4800361288812', sku: 'RET-PAN-004', categoryId: 'cat-ret-pantry', price: 98.0, cost: 79.0, stock: 22, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&auto=format&fit=crop&q=80' },
      { id: 'ret-014', name: 'Safeguard Pure White Soap 130g', barcode: '4800012299900', sku: 'RET-PER-001', categoryId: 'cat-ret-personal', price: 52.0, cost: 41.0, stock: 55, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&auto=format&fit=crop&q=80' },
      { id: 'ret-015', name: 'Colgate Total Dental Paste 150g', barcode: '4800012288877', sku: 'RET-PER-002', categoryId: 'cat-ret-personal', price: 110.0, cost: 88.0, stock: 30, image: 'https://images.unsplash.com/photo-1559591937-e62fb330bc1f?w=200&auto=format&fit=crop&q=80' },
      { id: 'ret-016', name: 'Breeze Laundry Detergent 1kg', barcode: '4800018844332', sku: 'RET-HOU-001', categoryId: 'cat-ret-household', price: 145.0, cost: 118.0, stock: 18, image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=200&auto=format&fit=crop&q=80' },
    ],
  },

  RESTAURANT: {
    id: 'RESTAURANT',
    title: 'Restaurant & Cafe',
    tagline: 'Dine-in, Takeout, Bistro, Coffee shop & Fast casual',
    defaultStoreName: 'UNIVERSAL BISTRO & CAFE',
    defaultBranch: 'Downtown Branch',
    receiptHeader: 'GUEST CHECK / RESTAURANT BILL',
    receiptFooter: 'THANK YOU FOR DINING WITH US!\nSERVICE CHARGE NOT INCLUDED.\nPLEASE COME AGAIN.',
    enableDining: true,
    categories: [
      { id: 'cat-res-mains', name: 'Rice Bowls & Mains', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=80' },
      { id: 'cat-res-burgers', name: 'Burgers & Sandwiches', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&auto=format&fit=crop&q=80' },
      { id: 'cat-res-pasta', name: 'Pasta & Noodles', image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=120&auto=format&fit=crop&q=80' },
      { id: 'cat-res-sides', name: 'Appetizers & Sides', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=120&auto=format&fit=crop&q=80' },
      { id: 'cat-res-drinks', name: 'Beverages & Coffee', image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=120&auto=format&fit=crop&q=80' },
      { id: 'cat-res-desserts', name: 'Pastries & Desserts', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=120&auto=format&fit=crop&q=80' },
    ],
    products: [
      { id: 'res-001', name: 'USDA Prime Ribeye Steak 250g', barcode: '480111000001', sku: 'RES-STK-001', categoryId: 'cat-res-mains', price: 450.0, cost: 260.0, stock: 20, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&auto=format&fit=crop&q=80' },
      { id: 'res-002', name: 'Crispy Garlic Fried Chicken Meal', barcode: '480111000002', sku: 'RES-CHK-001', categoryId: 'cat-res-mains', price: 165.0, cost: 85.0, stock: 45, image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=200&auto=format&fit=crop&q=80' },
      { id: 'res-003', name: 'Pork Belly Sisig Rice Bowl', barcode: '480111000003', sku: 'RES-SSG-001', categoryId: 'cat-res-mains', price: 175.0, cost: 90.0, stock: 35, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80' },
      { id: 'res-004', name: 'Double Bacon Smash Cheeseburger', barcode: '480111000004', sku: 'RES-BGR-001', categoryId: 'cat-res-burgers', price: 220.0, cost: 110.0, stock: 28, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80' },
      { id: 'res-005', name: 'Classic Truffle Pasta Carbonara', barcode: '480111000005', sku: 'RES-PST-001', categoryId: 'cat-res-pasta', price: 240.0, cost: 115.0, stock: 25, image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=200&auto=format&fit=crop&q=80' },
      { id: 'res-006', name: 'Slow-Cooked Beef Bolognese Pasta', barcode: '480111000006', sku: 'RES-PST-002', categoryId: 'cat-res-pasta', price: 210.0, cost: 95.0, stock: 30, image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=200&auto=format&fit=crop&q=80' },
      { id: 'res-007', name: 'Parmesan Truffle French Fries', barcode: '480111000007', sku: 'RES-SID-001', categoryId: 'cat-res-sides', price: 120.0, cost: 45.0, stock: 60, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&auto=format&fit=crop&q=80' },
      { id: 'res-008', name: 'Golden Mozzarella Sticks (6pcs)', barcode: '480111000008', sku: 'RES-SID-002', categoryId: 'cat-res-sides', price: 140.0, cost: 65.0, stock: 40, image: 'https://images.unsplash.com/photo-1548340748-6d2b7d7da280?w=200&auto=format&fit=crop&q=80' },
      { id: 'res-009', name: 'Iced Caramel Macchiato 16oz', barcode: '480111000009', sku: 'RES-COF-001', categoryId: 'cat-res-drinks', price: 135.0, cost: 50.0, stock: 80, image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=200&auto=format&fit=crop&q=80' },
      { id: 'res-010', name: 'House Special Lemon Iced Tea', barcode: '480111000010', sku: 'RES-DRK-001', categoryId: 'cat-res-drinks', price: 65.0, cost: 20.0, stock: 100, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&auto=format&fit=crop&q=80' },
      { id: 'res-011', name: 'New York Baked Cheesecake Slice', barcode: '480111000011', sku: 'RES-DES-001', categoryId: 'cat-res-desserts', price: 160.0, cost: 75.0, stock: 24, image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=200&auto=format&fit=crop&q=80' },
      { id: 'res-012', name: 'Warm Chocolate Lava Cake', barcode: '480111000012', sku: 'RES-DES-002', categoryId: 'cat-res-desserts', price: 180.0, cost: 80.0, stock: 18, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=200&auto=format&fit=crop&q=80' },
    ],
  },

  VAPE_SHOP: {
    id: 'VAPE_SHOP',
    title: 'Vape Shop & Specialty',
    tagline: 'E-Liquids, Salt Nic, Pod systems, Disposables & Mod devices',
    defaultStoreName: 'CLOUD & CO. VAPE LOUNGE',
    defaultBranch: 'Main Lounge',
    receiptHeader: 'SPECIALTY VAPE RECEIPT',
    receiptFooter: 'GOVERNMENT WARNING: 18+ ONLY.\nTHIS PRODUCT CONTAINS NICOTINE WHICH IS HIGHLY ADDICTIVE.\nNOT FOR SALE TO MINORS (RA 11900).',
    enableDining: false,
    categories: [
      { id: 'cat-vap-eliquid', name: 'E-Liquids & Salt Nic', image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=120&auto=format&fit=crop&q=80' },
      { id: 'cat-vap-disposable', name: 'Disposable Vapes', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=120&auto=format&fit=crop&q=80' },
      { id: 'cat-vap-pods', name: 'Pod Systems & Devices', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=120&auto=format&fit=crop&q=80' },
      { id: 'cat-vap-coils', name: 'Replacement Coils & Cartridges', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=120&auto=format&fit=crop&q=80' },
      { id: 'cat-vap-acc', name: 'Batteries & Accessories', image: 'https://images.unsplash.com/photo-1609592424109-dd77e5d8ff1b?w=120&auto=format&fit=crop&q=80' },
    ],
    products: [
      { id: 'vap-001', name: 'RELX Infinity 2 Device (Phantom)', barcode: '480222000001', sku: 'VAP-DEV-001', categoryId: 'cat-vap-pods', price: 1250.0, cost: 890.0, stock: 15, image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=200&auto=format&fit=crop&q=80' },
      { id: 'vap-002', name: 'OXVA Xlim Pro 30W Pod Kit', barcode: '480222000002', sku: 'VAP-DEV-002', categoryId: 'cat-vap-pods', price: 1450.0, cost: 1050.0, stock: 12, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80' },
      { id: 'vap-003', name: 'RELX Pro Pod Fresh Red (Watermelon)', barcode: '480222000003', sku: 'VAP-POD-001', categoryId: 'cat-vap-pods', price: 250.0, cost: 180.0, stock: 40, image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=200&auto=format&fit=crop&q=80' },
      { id: 'vap-004', name: 'RELX Pro Pod Dark Sparkle (Cola Ice)', barcode: '480222000004', sku: 'VAP-POD-002', categoryId: 'cat-vap-pods', price: 250.0, cost: 180.0, stock: 35, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&auto=format&fit=crop&q=80' },
      { id: 'vap-005', name: 'OXVA Xlim V3 Cartridge 0.6Ω (3-pack)', barcode: '480222000005', sku: 'VAP-COIL-001', categoryId: 'cat-vap-coils', price: 450.0, cost: 320.0, stock: 25, image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80' },
      { id: 'vap-006', name: 'Geekvape Z Series 0.2Ω Mesh Coil', barcode: '480222000006', sku: 'VAP-COIL-002', categoryId: 'cat-vap-coils', price: 180.0, cost: 110.0, stock: 30, image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=200&auto=format&fit=crop&q=80' },
      { id: 'vap-007', name: 'Flava 10,000 Puffs Disposable (Grape)', barcode: '480222000007', sku: 'VAP-DSP-001', categoryId: 'cat-vap-disposable', price: 480.0, cost: 310.0, stock: 50, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=200&auto=format&fit=crop&q=80' },
      { id: 'vap-008', name: 'Shift Pod 9,000 Puffs (Strawberry Frost)', barcode: '480222000008', sku: 'VAP-DSP-002', categoryId: 'cat-vap-disposable', price: 450.0, cost: 290.0, stock: 45, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=200&auto=format&fit=crop&q=80' },
      { id: 'vap-009', name: 'Tokyo Iced Mango Salt Nic 30ml 30mg', barcode: '480222000009', sku: 'VAP-LIQ-001', categoryId: 'cat-vap-eliquid', price: 360.0, cost: 220.0, stock: 20, image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=200&auto=format&fit=crop&q=80' },
      { id: 'vap-010', name: 'Buko Pandan Pastry Salt Nic 30ml 25mg', barcode: '480222000010', sku: 'VAP-LIQ-002', categoryId: 'cat-vap-eliquid', price: 350.0, cost: 210.0, stock: 22, image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=200&auto=format&fit=crop&q=80' },
      { id: 'vap-011', name: 'Strawberry Yakult Ice Freebase 60ml 3mg', barcode: '480222000011', sku: 'VAP-LIQ-003', categoryId: 'cat-vap-eliquid', price: 380.0, cost: 230.0, stock: 18, image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=200&auto=format&fit=crop&q=80' },
      { id: 'vap-012', name: 'Molicel P28A 18650 2800mAh Battery', barcode: '480222000012', sku: 'VAP-ACC-001', categoryId: 'cat-vap-acc', price: 320.0, cost: 210.0, stock: 25, image: 'https://images.unsplash.com/photo-1609592424109-dd77e5d8ff1b?w=200&auto=format&fit=crop&q=80' },
      { id: 'vap-013', name: 'Cotton Bacon Prime Organic Cotton Wick', barcode: '480222000013', sku: 'VAP-ACC-002', categoryId: 'cat-vap-acc', price: 220.0, cost: 130.0, stock: 30, image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80' },
    ],
  },

  SERVICES: {
    id: 'SERVICES',
    title: 'Services & Salon',
    tagline: 'Barbershop, Salon, Device Repair, Spa & Professional Labor',
    defaultStoreName: 'APEX SERVICES & SALON',
    defaultBranch: 'Main Studio',
    receiptHeader: 'SERVICE INVOICE & ACKNOWLEDGEMENT',
    receiptFooter: 'THANK YOU FOR YOUR PATRONAGE!\nALL WORKMANSHIP GUARANTEED FOR 30 DAYS WITH THIS INVOICE.\nPLEASE COME AGAIN.',
    enableDining: false,
    categories: [
      { id: 'cat-srv-hair', name: 'Haircut & Styling', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=120&auto=format&fit=crop&q=80' },
      { id: 'cat-srv-spa', name: 'Spa & Facial Treatment', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=120&auto=format&fit=crop&q=80' },
      { id: 'cat-srv-repair', name: 'Electronics & Phone Repair', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=120&auto=format&fit=crop&q=80' },
      { id: 'cat-srv-labor', name: 'Home & Appliance Labor', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=120&auto=format&fit=crop&q=80' },
      { id: 'cat-srv-care', name: 'Aftercare & Retail Supplies', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=120&auto=format&fit=crop&q=80' },
    ],
    products: [
      { id: 'srv-001', name: 'Executive Haircut & Menthol Shampoo', barcode: '480333000001', sku: 'SRV-CUT-001', categoryId: 'cat-srv-hair', price: 250.0, cost: 50.0, stock: 999, image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&auto=format&fit=crop&q=80' },
      { id: 'srv-002', name: 'Beard Sculpting & Hot Towel Shave', barcode: '480333000002', sku: 'SRV-CUT-002', categoryId: 'cat-srv-hair', price: 180.0, cost: 30.0, stock: 999, image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=200&auto=format&fit=crop&q=80' },
      { id: 'srv-003', name: 'Hair Color & Keratin Gloss Treatment', barcode: '480333000003', sku: 'SRV-HAIR-001', categoryId: 'cat-srv-hair', price: 1200.0, cost: 350.0, stock: 999, image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&auto=format&fit=crop&q=80' },
      { id: 'srv-004', name: 'Japanese Hair Rebonding & Collagen', barcode: '480333000004', sku: 'SRV-HAIR-002', categoryId: 'cat-srv-hair', price: 2500.0, cost: 600.0, stock: 999, image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=80' },
      { id: 'srv-005', name: 'Full Body Aromatherapy Massage 60m', barcode: '480333000005', sku: 'SRV-SPA-001', categoryId: 'cat-srv-spa', price: 600.0, cost: 150.0, stock: 999, image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&auto=format&fit=crop&q=80' },
      { id: 'srv-006', name: 'Deluxe Foot Spa & Pedicure', barcode: '480333000006', sku: 'SRV-SPA-002', categoryId: 'cat-srv-spa', price: 350.0, cost: 80.0, stock: 999, image: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=200&auto=format&fit=crop&q=80' },
      { id: 'srv-007', name: 'Smartphone LCD Screen Replacement Labor', barcode: '480333000007', sku: 'SRV-REP-001', categoryId: 'cat-srv-repair', price: 850.0, cost: 200.0, stock: 999, image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80' },
      { id: 'srv-008', name: 'Smartphone Battery Replacement Labor', barcode: '480333000008', sku: 'SRV-REP-002', categoryId: 'cat-srv-repair', price: 500.0, cost: 120.0, stock: 999, image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=200&auto=format&fit=crop&q=80' },
      { id: 'srv-009', name: 'Laptop Deep Clean & Thermal Paste', barcode: '480333000009', sku: 'SRV-REP-003', categoryId: 'cat-srv-repair', price: 650.0, cost: 100.0, stock: 999, image: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=200&auto=format&fit=crop&q=80' },
      { id: 'srv-010', name: 'Split AC Cleaning & Deep Diagnostics', barcode: '480333000010', sku: 'SRV-LAB-001', categoryId: 'cat-srv-labor', price: 1200.0, cost: 250.0, stock: 999, image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200&auto=format&fit=crop&q=80' },
      { id: 'srv-011', name: 'CCTV Camera Setup Labor per Node', barcode: '480333000011', sku: 'SRV-LAB-002', categoryId: 'cat-srv-labor', price: 750.0, cost: 150.0, stock: 999, image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=200&auto=format&fit=crop&q=80' },
      { id: 'srv-012', name: 'Moroccan Argan Hair Serum 100ml', barcode: '480333000012', sku: 'SRV-RET-001', categoryId: 'cat-srv-care', price: 450.0, cost: 280.0, stock: 25, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&auto=format&fit=crop&q=80' },
      { id: 'srv-013', name: 'Tempered Glass 9D Screen Protector', barcode: '480333000013', sku: 'SRV-RET-002', categoryId: 'cat-srv-care', price: 150.0, cost: 40.0, stock: 50, image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=200&auto=format&fit=crop&q=80' },
    ],
  },
};

/**
 * Switches the business mode catalog in Dexie IndexedDB and updates settings.
 */
export async function switchBusinessCatalog(
  targetType: BusinessType,
  replaceCatalog: boolean = true
): Promise<BusinessCatalogProfile> {
  const profile = BUSINESS_CATALOGS[targetType] || BUSINESS_CATALOGS.RETAIL;

  if (replaceCatalog) {
    await db.transaction('rw', [db.categories, db.products], async () => {
      await db.categories.clear();
      await db.products.clear();
      await db.categories.bulkPut(profile.categories);
      await db.products.bulkPut(profile.products);
    });
  }

  return profile;
}
