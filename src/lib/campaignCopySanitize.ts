import {
  ensureBusinessNameAsHeadline,
  stripCampaignGoalFromFlyerCopy,
} from "./campaignGoalImageGuard";
import { ensureBusinessContactOnCopy } from "./businessContact";
import { stripColorCodesFromText } from "./flyerExactTextGuard";
import type { CampaignCopy } from "./campaignTextLayers";
import { clampCampaignCopy } from "./campaignCopyAi";
import { dedupeFlyerCtaCopy } from "./flyerCtaDedupe";
import type { BusinessProfile } from "./types";

const EMOJI_RE = /\p{Extended_Pictographic}/gu;
const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF\u2060]/g;
const CONTROL_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/** Characters that break SVG text layers or confuse Imagen */
const PROBLEMATIC_RE = /[<>{}[\]\\|`~^]/g;

function normalizeUnicode(input: string): string {
  return input.normalize("NFKC");
}

function straightQuotes(input: string): string {
  return input
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D\u2033]/g, '"');
}

/** Keep printable Latin + common punctuation for flyers */
function toFlyerSafeChars(input: string): string {
  return input.replace(/[^\x20-\x7E\u00A0-\u024F\u1E00-\u1EFF]/g, "");
}

function collapseWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function stripMetaWords(input: string): string {
  return input
    .replace(
      /\b(hex|rgb|rgba|hsl|pantone|colour code|color code|lorem ipsum|sample text|placeholder)\b/gi,
      ""
    )
    .replace(/\b(headline|tagline|cta|footer|logo zone)\s*:/gi, "");
}

function sanitizeLine(value: string, maxLen: number): string {
  let t = value || "";
  t = normalizeUnicode(t);
  t = straightQuotes(t);
  t = t.replace(ZERO_WIDTH_RE, "");
  t = t.replace(CONTROL_RE, "");
  t = t.replace(EMOJI_RE, "");
  t = stripColorCodesFromText(t);
  t = stripMetaWords(t);
  t = t.replace(PROBLEMATIC_RE, "");
  t = toFlyerSafeChars(t);
  t = collapseWhitespace(t);
  if (t.length > maxLen) {
    t = t.slice(0, maxLen).trim();
    const lastSpace = t.lastIndexOf(" ");
    if (lastSpace > maxLen * 0.6) t = t.slice(0, lastSpace);
  }
  return t;
}

/**
 * Pixel-perfect overlay text: ASCII-safe, no hex/meta, length-clamped.
 * Use on every flyer copy path before Sharp/Cloudinary or Imagen.
 */
export function sanitizeCampaignCopyForFlyer(
  copy: CampaignCopy,
  business?: BusinessProfile
): CampaignCopy {
  const clamped = clampCampaignCopy({
    headline: sanitizeLine(copy.headline, 72),
    tagline: sanitizeLine(copy.tagline, 90),
    cta: sanitizeLine(copy.cta, 28),
    location: sanitizeLine(copy.location, 60),
    contact: sanitizeLine(copy.contact, 80),
  });
  const deduped = dedupeFlyerCtaCopy(clamped, business);
  const withoutGoal = business
    ? stripCampaignGoalFromFlyerCopy(deduped, business)
    : deduped;
  const withName = business
    ? ensureBusinessNameAsHeadline(withoutGoal, business)
    : withoutGoal;
  return business ? ensureBusinessContactOnCopy(withName, business) : withName;
}

/** Validate copy is usable after sanitization */
export function assertFlyerCopyReady(
  copy: CampaignCopy,
  business?: BusinessProfile
): CampaignCopy {
  let clean = sanitizeCampaignCopyForFlyer(copy, business);
  if (business) clean = ensureBusinessContactOnCopy(clean, business);
  if (!clean.headline.trim()) {
    throw new Error("Flyer headline is empty after sanitization. Check business name in Step 1.");
  }
  return clean;
}
