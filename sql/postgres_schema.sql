-- ==============================================================================
-- Universal Hybrid POS — Production PostgreSQL Database Schema
-- Architecture: Offline-First Hybrid Sync Gateway
-- ==============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically update timestamps
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 1. Branches & Stores
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_number VARCHAR(50),
    tin VARCHAR(50),
    tax_rate NUMERIC(5,2) DEFAULT 12.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_branches_updated_at
BEFORE UPDATE ON branches
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 2. Registered POS Terminals (Machine Identity)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    device_name VARCHAR(100) NOT NULL,
    device_token VARCHAR(255) UNIQUE NOT NULL,
    platform VARCHAR(50) DEFAULT 'ANDROID_APK', -- ANDROID_APK, WEB, DESKTOP
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_devices_updated_at
BEFORE UPDATE ON devices
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 3. Product Categories
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(100) PRIMARY KEY, -- String ID matching Dexie (e.g. cat-breakfast)
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    image TEXT,
    color VARCHAR(50),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_updated_at ON categories(updated_at);
CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 4. Products Catalog
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(100) PRIMARY KEY, -- String ID matching Dexie (UUID or product slug)
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    category_id VARCHAR(100) REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    barcode VARCHAR(100),
    sku VARCHAR(100),
    price NUMERIC(12,2) NOT NULL,
    cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    image TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at);
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 5. Cashier Shifts
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shifts (
    id VARCHAR(100) PRIMARY KEY, -- UUID from client Dexie
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    cashier_name VARCHAR(150) NOT NULL,
    opened_at BIGINT NOT NULL,
    closed_at BIGINT,
    starting_float NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_cash_sales NUMERIC(12,2) DEFAULT 0,
    total_non_cash_sales NUMERIC(12,2) DEFAULT 0,
    expected_cash_in_drawer NUMERIC(12,2) DEFAULT 0,
    actual_cash_counted NUMERIC(12,2),
    discrepancy NUMERIC(12,2),
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_opened_at ON shifts(opened_at);
CREATE TRIGGER trg_shifts_updated_at
BEFORE UPDATE ON shifts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 6. Orders / Sales Transactions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(100) PRIMARY KEY, -- Client-generated UUIDv4
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    order_number VARCHAR(100) NOT NULL,
    cashier_name VARCHAR(150) NOT NULL,
    shift_id VARCHAR(100) REFERENCES shifts(id) ON DELETE SET NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL,
    discount_type VARCHAR(50),
    discount_customer_name VARCHAR(255),
    discount_id_number VARCHAR(100),
    vat_exempt_amount NUMERIC(12,2) DEFAULT 0,
    senior_discount_amount NUMERIC(12,2) DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL,
    amount_tendered NUMERIC(12,2) NOT NULL,
    change_due NUMERIC(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    created_at BIGINT NOT NULL, -- Client timestamp (ms)
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch_id);

-- ------------------------------------------------------------------------------
-- 7. Order Items (Line Items)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(100) PRIMARY KEY, -- Client UUID
    order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    quantity INT NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ------------------------------------------------------------------------------
-- 8. Append-Only Stock Ledger
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_ledger (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    product_id VARCHAR(100) NOT NULL,
    delta INT NOT NULL, -- e.g. -2 for sale, +10 for restock
    reason VARCHAR(50) NOT NULL, -- 'SALE', 'RESTOCK', 'ADJUSTMENT', 'VOID'
    order_id VARCHAR(100),
    client_timestamp BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_ledger_product ON stock_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_branch ON stock_ledger(branch_id);

-- ------------------------------------------------------------------------------
-- Seed Default Branch & Device (For Local Testing & Development)
-- ------------------------------------------------------------------------------
INSERT INTO branches (id, code, name, address, tin)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'MAIN-BRANCH',
    'Universal POS Flagship Store',
    '123 Commercial Avenue, Metro Manila',
    '123-456-789-000'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO devices (id, branch_id, device_name, device_token)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Terminal-01 (Tablet)',
    'dev_token_pos_primary_001'
) ON CONFLICT (id) DO NOTHING;
