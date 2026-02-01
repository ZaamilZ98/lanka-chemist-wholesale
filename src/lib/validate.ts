import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES } from "./constants";
import type { CustomerType } from "@/types/database";

const VALID_CUSTOMER_TYPES: CustomerType[] = [
  "doctor",
  "dentist",
  "pharmacy",
  "clinic",
  "dispensary",
  "other",
];

// --- Email ---

export function validateEmail(email: string): string | null {
  if (!email) return "Email is required";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return "Invalid email address";
  if (email.length > 255) return "Email is too long";
  return null;
}

// --- Phone (Sri Lankan) ---

export function validatePhone(phone: string): string | null {
  if (!phone) return "Phone number is required";
  // Sri Lankan: 0XXXXXXXXX (10 digits) or +94XXXXXXXXX (12 chars)
  const cleaned = phone.replace(/[\s\-()]/g, "");
  const re = /^(\+94\d{9}|0\d{9})$/;
  if (!re.test(cleaned)) return "Enter a valid Sri Lankan phone number (e.g. 0771234567)";
  return null;
}

// --- Password ---

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
  if (!/\d/.test(password)) return "Password must contain a digit";
  return null;
}

// --- SLMC Number ---

export function validateSlmcNumber(value: string): string | null {
  if (!value) return "SLMC number is required";
  // Typically numeric, 4-10 digits
  const re = /^\d{4,10}$/;
  if (!re.test(value.trim())) return "Enter a valid SLMC number (4-10 digits)";
  return null;
}

// --- NMRA License ---

export function validateNmraLicense(value: string): string | null {
  if (!value) return "NMRA license number is required";
  // Alphanumeric, 3-20 characters
  const re = /^[A-Za-z0-9\-/]{3,20}$/;
  if (!re.test(value.trim())) return "Enter a valid NMRA license number";
  return null;
}

// --- Sanitize ---

export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

// --- File Validation ---

// Magic bytes for allowed file types
const FILE_MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
};

export function checkFileMagicBytes(
  buffer: ArrayBuffer,
  declaredType: string,
): boolean {
  const bytes = new Uint8Array(buffer);
  const signatures = FILE_MAGIC_BYTES[declaredType];
  if (!signatures) return false;
  return signatures.some((sig) =>
    sig.every((byte, i) => bytes[i] === byte),
  );
}

export function validateFileUpload(
  file: File,
): string | null {
  if (!file) return "File is required";
  if (file.size > MAX_FILE_SIZE) return "File must be under 5MB";
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Only JPEG, PNG, and PDF files are allowed";
  }
  return null;
}

// --- Registration Validation ---

interface RegistrationInput {
  email: string;
  password: string;
  customer_type: CustomerType;
  contact_name: string;
  business_name?: string;
  phone: string;
  whatsapp?: string;
  slmc_number?: string;
  nmra_license_number?: string;
  address_line1: string;
  city: string;
  district: string;
}

export function validateRegistrationInput(
  data: RegistrationInput,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!VALID_CUSTOMER_TYPES.includes(data.customer_type)) {
    errors.customer_type = "Invalid account type";
  }

  const emailErr = validateEmail(data.email);
  if (emailErr) errors.email = emailErr;

  const passErr = validatePassword(data.password);
  if (passErr) errors.password = passErr;

  if (!data.contact_name?.trim()) errors.contact_name = "Name is required";

  const phoneErr = validatePhone(data.phone);
  if (phoneErr) errors.phone = phoneErr;

  if (data.whatsapp) {
    const waErr = validatePhone(data.whatsapp);
    if (waErr) errors.whatsapp = waErr;
  }

  const needsSlmc = ["doctor", "dentist"].includes(data.customer_type);
  const needsNmra = ["pharmacy", "clinic", "dispensary", "other"].includes(
    data.customer_type,
  );

  if (needsSlmc) {
    if (!data.slmc_number) {
      errors.slmc_number = "SLMC number is required for doctors/dentists";
    } else {
      const slmcErr = validateSlmcNumber(data.slmc_number);
      if (slmcErr) errors.slmc_number = slmcErr;
    }
  }

  if (needsNmra) {
    if (!data.business_name?.trim()) {
      errors.business_name = "Business name is required";
    }
    if (!data.nmra_license_number) {
      errors.nmra_license_number = "NMRA license is required for businesses";
    } else {
      const nmraErr = validateNmraLicense(data.nmra_license_number);
      if (nmraErr) errors.nmra_license_number = nmraErr;
    }
  }

  if (!data.address_line1?.trim()) errors.address_line1 = "Address is required";
  if (!data.city?.trim()) errors.city = "City is required";
  if (!data.district?.trim()) {
    errors.district = "District is required";
  } else if (
    !SRI_LANKAN_DISTRICTS.includes(data.district as (typeof SRI_LANKAN_DISTRICTS)[number])
  ) {
    errors.district = "Invalid district";
  }

  return errors;
}

// --- Sri Lankan Districts ---

export const SRI_LANKAN_DISTRICTS = [
  "Ampara",
  "Anuradhapura",
  "Badulla",
  "Batticaloa",
  "Colombo",
  "Galle",
  "Gampaha",
  "Hambantota",
  "Jaffna",
  "Kalutara",
  "Kandy",
  "Kegalle",
  "Kilinochchi",
  "Kurunegala",
  "Mannar",
  "Matale",
  "Matara",
  "Monaragala",
  "Mullaitivu",
  "Nuwara Eliya",
  "Polonnaruwa",
  "Puttalam",
  "Ratnapura",
  "Trincomalee",
  "Vavuniya",
] as const;
