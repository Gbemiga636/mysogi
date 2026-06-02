/**
 * Default: Cloudinary horizontal footer (phone · email · website) — AI never renders contact.
 * Set FLYER_SVG_FOOTER=true to use Sharp/SVG footer instead of Cloudinary.
 */
export function isSvgFlyerFooterMode(): boolean {
  return process.env.FLYER_SVG_FOOTER?.trim().toLowerCase() === "true";
}
