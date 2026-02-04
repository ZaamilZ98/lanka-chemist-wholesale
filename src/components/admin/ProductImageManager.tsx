"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import ConfirmDialog from "./ConfirmDialog";
import { MAX_PRODUCT_IMAGES, MAX_PRODUCT_IMAGE_SIZE, ALLOWED_PRODUCT_IMAGE_TYPES } from "@/lib/constants";

interface ProductImage {
  id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
}

interface Props {
  productId: string;
  images: ProductImage[];
  onImagesChanged: () => void;
}

export default function ProductImageManager({ productId, images, onImagesChanged }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ProductImage | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingAlt, setEditingAlt] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [reordering, setReordering] = useState(false);

  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const canUpload = images.length < MAX_PRODUCT_IMAGES;

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");

    if (!ALLOWED_PRODUCT_IMAGE_TYPES.includes(file.type)) {
      setUploadError("Only JPEG, PNG, and WebP images are allowed.");
      return;
    }
    if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
      setUploadError("Image must be under 5MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      onImagesChanged();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [productId, onImagesChanged]);

  async function handleSetPrimary(imageId: string) {
    try {
      await fetch(`/api/admin/products/${productId}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: [{ id: imageId, is_primary: true }],
        }),
      });
      onImagesChanged();
    } catch {
      // Silently fail — next refresh will show correct state
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `/api/admin/products/${productId}/images?imageId=${deleteTarget.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setDeleteTarget(null);
      onImagesChanged();
    } catch {
      // Keep dialog open on failure
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleSaveAltText(imageId: string) {
    try {
      await fetch(`/api/admin/products/${productId}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: [{ id: imageId, alt_text: altText || null }],
        }),
      });
      setEditingAlt(null);
      onImagesChanged();
    } catch {
      // Silently fail
    }
  }

  async function handleMove(imageId: string, direction: "up" | "down") {
    const idx = sorted.findIndex((img) => img.id === imageId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    setReordering(true);
    try {
      const updates = sorted.map((img, i) => {
        if (i === idx) return { id: img.id, sort_order: sorted[swapIdx].sort_order };
        if (i === swapIdx) return { id: img.id, sort_order: sorted[idx].sort_order };
        return { id: img.id, sort_order: img.sort_order };
      });

      await fetch(`/api/admin/products/${productId}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: updates }),
      });
      onImagesChanged();
    } catch {
      // Silently fail
    } finally {
      setReordering(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">
          Product Images
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({images.length}/{MAX_PRODUCT_IMAGES})
          </span>
        </h2>
        {canUpload && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              loading={uploading}
            >
              {uploading ? "Uploading..." : "Upload Image"}
            </Button>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {uploadError}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="text-center py-8">
          <svg
            className="mx-auto h-10 w-10 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">
            No images yet. Upload your first product image.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {sorted.map((img, idx) => (
            <div
              key={img.id}
              className="group relative rounded-lg border border-gray-200 bg-gray-50 overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="relative aspect-square">
                <Image
                  src={img.url}
                  alt={img.alt_text || "Product image"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                />
                {/* Primary badge */}
                {img.is_primary && (
                  <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Primary
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="p-2 space-y-1.5">
                {/* Alt text */}
                {editingAlt === img.id ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      placeholder="Alt text..."
                      className="flex-1 min-w-0 rounded border border-gray-300 px-1.5 py-0.5 text-xs focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveAltText(img.id);
                        if (e.key === "Escape") setEditingAlt(null);
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveAltText(img.id)}
                      className="rounded bg-brand-green px-1.5 py-0.5 text-xs text-white hover:bg-brand-green-dark"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAlt(img.id);
                      setAltText(img.alt_text || "");
                    }}
                    className="w-full text-left text-xs text-gray-500 hover:text-gray-700 truncate"
                    title={img.alt_text || "Add alt text"}
                  >
                    {img.alt_text || "Add alt text..."}
                  </button>
                )}

                {/* Action buttons row */}
                <div className="flex items-center gap-1">
                  {/* Move up */}
                  <button
                    type="button"
                    disabled={idx === 0 || reordering}
                    onClick={() => handleMove(img.id, "up")}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  {/* Move down */}
                  <button
                    type="button"
                    disabled={idx === sorted.length - 1 || reordering}
                    onClick={() => handleMove(img.id, "down")}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div className="flex-1" />

                  {/* Set as primary */}
                  {!img.is_primary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(img.id)}
                      className="rounded p-1 text-gray-400 hover:bg-amber-50 hover:text-amber-600"
                      title="Set as primary"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(img)}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete image"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => { if (!deleteLoading) setDeleteTarget(null); }}
      />
    </div>
  );
}
