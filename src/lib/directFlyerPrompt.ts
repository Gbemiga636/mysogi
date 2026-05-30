import { formatBrandPaletteForImagenVisual } from "./brandColors";
import { getCampaignVisualStyle } from "./businessCampaign";
import { buildSceneElementsProse } from "./flyerSceneElements";
import { sanitizeExactTextFlyerPrompt } from "./flyerExactTextGuard";
import { flyerFormatLabel } from "./flyerVisualCommon";
import { resolvePremiumAdStyle } from "./premiumFlyerEngine";
import type { BusinessProfile, VideoFormat } from "./types";

export const DIRECT_FLYER_MARKER = "DIRECT-AD-VISUAL";

export function isDirectFlyerPrompt(prompt: string): boolean {
  return prompt.includes(DIRECT_FLYER_MARKER);
}

export function isSimpleFlyerMode(): boolean {
  const v = process.env.FLYER_SIMPLE_MODE?.trim().toLowerCase();
  if (v === "false" || v === "0" || v === "off") return false;
  return true;
}

/**
 * One clear prompt from business details only — no Groq enhancement, no "flyer" jargon.
 * Image has no text; headline/CTA/contact are added via SVG overlay after.
 */
export function buildDirectFlyerImagePrompt(
  business: BusinessProfile,
  format: VideoFormat,
  userIdea?: string
): string {
  const name = business.businessName?.trim() || "the brand";
  const industry = business.industry?.trim() || "local business";
  const audience = business.targetAudience?.trim() || "local customers";
  const goal = business.campaignGoal?.trim() || "drive sales and awareness";
  const location = business.location?.trim() || "";
  const tagline = business.tagline?.trim() || "";
  const style = getCampaignVisualStyle(business);
  const adStyle = resolvePremiumAdStyle(business);
  const palette = formatBrandPaletteForImagenVisual(business);
  const scene = buildSceneElementsProse(business);
  const fmt = flyerFormatLabel(format);
  const idea = userIdea?.trim();

  const prompt = [
    DIRECT_FLYER_MARKER,
    `Premium cinematic marketing advertisement photo for ${name}, ${industry} industry.`,
    `Campaign goal: ${goal}. Target audience: ${audience}.`,
    location ? `Market setting: ${location}.` : "",
    tagline ? `Brand mood: ${tagline}.` : "",
    idea ? `Creative direction: ${idea.slice(0, 280)}.` : "",
    `Scene: ${scene.slice(0, 500)}`,
    `Visual style: ${style}. ${adStyle.aesthetic}. Lighting: ${adStyle.lighting}.`,
    `Format: ${fmt}.`,
    `Color grading: ${palette}.`,
    "Composition: luxury commercial photography, foreground and background depth, hero subject in center, calm darker area at top for headline overlay, mid-lower area for CTA button overlay, bottom strip for phone and email overlay.",
    "Absolutely no readable text, letters, numbers, logos with words, or signage in the photograph.",
    "Ultra-realistic, expensive agency campaign look, intentional lighting, not a generic AI poster or template.",
  ]
    .filter(Boolean)
    .join(" ");

  return sanitizeExactTextFlyerPrompt(prompt).slice(0, 3200);
}
