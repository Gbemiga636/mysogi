import { hasBusinessContact } from "./businessContactCore";
import { isCloudinaryConfigured } from "./cloudinaryEnv";

function isSvgFlyerFooterEnv(): boolean {
  return process.env.FLYER_SVG_FOOTER?.trim().toLowerCase() === "true";
}

function isCloudinaryFooterEnv(): boolean {
  if (isSvgFlyerFooterEnv()) return false;
  const flag = process.env.FLYER_CLOUDINARY_FOOTER?.trim().toLowerCase();
  if (flag !== "true" && flag !== "1" && flag !== "on") return false;
  return isCloudinaryConfigured();
}

/**
 * When true, the image model tries to paint contact (often wrong digits/URLs).
 * Default false — Mysogi burns exact Step 1 phone/email/website into the final PNG.
 */
export function shouldPaintContactInAiImage(): boolean {
  return process.env.FLYER_EXACT_CONTACT_IN_AI?.trim().toLowerCase() === "true";
}

/** Pixel-perfect Step 1 contact on the finished flyer (Sharp SVG by default). */
export function shouldUseExactContactFooterCompose(): boolean {
  if (shouldPaintContactInAiImage()) return false;
  const v = process.env.FLYER_EXACT_CONTACT_FOOTER?.trim().toLowerCase();
  if (v === "false" || v === "0" || v === "off") return false;
  return true;
}

/** AI must not render any phone/email/website — exact values added after generation. */
export function shouldForbidContactInAiImage(): boolean {
  if (shouldPaintContactInAiImage()) return false;
  return shouldUseFooterOverlayCompose();
}

export function shouldUseFooterOverlayCompose(): boolean {
  const v = process.env.FLYER_FOOTER_OVERLAY?.trim().toLowerCase();
  if (v === "false" || v === "0" || v === "off") return false;
  if (v === "true" || v === "1" || v === "on") return true;
  if (isCloudinaryFooterEnv()) return true;
  if (isSvgFlyerFooterEnv()) return true;
  return shouldUseExactContactFooterCompose();
}

export function businessHasExactContactFields(business: {
  phone?: string;
  email?: string;
  website?: string;
}): boolean {
  return hasBusinessContact(business as import("./types").BusinessProfile);
}
