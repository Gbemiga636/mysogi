import { getBrandPrimary, getBrandSecondary } from "./brandColors";
import type { BusinessProfile, VideoFormat } from "./types";

/** Visual style label derived from industry — not one-size crypto */
export function getCampaignVisualStyle(business: BusinessProfile): string {
  const ind = (business.industry || "").toLowerCase();
  if (/crypto|blockchain|web3|exchange|trading/.test(ind)) {
    return "premium futuristic fintech";
  }
  if (/fintech|finance|bank|insurance/.test(ind)) {
    return "trustworthy premium financial services";
  }
  if (/food|restaurant|catering|bakery|chef/.test(ind)) {
    return "warm appetizing culinary commercial";
  }
  if (/fashion|beauty|cosmetic|salon|spa/.test(ind)) {
    return "high-fashion editorial luxury";
  }
  if (/real estate|property|estate/.test(ind)) {
    return "aspirational luxury property marketing";
  }
  if (/tech|software|app|saas|startup/.test(ind)) {
    return "sleek modern tech product launch";
  }
  if (/health|medical|pharma|clinic|hospital/.test(ind)) {
    return "clean trustworthy healthcare wellness";
  }
  if (/education|training|course|school|university/.test(ind)) {
    return "inspiring professional education campaign";
  }
  if (/retail|shop|store|ecommerce|market/.test(ind)) {
    return "vibrant retail sales promotion";
  }
  if (/logistics|delivery|transport/.test(ind)) {
    return "dynamic reliable logistics brand";
  }
  if (/event|wedding|party|entertainment/.test(ind)) {
    return "exciting event promotion energy";
  }
  return "premium professional brand campaign";
}

export function derivePromptStyleFromBusiness(business: BusinessProfile): string {
  const style = getCampaignVisualStyle(business);
  const name = business.businessName?.trim() || "the brand";
  return `${style} marketing campaign for ${name}`;
}

/** Rich brief for Groq + Imagen — business-specific, no crypto default */
export function formatBusinessCampaignBrief(
  business: BusinessProfile,
  format?: VideoFormat,
  options?: { forImagePrompt?: boolean }
): string {
  const name = business.businessName?.trim() || "the business";
  const lines = [
    options?.forImagePrompt
      ? `Business name (MANDATORY typeset on flyer): ${name}`
      : `Business name: ${name}`,
    business.industry ? `Industry / category: ${business.industry}` : "",
    business.tagline ? `Brand tagline mood: ${business.tagline}` : "",
    business.targetAudience
      ? `Target audience: ${business.targetAudience}`
      : "Target audience: Nigerian digital consumers",
    business.location && !options?.forImagePrompt
      ? `Market / location: ${business.location}`
      : business.location && options?.forImagePrompt
        ? `Regional visual context only (never typeset): ${business.location}`
        : options?.forImagePrompt
          ? ""
          : "Market: Nigeria",
    `Call to action (copy overlay): ${business.callToAction || "Learn more"}`,
    `Brand colors — primary ${getBrandPrimary(business)}, accent ${getBrandSecondary(business)}`,
    options?.forImagePrompt
      ? "Contact details (phone, email, website, location): SVG footer overlay after generation — never render in the image."
      : `Contact on flyer (always include in footer): ${[business.phone, business.email, business.website].filter(Boolean).join(" · ") || "add phone and email in Step 1"}`,
    `Visual style direction: ${getCampaignVisualStyle(business)}`,
    format ? `Output format: ${format}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

export function buildCampaignCreativeAngle(
  business: BusinessProfile,
  userIdea: string
): string {
  const idea = userIdea.trim();
  if (idea) return idea;
  if (business.campaignGoal?.trim()) return business.campaignGoal.trim();
  if (business.tagline?.trim()) {
    return `Promote ${business.businessName || "the brand"} — ${business.tagline.trim()}`;
  }
  const ind = business.industry || "services";
  return `Drive conversions for ${business.businessName || "the brand"} in the ${ind} space`;
}
