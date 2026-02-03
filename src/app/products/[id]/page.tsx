import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import ProductDetailClient from "@/components/products/ProductDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const supabase = createServerClient();
    const { data: product } = await supabase
      .from("products")
      .select("generic_name, brand_name, strength, dosage_form")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (product) {
      const parts = [
        product.generic_name,
        product.brand_name,
        product.strength,
      ].filter(Boolean);

      return {
        title: `${parts.join(" — ")} — Lanka Chemist Wholesale`,
        description: `Buy ${product.generic_name} (${product.brand_name}) wholesale from Lanka Chemist. ${product.strength || ""} ${product.dosage_form || ""}`.trim(),
      };
    }
  } catch {
    // Fall through to default
  }

  return {
    title: "Product — Lanka Chemist Wholesale",
    description: "View product details at Lanka Chemist Wholesale.",
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  return <ProductDetailClient productId={id} />;
}
