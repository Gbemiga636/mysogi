import { formatBrandPaletteForImagenVisual } from "./brandColors";
import { getCampaignVisualStyle } from "./businessCampaign";
import {
  analyzeBrandPsychology,
  describeHeroSubject,
  getNicheVisualAdaptation,
} from "./eliteCreativeDirector";
import { buildSceneElementsProse } from "./flyerSceneElements";
import { sanitizeExactTextFlyerPrompt } from "./flyerExactTextGuard";
import { flyerFormatLabel } from "./flyerVisualCommon";
import {
  resolvePremiumAdStyle,
  type PremiumAdStyle,
} from "./premiumFlyerEngine";
import { getProfessionalShotRecipe } from "./professionalFlyerVisuals";
import type { BusinessProfile, VideoFormat } from "./types";

export const AD_AGENCY_MARKER = "AGENCY-CINEMATIC-AD";

export const AD_AGENCY_MAX_PROMPT_CHARS = 4000;

/** Banned — triggers generic AI poster aesthetics */
const BANNED_PROMPT_TERMS = /\b(business flyer|flyer design|flyer template|canva|poster maker|generic poster)\b/gi;

export type AdAgencyLuxuryLevel =
  | "ultra-luxury"
  | "premium"
  | "elevated-commercial"
  | "modern-performance";

export type AdAgencyCreativeDirection = {
  businessType: string;
  emotionalAngle: string;
  visualStorytelling: string;
  adComposition: string;
  luxuryLevel: AdAgencyLuxuryLevel;
  cinematicStyle: string;
  campaignStyle: PremiumAdStyle;
  sceneDirection: string;
  typographyZones: string;
  marketingPsychology: string;
};

function resolveLuxuryLevel(
  business: BusinessProfile,
  style: PremiumAdStyle
): AdAgencyLuxuryLevel {
  const mood = [business.tagline, business.campaignGoal, business.industry]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/luxury|premium|exclusive|elite|vip|boutique/.test(mood)) return "ultra-luxury";
  if (/nightlife|club|fashion|real estate|property|automotive|crypto/.test(mood)) {
    return "premium";
  }
  if (style.id === "corporate" || style.id === "premium_tech") {
    return "modern-performance";
  }
  return "elevated-commercial";
}

function buildVisualStorytelling(
  business: BusinessProfile,
  style: PremiumAdStyle,
  psych: ReturnType<typeof analyzeBrandPsychology>
): string {
  const goal = business.campaignGoal?.trim() || "drive desire and action";
  return [
    `Tell a ${style.label} story: ${psych.emotion} for ${business.targetAudience || "the target audience"}.`,
    `Campaign narrative: ${goal}.`,
    `Hero journey: viewer discovers ${business.industry || "the brand"} through cinematic environment and human/product moment — not a catalog shot.`,
  ].join(" ");
}

function buildTypographyZoneMap(format: VideoFormat): string {
  const fmt = flyerFormatLabel(format);
  return [
    `TYPOGRAPHY ZONES (${fmt} — negative space only, zero readable characters in photograph):`,
    "Upper calm band: soft sky, bokeh, or dark gradient veil for headline overlay via SVG.",
    "Upper-mid: optional supporting line zone — keep uncluttered.",
    "Center: hero subject — busiest detail, sharpest focus.",
    "Mid-lower: gentle darkening or glow band for CTA button overlay.",
    "Bottom strip: footer gradient for contact and location overlay.",
    "Top corner: logo safe area — minimal visual noise.",
    "Blank signage, blank screens, blank product labels in scene.",
  ].join(" ");
}

/**
 * Phase 1 — creative direction BEFORE any image prompt (rules + business profile).
 */
export function analyzeAdAgencyDirection(
  business: BusinessProfile,
  format: VideoFormat,
  userCreativeIdea?: string
): AdAgencyCreativeDirection {
  const campaignStyle = resolvePremiumAdStyle(business);
  const psych = analyzeBrandPsychology(business);
  const industry = business.industry?.trim() || "professional services";
  const scene = buildSceneElementsProse(business);
  const hero = describeHeroSubject(business);
  const niche = getNicheVisualAdaptation(business);
  const luxuryLevel = resolveLuxuryLevel(business, campaignStyle);

  const emotionalAngle = [
    `Primary emotion: ${psych.emotion}.`,
    `Tone: ${psych.tone}.`,
    `Selling: ${psych.selling}.`,
  ].join(" ");

  const visualStorytelling = buildVisualStorytelling(business, campaignStyle, psych);

  const adComposition = [
    campaignStyle.composition,
    "Eye flow for overlay: headline zone → hero subject → offer energy → CTA zone → footer contact.",
    "Asymmetrical balance, strategic negative space, commercial grid discipline.",
  ].join(" ");

  const cinematicStyle = [
    campaignStyle.aesthetic,
    campaignStyle.lighting,
    getCampaignVisualStyle(business),
    niche,
    `Luxury tier: ${luxuryLevel}.`,
  ].join(" ");

  const sceneDirection = [
    scene,
    `Hero focal point: ${hero}.`,
    userCreativeIdea?.trim()
      ? `Client creative angle: ${userCreativeIdea.trim().slice(0, 320)}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    businessType: industry,
    emotionalAngle,
    visualStorytelling,
    adComposition,
    luxuryLevel,
    cinematicStyle,
    campaignStyle,
    sceneDirection,
    typographyZones: buildTypographyZoneMap(format),
    marketingPsychology:
      "Trust, desire, exclusivity, high perceived value, commercially attractive, agency-intentional — never generic AI poster.",
  };
}

export function formatAdAgencyDirectionBlock(
  direction: AdAgencyCreativeDirection,
  business: BusinessProfile
): string {
  const name = business.businessName?.trim() || "Brand";
  return [
    "CREATIVE DIRECTION (locked before image generation):",
    `Business type: ${direction.businessType}.`,
    `Emotional angle: ${direction.emotionalAngle}`,
    `Visual storytelling: ${direction.visualStorytelling}`,
    `Ad composition: ${direction.adComposition}`,
    `Luxury level: ${direction.luxuryLevel}.`,
    `Cinematic style: ${direction.cinematicStyle}.`,
    `Campaign style: ${direction.campaignStyle.label}.`,
    `Brand: ${name}. Audience: ${business.targetAudience || "customers"}.`,
    direction.sceneDirection,
    direction.typographyZones,
    direction.marketingPsychology,
  ].join(" ");
}

function stripBannedTerms(text: string): string {
  return text.replace(BANNED_PROMPT_TERMS, "luxury marketing campaign").replace(/\s{2,}/g, " ").trim();
}

/**
 * Phase 2 — cinematic advertising scene prompt (NO text in image, never "flyer").
 */
export function buildAdAgencyCinematicImagePrompt(
  business: BusinessProfile,
  format: VideoFormat,
  direction: AdAgencyCreativeDirection,
  sceneNarrative?: string
): string {
  const palette = formatBrandPaletteForImagenVisual(business);
  const shot = getProfessionalShotRecipe(business, format);
  const fmt = flyerFormatLabel(format);
  const style = direction.campaignStyle;

  const narrative = sceneNarrative?.trim()
    ? `CINEMATOGRAPHER SCENE: ${sceneNarrative.trim().slice(0, 1200)}`
    : "";

  const brief = stripBannedTerms(
    [
      AD_AGENCY_MARKER,
      "AI AD AGENCY ENGINE — output a cinematic luxury marketing advertisement photograph ONLY.",
      "This is NOT a business flyer, NOT a poster template, NOT generic AI art.",
      formatAdAgencyDirectionBlock(direction, business),
      "MASTER VISUAL BRIEF:",
      "Cinematic advertising scene with foreground depth, midground hero focus, atmospheric background, layered composition, realistic perspective, visual storytelling.",
      "Luxury campaign composition with premium visual hierarchy and intentional negative space for typography overlay.",
      "Marketing storytelling environment — expensive, agency-made, visually balanced, commercially attractive.",
      `Format ${fmt}. ${shot}`,
      `Color harmony in lighting: ${palette}.`,
      style.id === "crypto" || style.id === "fintech"
        ? "Fintech futuristic: holographic UI accents, glass panels, volumetric glow — no readable UI text."
        : style.id === "automotive"
          ? "Luxury automotive: sculpted metal, reflective paint, prestige environment."
          : style.id === "nightlife"
            ? "Nightlife: velvet mood, bottle service atmosphere, controlled amber purple grade."
            : style.id === "real_estate"
              ? "Real estate: architectural prestige, golden hour, aspirational lifestyle."
              : style.id === "fashion"
                ? "Fashion campaign: editorial runway energy, glossy textures."
                : style.id === "restaurant"
                  ? "Restaurant luxury: hero dish steam, warm interior bokeh."
                  : style.id === "corporate"
                    ? "Corporate modern: glass office, trust, clean power."
                    : `${style.aesthetic}.`,
      "RENDER: ultra-realistic advertising photography, octane-quality materials, cinematic commercial grade, hyper detail, clean reflections.",
      "ABSOLUTELY NO readable text, letters, numbers, logos with words, or signage copy in the image.",
      narrative,
      "FINAL: masterpiece cinematic marketing environment — typography added separately via professional overlay.",
    ].join(" ")
  );

  return sanitizeExactTextFlyerPrompt(brief).slice(0, AD_AGENCY_MAX_PROMPT_CHARS);
}

export function isAdAgencyCinematicPrompt(prompt: string): boolean {
  return prompt.includes(AD_AGENCY_MARKER);
}
