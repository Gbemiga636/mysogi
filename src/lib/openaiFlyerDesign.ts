import { formatBrandPaletteForImagenVisual } from "./brandColors";
import { getCampaignVisualStyle } from "./businessCampaign";
import type { CampaignCopy } from "./campaignTextLayers";
import {
  analyzeBrandPsychology,
  describeHeroSubject,
  ELITE_VISUAL_MARKETING_LANGUAGE,
  getNicheVisualAdaptation,
} from "./eliteCreativeDirector";
import {
  buildEliteBusinessFields,
  ELITE_MASTER_PERSONA,
  formatEliteBusinessBlock,
} from "./eliteFlyerMasterPrompt";
import {
  FLYER_ANTI_COLOR_CODE_BLOCK,
  FLYER_ANTI_LOGO_BLOCK,
  FLYER_ANTI_META_LABEL_BLOCK,
  sanitizeExactTextFlyerPrompt,
} from "./flyerExactTextGuard";
import { buildSceneElementsProse } from "./flyerSceneElements";
import { flyerFormatLabel } from "./flyerVisualCommon";
import {
  buildPremiumDirectorStack,
  buildPremiumTypographyBlock,
  resolvePremiumAdStyle,
} from "./premiumFlyerEngine";
import { getProfessionalShotRecipe } from "./professionalFlyerVisuals";
import { isFinishedFlyerDesignEnabled } from "./seniorDesignerEngine";
import type { BusinessProfile, VideoFormat } from "./types";

export const OPENAI_INTEGRATED_FLYER_MARKER = "OPENAI-FINISHED-FLYER";

export const OPENAI_MAX_PROMPT_CHARS = 4000;

/** @deprecated use isFinishedFlyerDesignEnabled from seniorDesignerEngine */
export function isOpenAIIntegratedDesignEnabled(): boolean {
  return isFinishedFlyerDesignEnabled();
}

export function isOpenAIIntegratedFlyerPrompt(prompt: string): boolean {
  return prompt.includes(OPENAI_INTEGRATED_FLYER_MARKER);
}

const INTEGRATED_VISUAL_RULES = [
  "FINISHED ADVERTISEMENT: one complete print-ready marketing flyer with photography AND typography integrated — not a blank plate for overlay.",
  "Cinematic scene plus elite typesetting in the same artwork. Expensive, intentional, polished, viral-worthy.",
  "DO NOT leave empty text zones. DO NOT use post-production overlay language. Render the full ad in one image.",
  "Foreground, midground, background depth. Asymmetrical balance. Luxury commercial photography.",
].join(" ");

export function buildOpenAIBusinessStoryboard(
  business: BusinessProfile,
  format: VideoFormat,
  visualNarrative?: string
): string {
  const psych = analyzeBrandPsychology(business);
  const industry = business.industry?.trim() || "local business";
  const adStyle = resolvePremiumAdStyle(business);
  const niche = getNicheVisualAdaptation(business);
  const palette = formatBrandPaletteForImagenVisual(business);
  const hero = describeHeroSubject(business);
  const scene = buildSceneElementsProse(business);
  const shot = getProfessionalShotRecipe(business, format);
  const fmt = flyerFormatLabel(format);
  const style = getCampaignVisualStyle(business);

  const narrative = visualNarrative?.trim()
    ? `Creative director scene: ${visualNarrative.trim().slice(0, 1100)}.`
    : "";

  return [
    `Format: ${fmt} finished luxury advertisement.`,
    formatEliteBusinessBlock(buildEliteBusinessFields(business)),
    INTEGRATED_VISUAL_RULES,
    scene,
    `Hero: ${hero}.`,
    shot,
    niche,
    `Visual: ${style}. ${adStyle.aesthetic}.`,
    `Lighting: ${adStyle.lighting}.`,
    `Color grade: ${palette}.`,
    `Emotion: ${psych.emotion}.`,
    narrative,
    ELITE_VISUAL_MARKETING_LANGUAGE,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildOpenAIIntegratedFlyerPrompt(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  visualNarrative?: string
): string {
  const director = buildPremiumDirectorStack(business, format);
  const storyboard = buildOpenAIBusinessStoryboard(
    business,
    format,
    visualNarrative
  );
  const typography = buildPremiumTypographyBlock(business, copy);

  const brief = [
    OPENAI_INTEGRATED_FLYER_MARKER,
    ELITE_MASTER_PERSONA,
    director,
    storyboard,
    typography,
    FLYER_ANTI_LOGO_BLOCK,
    FLYER_ANTI_COLOR_CODE_BLOCK,
    FLYER_ANTI_META_LABEL_BLOCK,
    "FINAL: masterpiece luxury marketing flyer — cinematic photography and premium integrated typography, every word spelled correctly, agency-quality layout, no post overlay.",
  ].join(" ");

  return sanitizeExactTextFlyerPrompt(brief).slice(0, OPENAI_MAX_PROMPT_CHARS);
}
