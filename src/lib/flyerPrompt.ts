import {
  analyzeCampaignCreative,
  buildAgencyFlyerPrompt,
  mergeUserBriefWithAgencyPrompt,
  AD_AGENCY_VISUAL_LANGUAGE,
} from "./creativeDirector";
import { FLYER_RESERVED_ZONES_PROMPT } from "./flyerLayoutZones";
import { scrubPromptForImagen } from "./flyerImagenScrub";
import {
  finalizeImagenFlyerPrompt,
  FLYER_NO_TEXT_SUFFIX,
  sanitizeFlyerPromptForImagen,
} from "./flyerTextGuard";
import { flyerFormatLabel, industryFlyerVisuals } from "./flyerVisualCommon";
import type { BusinessProfile, VideoFormat } from "./types";

export {
  FLYER_NO_TEXT_SUFFIX,
  flyerFormatLabel,
  industryFlyerVisuals,
} from "./flyerVisualCommon";
export { finalizeImagenFlyerPrompt, FLYER_ZERO_TEXT_POLICY } from "./flyerTextGuard";

export function enforceFlyerNoText(
  prompt: string,
  business?: BusinessProfile
): string {
  return finalizeImagenFlyerPrompt(prompt, business);
}

/** Primary flyer prompt — creative director + agency brief, zero AI text */
export function buildFlyerVisualPrompt(
  business: BusinessProfile,
  creativeIdea: string,
  format: VideoFormat
): string {
  const analysis = analyzeCampaignCreative(business, creativeIdea, format);
  return buildAgencyFlyerPrompt(business, creativeIdea, format, analysis);
}

export function mergeUserFlyerCreative(
  userPrompt: string,
  business: BusinessProfile,
  format: VideoFormat
): string {
  return mergeUserBriefWithAgencyPrompt(userPrompt, business, format);
}

export function strengthenFlyerPromptForImagen(
  prompt: string,
  business?: BusinessProfile,
  format: VideoFormat = "1:1"
): string {
  if (/ZERO-TEXT|TEXT-FREE BACKGROUND|zero letters, zero numbers/i.test(prompt)) {
    return prompt.slice(0, 4800);
  }

  let result = sanitizeFlyerPromptForImagen(prompt, business);
  const lower = result.toLowerCase();

  if (
    !/advertising campaign|commercial photography|conversion-focused|magazine-quality/i.test(
      lower
    )
  ) {
    result = `${result} ${AD_AGENCY_VISUAL_LANGUAGE}.`;
  }
  if (!/upper band|hero center|lower band|negative-space/i.test(lower)) {
    result = `${result} ${FLYER_RESERVED_ZONES_PROMPT}`;
  }
  if (business && result.length < 400) {
    return buildFlyerVisualPrompt(business, "", format);
  }

  return scrubPromptForImagen(finalizeImagenFlyerPrompt(result, business), business);
}

export function applyFlyerVisualBoost(
  prompt: string,
  business?: BusinessProfile,
  format: VideoFormat = "1:1"
): string {
  return strengthenFlyerPromptForImagen(prompt, business, format);
}

export function buildFlyerPromptFallback(
  business: BusinessProfile,
  creativeIdea: string,
  format: VideoFormat
): string {
  return buildFlyerVisualPrompt(business, creativeIdea, format);
}

export const buildFlyerPromptWithExactText = buildFlyerVisualPrompt;

export {
  analyzeCampaignCreative,
  buildAgencyFlyerPrompt,
  formatCreativeDirectorBrief,
} from "./creativeDirector";
