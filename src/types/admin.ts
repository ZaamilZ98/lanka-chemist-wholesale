import type {
  OrderStatus,
  PaymentStatus,
  CustomerStatus,
  CustomerType,
  DosageForm,
  ProductSection,
  StockAdjustmentReason,
} from "./database";

// --- Dashboard ---

export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  pendingVerifications: number;
  lowStockCount: number;
  recentOrders: RecentOrder[];
  lowStockProducts: LowStockProduct[];
}

export interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total: number;
  created_at: string;
}

export interface LowStockProduct {
  id: string;
  brand_name: string;
  generic_name: string;
  stock_quantity: number;
  low_stock_threshold: number;
}

export interface AdminInfo {
  id: string;
  email: string;
  name: string;
}

// --- Pagination ---

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Customer Management ---

export interface AdminCustomerListItem {
  id: string;
  business_name: string | null;
  contact_name: string;
  email: string;
  phone: string;
  customer_type: CustomerType;
  status: CustomerStatus;
  created_at: string;
}

export interface AdminCustomerDetail {
  id: string;
  email: string;
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
  verification_documents: {
    id: string;
    document_type: string;
    file_url: string;
    file_name: string;
    uploaded_at: string;
  }[];
  customer_addresses: {
    id: string;
    label: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    district: string;
    postal_code: string | null;
    is_default: boolean;
  }[];
}

// --- Order Management ---

export interface AdminOrderListItem {
  id: string;
  order_number: string;
  customer_name: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total: number;
  item_count: number;
  created_at: string;
}

export interface AdminOrderDetail {
  id: string;
  order_number: string;
  customer_id: string;
  status: OrderStatus;
  delivery_method: string;
  delivery_fee: number;
  delivery_distance_km: number | null;
  preferred_delivery_date: string | null;
  subtotal: number;
  total: number;
  payment_method: string;
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
  customer: {
    id: string;
    contact_name: string;
    business_name: string | null;
    email: string;
    phone: string;
    customer_type: CustomerType;
  };
  delivery_address: {
    address_line1: string;
    address_line2: string | null;
    city: string;
    district: string;
    postal_code: string | null;
  } | null;
  items: {
    id: string;
    product_id: string;
    product_name: string;
    product_generic_name: string | null;
    product_sku: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  status_history: {
    id: string;
    old_status: OrderStatus | null;
    new_status: OrderStatus;
    notes: string | null;
    changed_by: string | null;
    admin_name: string | null;
    created_at: string;
  }[];
}

// --- Product Management ---

export interface AdminProductListItem {
  id: string;
  brand_name: string;
  generic_name: string;
  sku: string | null;
  wholesale_price: number;
  stock_quantity: number;
  is_active: boolean;
  category_name: string | null;
  manufacturer_name: string | null;
  section: ProductSection;
  dosage_form: DosageForm | null;
}

export interface AdminProductDetail {
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
  category_name: string | null;
  manufacturer_name: string | null;
  images: {
    id: string;
    url: string;
    alt_text: string | null;
    is_primary: boolean;
    sort_order: number;
  }[];
  stock_movements: {
    id: string;
    quantity_change: number;
    quantity_before: number;
    quantity_after: number;
    reason: StockAdjustmentReason;
    notes: string | null;
    created_by: string | null;
    admin_name: string | null;
    created_at: string;
  }[];
}

export interface StockAdjustment {
  product_id: string;
  quantity_change: number;
  reason: StockAdjustmentReason;
  notes?: string;
}
