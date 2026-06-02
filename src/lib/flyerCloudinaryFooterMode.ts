import { isCloudinaryConfigured } from "./cloudinaryEnv";

export {
  shouldPaintContactInAiImage,
  shouldUseExactContactFooterCompose,
  shouldForbidContactInAiImage,
  businessHasExactContactFields,
  shouldUseFooterOverlayCompose,
} from "./flyerExactContactMode";

/**
 * Optional Cloudinary text footer (off by default).
 * Enable with FLYER_CLOUDINARY_FOOTER=true when CLOUDINARY_URL is set.
 */
export function isCloudinaryFooterOverlayEnabled(): boolean {
  const v = process.env.FLYER_SVG_FOOTER?.trim().toLowerCase();
  if (v === "true" || v === "1" || v === "on") return false;
  const flag = process.env.FLYER_CLOUDINARY_FOOTER?.trim().toLowerCase();
  if (flag !== "true" && flag !== "1" && flag !== "on") return false;
  return isCloudinaryConfigured();
}

export function isSvgFlyerFooterMode(): boolean {
  return process.env.FLYER_SVG_FOOTER?.trim().toLowerCase() === "true";
}
