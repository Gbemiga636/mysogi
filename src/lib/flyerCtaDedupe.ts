import { defaultTagline } from "./campaignTextLayers";
import type { CampaignCopy } from "./campaignTextLayers";
import type { BusinessProfile } from "./types";

const CTA_PHRASE_RE =
  /\b(shop\s*now|order\s*now|call\s*now|book\s*now|get\s*started|learn\s*more|sign\s*up|buy\s*now|visit\s*us|contact\s*us|click\s*here|join\s*now|reserve\s*now|order\s*today|call\s*today|dm\s*us|whatsapp\s*now)\b/gi;

function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripCtaPhrases(text: string, cta: string): string {
  let t = text;
  if (cta.trim()) {
    t = t.replace(new RegExp(escapeRegExp(cta.trim()), "gi"), "");
  }
  t = t.replace(CTA_PHRASE_RE, "");
  return t
    .replace(/\s*[-–—|,:]\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function looksLikeStandaloneCta(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  const words = t.split(/\s+/).length;
  return words <= 5 && CTA_PHRASE_RE.test(t);
}

/**
 * One CTA only — premium bar uses business.callToAction; tagline never repeats it.
 */
export function dedupeFlyerCtaCopy(
  copy: CampaignCopy,
  business?: BusinessProfile
): CampaignCopy {
  const canonicalCta = (
    business?.callToAction?.trim() ||
    copy.cta?.trim() ||
    "Get Started"
  ).slice(0, 28);

  let tagline = stripCtaPhrases(copy.tagline, canonicalCta);

  if (!tagline || normalizeKey(tagline) === normalizeKey(canonicalCta)) {
    tagline = business
      ? stripCtaPhrases(defaultTagline(business), canonicalCta)
      : "";
  }

  if (looksLikeStandaloneCta(tagline)) {
    tagline = business
      ? stripCtaPhrases(defaultTagline(business), canonicalCta)
      : "";
  }

  if (!tagline && business) {
    tagline = stripCtaPhrases(defaultTagline(business), canonicalCta);
  }

  return {
    ...copy,
    tagline,
    cta: canonicalCta,
  };
}
