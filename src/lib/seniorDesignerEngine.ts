import { ensureBusinessContactOnCopy } from "./businessContact";
import { formatBrandPaletteForImagenVisual } from "./brandColors";
import { getCampaignVisualStyle } from "./businessCampaign";
import type { CampaignCopy } from "./campaignTextLayers";
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
import type { EliteAdCreativePackage } from "./eliteAdCreativeDirector";
import {
  buildMasterPromptFromElitePackage,
  PREMIUM_COMMERCIAL_GRAPHIC_MOTIFS,
} from "./eliteAdCreativeDirector";
import {
  buildMobileExactCopyLayoutBlock,
  buildMobilePosterPromptBlocks,
} from "./mobileAdInImageLayout";
import { buildPremiumInImageTypographyBlock } from "./premiumInImageTypography";
import {
  buildPrintReadyAdvertisingBlock,
  PRINT_READY_FLYER_SYSTEM,
} from "./printReadyFlyerBrief";
import {
  buildTrendingSocialPromptBlocks,
  isTrendingSocialFlyerEnabled,
  TRENDING_SOCIAL_FLYER_SYSTEM,
} from "./trendingSocialFlyerSystem";
import {
  buildReferenceFlyerPromptBlock,
  isReferenceFlyerStyleEnabled,
  resolveReferenceFlyerStyle,
} from "./referenceFlyerStyle";
import { isSvgFlyerFooterMode } from "./flyerSvgFooterMode";
import { buildIntegratedContactTypesetBlock } from "./businessContact";
import { buildNoContactTextInImageBlock } from "./businessContact";
import {
  buildCampaignTypePromptBlock,
  buildCampaignTypePromptLead,
} from "./campaignTypeEngine";
import { buildCampaignMessagePrimaryBlock } from "./campaignMessagePrompt";
import { buildCtaFooterBalancePromptBlock } from "./flyerLayoutBalance";
import {
  assemblePromptWithAdherence,
  buildClientDirectiveReminder,
  buildClientMandatoryDirectiveBlock,
} from "./promptAdherence";
import type { BusinessProfile, VideoFormat } from "./types";

export const SENIOR_DESIGNER_MARKER = "SENIOR-FINISHED-AD";
export const SENIOR_SCENE_MARKER = "SENIOR-SCENE-PLATE";

export const SENIOR_DESIGNER_MAX_CHARS = 4000;

export const SENIOR_DESIGNER_PERSONA = [
  "Think as Creative Director, Senior Brand Designer, and Social Media Ad Strategist at Apple/Nike/Spotify/Stripe caliber.",
  "Deliver trending mobile-first flyers — centered hierarchy, cinematic depth, glass overlays, glowing CTA — NOT text pasted on a photo, NOT a template.",
].join(" ");

export const SENIOR_SCENE_PERSONA = [
  "Think as a human Creative Director at a top international agency: cast real people, style hero products, build perfect environments, and direct light like a luxury commercial shoot.",
  "Deliver a cinematic key visual with layered depth — NOT empty stock, NOT generic AI, NOT a plain gradient.",
].join(" ");

/**
 * Premium hybrid: rich scene plate + SVG typography overlay (off by default).
 * Default path: finished ad with copy typeset inside the generated image.
 */
export function isPremiumHybridFlyerEnabled(): boolean {
  const v = process.env.FLYER_PREMIUM_HYBRID?.trim().toLowerCase();
  if (v === "false" || v === "0" || v === "off") return false;
  if (v === "true" || v === "1" || v === "on" || v === "hybrid") return true;
  return false;
}

export type SeniorBusinessAnalysis = {
  industry: string;
  audience: string;
  emotionalAppeal: string;
  luxuryLevel: string;
  conversionGoal: string;
  marketingAngle: string;
};

export type SeniorCreativeConcept = {
  title: string;
  narrative: string;
};

export type SeniorVisualDirection = {
  composition: string;
  lighting: string;
  camera: string;
  typographyStyle: string;
  colorPalette: string;
  atmosphere: string;
  adStructure: string;
};

/** Full finished flyer in-image (typography + layout + CTA). Default for OpenAI. */
export function isFinishedFlyerDesignEnabled(): boolean {
  const v = process.env.FLYER_FINISHED_DESIGN?.trim().toLowerCase();
  if (v === "false" || v === "0" || v === "off" || v === "overlay" || v === "plate") {
    return false;
  }
  if (v === "true" || v === "1" || v === "on" || v === "finished" || v === "integrated") {
    return true;
  }
  const legacy = process.env.FLYER_OPENAI_INTEGRATED_DESIGN?.trim().toLowerCase();
  if (legacy === "true" || legacy === "1") return true;
  if (legacy === "false" || legacy === "0") return false;
  return true;
}

export function isSeniorDesignerPrompt(prompt: string): boolean {
  return (
    prompt.includes(SENIOR_DESIGNER_MARKER) ||
    prompt.includes(SENIOR_SCENE_MARKER) ||
    prompt.includes("ELITE-AGENCY-AD")
  );
}

export function isSeniorScenePlatePrompt(prompt: string): boolean {
  return prompt.includes(SENIOR_SCENE_MARKER);
}

/** STEP 1 — deep business analysis */
export function analyzeBusinessForDesign(
  business: BusinessProfile
): SeniorBusinessAnalysis {
  const psych = analyzeBrandPsychology(business);
  const industry = business.industry?.trim() || "professional services";

  let marketingAngle = "premium trust and desire to act";
  const ind = industry.toLowerCase();
  if (/crypto|fintech|finance/.test(ind)) {
    marketingAngle = "futuristic wealth, confidence, and momentum";
  } else if (/nightlife|club|bar/.test(ind)) {
    marketingAngle = "exclusive nightlife experience and FOMO";
  } else if (/real estate|property/.test(ind)) {
    marketingAngle = "aspirational lifestyle and elite property ownership";
  } else if (/auto|car|motor/.test(ind)) {
    marketingAngle = "cinematic automotive luxury and performance prestige";
  } else if (/fashion|beauty/.test(ind)) {
    marketingAngle = "modern fashion editorial and self-expression";
  } else if (/food|restaurant/.test(ind)) {
    marketingAngle = "premium culinary desire and unforgettable dining";
  } else if (/tech|saas|software/.test(ind)) {
    marketingAngle = "innovation leadership and business growth";
  }

  let luxuryLevel = "premium";
  if (/luxury|premium|exclusive|elite|vip/.test([business.tagline, business.campaignGoal].join(" "))) {
    luxuryLevel = "ultra-luxury";
  }

  return {
    industry,
    audience: business.targetAudience?.trim() || "discerning customers",
    emotionalAppeal: psych.emotion,
    conversionGoal: business.campaignGoal?.trim() || business.callToAction?.trim() || "conversions",
    marketingAngle,
    luxuryLevel,
  };
}

/** STEP 2 — creative concept (rules; Groq may refine title) */
export function buildCreativeConcept(
  business: BusinessProfile,
  analysis: SeniorBusinessAnalysis
): SeniorCreativeConcept {
  const style = resolvePremiumAdStyle(business);
  const name = business.businessName?.trim() || "the brand";

  const titles: Record<string, string> = {
    crypto: "Futuristic fintech domination",
    fintech: "Digital wealth elevation campaign",
    automotive: "Cinematic automotive luxury",
    fashion: "Modern fashion editorial",
    real_estate: "Elite property lifestyle",
    nightlife: "Luxury nightlife experience",
    restaurant: "Premium restaurant campaign",
    corporate: "Elite business growth campaign",
    premium_tech: "Next-generation innovation launch",
    luxury: "Ultra-luxury brand authority",
  };

  const title = titles[style.id] || `Premium ${analysis.industry} campaign`;

  return {
    title,
    narrative: `${title} for ${name}: ${analysis.marketingAngle}, ${analysis.emotionalAppeal}, ${style.aesthetic}.`,
  };
}

/** STEP 3 — visual direction */
export function buildVisualDirection(
  business: BusinessProfile,
  format: VideoFormat,
  analysis: SeniorBusinessAnalysis,
  concept: SeniorCreativeConcept
): SeniorVisualDirection {
  const style = resolvePremiumAdStyle(business);
  const shot = getProfessionalShotRecipe(business, format);
  const palette = formatBrandPaletteForImagenVisual(business);
  const niche = getNicheVisualAdaptation(business);
  const fmt = flyerFormatLabel(format);

  return {
    composition: `${style.composition}. Asymmetrical balance, foreground depth, midground hero, atmospheric background. Eye flow: headline → hero → CTA → contact. ${fmt}.`,
    lighting: `${style.lighting}. Cinematic rim light, volumetric glow, studio highlights, dramatic shadows, luxury grade.`,
    camera: shot.slice(0, 350),
    typographyStyle: `${style.typographyMood}. Professional digital typesetting — crisp InDesign-quality fonts, perfect kerning, bold headline, polished pill CTA — never hand-drawn or painted letters.`,
    colorPalette: palette,
    atmosphere: `${concept.title}. ${niche}. ${getCampaignVisualStyle(business)}. ${analysis.luxuryLevel} tier.`,
    adStructure:
      "Small clear band at top center reserved for brand logo (do not draw logo). Headline below that band, supporting text beneath, hero center-right, CTA mid-lower, contact footer — complete ad in one image.",
  };
}

export const LOGO_ZONE_RULES =
  "Do not render any brand logo, pictorial mark, or watermark in the image. Leave a small calm band at top center for logo overlay.";

/** People, environment, and Step 1 items — human CD direction */
function buildCastPropsAndSceneBlock(business: BusinessProfile): string {
  const scene = buildSceneElementsProse(business);
  const hero = describeHeroSubject(business);
  return [
    "CAST AND ENVIRONMENT (mandatory):",
    "Real diverse people with natural expressions and believable interaction with products.",
    "Foreground hero props, midground story, atmospheric background with depth and bokeh.",
    scene.slice(0, 520),
    `Hero subject direction: ${hero}.`,
    "Wardrobe and surfaces premium; no visible logos, text, or watermarks on clothing or props.",
  ].join(" ");
}

/** STEP 4 — master art-directed prompt */
export function buildMasterFinishedFlyerPrompt(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  userIdea?: string,
  groqConceptBoost?: string,
  groqVisualBoost?: string,
  elitePackage?: EliteAdCreativePackage,
  referenceStyleOverride?: import("./referenceFlyerStyle").ReferenceFlyerStyleId,
  campaignMessage = ""
): string {
  if (elitePackage?.finalImagePrompt?.trim()) {
    return buildMasterPromptFromElitePackage(
      business,
      copy,
      format,
      elitePackage,
      userIdea
    );
  }
  const analysis = analyzeBusinessForDesign(business);
  const concept = buildCreativeConcept(business, analysis);
  const visual = buildVisualDirection(business, format, analysis, concept);
  const style = resolvePremiumAdStyle(business);
  const castBlock = buildCastPropsAndSceneBlock(business);
  const name = business.businessName?.trim() || "Brand";
  const offer =
    business.tagline?.trim() ||
    business.campaignGoal?.trim() ||
    "premium offer";
  const safe = ensureBusinessContactOnCopy(copy, business);
  const mobile = buildMobilePosterPromptBlocks(business, safe, format);
  const svgFooter = isSvgFlyerFooterMode();
  const copyBlock = buildMobileExactCopyLayoutBlock(business, safe, {
    svgFooter,
    format,
  });
  const userPrompt = userIdea?.trim() ?? "";
  const clientDirective = buildClientMandatoryDirectiveBlock(business, userPrompt);
  const clientReminder = buildClientDirectiveReminder(userPrompt);
  const campaignBlock = buildCampaignTypePromptBlock(
    business,
    userPrompt,
    campaignMessage
  );
  const messageBlock = buildCampaignMessagePrimaryBlock(campaignMessage, business);
  const balanceBlock = buildCtaFooterBalancePromptBlock(business, format, safe);
  const printBrief = buildPrintReadyAdvertisingBlock(business, safe, format).slice(0, 1000);
  const trendingBlocks = isTrendingSocialFlyerEnabled()
    ? buildTrendingSocialPromptBlocks(
        business,
        safe,
        format,
        referenceStyleOverride
      )
    : null;
  const referenceBlock = isReferenceFlyerStyleEnabled()
    ? buildReferenceFlyerPromptBlock(
        business,
        safe,
        format,
        referenceStyleOverride
      )
    : "";

  const conceptLine = groqConceptBoost?.trim()
    ? `Creative concept (director): ${groqConceptBoost.slice(0, 400)}`
    : `Creative concept: ${concept.narrative}`;

  return assemblePromptWithAdherence([
    {
      priority: 101,
      id: "campaign-type-lead",
      content: buildCampaignTypePromptLead(business, userPrompt, campaignMessage),
    },
    { priority: 100, id: "markers", content: `${SENIOR_DESIGNER_MARKER} ${SENIOR_DESIGNER_PERSONA}` },
    { priority: 100, id: "client", content: clientDirective },
    ...(referenceBlock
      ? [{ priority: 100, id: "reference", content: referenceBlock.slice(0, 3200) }]
      : []),
    ...(svgFooter
      ? [
          {
            priority: 100,
            id: "no-contact",
            content: buildNoContactTextInImageBlock(business, format, safe),
          },
          { priority: 100, id: "balance", content: balanceBlock },
        ]
      : [
          {
            priority: 100,
            id: "contact-typeset",
            content: buildIntegratedContactTypesetBlock(business, safe, format),
          },
        ]),
    { priority: 100, id: "campaign-message", content: messageBlock },
    { priority: 99, id: "campaign", content: campaignBlock },
    { priority: 98, id: "trending", content: trendingBlocks ? `${trendingBlocks.system} ${trendingBlocks.artDirection}` : TRENDING_SOCIAL_FLYER_SYSTEM },
    { priority: 97, id: "copy", content: copyBlock },
    { priority: 96, id: "reminder", content: clientReminder },
    { priority: 95, id: "business", content: printBrief },
    {
      priority: 94,
      id: "scene",
      content: groqVisualBoost?.trim()
        ? `PRINT-READY SCENE: ${groqVisualBoost.trim().slice(0, 750)}`
        : castBlock,
    },
    { priority: 93, id: "typeset", content: buildPremiumInImageTypographyBlock(business) },
    { priority: 65, id: "layout", content: trendingBlocks ? `${trendingBlocks.layout} ${mobile.contrast}` : `${mobile.zoneBlueprint} ${mobile.contrast}` },
    { priority: 60, id: "steps", content: `CONCEPT: ${conceptLine}` },
    { priority: 55, id: "motifs", content: PREMIUM_COMMERCIAL_GRAPHIC_MOTIFS },
    { priority: 50, id: "logo", content: LOGO_ZONE_RULES },
    { priority: 40, id: "quality", content: mobile.quality },
    {
      priority: 100,
      id: "final",
      content: isReferenceFlyerStyleEnabled()
        ? `FINAL: Match client reference ${resolveReferenceFlyerStyle(business, referenceStyleOverride)} — premium integrated UI ad with 3D hero, glass panels, neon glow, typeset headline and CTA.`
        : "FINAL: Trending premium social flyer — cinematic hero, glowing CTA, art-directed mobile ad.",
    },
  ]);
}

/** Premium hybrid — cinematic scene plate; copy and logo added via SVG overlay */
export function buildMasterSceneOnlyPrompt(
  business: BusinessProfile,
  format: VideoFormat,
  userIdea?: string,
  groqConceptBoost?: string,
  groqVisualBoost?: string
): string {
  const analysis = analyzeBusinessForDesign(business);
  const concept = buildCreativeConcept(business, analysis);
  const visual = buildVisualDirection(business, format, analysis, concept);
  const style = resolvePremiumAdStyle(business);
  const castBlock = buildCastPropsAndSceneBlock(business);
  const name = business.businessName?.trim() || "Brand";
  const offer =
    business.tagline?.trim() ||
    business.campaignGoal?.trim() ||
    "premium offer";
  const idea = userIdea?.trim();
  const fmt = flyerFormatLabel(format);

  const conceptLine = groqConceptBoost?.trim()
    ? `Creative concept (director): ${groqConceptBoost.slice(0, 400)}`
    : `Creative concept: ${concept.narrative}`;

  const prompt = [
    SENIOR_SCENE_MARKER,
    SENIOR_SCENE_PERSONA,
    `Create a luxury cinematic advertising key visual for ${name}.`,
    `Industry: ${analysis.industry}. Offer: ${offer}. Audience: ${analysis.audience}.`,
    `Visual style: ${style.label} — ${getCampaignVisualStyle(business)}. Format ${fmt}.`,
    idea ? `Client direction: ${idea.slice(0, 280)}.` : "",
    `STEP 1 ANALYSIS: emotion ${analysis.emotionalAppeal}, goal ${analysis.conversionGoal}, angle ${analysis.marketingAngle}, luxury ${analysis.luxuryLevel}.`,
    `STEP 2 CONCEPT: ${conceptLine}`,
    `STEP 3 VISUAL DIRECTION: composition ${visual.composition} lighting ${visual.lighting} camera ${visual.camera} palette ${visual.colorPalette} atmosphere ${visual.atmosphere}`,
    groqVisualBoost?.trim()
      ? `GROQ CREATIVE DIRECTOR (scene & cast — follow closely): ${groqVisualBoost.trim().slice(0, 920)}`
      : "",
    castBlock,
    "COMPOSITION FOR OVERLAY: upper third clean negative space (soft sky, bokeh, or gradient) reserved for headline; hero people and props center and lower frame; cinematic asymmetry.",
    "ZERO-TEXT PLATE: absolutely no letters, numbers, words, signage, UI chrome, or watermarks anywhere in the image.",
    "LIGHTING: cinematic rim, volumetric glow, advertising photography, studio-quality shadows, luxury color grade.",
    "RENDER: octane-quality commercial photography, ultra-detailed textures, sharp hero focus, shallow depth of field, high-end social campaign.",
    "AVOID: empty backgrounds, flat lighting, clipart, random unrelated objects, crowded collage, generic stock, template look.",
    "FINAL: world-class luxury campaign key visual by a human creative director — perfect scene for premium typography overlay.",
  ]
    .filter(Boolean)
    .join(" ");

  return sanitizeExactTextFlyerPrompt(prompt).slice(0, SENIOR_DESIGNER_MAX_CHARS);
}

export type SeniorDesignPlan = {
  analysis: SeniorBusinessAnalysis;
  concept: SeniorCreativeConcept;
  visual: SeniorVisualDirection;
};

export function buildSeniorDesignPlan(
  business: BusinessProfile,
  format: VideoFormat
): SeniorDesignPlan {
  const analysis = analyzeBusinessForDesign(business);
  const concept = buildCreativeConcept(business, analysis);
  const visual = buildVisualDirection(business, format, analysis, concept);
  return { analysis, concept, visual };
}
