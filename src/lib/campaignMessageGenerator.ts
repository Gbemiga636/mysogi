import "server-only";

import { detectCampaignType } from "./campaignTypeEngine";
import { getCampaignTypeLabel } from "./campaignProfile";
import {
  DEFAULT_CAMPAIGN_MESSAGE_LIMITS,
  type CampaignMessageLimits,
} from "./campaignMessageLimits";
import type { BusinessProfile } from "./types";

export {
  CAMPAIGN_MESSAGE_MAX,
  CAMPAIGN_MESSAGE_MIN,
  CAMPAIGN_MESSAGE_TARGET,
  CAMPAIGN_MESSAGE_LIMIT_PRESETS,
  DEFAULT_CAMPAIGN_MESSAGE_LIMITS,
  resolveCampaignMessageLimits,
  type CampaignMessageLimitPresetId,
  type CampaignMessageLimits,
} from "./campaignMessageLimits";

function clampMessage(text: string, limits: CampaignMessageLimits): string {
  const { minLength, maxLength } = limits;
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= maxLength) return t;
  const cut = t.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > minLength ? cut.slice(0, lastSpace) : cut).trim();
}

/** Expand short Groq output toward the target character range using Step 1 details. */
export function ensureFullLengthMessage(
  text: string,
  business: BusinessProfile,
  limits: CampaignMessageLimits = DEFAULT_CAMPAIGN_MESSAGE_LIMITS
): string {
  let msg = clampMessage(text, limits);
  if (msg.length >= limits.minLength) return msg;

  const name = business.businessName?.trim() || "Us";
  const cta = business.callToAction?.trim() || "Learn more";
  const loc = business.location?.trim();
  const site = business.website?.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  const phone = business.phone?.trim();
  const tagline = business.tagline?.trim();
  const industry = business.industry?.trim();
  const typeLabel = getCampaignTypeLabel(business);

  const extras: string[] = [];
  if (typeLabel && !msg.toLowerCase().includes(typeLabel.slice(0, 8).toLowerCase())) {
    extras.push(typeLabel);
  }
  if (tagline && !msg.toLowerCase().includes(tagline.slice(0, 12).toLowerCase())) {
    extras.push(tagline);
  }
  if (industry && !msg.toLowerCase().includes(industry.slice(0, 8).toLowerCase())) {
    extras.push(`Premium ${industry} for you`);
  }
  if (loc && !msg.includes(loc)) extras.push(loc);
  if (cta && !msg.toLowerCase().includes(cta.toLowerCase())) extras.push(`${cta} today`);
  if (site && !msg.includes(site)) extras.push(site);
  if (phone && !msg.includes(phone.slice(-4))) extras.push(`Call ${phone}`);

  for (const extra of extras) {
    if (msg.length >= limits.minLength) break;
    const candidate = clampMessage(`${msg} ${extra}.`, limits);
    if (candidate.length > msg.length) msg = candidate;
  }

  if (msg.length < limits.minLength) {
    const pad = ` ${name} — ${cta}.`;
    msg = clampMessage(`${msg}${pad}`, limits);
  }

  return clampMessage(msg, limits);
}

function buildLongFallbackMessages(
  business: BusinessProfile,
  limits: CampaignMessageLimits = DEFAULT_CAMPAIGN_MESSAGE_LIMITS
): string[] {
  const name = business.businessName?.trim() || "Us";
  const cta = business.callToAction?.trim() || "Learn more";
  const loc = business.location?.trim() || "Lagos";
  const site = business.website?.replace(/^https?:\/\//i, "").replace(/\/$/, "") || "";
  const tagline = business.tagline?.trim() || "Quality you can trust";
  const industry = business.industry?.trim() || "premium service";
  const typeLabel = getCampaignTypeLabel(business) || "Special offer";
  const profile = detectCampaignType(business);

  const templates = [
    `${name}: ${tagline} ${typeLabel} — ${profile.taglineAngle.slice(0, 50)}. ${cta} now${loc ? ` at ${loc}` : ""}${site ? `. ${site}` : "."}`,
    `Do not miss ${name} — ${industry} made for you in ${loc}. ${typeLabel}: ${cta} today${site ? ` | ${site}` : "."} Trusted by locals.`,
    `${typeLabel} from ${name}! ${tagline} Visit ${loc} or ${cta.toLowerCase()}${site ? ` — ${site}` : " today"}. ${business.phone?.trim() ? `Call ${business.phone.trim()}.` : "We are ready for you."}`,
  ];

  return templates.map((t) => ensureFullLengthMessage(t, business, limits));
}

function parseMessagesJson(
  raw: string,
  business?: BusinessProfile,
  limits: CampaignMessageLimits = DEFAULT_CAMPAIGN_MESSAGE_LIMITS
): string[] | null {
  const trimmed = raw.trim();
  const normalize = (s: string) =>
    business ? ensureFullLengthMessage(s, business, limits) : clampMessage(s, limits);

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((x) => normalize(String(x)))
        .filter(Boolean)
        .slice(0, 3);
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { messages?: unknown }).messages)
    ) {
      return ((parsed as { messages: unknown[] }).messages)
        .map((x) => normalize(String(x)))
        .filter(Boolean)
        .slice(0, 3);
    }
  } catch {
    /* try line parse */
  }

  const lines = trimmed
    .split(/\n+/)
    .map((l) => l.replace(/^[\d.)\-"'\s]+/, "").trim())
    .filter(Boolean)
    .map((l) => normalize(l))
    .slice(0, 3);
  return lines.length >= 2 ? lines : null;
}

export type GenerateCampaignMessagesOptions = {
  limits?: CampaignMessageLimits;
};

/**
 * Generate 3 distinct campaign messages within the configured character range.
 */
export async function generateCampaignMessages(
  business: BusinessProfile,
  userPrompt = "",
  existingMessage = "",
  options: GenerateCampaignMessagesOptions = {}
): Promise<string[]> {
  const limits = options.limits ?? DEFAULT_CAMPAIGN_MESSAGE_LIMITS;
  const fallback = buildCampaignCopyFallback(business, limits);
  const { generateCampaignMessagesGroq } = await import("./groq");
  try {
    const messages = await generateCampaignMessagesGroq(
      business,
      userPrompt,
      existingMessage,
      limits
    );
    const normalized = messages.map((m) =>
      ensureFullLengthMessage(m, business, limits)
    );
    if (normalized.length >= 3) return normalized.slice(0, 3);
    if (normalized.length > 0) {
      const merged = [...normalized];
      for (const fb of fallback) {
        if (merged.length >= 3) break;
        if (!merged.some((m) => m.toLowerCase() === fb.toLowerCase())) {
          merged.push(fb);
        }
      }
      return merged.slice(0, 3);
    }
  } catch {
    /* fallback below */
  }
  return fallback;
}

function buildCampaignCopyFallback(
  business: BusinessProfile,
  limits: CampaignMessageLimits = DEFAULT_CAMPAIGN_MESSAGE_LIMITS
): string[] {
  return buildLongFallbackMessages(business, limits);
}

export {
  parseMessagesJson,
  clampMessage,
  buildCampaignCopyFallback,
  buildLongFallbackMessages,
};
