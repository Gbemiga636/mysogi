import {
  buildBusinessContactParts,
  ensureBusinessContactOnCopy,
} from "./businessContact";
import type { CampaignCopy } from "./campaignTextLayers";
import type { BusinessProfile } from "./types";

/** Strip hex/rgb/hsl codes so Imagen cannot paint them as visible text */
const HEX_PATTERN = /#(?:[0-9A-Fa-f]{3,8})\b/g;
const RGB_PATTERN = /\brgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/gi;
const HSL_PATTERN = /\bhsla?\(\s*\d+/gi;

export const FLYER_ANTI_LOGO_BLOCK =
  "No pictorial brand marks or watermarks; top area stays photographic only.";

export const FLYER_ANTI_COLOR_CODE_BLOCK =
  "No hash symbols, digit codes, or swatch labels in the image.";

export const FLYER_ANTI_META_LABEL_BLOCK =
  "No designer notes or instruction words anywhere in the image.";

export function stripColorCodesFromText(text: string): string {
  return text
    .replace(HEX_PATTERN, "")
    .replace(RGB_PATTERN, "")
    .replace(HSL_PATTERN, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Final pass before Imagen — removes any hex that slipped in from business profile */
export function sanitizeExactTextFlyerPrompt(prompt: string): string {
  let p = stripColorCodesFromText(prompt);
  p = p.replace(/\b0x[0-9A-Fa-f]+\b/gi, "");
  p = p.replace(/\bPantone\s+\d+/gi, "");
  return p.replace(/\s{2,}/g, " ").trim();
}

export function buildExactTextVerticalLayout(): string {
  return [
    "Spacing: calm top strip, largest words in upper area, supporting words below that,",
    "photographic hero in middle, action phrase in pill shape mid-lower,",
    "address near bottom, contact at bottom edge, generous margins, no overlap.",
  ].join(" ");
}

function quote(s: string): string {
  return s.replace(/"/g, "'").trim();
}

export function buildTypographyPrecisionBlock(
  copy: CampaignCopy,
  business?: BusinessProfile
): string {
  const safe = business ? ensureBusinessContactOnCopy(copy, business) : copy;
  const contactParts = business ? buildBusinessContactParts(business) : null;
  const parts: string[] = [];
  const add = (text: string) => {
    const q = quote(text);
    if (q) parts.push(`Render exactly: ${q}`);
  };
  add(safe.headline);
  if (safe.tagline) add(safe.tagline);
  if (safe.cta) add(safe.cta);
  if (safe.location) add(safe.location);
  if (contactParts?.phone) add(contactParts.phone);
  if (contactParts?.email) add(contactParts.email);
  if (safe.contact) add(safe.contact);

  return [
    "Only these exact phrases may appear as visible writing in the design:",
    parts.join(" | "),
    "Phone and email must appear in the footer when provided. Premium sans-serif, high contrast, perfect spelling, no extra words.",
  ].join(" ");
}

export const FLYER_EXACT_TEXT_COMPLIANCE =
  "Writing limited to the exact phrases listed above; no other readable words.";

export function buildExactTextImagenSuffix(): string {
  return "FINAL: world-class agency flyer — creative campaign visuals + exact LINE copy only.";
}
