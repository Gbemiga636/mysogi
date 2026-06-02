import { withCampaignTypePromptLead } from "./campaignTypeEngine";
import { buildAgencyFlyerPrompt } from "./creativeDirector";
import {
  applyFlyerVisualBoost,
  buildFlyerVisualPrompt,
  mergeUserFlyerCreative,
} from "./flyerPrompt";
import { formatBusinessCampaignBrief } from "./businessCampaign";
import { formatBrandPaletteForPrompt, getBrandPrimary, getBrandSecondary } from "./brandColors";
import type { BusinessProfile, VideoFormat } from "./types";

export type MediaPromptKind = "video" | "flyer" | "image";

export function formatBusinessContext(b: BusinessProfile): string {
  return formatBusinessCampaignBrief(b);
}

function resolveKind(kind: MediaPromptKind): "video" | "flyer" {
  return kind === "video" ? "video" : "flyer";
}

export function buildBusinessMediaPrompt(
  business: BusinessProfile,
  creativeIdea: string,
  kind: MediaPromptKind,
  format: VideoFormat = "1:1"
): string {
  const resolved = resolveKind(kind);
  if (resolved === "flyer") {
    return buildFlyerVisualPrompt(business, creativeIdea, format);
  }

  const name = business.businessName || "the business";
  const idea =
    creativeIdea.trim() ||
    business.campaignGoal ||
    `Premium marketing video for ${name}`;

  return [
    `Create a cinematic marketing video ad for ${name}.`,
    `Scene & message: ${idea}.`,
    `Industry: ${business.industry || "local services"}. Setting: ${business.location || "Nigeria"}.`,
    `Audience: ${business.targetAudience || "Nigerian consumers"}.`,
    `Mood: ${business.tagline || "professional, trustworthy, conversion-focused"}.`,
    `Visual palette: ${formatBrandPaletteForPrompt(business)}.`,
    `Campaign goal: ${business.campaignGoal || "drive leads and sales"}.`,
    `Support CTA: "${business.callToAction}".`,
    "No fake text or logos in scene — real logo overlaid after generation.",
    "Authentic local market context where relevant.",
  ].join(" ");
}

export function enrichPromptWithBusiness(
  business: BusinessProfile,
  promptText: string,
  kind: MediaPromptKind = "video",
  format: VideoFormat = "1:1",
  campaignMessage = ""
): string {
  const resolved = resolveKind(kind);
  const trimmed = promptText.trim();
  const idea = trimmed || business.campaignGoal || business.businessName || "";

  if (resolved === "flyer") {
    const prompt =
      trimmed.length >= 20
        ? mergeUserFlyerCreative(trimmed, business, format)
        : buildAgencyFlyerPrompt(business, idea, format);

    return withCampaignTypePromptLead(
      applyFlyerVisualBoost(prompt, business, format),
      business,
      idea,
      campaignMessage
    );
  }

  const name = business.businessName?.trim();
  if (!name) return buildBusinessMediaPrompt(business, trimmed, kind, format);

  const hasBusiness =
    trimmed.toLowerCase().includes(name.toLowerCase()) ||
    (business.industry &&
      trimmed.toLowerCase().includes(business.industry.toLowerCase()));

  if (hasBusiness && trimmed.length > 80) {
    return [
      trimmed,
      `Brand colors: ${getBrandPrimary(business)} and ${getBrandSecondary(business)}.`,
      `Audience: ${business.targetAudience || "Nigerian consumers"}.`,
    ].join(" ");
  }

  const prefix = buildBusinessMediaPrompt(business, trimmed, kind, format);
  return trimmed ? `${prefix} Creative direction: ${trimmed}` : prefix;
}
