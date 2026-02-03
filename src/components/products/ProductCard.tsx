import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { DOSAGE_FORM_LABELS } from "@/lib/constants";
import type { ProductListItem } from "@/types/api";

interface ProductCardProps {
  product: ProductListItem;
  showWholesalePrice?: boolean;
}

export default function ProductCard({
  product,
  showWholesalePrice = false,
}: ProductCardProps) {
  const primaryImage = product.images?.find((img) => img.is_primary) ??
    product.images?.[0];
  const inStock = product.stock_quantity > 0;
  const isSpc = product.section === "spc";

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={primaryImage.alt_text || product.generic_name}
            className="h-full w-full object-contain p-4 transition-transform group-hover:scale-105"
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

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <Badge variant={product.is_prescription ? "blue" : "green"}>
            {product.is_prescription ? "Rx" : "OTC"}
          </Badge>
        </div>

        {!inStock && (
          <div className="absolute top-2 right-2">
            <Badge variant="red">Out of stock</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5">
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-1 group-hover:text-brand-green transition-colors">
          {product.generic_name}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
          {product.brand_name}
          {product.manufacturer && ` — ${product.manufacturer.name}`}
        </p>

        {/* Strength + form */}
        {(product.strength || product.dosage_form) && (
          <p className="mt-1 text-xs text-gray-500">
            {[
              product.strength,
              product.dosage_form
                ? DOSAGE_FORM_LABELS[product.dosage_form] || product.dosage_form
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        {product.pack_size && (
          <p className="text-xs text-gray-400 mt-0.5">{product.pack_size}</p>
        )}

        {/* Price */}
        <div className="mt-auto pt-2.5">
          {isSpc ? (
            <p className="text-sm font-medium text-brand-blue">Contact us</p>
          ) : (
            <>
              {product.mrp && (
                <p className="text-xs text-gray-400">
                  MRP Rs {product.mrp.toLocaleString("en-LK")}
                </p>
              )}
              {showWholesalePrice && (
                <p className="text-sm font-bold text-brand-green">
                  Rs {product.wholesale_price.toLocaleString("en-LK")}
                </p>
              )}
            </>
          )}
        </div>

        {/* Stock status */}
        <div className="mt-1.5">
          {inStock ? (
            <span className="text-xs text-emerald-600">In stock</span>
          ) : (
            <span className="text-xs text-red-500">Out of stock</span>
          )}
        </div>
      </div>
    </Link>
  );
}
