// Order status workflow
export const ORDER_STATUS_FLOW = [
  "new",
  "confirmed",
  "packing",
  "ready",
  "dispatched",
  "delivered",
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  new: "New",
  confirmed: "Confirmed",
  packing: "Packing",
  ready: "Ready for Dispatch",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const CUSTOMER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending Verification",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

export const PRODUCT_SECTION_LABELS: Record<string, string> = {
  medicines: "Medicines",
  surgical: "Surgical Items",
  equipment: "Medical Equipment",
  spc: "SPC (Special Category)",
};

export const DOSAGE_FORM_LABELS: Record<string, string> = {
  tablet: "Tablet",
  capsule: "Capsule",
  syrup: "Syrup",
  suspension: "Suspension",
  injection: "Injection",
  cream: "Cream",
  ointment: "Ointment",
  gel: "Gel",
  drops: "Drops",
  inhaler: "Inhaler",
  suppository: "Suppository",
  patch: "Patch",
  powder: "Powder",
  solution: "Solution",
  spray: "Spray",
  other: "Other",
};

export const SPC_MINIMUM_ORDER = 50000;

export const DELIVERY_RATE_PER_KM = 25;

// File upload constraints (documents: SLMC/NMRA uploads)
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
];
export const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];

// Product image constraints
export const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_PRODUCT_IMAGES = 8;
export const ALLOWED_PRODUCT_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// Pagination
export const DEFAULT_PAGE_SIZE = 20;

// Delivery methods
export const DELIVERY_METHOD_LABELS: Record<string, string> = {
  pickup: "Store Pickup",
  standard: "Standard Delivery",
  express: "Express Delivery",
  hospital_nhsl: "Hospital Pick Up - NHSL Colombo",
  hospital_csth: "Hospital Pick Up - CSTH Kalubowila",
};

// Payment methods
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash_on_delivery: "Cash on Delivery",
  bank_transfer: "Bank Transfer",
};

// Stock adjustment reasons
export const STOCK_ADJUSTMENT_REASON_LABELS: Record<string, string> = {
  purchase: "Purchase",
  sale: "Sale",
  return: "Return",
  damage: "Damage",
  expired: "Expired",
  count_correction: "Count Correction",
  other: "Other",
};

// Customer types
export const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  doctor: "Doctor",
  dentist: "Dentist",
  pharmacy: "Pharmacy",
  clinic: "Private Clinic",
  dispensary: "Dispensary",
  other: "Other",
};

// Payment statuses
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  refunded: "Refunded",
};

// Auth
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MINUTES = 15;

// Valid order status transitions (current → allowed next statuses)
export const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["packing", "cancelled"],
  packing: ["ready", "cancelled"],
  ready: ["dispatched"],
  dispatched: ["delivered"],
};
