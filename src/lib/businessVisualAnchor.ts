import { describeHexAsVisualColor, getBrandPrimary, getBrandSecondary } from "./brandColors";
import { getCampaignVisualStyle } from "./businessCampaign";
import { describeHeroSubject } from "./eliteCreativeDirector";
import type { BusinessProfile } from "./types";

/**
 * Mandatory business context for Imagen — repeated industry signals so visuals match Step 1.
 * Avoids words Imagen paints as junk (zone, colour, overlay).
 */
export function buildBusinessVisualAnchor(
  business: BusinessProfile,
  userBrief?: string
): string {
  const industry = business.industry?.trim() || "local business";
  const style = getCampaignVisualStyle(business);
  const hero = describeHeroSubject(business);
  const primary = describeHexAsVisualColor(getBrandPrimary(business));
  const accent = describeHexAsVisualColor(getBrandSecondary(business));

  const lines = [
    `MANDATORY: This is a paid advertisement for the ${industry} industry only.`,
    `The viewer must instantly recognize this as ${industry} — not generic stock art.`,
    `Visual style: ${style}.`,
    `Hero subject: ${hero}.`,
    business.campaignGoal?.trim()
      ? `Campaign message to convey visually: ${business.campaignGoal.trim()}.`
      : "",
    business.targetAudience?.trim()
      ? `Designed for: ${business.targetAudience.trim()}.`
      : "",
    business.location?.trim()
      ? `Location and market: ${business.location.trim()}.`
      : "",
    business.tagline?.trim()
      ? `Brand feeling: ${business.tagline.trim()}.`
      : "",
    userBrief?.trim() ? `Creative direction: ${userBrief.trim().slice(0, 280)}.` : "",
    `Lighting uses ${primary} shadows and ${accent} highlights in the scene.`,
    "Show real products, real venue, real tools, or real people of this trade.",
  ];

  return lines.filter(Boolean).join(" ");
}

export const IMAGEN_NO_GRAPHIC_SHAPES =
  "Photography only: no floating circles, squares, pills, stickers, badges, arrows, frames, UI cards, or abstract geometric overlays. Only real-world objects and environments.";
