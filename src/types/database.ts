// Database types matching the PostgreSQL schema

export type CustomerStatus = "pending" | "approved" | "rejected" | "suspended";
export type CustomerType =
  | "doctor"
  | "dentist"
  | "pharmacy"
  | "clinic"
  | "dispensary"
  | "other";
export type OrderStatus =
  | "new"
  | "confirmed"
  | "packing"
  | "ready"
  | "dispatched"
  | "delivered"
  | "cancelled";
export type DeliveryMethod = "pickup" | "standard" | "express" | "hospital_nhsl" | "hospital_csth";
export type PaymentMethod = "cash_on_delivery" | "bank_transfer";
export type PaymentStatus = "pending" | "paid" | "refunded";
export type ProductSection = "medicines" | "surgical" | "equipment" | "spc";
export type DosageForm =
  | "tablet"
  | "capsule"
  | "syrup"
  | "suspension"
  | "injection"
  | "cream"
  | "ointment"
  | "gel"
  | "drops"
  | "inhaler"
  | "suppository"
  | "patch"
  | "powder"
  | "solution"
  | "spray"
  | "other";
export type StockAdjustmentReason =
  | "purchase"
  | "sale"
  | "return"
  | "damage"
  | "expired"
  | "count_correction"
  | "other";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  section: ProductSection;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  generic_name: string;
  brand_name: string;
  manufacturer_id: string | null;
  category_id: string | null;
  section: ProductSection;
  strength: string | null;
  dosage_form: DosageForm | null;
  pack_size: string | null;
  storage_conditions: string | null;
  wholesale_price: number;
  mrp: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  sku: string | null;
  barcode: string | null;
  is_prescription: boolean;
  is_active: boolean;
  is_visible: boolean;
  description: string | null;
  sort_order: number;
  total_sold: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  email: string;
  password_hash: string;
  customer_type: CustomerType;
  business_name: string | null;
  contact_name: string;
  slmc_number: string | null;
  nmra_license_number: string | null;
  phone: string;
  whatsapp: string | null;
  status: CustomerStatus;
  rejection_reason: string | null;
  admin_notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  district: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface VerificationDocument {
  id: string;
  customer_id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  status: OrderStatus;
  delivery_method: DeliveryMethod;
  delivery_address_id: string | null;
  delivery_fee: number;
  delivery_distance_km: number | null;
  preferred_delivery_date: string | null;
  subtotal: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_notes: string | null;
  admin_notes: string | null;
  cancelled_reason: string | null;
  invoice_url: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_generic_name: string | null;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface CartItem {
  id: string;
  customer_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reason: StockAdjustmentReason;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export interface StoreSetting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

// Extended types with joined data
export interface ProductWithDetails extends Product {
  manufacturer?: Manufacturer;
  category?: Category;
  images?: ProductImage[];
}

export interface OrderWithDetails extends Order {
  customer?: Customer;
  items?: OrderItem[];
  delivery_address?: CustomerAddress;
}

export interface CartItemWithProduct extends CartItem {
  product?: Product;
}
