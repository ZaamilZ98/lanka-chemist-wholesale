import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES, ALLOWED_IMAGE_EXTENSIONS } from "@/lib/constants";
import { checkFileMagicBytes } from "@/lib/validate";
import crypto from "crypto";

// Map MIME type to safe extension (never trust user-provided extension)
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and PDF files are allowed" },
        { status: 400 },
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be under 5MB" },
        { status: 400 },
      );
    }

    // Read buffer and validate magic bytes
    const buffer = await file.arrayBuffer();
    if (!checkFileMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "File content does not match its declared type" },
        { status: 400 },
      );
    }

    // Generate unique filename — derive extension from validated MIME, not user filename
    const ext = MIME_TO_EXT[file.type] || "bin";
    const uuid = crypto.randomUUID();
    const key = `uploads/${uuid}.${ext}`;

    // Upload to R2
    const r2 = getR2Client();
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: Buffer.from(buffer),
        ContentType: file.type,
      }),
    );

    const url = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : key;

    return NextResponse.json(
      {
        url,
        key,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}
