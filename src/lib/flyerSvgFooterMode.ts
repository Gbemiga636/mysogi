/**
 * When true: phone, email, website, and location are composited via SVG at the bottom.
 * Headline / CTA remain in the AI image (finished-design path).
 */
export function isSvgFlyerFooterMode(): boolean {
  if (process.env.FLYER_SVG_FOOTER?.trim().toLowerCase() === "false") {
    return false;
  }
  if (process.env.FLYER_SVG_FOOTER?.trim().toLowerCase() === "true") {
    return true;
  }
  const finished =
    process.env.FLYER_FINISHED_DESIGN?.trim().toLowerCase() !== "false";
  const hybrid =
    process.env.FLYER_PREMIUM_HYBRID?.trim().toLowerCase() === "true";
  return finished && !hybrid;
}
