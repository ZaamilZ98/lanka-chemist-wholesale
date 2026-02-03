import type { ProductSection, DosageForm } from "./database";

export interface ProductListParams {
  q?: string;
  section?: ProductSection;
  category?: string; // slug
  manufacturer?: string; // slug
  dosage_form?: DosageForm;
  prescription?: "true" | "false";
  in_stock?: "true";
  sort?: SortOption;
  page?: number;
  per_page?: number;
}

export type SortOption =
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc"
  | "newest"
  | "popular";

export interface ProductListItem {
  id: string;
  generic_name: string;
  brand_name: string;
  strength: string | null;
  dosage_form: string | null;
  pack_size: string | null;
  wholesale_price: number;
  mrp: number | null;
  stock_quantity: number;
  is_prescription: boolean;
  section: ProductSection;
  sku: string | null;
  total_sold: number;
  created_at: string;
  manufacturer: { id: string; name: string; slug: string } | null;
  category: {
    id: string;
    name: string;
    slug: string;
    section: ProductSection;
  } | null;
  images: {
    id: string;
    url: string;
    alt_text: string | null;
    is_primary: boolean;
    sort_order: number;
  }[];
}

export interface ProductListResponse {
  products: ProductListItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ProductDetail extends ProductListItem {
  storage_conditions: string | null;
  low_stock_threshold: number;
  barcode: string | null;
  is_active: boolean;
  is_visible: boolean;
  description: string | null;
  updated_at: string;
  manufacturer: {
    id: string;
    name: string;
    slug: string;
    country: string | null;
  } | null;
}

export interface ProductDetailResponse {
  product: ProductDetail;
  related: ProductListItem[];
}

export interface SearchSuggestion {
  id: string;
  generic_name: string;
  brand_name: string;
  strength: string | null;
  dosage_form: string | null;
}

// --- Cart types ---

export interface CartItemProduct {
  id: string;
  generic_name: string;
  brand_name: string;
  strength: string | null;
  dosage_form: string | null;
  pack_size: string | null;
  wholesale_price: number;
  stock_quantity: number;
  is_active: boolean;
  is_visible: boolean;
  section: ProductSection;
  images: {
    id: string;
    url: string;
    alt_text: string | null;
    is_primary: boolean;
    sort_order: number;
  }[];
}

export interface CartItemResponse {
  id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product: CartItemProduct;
}

export type CartWarningType =
  | "out_of_stock"
  | "quantity_reduced"
  | "product_unavailable";

export interface CartWarning {
  type: CartWarningType;
  product_name: string;
  old_quantity?: number;
  new_quantity?: number;
}

export interface CartResponse {
  items: CartItemResponse[];
  warnings: CartWarning[];
}

export interface AddToCartRequest {
  product_id: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

// --- Checkout / Order types ---

export interface DeliveryFeeResponse {
  delivery_method: string;
  delivery_fee: number;
  delivery_distance_km: number | null;
  fee_note: string;
  has_coordinates: boolean;
}

export interface PlaceOrderRequest {
  delivery_method: string;
  delivery_address_id?: string;
  payment_method: string;
  order_notes?: string;
  preferred_delivery_date?: string;
}

export interface StockIssue {
  product_id: string;
  product_name: string;
  requested: number;
  available: number;
}

export interface PlaceOrderResponse {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_method: string;
  payment_method: string;
  order_notes: string | null;
  preferred_delivery_date: string | null;
  created_at: string;
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
}

export interface BankDetailsResponse {
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_branch: string;
}

export interface OrderDetailResponse {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  delivery_distance_km: number | null;
  total: number;
  delivery_method: string;
  payment_method: string;
  payment_status: string;
  order_notes: string | null;
  preferred_delivery_date: string | null;
  created_at: string;
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
  delivery_address: {
    id: string;
    label: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    district: string;
    postal_code: string | null;
  } | null;
}
