import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { createServerClient } from "@/lib/supabase/server";
import PickingListPrintView from "@/components/admin/PickingListPrintView";

export const metadata: Metadata = {
  title: "Picking List",
};

async function getAdminFromCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("lc_admin_token")?.value;
  if (!token) return false;
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return false;
    jwt.verify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export default async function PickingListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const isAdmin = await getAdminFromCookie();
  if (!isAdmin) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const supabase = createServerClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `id, order_number, created_at, status,
       customers(contact_name, business_name),
       order_items(id, product_name, product_generic_name, product_sku, quantity)`,
    )
    .eq("id", id)
    .single();

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">Order not found</p>
          <a
            href="/admin/orders"
            className="mt-4 inline-block text-sm text-brand-green hover:underline"
          >
            Back to Orders
          </a>
        </div>
      </div>
    );
  }

  const customer = order.customers as unknown as {
    contact_name: string;
    business_name: string | null;
  } | null;

  const items = (order.order_items as unknown as {
    id: string;
    product_name: string;
    product_generic_name: string | null;
    product_sku: string | null;
    quantity: number;
  }[]) ?? [];

  return (
    <PickingListPrintView
      order={{
        order_number: order.order_number,
        created_at: order.created_at,
        customer_name: customer?.contact_name ?? "Unknown",
        customer_business: customer?.business_name ?? null,
        items,
      }}
    />
  );
}
