import { buildBusinessContactLine } from "./businessContact";
import {
  ensureBusinessNameAsHeadline,
  getBusinessNameHeadline,
  stripCampaignGoalFromFlyerCopy,
} from "./campaignGoalImageGuard";
import { stripColorCodesFromText } from "./flyerExactTextGuard";
import type { CampaignCopy } from "./campaignTextLayers";
import { buildCampaignCopy } from "./campaignTextLayers";
import type { BusinessProfile } from "./types";

function sanitizeCopyField(value: string): string {
  return stripColorCodesFromText(value)
    .replace(/\b(hex|rgb|rgba|hsl|pantone|colour code|color code)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Parse Groq JSON flyer copy; tolerates markdown fences */
export function parseCampaignCopyJson(raw: string): Partial<CampaignCopy> | null {
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    const pick = (k: keyof CampaignCopy) =>
      typeof obj[k] === "string" ? (obj[k] as string).trim() : "";
    return {
      headline: pick("headline"),
      tagline: pick("tagline"),
      cta: pick("cta"),
      location: pick("location"),
      contact: pick("contact"),
    };
  } catch {
    return null;
  }
}

export function clampCampaignCopy(copy: CampaignCopy): CampaignCopy {
  const trim = (s: string, max: number) => {
    const clean = sanitizeCopyField(s);
    return clean.length <= max ? clean : `${clean.slice(0, max - 1).trim()}…`;
  };
  return {
    headline: trim(copy.headline, 72),
    tagline: trim(copy.tagline, 90),
    cta: trim(copy.cta, 28),
    location: trim(copy.location, 60),
    contact: trim(copy.contact, 80),
  };
}

/** Merge AI copy with business facts (location, contact stay accurate) */
export function mergeCampaignCopyWithBusiness(
  ai: Partial<CampaignCopy>,
  business: BusinessProfile
): CampaignCopy {
  const fallback = buildCampaignCopy(business);
  const contact = buildBusinessContactLine(business);

  const cta =
    business.callToAction?.trim() || ai.cta || fallback.cta;

  return clampCampaignCopy(
    ensureBusinessNameAsHeadline(
      stripCampaignGoalFromFlyerCopy(
        {
          headline: getBusinessNameHeadline(business),
          tagline: ai.tagline || fallback.tagline,
          cta,
          location: business.location?.trim() || ai.location || fallback.location,
          contact: contact || ai.contact || fallback.contact,
        },
        business
      ),
      business
    )
  );
}
