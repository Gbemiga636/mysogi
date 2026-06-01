/**
 * SVG footer overlay is OFF by default — all text (including contact) is rendered in the AI image.
 * Set FLYER_SVG_FOOTER=true only to restore legacy Sharp/SVG contact footer.
 */
export function isSvgFlyerFooterMode(): boolean {
  return process.env.FLYER_SVG_FOOTER?.trim().toLowerCase() === "true";
}
