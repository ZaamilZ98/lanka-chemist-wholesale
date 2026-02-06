"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Badge from "@/components/ui/Badge";
import ImageGallery from "./ImageGallery";
import QuantitySelector from "./QuantitySelector";
import RelatedProducts from "./RelatedProducts";
import ProductAlternatives from "./ProductAlternatives";
import RecentlyViewedProducts from "./RecentlyViewedProducts";
import SpcNotice from "./SpcNotice";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import Skeleton from "@/components/ui/Skeleton";
import { useCart } from "@/hooks/useCart";
import {
  DOSAGE_FORM_LABELS,
  PRODUCT_SECTION_LABELS,
} from "@/lib/constants";
import type { ProductDetail, ProductListItem } from "@/types/api";

interface ProductDetailClientProps {
  productId: string;
}

export default function ProductDetailClient({
  productId,
}: ProductDetailClientProps) {
  const { isAuthenticated, isApproved, isPending } = useAuth();
  const { addToCart } = useCart();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [related, setRelated] = useState<ProductListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError("");

    fetch(`/api/products/${productId}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => {
        setProduct(data.product);
        setRelated(data.related ?? []);
        // Track view for recently viewed products
        if (data.product?.id) {
          addToRecentlyViewed(data.product.id);
        }
      })
      .catch(() => {
        setError("Product not found");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [productId, addToRecentlyViewed]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <Skeleton className="h-4 w-48 mb-6" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-10 w-40 mt-6" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-300 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <p className="text-gray-600 font-medium">Product not found</p>
        <button
          onClick={() => router.push("/products")}
          className="mt-4 text-sm font-medium text-brand-green hover:text-brand-green-dark transition-colors"
        >
          Back to products
        </button>
      </div>
    );
  }

  const showWholesale = isAuthenticated;
  const inStock = product.stock_quantity > 0;
  const isSpc = product.section === "spc";
  const manufacturer = product.manufacturer as {
    id: string;
    name: string;
    slug: string;
    country: string | null;
  } | null;
  const category = product.category as {
    id: string;
    name: string;
    slug: string;
    section: string;
  } | null;

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    ...(category
      ? [
          {
            label: PRODUCT_SECTION_LABELS[product.section] || product.section,
            href: `/products?section=${product.section}`,
          },
          {
            label: category.name,
            href: `/products?section=${product.section}&category=${category.slug}`,
          },
        ]
      : []),
    { label: product.generic_name },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb items={breadcrumbs} />
      </div>

      {/* SPC notice */}
      {isSpc && (
        <div className="mb-6">
          <SpcNotice />
        </div>
      )}

      {/* Product detail */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Image gallery */}
        <ImageGallery
          images={product.images ?? []}
          productName={product.generic_name}
        />

        {/* Product info */}
        <div>
          {/* Badges */}
          <div className="flex gap-2 mb-3">
            <Badge variant={product.is_prescription ? "blue" : "green"}>
              {product.is_prescription ? "Prescription (Rx)" : "Over the Counter (OTC)"}
            </Badge>
            <Badge variant="gray">
              {PRODUCT_SECTION_LABELS[product.section] || product.section}
            </Badge>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            {product.generic_name}
          </h1>
          <p className="mt-1 text-base text-gray-500">
            {product.brand_name}
            {manufacturer && ` by ${manufacturer.name}`}
            {manufacturer?.country && ` (${manufacturer.country})`}
          </p>

          {/* Details */}
          <dl className="mt-4 space-y-2 text-sm">
            {product.strength && (
              <div className="flex gap-2">
                <dt className="text-gray-500 w-28 shrink-0">Strength:</dt>
                <dd className="text-gray-800">{product.strength}</dd>
              </div>
            )}
            {product.dosage_form && (
              <div className="flex gap-2">
                <dt className="text-gray-500 w-28 shrink-0">Dosage form:</dt>
                <dd className="text-gray-800">
                  {DOSAGE_FORM_LABELS[product.dosage_form] || product.dosage_form}
                </dd>
              </div>
            )}
            {product.pack_size && (
              <div className="flex gap-2">
                <dt className="text-gray-500 w-28 shrink-0">Pack size:</dt>
                <dd className="text-gray-800">{product.pack_size}</dd>
              </div>
            )}
            {product.sku && (
              <div className="flex gap-2">
                <dt className="text-gray-500 w-28 shrink-0">SKU:</dt>
                <dd className="text-gray-800 font-mono text-xs">{product.sku}</dd>
              </div>
            )}
            {product.barcode && (
              <div className="flex gap-2">
                <dt className="text-gray-500 w-28 shrink-0">Barcode:</dt>
                <dd className="text-gray-800 font-mono text-xs">{product.barcode}</dd>
              </div>
            )}
            {product.storage_conditions && (
              <div className="flex gap-2">
                <dt className="text-gray-500 w-28 shrink-0">Storage:</dt>
                <dd className="text-gray-800">{product.storage_conditions}</dd>
              </div>
            )}
          </dl>

          {/* Price */}
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            {isSpc ? (
              <div>
                <p className="text-base font-semibold text-brand-blue">
                  Contact us for pricing
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  SPC items require a minimum order of Rs 50,000
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {product.mrp && (
                  <p className="text-sm text-gray-500">
                    MRP: Rs {product.mrp.toLocaleString("en-LK")}
                  </p>
                )}
                {showWholesale ? (
                  <p className="text-xl font-bold text-brand-green">
                    Rs {product.wholesale_price.toLocaleString("en-LK")}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      wholesale
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    {isAuthenticated
                      ? "Wholesale price visible after account approval"
                      : "Sign in to see wholesale prices"}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Stock status */}
          <div className="mt-4">
            {inStock ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
                In stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
                Out of stock
              </span>
            )}
          </div>

          {/* Add to cart / login prompt */}
          <div className="mt-6">
            {!isAuthenticated ? (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-600 mb-3">
                  Sign in with your registered account to add items to cart and see wholesale prices.
                </p>
                <a
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-lg bg-brand-green px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-green-dark transition-colors"
                >
                  Sign in
                </a>
              </div>
            ) : isPending ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                  Your account is pending verification. You'll be able to place orders once approved.
                </p>
              </div>
            ) : isApproved && inStock && !isSpc ? (
              <div>
                <div className="flex items-end gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Quantity
                    </label>
                    <QuantitySelector
                      value={quantity}
                      max={product.stock_quantity}
                      onChange={setQuantity}
                    />
                  </div>
                  <button
                    onClick={async () => {
                      setAddingToCart(true);
                      setCartMessage(null);
                      const result = await addToCart(product.id, quantity);
                      if (result.error) {
                        setCartMessage({ type: "error", text: result.error });
                      } else {
                        setCartMessage({
                          type: "success",
                          text: `Added ${quantity} item${quantity > 1 ? "s" : ""} to cart`,
                        });
                        setQuantity(1);
                      }
                      setAddingToCart(false);
                    }}
                    disabled={addingToCart}
                    className="rounded-lg bg-brand-green px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {addingToCart ? "Adding..." : "Add to Cart"}
                  </button>
                </div>
                {cartMessage && (
                  <div
                    className={`mt-3 rounded-lg px-4 py-2.5 text-sm ${
                      cartMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {cartMessage.text}
                    {cartMessage.type === "success" && (
                      <>
                        {" "}
                        <a
                          href="/cart"
                          className="font-medium underline hover:no-underline"
                        >
                          View cart
                        </a>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">
                Description
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Product alternatives (shown when out of stock) */}
      {!inStock && (
        <ProductAlternatives
          productId={product.id}
          showWholesalePrice={showWholesale}
        />
      )}

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <RelatedProducts
            products={related}
            showWholesalePrice={showWholesale}
          />
        </div>
      )}

      {/* Recently viewed products */}
      <RecentlyViewedProducts
        currentProductId={product.id}
        showWholesalePrice={showWholesale}
      />
    </div>
  );
}
