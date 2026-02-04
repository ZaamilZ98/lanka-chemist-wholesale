import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { getR2Client, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { processProductImage } from "@/lib/image-processing";
import {
  MAX_PRODUCT_IMAGE_SIZE,
  MAX_PRODUCT_IMAGES,
  ALLOWED_PRODUCT_IMAGE_TYPES,
} from "@/lib/constants";
import crypto from "crypto";

// WebP magic bytes: RIFF....WEBP
function checkProductImageMagicBytes(
  buffer: ArrayBuffer,
  declaredType: string,
): boolean {
  const bytes = new Uint8Array(buffer);
  switch (declaredType) {
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return (
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47
      );
    case "image/webp":
      return (
        bytes[0] === 0x52 && // R
        bytes[1] === 0x49 && // I
        bytes[2] === 0x46 && // F
        bytes[3] === 0x46 && // F
        bytes[8] === 0x57 && // W
        bytes[9] === 0x45 && // E
        bytes[10] === 0x42 && // B
        bytes[11] === 0x50 // P
      );
    default:
      return false;
  }
}

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** POST: Upload a new product image */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: productId } = await params;
    const supabase = createServerClient();

    // Verify product exists
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .single();

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    // Check current image count
    const { count } = await supabase
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);

    if ((count ?? 0) >= MAX_PRODUCT_IMAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PRODUCT_IMAGES} images per product` },
        { status: 400 },
      );
    }

    // Parse form data
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Request must be multipart/form-data" },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 },
      );
    }

    // Validate MIME type
    if (!ALLOWED_PRODUCT_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP images are allowed" },
        { status: 400 },
      );
    }

    // Validate size
    if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
      return NextResponse.json(
        { error: "Image must be under 5MB" },
        { status: 400 },
      );
    }

    // Read buffer and validate magic bytes
    const arrayBuffer = await file.arrayBuffer();
    if (!checkProductImageMagicBytes(arrayBuffer, file.type)) {
      return NextResponse.json(
        { error: "File content does not match its declared type" },
        { status: 400 },
      );
    }

    // Process image (resize, watermark, optimize)
    const processed = await processProductImage(
      Buffer.from(arrayBuffer),
      file.type,
    );

    // Upload to R2
    const ext =
      MIME_TO_EXT[processed.contentType] || MIME_TO_EXT[file.type] || "jpg";
    const uuid = crypto.randomUUID();
    const key = `products/${productId}/${uuid}.${ext}`;

    const r2 = getR2Client();
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: processed.buffer,
        ContentType: processed.contentType,
      }),
    );

    const url = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : key;

    // Determine sort_order and is_primary
    const { data: maxSortRow } = await supabase
      .from("product_images")
      .select("sort_order")
      .eq("product_id", productId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const nextSort = maxSortRow ? maxSortRow.sort_order + 1 : 0;
    const isPrimary = (count ?? 0) === 0; // first image is primary

    // Insert DB record
    const { data: image, error: insertError } = await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        url,
        alt_text: null,
        is_primary: isPrimary,
        sort_order: nextSort,
      })
      .select("id, url, alt_text, is_primary, sort_order")
      .single();

    if (insertError || !image) {
      console.error("Product image insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save image record" },
        { status: 500 },
      );
    }

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error("Product image upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}

/** PATCH: Batch update image metadata (reorder, set primary, alt_text) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: productId } = await params;
    const body = await request.json();
    const images = body.images as
      | {
          id: string;
          sort_order?: number;
          is_primary?: boolean;
          alt_text?: string | null;
        }[]
      | undefined;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "images array is required" },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    // Ensure only one primary
    const primaryCount = images.filter((img) => img.is_primary === true).length;
    if (primaryCount > 1) {
      return NextResponse.json(
        { error: "Only one image can be primary" },
        { status: 400 },
      );
    }

    // If one is set as primary, unset all others first
    if (primaryCount === 1) {
      await supabase
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", productId);
    }

    // Update each image
    for (const img of images) {
      const updateData: Record<string, unknown> = {};
      if (img.sort_order !== undefined) updateData.sort_order = img.sort_order;
      if (img.is_primary !== undefined) updateData.is_primary = img.is_primary;
      if (img.alt_text !== undefined) updateData.alt_text = img.alt_text;

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from("product_images")
          .update(updateData)
          .eq("id", img.id)
          .eq("product_id", productId);
      }
    }

    // Return updated images
    const { data: updatedImages } = await supabase
      .from("product_images")
      .select("id, url, alt_text, is_primary, sort_order")
      .eq("product_id", productId)
      .order("sort_order");

    return NextResponse.json({ images: updatedImages ?? [] });
  } catch (error) {
    console.error("Image metadata update error:", error);
    return NextResponse.json(
      { error: "Failed to update images" },
      { status: 500 },
    );
  }
}

/** DELETE: Remove a product image */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: productId } = await params;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("imageId");

    if (!imageId) {
      return NextResponse.json(
        { error: "imageId query parameter is required" },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    // Fetch the image to get URL and check primary status
    const { data: image } = await supabase
      .from("product_images")
      .select("id, url, is_primary")
      .eq("id", imageId)
      .eq("product_id", productId)
      .single();

    if (!image) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 },
      );
    }

    // Delete DB record
    const { error: deleteError } = await supabase
      .from("product_images")
      .delete()
      .eq("id", imageId);

    if (deleteError) {
      console.error("Image delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete image" },
        { status: 500 },
      );
    }

    // If deleted image was primary, set the next image as primary
    if (image.is_primary) {
      const { data: nextImage } = await supabase
        .from("product_images")
        .select("id")
        .eq("product_id", productId)
        .order("sort_order")
        .limit(1)
        .single();

      if (nextImage) {
        await supabase
          .from("product_images")
          .update({ is_primary: true })
          .eq("id", nextImage.id);
      }
    }

    // Best-effort R2 deletion (non-blocking)
    try {
      const urlPath = image.url;
      // Extract R2 key from URL
      const key = R2_PUBLIC_URL && urlPath.startsWith(R2_PUBLIC_URL)
        ? urlPath.slice(R2_PUBLIC_URL.length + 1)
        : urlPath;

      if (key.startsWith("products/")) {
        const r2 = getR2Client();
        r2.send(
          new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }),
        ).catch((err) => console.error("R2 delete error:", err));
      }
    } catch {
      // Non-blocking — R2 cleanup failures are not critical
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Image delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 },
    );
  }
}
