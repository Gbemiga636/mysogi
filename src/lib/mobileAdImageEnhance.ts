import sharp from "sharp";

/**
 * Light polish on AI base image before logo-only compose (no SVG typography).
 */
export async function enhanceMobileAdBaseImage(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .modulate({ brightness: 1.03, saturation: 1.06 })
      .sharpen({ sigma: 0.65, m1: 0.5, m2: 0.35 })
      .jpeg({ quality: 94, mozjpeg: true })
      .toBuffer();
  } catch {
    return buffer;
  }
}
