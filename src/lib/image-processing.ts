import sharp from "sharp";

interface ProcessedImage {
  buffer: Buffer;
  contentType: string;
}

/**
 * Process a product image: resize, watermark, and optimize.
 *
 * - Resize to max 1200px wide (maintain aspect, no upscaling)
 * - Apply semi-transparent "Lanka Chemist" watermark in bottom-right
 * - JPEG output at quality 85, or PNG if input is PNG
 */
export async function processProductImage(
  buffer: Buffer,
  mimeType: string,
): Promise<ProcessedImage> {
  const isPng = mimeType === "image/png";

  // Get original metadata to know dimensions
  const meta = await sharp(buffer).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  // Resize to max 1200px wide (no upscaling)
  let pipeline = sharp(buffer).resize({
    width: Math.min(width, 1200),
    withoutEnlargement: true,
  });

  // Build watermark SVG — scale relative to output width
  const outputWidth = Math.min(width, 1200);
  const outputHeight =
    width > 1200 ? Math.round((height * 1200) / width) : height;
  const fontSize = Math.max(16, Math.round(outputWidth * 0.028));
  const paddingRight = Math.round(outputWidth * 0.02);
  const paddingBottom = Math.round(outputHeight * 0.025);

  const watermarkSvg = Buffer.from(
    `<svg width="${outputWidth}" height="${outputHeight}">
      <text
        x="${outputWidth - paddingRight}"
        y="${outputHeight - paddingBottom}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="white"
        fill-opacity="0.55"
        text-anchor="end"
        dominant-baseline="auto"
      >Lanka Chemist</text>
    </svg>`,
  );

  pipeline = pipeline.composite([
    { input: watermarkSvg, gravity: "southeast" },
  ]);

  // Output format
  if (isPng) {
    pipeline = pipeline.png({ quality: 85, compressionLevel: 8 });
  } else {
    pipeline = pipeline.jpeg({ quality: 85, mozjpeg: true });
  }

  const outputBuffer = await pipeline.toBuffer();

  return {
    buffer: outputBuffer,
    contentType: isPng ? "image/png" : "image/jpeg",
  };
}
