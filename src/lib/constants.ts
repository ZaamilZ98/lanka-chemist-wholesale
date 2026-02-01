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

// File upload constraints
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
];
export const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];

// Pagination
export const DEFAULT_PAGE_SIZE = 20;

// Auth
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MINUTES = 15;
