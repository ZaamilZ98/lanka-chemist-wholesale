import { createServerClient } from "@/lib/supabase/server";

export interface StoreSettings {
  store_name: string;
  store_phone: string;
  store_email: string;
  store_address: string;
  nmra_license_number: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_branch: string;
  admin_email: string;
}

const SETTINGS_KEYS = [
  "store_name",
  "store_phone",
  "store_email",
  "store_address",
  "nmra_license_number",
  "bank_name",
  "bank_account_name",
  "bank_account_number",
  "bank_branch",
  "admin_email",
];

export async function getStoreSettings(): Promise<StoreSettings> {
  const supabase = createServerClient();

  const { data } = await supabase
    .from("store_settings")
    .select("key, value")
    .in("key", SETTINGS_KEYS);

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.key] = row.value ?? "";
  }

  return {
    store_name: map.store_name || "Lanka Chemist Wholesale",
    store_phone: map.store_phone || "",
    store_email: map.store_email || "",
    store_address: map.store_address || "",
    nmra_license_number: map.nmra_license_number || "",
    bank_name: map.bank_name || "",
    bank_account_name: map.bank_account_name || "",
    bank_account_number: map.bank_account_number || "",
    bank_branch: map.bank_branch || "",
    admin_email: map.admin_email || "",
  };
}
