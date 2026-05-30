/**
 * Flyer overlay text uses embedded Google fonts per role (see flyerTypeTheme.ts).
 * These system stacks are fallbacks for Cloudinary-only paths.
 */
export function getFlyerDisplayFont(): string {
  if (process.platform === "win32") {
    return "Segoe UI, Segoe UI Variable Text, Helvetica Neue, Arial, sans-serif";
  }
  if (process.platform === "darwin") {
    return "SF Pro Text, SF Pro Display, Helvetica Neue, Arial, sans-serif";
  }
  return "Helvetica Neue, Helvetica, Arial, sans-serif";
}

export function getFlyerHeadlineFont(): string {
  if (process.platform === "win32") {
    return "Segoe UI Semibold, Segoe UI, Arial Black, Helvetica Neue, sans-serif";
  }
  if (process.platform === "darwin") {
    return "SF Pro Display Semibold, SF Pro Display, Helvetica Neue, sans-serif";
  }
  return "Helvetica Neue, Helvetica, Arial Black, sans-serif";
}

export const CLOUDINARY_FLYER_FONT = "Poppins";

export function svgTextShadowFilter(id: string): string {
  return `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.7"/><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000000" flood-opacity="0.35"/></filter>`;
}

/** Strong shadow for headline text placed directly on the photo (no panel) */
export function svgHeadlineOnImageFilter(id: string): string {
  return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.9"/><feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#000000" flood-opacity="0.65"/><feDropShadow dx="0" dy="0" stdDeviation="1" flood-color="#000000" flood-opacity="0.5"/></filter>`;
}

export function svgHeadlineGlowFilter(id: string): string {
  return `<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#ffffff" flood-opacity="0.15"/></filter>`;
}
