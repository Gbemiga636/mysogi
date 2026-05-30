import { isCloudinaryConfigured } from "./cloudinary";

/** Flyer compose: sharp (local), cloudinary (legacy), hybrid (sharp + cloudinary CDN) */
export type FlyerComposeEngine = "sharp" | "cloudinary" | "hybrid";

/**
 * hybrid = AI typesets headline/CTA in-image + Sharp adds contact footer + logo
 * ai = Imagen renders copy in-image (less accurate text)
 * overlay = legacy text-free plate + full Sharp compose
 */
export type FlyerTextMode = "ai" | "overlay" | "hybrid";

export function getFlyerTextMode(): FlyerTextMode {
  const v = process.env.FLYER_TEXT_MODE?.trim().toLowerCase();
  if (v === "ai") return "ai";
  if (v === "overlay") return "overlay";
  return "hybrid";
}

export function isPixelPerfectFlyerText(): boolean {
  return getFlyerTextMode() !== "ai";
}

/**
 * Only FLYER_PREMIUM_HYBRID=true overlays headline/CTA via Sharp.
 * Default finished-design path typesets copy inside the AI image; Sharp adds contact footer + logo only.
 */
export function shouldCompositeFlyerCopyInSharp(): boolean {
  const v = process.env.FLYER_PREMIUM_HYBRID?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "on" || v === "hybrid";
}

export function getFlyerComposeEngine(): FlyerComposeEngine {
  if (getFlyerTextMode() === "ai") return "sharp"; // logo-only pass
  const v = process.env.FLYER_COMPOSE_ENGINE?.trim().toLowerCase();
  if (v === "cloudinary") return "cloudinary";
  if (v === "sharp") return "sharp";
  if (v === "hybrid") return "hybrid";
  if (isCloudinaryConfigured()) return "hybrid";
  return "sharp";
}

/** Logo overlay after AI text — Cloudinary preferred when configured */
export function getLogoComposeEngine(): "cloudinary" | "sharp" {
  const v = process.env.FLYER_LOGO_COMPOSE?.trim().toLowerCase();
  if (v === "sharp") return "sharp";
  if (v === "cloudinary") return "cloudinary";
  if (isCloudinaryConfigured()) return "cloudinary";
  return "sharp";
}

export function parseComposeError(error: unknown): string {
  const msg =
    error instanceof Error
      ? error.message
      : String((error as { message?: string })?.message ?? error);

  if (/Could not download the AI image/i.test(msg)) {
    return msg;
  }
  if (/Could not download image|Downloaded image was empty/i.test(msg)) {
    return "Could not download the generated image from the server. Try generating again.";
  }
  if (/Logo file is too large|Invalid image data/i.test(msg)) {
    return msg;
  }
  if (/sharp|Input buffer|ENOENT|EACCES/i.test(msg)) {
    return "Image processing failed. Try a smaller logo (under 2MB).";
  }
  if (/Cloudinary/i.test(msg)) {
    return msg;
  }
  return msg || "Flyer composition failed";
}
