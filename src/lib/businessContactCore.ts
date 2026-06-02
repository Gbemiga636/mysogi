import type { CampaignCopy } from "./campaignTextLayers";
import type { BusinessProfile } from "./types";

export type BusinessContactParts = {
  phone: string;
  email: string;
  website: string;
  /** phone · email · website (non-empty parts only) */
  line: string;
};

/** Phone + email (+ website) from Step 1 — always used on flyers */
export function buildBusinessContactParts(
  business: BusinessProfile
): BusinessContactParts {
  const phone = business.phone?.trim() || "";
  const email = business.email?.trim() || "";
  const website = business.website?.trim() || "";
  const line = [phone, email, website].filter(Boolean).join(" · ");
  return { phone, email, website, line };
}

export function buildBusinessContactLine(business: BusinessProfile): string {
  return buildBusinessContactParts(business).line;
}

/** Footer lines for SVG overlay — same order as buildStructuredFooterLines (client-safe). */
export function estimateFooterDisplayLines(
  business: BusinessProfile,
  copy?: CampaignCopy
): string[] {
  const parts = buildBusinessContactParts(business);
  const lines: string[] = [];
  const location = copy?.location?.trim() || business.location?.trim() || "";
  if (location) lines.push(location);
  if (parts.phone) lines.push(parts.phone);
  if (parts.email) lines.push(parts.email);
  if (parts.website) {
    lines.push(parts.website.replace(/^https?:\/\//i, "").replace(/\/$/, ""));
  }
  if (lines.length) return lines;
  const contact = copy?.contact?.trim();
  if (contact) {
    return contact
      .split(/\s*[·|•]\s*|\s{2,}/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4);
  }
  return [];
}

export function hasBusinessContact(business: BusinessProfile): boolean {
  return Boolean(
    buildBusinessContactLine(business) || business.location?.trim()
  );
}

/** Preserve exact Step 1 contact strings (trim only — no reformatting). */
export function normalizeBusinessProfileContact<T extends BusinessProfile>(
  business: T
): T {
  return {
    ...business,
    phone: business.phone?.trim() ?? "",
    email: business.email?.trim() ?? "",
    website: business.website?.trim() ?? "",
  };
}
