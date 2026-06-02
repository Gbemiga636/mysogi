/**
 * Locks flyer prompts to Step 1 business profile:
 * - visuals must match industry
 * - contact footer uses ONLY profile phone, email, website
 * - strong typography + exact copy
 */

import { getCampaignVisualStyle } from "./businessCampaign";
import { buildCampaignTypePromptLead } from "./campaignTypeEngine";
import { buildBusinessContactParts } from "./businessContact";
import {
  buildForbiddenContactInImageBlock,
  buildFooterVerificationBookend,
  buildMandatoryExactContactBlock,
} from "./flyerFooterLock";
import { shouldForbidContactInAiImage } from "./flyerExactContactMode";
import { buildStep1ExactContactLockBlock } from "./flyerContactPrompt";
import {
  buildExactMarketingCopyBlock,
  buildFlyerTypographyAuthorityBlock,
} from "./flyerTypographyAuthority";
import { buildSceneElementsProse } from "./flyerSceneElements";
import { sanitizeExactTextFlyerPrompt } from "./flyerExactTextGuard";
import type { CampaignCopy } from "./campaignTextLayers";
import type { BusinessProfile, VideoFormat } from "./types";

export {
  buildForbiddenContactInImageBlock,
  buildMandatoryExactContactBlock,
  buildFooterVerificationBookend,
} from "./flyerFooterLock";

/** Industry-specific hero scene — prevents generic wrong-industry imagery */
export function buildIndustryLockedVisualBlock(
  business: BusinessProfile
): string {
  const industry = business.industry?.trim() || "local services";
  const name = business.businessName?.trim() || "the brand";
  const style = getCampaignVisualStyle(business);
  const scene = buildSceneElementsProse(business);
  const location = business.location?.trim();
  const audience = business.targetAudience?.trim();

  return [
    "MANDATORY INDUSTRY VISUAL (must match this business — not generic stock):",
    `Business name: ${name}`,
    `Industry / category: ${industry}`,
    audience ? `Target audience: ${audience}` : "",
    location
      ? `Setting / market context for photography (do not invent a different city): ${location}`
      : "",
    `Required visual style: ${style}`,
    `Scene direction: ${scene}`,
    `Every person, product, interior, and prop MUST belong to the ${industry} industry.`,
    "FORBIDDEN: unrelated stock visuals (e.g. fintech dashboards for food brands, gym scenes for real estate, random office for a bakery).",
    business.imageProps?.trim()
      ? `Mandatory featured elements from client: ${business.imageProps.trim()}`
      : "",
    business.campaignGoal?.trim()
      ? `Campaign goal context: ${business.campaignGoal.trim()}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Remove contact lines from model image_prompt that don't match profile */
export function stripUnauthorizedContactFromPrompt(
  text: string,
  business: BusinessProfile
): string {
  const { phone, email, website } = buildBusinessContactParts(business);
  const websiteNorm = website.replace(/^https?:\/\//i, "").replace(/\/$/, "");

  const lines = text.split("\n");
  const kept: string[] = [];

  const phoneDigits = phone.replace(/\D/g, "");
  const emailLower = email.toLowerCase();
  const siteLower = websiteNorm.toLowerCase();

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (/@/.test(line) && emailLower && !lower.includes(emailLower)) {
      continue;
    }
    if (/@/.test(line) && !emailLower) {
      continue;
    }

    if (/\.com|\.ng|\.net|www\.|https?:/i.test(line)) {
      if (siteLower && !lower.includes(siteLower)) continue;
      if (!siteLower) continue;
    }

    const digitsInLine = line.replace(/\D/g, "");
    if (digitsInLine.length >= 10) {
      if (
        phoneDigits &&
        !digitsInLine.includes(phoneDigits) &&
        !phoneDigits.includes(digitsInLine)
      ) {
        continue;
      }
      if (!phoneDigits) continue;
    }

    if (
      /phone|call|whatsapp|tel:/i.test(lower) &&
      phone &&
      !lower.includes(phone.replace(/\s/g, "").slice(-8))
    ) {
      if (!line.includes(phone)) continue;
    }

    kept.push(line);
  }

  return kept.join("\n").trim();
}

/** Lead every finished-design image prompt */
export function buildFlyerPromptBindingPrefix(
  business: BusinessProfile,
  format: VideoFormat
): string {
  return [
    buildIndustryLockedVisualBlock(business),
    "",
    buildFlyerTypographyAuthorityBlock(business),
    "",
    shouldForbidContactInAiImage()
      ? buildForbiddenContactInImageBlock(business, format)
      : buildMandatoryExactContactBlock(business, format),
    "",
    buildStep1ExactContactLockBlock(business),
    "",
  ].join("\n");
}

export type AssembleFinishedFlyerPromptOpts = {
  marker: string;
  business: BusinessProfile;
  copy: CampaignCopy;
  format: VideoFormat;
  middleSections: string[];
  viralLines?: { hook?: string; value?: string; proof?: string; cta?: string };
  userPrompt?: string;
  campaignMessage?: string;
};

/** Standard assembly: binding + copy + body + footer bookend */
export function assembleFinishedFlyerPrompt(
  opts: AssembleFinishedFlyerPromptOpts
): string {
  const { business, copy, format, middleSections, viralLines, marker } = opts;

  const prompt = [
    marker,
    buildCampaignTypePromptLead(
      business,
      opts.userPrompt ?? "",
      opts.campaignMessage ?? ""
    ),
    buildFlyerPromptBindingPrefix(business, format),
    buildExactMarketingCopyBlock(business, copy, viralLines),
    "",
    ...middleSections,
    "",
    shouldForbidContactInAiImage()
      ? buildForbiddenContactInImageBlock(business, format)
      : buildMandatoryExactContactBlock(business, format),
    buildStep1ExactContactLockBlock(business),
    buildFooterVerificationBookend(business),
  ]
    .filter((s) => s.trim().length > 0)
    .join("\n\n");

  return sanitizeExactTextFlyerPrompt(prompt).slice(0, 3900);
}
