-- Lanka Chemist Wholesale - Database Schema
-- PostgreSQL (Supabase)

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for fuzzy text search

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE customer_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE customer_type AS ENUM ('doctor', 'dentist', 'pharmacy', 'clinic', 'dispensary', 'other');
CREATE TYPE order_status AS ENUM ('new', 'confirmed', 'packing', 'ready', 'dispatched', 'delivered', 'cancelled');
CREATE TYPE delivery_method AS ENUM ('pickup', 'standard', 'express');
CREATE TYPE payment_method AS ENUM ('cash_on_delivery', 'bank_transfer');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');
CREATE TYPE product_section AS ENUM ('medicines', 'surgical', 'equipment', 'spc');
CREATE TYPE dosage_form AS ENUM (
  'tablet', 'capsule', 'syrup', 'suspension', 'injection',
  'cream', 'ointment', 'gel', 'drops', 'inhaler',
  'suppository', 'patch', 'powder', 'solution', 'spray', 'other'
);
CREATE TYPE stock_adjustment_reason AS ENUM (
  'purchase', 'sale', 'return', 'damage', 'expired', 'count_correction', 'other'
);

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  section product_section NOT NULL DEFAULT 'medicines',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_section ON categories(section);
CREATE INDEX idx_categories_slug ON categories(slug);

-- ============================================
-- MANUFACTURERS
-- ============================================
CREATE TABLE manufacturers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  country VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_manufacturers_slug ON manufacturers(slug);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generic_name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255) NOT NULL,
  manufacturer_id UUID REFERENCES manufacturers(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  section product_section NOT NULL DEFAULT 'medicines',
  strength VARCHAR(100),
  dosage_form dosage_form,
  pack_size VARCHAR(100),
  storage_conditions VARCHAR(255),
  wholesale_price DECIMAL(12, 2) NOT NULL,
  mrp DECIMAL(12, 2),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  sku VARCHAR(100) UNIQUE,
  barcode VARCHAR(100),
  is_prescription BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  total_sold INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_generic_name ON products(generic_name);
CREATE INDEX idx_products_brand_name ON products(brand_name);
CREATE INDEX idx_products_manufacturer ON products(manufacturer_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_section ON products(section);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_active_visible ON products(is_active, is_visible);
CREATE INDEX idx_products_stock ON products(stock_quantity);
CREATE INDEX idx_products_price ON products(wholesale_price);

-- Full-text search index
CREATE INDEX idx_products_search ON products
  USING GIN (
    to_tsvector('english',
      COALESCE(generic_name, '') || ' ' ||
      COALESCE(brand_name, '') || ' ' ||
      COALESCE(description, '')
    )
  );

-- Trigram indexes for fuzzy search / autocomplete
CREATE INDEX idx_products_generic_trgm ON products USING GIN (generic_name gin_trgm_ops);
CREATE INDEX idx_products_brand_trgm ON products USING GIN (brand_name gin_trgm_ops);

-- ============================================
-- PRODUCT IMAGES
-- ============================================
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

-- ============================================
-- CUSTOMERS
-- ============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  customer_type customer_type NOT NULL,
  business_name VARCHAR(255),
  contact_name VARCHAR(255) NOT NULL,
  slmc_number VARCHAR(50),
  nmra_license_number VARCHAR(50),
  phone VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20),
  status customer_status DEFAULT 'pending',
  rejection_reason TEXT,
  admin_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_type ON customers(customer_type);
CREATE INDEX idx_customers_phone ON customers(phone);

-- ============================================
-- CUSTOMER ADDRESSES
-- ============================================
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label VARCHAR(100) DEFAULT 'Default',
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  postal_code VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_addresses_customer ON customer_addresses(customer_id);

-- ============================================
-- VERIFICATION DOCUMENTS
-- ============================================
CREATE TABLE verification_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- 'slmc_id' or 'nmra_license'
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(50),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
);

CREATE INDEX idx_verification_docs_customer ON verification_documents(customer_id);

-- ============================================
-- ADMIN USERS
-- ============================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(20) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  status order_status DEFAULT 'new',
  delivery_method delivery_method NOT NULL,
  delivery_address_id UUID REFERENCES customer_addresses(id),
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  delivery_distance_km DECIMAL(8, 2),
  preferred_delivery_date DATE,
  subtotal DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  order_notes TEXT,
  admin_notes TEXT,
  cancelled_reason TEXT,
  invoice_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  product_generic_name VARCHAR(255),
  product_sku VARCHAR(100),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ============================================
-- CART ITEMS
-- ============================================
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

CREATE INDEX idx_cart_items_customer ON cart_items(customer_id);

-- ============================================
-- STOCK MOVEMENTS
-- ============================================
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_change INTEGER NOT NULL, -- positive = stock in, negative = stock out
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reason stock_adjustment_reason NOT NULL,
  reference_id UUID, -- order_id or other reference
  notes TEXT,
  created_by UUID, -- admin user id
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_created ON stock_movements(created_at DESC);

-- ============================================
-- ORDER STATUS HISTORY
-- ============================================
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status order_status,
  new_status order_status NOT NULL,
  notes TEXT,
  changed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);

-- ============================================
-- STORE SETTINGS
-- ============================================
CREATE TABLE store_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description VARCHAR(255),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default store settings
INSERT INTO store_settings (key, value, description) VALUES
  ('store_name', 'Lanka Chemist Wholesale', 'Store display name'),
  ('store_phone', '', 'Store phone / hotline number'),
  ('store_whatsapp', '', 'WhatsApp number for inquiries'),
  ('store_email', '', 'Store email address'),
  ('store_address', '', 'Physical store address'),
  ('store_latitude', '6.9271', 'Store latitude for delivery calculation'),
  ('store_longitude', '79.8612', 'Store longitude for delivery calculation'),
  ('operating_hours', '', 'Store operating hours'),
  ('nmra_license_number', '', 'NMRA license number'),
  ('delivery_rate_per_km', '25', 'Delivery fee per km in Rs'),
  ('bank_name', '', 'Bank name for transfers'),
  ('bank_account_name', '', 'Bank account holder name'),
  ('bank_account_number', '', 'Bank account number'),
  ('bank_branch', '', 'Bank branch'),
  ('spc_minimum_order', '50000', 'Minimum order for SPC items in Rs'),
  ('low_stock_default_threshold', '10', 'Default low stock alert threshold');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate order number (LCW-YYYYMMDD-XXXX)
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  today_count INTEGER;
  date_part VARCHAR(8);
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO today_count
    FROM orders
    WHERE order_number LIKE 'LCW-' || date_part || '-%';
  NEW.order_number := 'LCW-' || date_part || '-' || LPAD(today_count::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_customer_addresses_updated_at
  BEFORE UPDATE ON customer_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();
