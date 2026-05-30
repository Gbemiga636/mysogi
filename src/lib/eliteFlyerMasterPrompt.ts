import { formatBrandPaletteForImagenVisual, getBrandPrimary, getBrandSecondary } from "./brandColors";
import { getCampaignVisualStyle } from "./businessCampaign";
import {
  analyzeBrandPsychology,
  describeHeroSubject,
  getNicheVisualAdaptation,
} from "./eliteCreativeDirector";
import { sanitizeExactTextFlyerPrompt } from "./flyerExactTextGuard";
import { buildSceneElementsProse } from "./flyerSceneElements";
import { flyerFormatLabel } from "./flyerVisualCommon";
import { resolvePremiumAdStyle } from "./premiumFlyerEngine";
import { getProfessionalShotRecipe } from "./professionalFlyerVisuals";
import type { BusinessProfile, VideoFormat } from "./types";

export const ELITE_MASTER_MARKER = "ELITE-CINEMATIC-AD";

export const ELITE_MASTER_PERSONA = [
  "You are an ELITE CREATIVE DIRECTOR, SENIOR GRAPHIC DESIGNER, LUXURY BRAND DESIGNER, TYPOGRAPHY SPECIALIST, CINEMATOGRAPHER, and HIGH-END ADVERTISING AGENCY.",
  "Create WORLD-CLASS LUXURY MARKETING ADVERTISEMENTS — never normal AI posters.",
].join(" ");

export const ELITE_MASTER_MAX_CHARS = 4000;

export type EliteBusinessFields = {
  businessName: string;
  industry: string;
  product: string;
  offer: string;
  targetAudience: string;
  brandStyle: string;
  brandColors: string;
  cta: string;
  details: string;
};

export function buildEliteBusinessFields(
  business: BusinessProfile,
  userDetails?: string
): EliteBusinessFields {
  const name = business.businessName?.trim() || "Brand";
  const industry = business.industry?.trim() || "professional services";
  const product =
    business.campaignGoal?.trim() ||
    `${industry} product or service`;
  const offer =
    business.tagline?.trim() ||
    business.campaignGoal?.trim() ||
    "premium offer";
  const details = [
    userDetails?.trim(),
    business.location?.trim() ? `Location: ${business.location.trim()}` : "",
    business.website?.trim() ? `Web: ${business.website.trim()}` : "",
  ]
    .filter(Boolean)
    .join(". ");

  return {
    businessName: name,
    industry,
    product,
    offer,
    targetAudience:
      business.targetAudience?.trim() || "discerning local customers",
    brandStyle: getCampaignVisualStyle(business),
    brandColors: `primary ${getBrandPrimary(business)}, accent ${getBrandSecondary(business)} — ${formatBrandPaletteForImagenVisual(business)}`,
    cta: business.callToAction?.trim() || "Get Started",
    details: details || "premium commercial campaign",
  };
}

export function formatEliteBusinessBlock(fields: EliteBusinessFields): string {
  return [
    "BUSINESS INFORMATION",
    `Business Name: ${fields.businessName}`,
    `Industry: ${fields.industry}`,
    `Product/Service: ${fields.product}`,
    `Offer/Promotion: ${fields.offer}`,
    `Target Audience: ${fields.targetAudience}`,
    `Brand Style: ${fields.brandStyle}`,
    `Primary Colors: ${fields.brandColors}`,
    `Call To Action: ${fields.cta}`,
    `Additional Details: ${fields.details}`,
  ].join(" ");
}

const MASTER_CREATIVE_RULES = [
  "MASTER CREATIVE DIRECTION: premium cinematic advertisement with luxury composition, professional visual hierarchy, cinematic lighting, premium rendering, realistic depth, advertising photography aesthetics, emotional marketing appeal, modern agency layout.",
  "Must look: expensive, intentional, polished, cinematic, viral-worthy, commercially attractive, art-directed by elite designers.",
  "DO NOT: generic flyer, random text in image, flat composition, cluttered layout, AI-generated cheap look, messy spacing, weak lighting, distorted objects, cheap glow, overexposed highlights.",
].join(" ");

const SCENE_COMPOSITION = [
  "SCENE: foreground depth, midground subject focus, atmospheric background, layered composition, strategic negative space, asymmetrical balance, realistic perspective, visual storytelling.",
  "Eye flow zones (leave calm negative space, NO readable words painted in image): upper band for headline overlay, center for hero subject, mid-lower for CTA overlay, bottom strip for contact overlay, top corner for logo overlay.",
].join(" ");

const SUBJECT_ENVIRONMENT = [
  "SUBJECT: premium environment, realistic materials, elegant textures, luxury atmosphere, cinematic staging, realistic reflections, sophisticated props, industry-authentic people and settings.",
].join(" ");

const LIGHTING_BLOCK = [
  "LIGHTING: cinematic rim light, volumetric light, controlled glow, soft reflections, studio highlights, dramatic shadows, luxury color grade, atmospheric depth — high-budget commercial photography.",
].join(" ");

const TYPOGRAPHY_ZONES = [
  "TYPOGRAPHY ZONES (critical): reserve clean negative space for professional HTML/Canvas typography overlay after generation.",
  "Do NOT render headline, tagline, CTA, phone, email, or logo text inside the photograph.",
  "Keep upper area, CTA band, and footer band visually calm — soft bokeh, gradient veil, or darkened strip — so premium fonts overlay cleanly.",
  "Blank signage, blank screens, blank packaging labels in scene.",
].join(" ");

const RENDER_QUALITY = [
  "RENDER: ultra realistic advertising photography, octane-quality materials, unreal-engine cinematic realism, hyper detail, sharp focus, clean reflections, professional contrast, luxury paid-social campaign quality.",
].join(" ");

const MARKETING_FEEL = [
  "MARKETING PSYCHOLOGY: trust, luxury, excitement, desire, professionalism, exclusivity, high perceived value.",
].join(" ");

const FINAL_OUTPUT = [
  "OUTPUT TARGET: luxury Instagram ad, premium billboard, world-class fintech/automotive/fashion commercial — elite, modern, expensive, visually addictive.",
  "Create a MASTERPIECE-LEVEL cinematic marketing advertisement. No readable typography in the image itself.",
].join(" ");

export function isEliteMasterFlyerPrompt(prompt: string): boolean {
  return prompt.includes(ELITE_MASTER_MARKER);
}

/**
 * Full elite master prompt for OpenAI / Imagen — cinematic visual only, text via Sharp overlay.
 */
export function buildEliteMasterVisualPrompt(
  business: BusinessProfile,
  format: VideoFormat,
  visualNarrative?: string,
  userDetails?: string
): string {
  const fields = buildEliteBusinessFields(business, userDetails);
  const psych = analyzeBrandPsychology(business);
  const adStyle = resolvePremiumAdStyle(business);
  const niche = getNicheVisualAdaptation(business);
  const hero = describeHeroSubject(business);
  const scene = buildSceneElementsProse(business);
  const shot = getProfessionalShotRecipe(business, format);
  const fmt = flyerFormatLabel(format);

  const styleFlavor =
    adStyle.id === "crypto" || adStyle.id === "fintech"
      ? "Futuristic: holographic UI accents, neon rim, volumetric glow, premium HUD glass panels without readable text."
      : adStyle.id === "luxury" || adStyle.id === "fashion"
        ? "Luxury: dramatic light, glossy surfaces, elegant shadows, rich textures."
        : `${adStyle.aesthetic}. ${adStyle.lighting}.`;

  const narrative = visualNarrative?.trim()
    ? `DIRECTOR SCENE (execute): ${visualNarrative.trim().slice(0, 1200)}`
    : "";

  const brief = [
    ELITE_MASTER_MARKER,
    ELITE_MASTER_PERSONA,
    formatEliteBusinessBlock(fields),
    MASTER_CREATIVE_RULES,
    SCENE_COMPOSITION,
    SUBJECT_ENVIRONMENT,
    `HERO: ${hero}. ${scene}`,
    `CAMERA & SHOT: ${fmt}. ${shot}`,
    LIGHTING_BLOCK,
    styleFlavor,
    niche,
    `Emotion: ${psych.emotion}. Tone: ${psych.tone}.`,
    TYPOGRAPHY_ZONES,
    RENDER_QUALITY,
    MARKETING_FEEL,
    narrative,
    FINAL_OUTPUT,
  ]
    .filter(Boolean)
    .join(" ");

  return sanitizeExactTextFlyerPrompt(brief).slice(0, ELITE_MASTER_MAX_CHARS);
}
