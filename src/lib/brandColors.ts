import type { BusinessProfile } from "./types";

const HEX_RE = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;

const DEFAULT_PRIMARY = "#0B1F3A";
const DEFAULT_SECONDARY = "#F26522";

function normalizeHex(hex: string, fallback: string): string {
  const t = hex.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(t)) {
    const h = t.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toUpperCase();
  }
  return fallback;
}

/** Extract up to two hex codes from legacy brandColors string */
function parseLegacyBrandColors(brandColors: string): {
  primary: string;
  secondary: string;
} {
  const matches = [...brandColors.matchAll(HEX_RE)].map((m) =>
    normalizeHex(m[0], DEFAULT_PRIMARY)
  );
  return {
    primary: matches[0] ?? DEFAULT_PRIMARY,
    secondary: matches[1] ?? matches[0] ?? DEFAULT_SECONDARY,
  };
}

export function getBrandPrimary(business: BusinessProfile): string {
  if (business.brandPrimary?.trim()) {
    return normalizeHex(business.brandPrimary, DEFAULT_PRIMARY);
  }
  return parseLegacyBrandColors(business.brandColors || "").primary;
}

export function getBrandSecondary(business: BusinessProfile): string {
  if (business.brandSecondary?.trim()) {
    return normalizeHex(business.brandSecondary, DEFAULT_SECONDARY);
  }
  return parseLegacyBrandColors(business.brandColors || "").secondary;
}

/** Sync legacy string field from pickers */
export function syncBrandColorsString(
  primary: string,
  secondary: string
): string {
  const p = normalizeHex(primary, DEFAULT_PRIMARY);
  const s = normalizeHex(secondary, DEFAULT_SECONDARY);
  return `${p}, ${s}`;
}

/** Describe hex as a color name only — safe for Imagen (no # codes in image) */
export function describeHexAsVisualColor(hex: string): string {
  const n = normalizeHex(hex, DEFAULT_PRIMARY).slice(1);
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2 / 255;

  if (max - min < 18) {
    if (l < 0.2) return "charcoal black";
    if (l > 0.82) return "soft white";
    return "neutral gray";
  }

  let family = "neutral";
  if (r >= g && r >= b) {
    if (g > b * 1.15 && g > 100) family = "warm orange";
    else if (b > g * 1.1) family = "magenta";
    else family = "red";
  } else if (g >= r && g >= b) {
    family = b > r ? "teal" : "green";
  } else {
    family = r > g * 1.1 ? "purple" : "blue";
  }

  const weight =
    l < 0.28 ? "deep" : l < 0.5 ? "rich" : l < 0.72 ? "vivid" : "light";
  return `${weight} ${family}`;
}

/** Visual palette for Imagen exact-text flyers — never includes hex strings */
export function formatBrandPaletteForImagenVisual(
  business: BusinessProfile
): string {
  const primary = describeHexAsVisualColor(getBrandPrimary(business));
  const secondary = describeHexAsVisualColor(getBrandSecondary(business));
  const ind = (business.industry || "").toLowerCase();

  if (/food|restaurant|catering|bakery/.test(ind)) {
    return `warm appetizing grading with ${primary} shadows and ${secondary} accent highlights, golden food tones`;
  }
  if (/fashion|beauty|cosmetic|salon/.test(ind)) {
    return `elegant ${primary} atmosphere with luxurious ${secondary} accent lighting, editorial beauty campaign`;
  }
  if (/real estate|property/.test(ind)) {
    return `sophisticated ${primary} and ${secondary} luxury property color grading, golden hour`;
  }
  if (/health|medical|wellness|clinic/.test(ind)) {
    return `clean trustworthy ${primary} with calming ${secondary} healthcare aesthetic`;
  }
  if (/crypto|fintech|tech|software|saas/.test(ind)) {
    return `sleek digital look: ${primary} depth with glowing ${secondary} rim lights and gradients`;
  }
  return `professional campaign grading: ${primary} dominant with ${secondary} accent highlights`;
}

/** Human + hex description for image prompts — tuned per industry */
export function formatBrandPaletteForPrompt(business: BusinessProfile): string {
  const primary = getBrandPrimary(business);
  const secondary = getBrandSecondary(business);
  const ind = (business.industry || "").toLowerCase();

  if (/food|restaurant|catering|bakery/.test(ind)) {
    return `warm appetizing palette dominated by ${primary} with rich ${secondary} accent highlights, golden food photography tones`;
  }
  if (/fashion|beauty|cosmetic|salon/.test(ind)) {
    return `elegant ${primary} backdrop with luxurious ${secondary} accent lighting, editorial beauty campaign colors`;
  }
  if (/real estate|property/.test(ind)) {
    return `sophisticated ${primary} and ${secondary} tones, golden hour luxury property color grading`;
  }
  if (/health|medical|wellness|clinic/.test(ind)) {
    return `clean trustworthy ${primary} and calming ${secondary} healthcare brand colors`;
  }
  if (/crypto|fintech|tech|software|saas/.test(ind)) {
    return `glowing digital accents in ${primary} and ${secondary}, neon rim lights, sleek gradient blends between deep ${primary} shadows and vibrant ${secondary} highlights`;
  }
  return `professional brand colors ${primary} and ${secondary}, cohesive campaign color grading with ${primary} shadows and ${secondary} accent highlights`;
}

/** Cloudinary background param (no #) */
export function cloudinaryColor(hex: string): string {
  return hex.replace(/^#/, "");
}
