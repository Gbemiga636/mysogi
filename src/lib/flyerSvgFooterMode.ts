/**
 * Sharp/SVG contact footer (default) — exact Step 1 phone/email/website after AI.
 * Set FLYER_CLOUDINARY_FOOTER=true to use Cloudinary text instead.
 */
export function isSvgFlyerFooterMode(): boolean {
  const flag = process.env.FLYER_SVG_FOOTER?.trim().toLowerCase();
  if (flag === "false" || flag === "0" || flag === "off") return false;
  if (flag === "true" || flag === "1" || flag === "on") return true;
  const cloudinary = process.env.FLYER_CLOUDINARY_FOOTER?.trim().toLowerCase();
  if (cloudinary === "true" || cloudinary === "1" || cloudinary === "on") {
    return false;
  }
  return true;
}
