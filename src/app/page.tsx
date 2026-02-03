import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { PRODUCT_SECTION_LABELS } from "@/lib/constants";
import type { ProductSection } from "@/types/database";

async function getFeaturedProducts() {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("products")
      .select(
        `
        id, generic_name, brand_name, strength, dosage_form, pack_size,
        wholesale_price, mrp, stock_quantity, is_prescription, section,
        manufacturer:manufacturers(id, name, slug),
        images:product_images(id, url, alt_text, is_primary, sort_order)
      `,
      )
      .eq("is_active", true)
      .eq("is_visible", true)
      .gt("stock_quantity", 0)
      .order("total_sold", { ascending: false })
      .limit(8);

    return data ?? [];
  } catch {
    return [];
  }
}

async function getCategoryCounts() {
  try {
    const supabase = createServerClient();
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name, slug, section, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    return categories ?? [];
  } catch {
    return [];
  }
}

const SECTION_ICONS: Record<ProductSection, React.ReactNode> = {
  medicines: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  ),
  surgical: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1-5.1a3 3 0 114.24-4.24l5.1 5.1m-6.36 6.36l6.36-6.36m0 0l5.1 5.1a3 3 0 11-4.24 4.24l-5.1-5.1m6.36-6.36L17.3 3.87a2.12 2.12 0 013 3l-3.17 3.17" />
    </svg>
  ),
  equipment: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V15m0 0l-2.25-1.313M3 16.5v2.25M21 16.5v2.25M12 15l-2.25 1.313M12 15l2.25 1.313" />
    </svg>
  ),
  spc: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
};

export default async function Home() {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategoryCounts(),
  ]);

  // Group categories by section
  const sections = ["medicines", "surgical", "equipment", "spc"] as const;

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-brand-blue overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-brand-green-light text-sm font-medium tracking-wide uppercase mb-3">
              B2B Wholesale Pharmacy
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Quality Pharmaceuticals for Healthcare Professionals
            </h1>
            <p className="mt-4 text-base sm:text-lg text-blue-100 leading-relaxed max-w-xl">
              Your trusted wholesale supplier for medicines, surgical items, and medical equipment. Registered SLMC practitioners and healthcare businesses only.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-lg bg-brand-green px-6 py-3 text-sm font-semibold text-white hover:bg-brand-green-dark transition-colors"
              >
                Browse Products
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
              >
                Register Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sections grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Shop by Section
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {sections.map((sec) => {
            const catCount = categories.filter((c) => c.section === sec).length;
            return (
              <Link
                key={sec}
                href={`/products?section=${sec}`}
                className="group flex flex-col items-center rounded-lg border border-gray-200 bg-white p-5 text-center transition-all hover:shadow-md hover:border-brand-green/30"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-green-light text-brand-green group-hover:bg-brand-green group-hover:text-white transition-colors">
                  {SECTION_ICONS[sec]}
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-900">
                  {PRODUCT_SECTION_LABELS[sec]}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {catCount} {catCount === 1 ? "category" : "categories"}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Popular Products
            </h2>
            <Link
              href="/products?sort=popular"
              className="text-sm font-medium text-brand-green hover:text-brand-green-dark transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.slice(0, 4).map((p) => {
              const images = p.images as unknown as { url: string; is_primary: boolean }[] | null;
              const mfr = p.manufacturer as unknown as { name: string } | null;
              const primaryImg = images?.find((img) => img.is_primary) ?? images?.[0];
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="group flex flex-col rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md overflow-hidden"
                >
                  <div className="relative aspect-square bg-gray-50">
                    {primaryImg ? (
                      <img
                        src={primaryImg.url}
                        alt={p.generic_name}
                        className="h-full w-full object-contain p-4"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <svg
                          className="h-16 w-16"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3.5">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-brand-green transition-colors">
                      {p.generic_name}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                      {p.brand_name}
                      {mfr && ` — ${mfr.name}`}
                    </p>
                    {p.mrp && (
                      <p className="mt-1.5 text-xs text-gray-400">
                        MRP Rs {p.mrp.toLocaleString("en-LK")}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="bg-white border-t border-gray-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Browse by Category
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?section=${cat.section}&category=${cat.slug}`}
                  className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-brand-green/30 hover:text-brand-green hover:bg-brand-green-light/50 transition-all"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-brand-green-light/50 border-t border-brand-green/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 text-center">
          <h2 className="text-xl font-bold text-gray-900">
            Ready to place an order?
          </h2>
          <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
            Register your medical practice or pharmacy to access wholesale prices and start ordering.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-lg bg-brand-green px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-dark transition-colors"
            >
              Browse All Products
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
