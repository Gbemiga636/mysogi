/**
 * Elite AI Creative Director — agency-grade ad concepts for GPT Image 1.
 * Structured phases: concept → art direction → typography → final prompt → negative.
 */

import { buildBusinessContactParts, ensureBusinessContactOnCopy } from "./businessContact";
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
import {
  buildMobileExactCopyLayoutBlock,
  buildMobilePosterPromptBlocks,
} from "./mobileAdInImageLayout";
import { resolveMobileAdPreset } from "./mobileAdPresets";
import { FORMAT_RATIOS } from "./types";
import {
  assemblePromptWithAdherence,
  buildClientDirectiveReminder,
  buildClientMandatoryDirectiveBlock,
  condenseForClientPriority,
  hasExplicitClientPrompt,
} from "./promptAdherence";
import { resolvePremiumAdStyle } from "./premiumFlyerEngine";
import { getProfessionalShotRecipe } from "./professionalFlyerVisuals";
import {
  analyzeBusinessForDesign,
  buildCreativeConcept,
  buildVisualDirection,
  LOGO_ZONE_RULES,
  SENIOR_DESIGNER_MARKER,
  SENIOR_DESIGNER_MAX_CHARS,
} from "./seniorDesignerEngine";
import { buildPremiumInImageTypographyBlock } from "./premiumInImageTypography";
import {
  buildPrintReadyAdvertisingBlock,
  formatImagePromptProfile,
  PRINT_READY_FLYER_SYSTEM,
} from "./printReadyFlyerBrief";
import {
  CONTACT_TEXT_NEGATIVE_PROMPT,
  buildNoContactTextInImageBlock,
} from "./businessContact";
import { buildCtaFooterBalancePromptBlock } from "./flyerLayoutBalance";
import { isSvgFlyerFooterMode } from "./flyerSvgFooterMode";
import {
  buildTrendingSocialPromptBlocks,
  isTrendingSocialFlyerEnabled,
  TRENDING_NEGATIVE_AESTHETIC,
  TRENDING_SOCIAL_FLYER_SYSTEM,
} from "./trendingSocialFlyerSystem";
import type { BusinessProfile, VideoFormat } from "./types";

export const ELITE_AGENCY_MARKER = "ELITE-AGENCY-AD";

export const ELITE_AD_CREATIVE_DIRECTOR_SYSTEM = `You are an elite AI Creative Director and premium advertisement designer.

Your job is NOT to simply generate image prompts. You create world-class commercial ad concepts comparable to luxury agencies, Apple campaigns, high-end crypto brands, premium automotive ads, Netflix key art, and billion-dollar startup launch creatives.

You must NEVER create generic "text on image" posters or flat Canva-style layouts.

You think and operate like: Senior Art Director, Brand Strategist, Luxury Marketing Expert, Cinematic Photographer, Typography Specialist, Conversion Copywriter, UI/UX Visual Designer, High-End CGI Product Advertiser.

PRIMARY OBJECTIVE: Highly cinematic, visually layered, premium advertisements with strong hierarchy, luxury composition, believable lighting, premium typography integrated into the layout, emotional marketing psychology, realistic depth, rich environments, conversion-focused layouts, and social-media polish.

BEFORE THE FINAL PROMPT you analyze brand positioning, art direction, composition, lighting, typography hierarchy, focal point, color psychology, cinematic depth, premium design motifs (glass panels, geometric accents, gradient meshes, pill CTAs), and realism level.

COMPOSITION MUST INCLUDE: clear focal subject, foreground/midground/background separation, cinematic lighting, premium reflections, realistic shadows, atmospheric depth, luxury spacing, visual balance, layered composition, elegant typography integration, believable environment.

AVOID: floating random text, flat compositions, empty backgrounds, generic gradients, cheap effects, overexposed neon, low-detail renders, cluttered layouts, simple posters without graphic design layers.`;

/** Premium flyer graphic layers — shapes, glass, UI depth */
export const PREMIUM_COMMERCIAL_GRAPHIC_MOTIFS = [
  "PREMIUM COMMERCIAL GRAPHIC LAYER (mandatory — real agency flyer, not a plain photo with text):",
  "Integrate frosted glass morphism panels, subtle geometric accent shapes (diagonal light streaks, thin arcs, minimal hex grid at low opacity),",
  "premium pill-shaped CTA button with depth and inner glow, optional holographic UI frame or floating product card where appropriate,",
  "corner gradient mesh or cinematic vignette, layered Z-depth like Netflix key art or Apple launch posters — photo base, atmosphere, graphic accents, typeset copy on top.",
].join(" ");

export type EliteAdArtDirection = {
  lighting: string;
  environment: string;
  composition: string;
  mood: string;
  camera: string;
  colorPalette: string;
};

export type EliteAdTypographyStrategy = {
  headlinePlacement: string;
  fontStyle: string;
  ctaTreatment: string;
  hierarchy: string;
};

export type EliteAdCreativePackage = {
  creativeConcept: string;
  artDirection: EliteAdArtDirection;
  typographyStrategy: EliteAdTypographyStrategy;
  finalImagePrompt: string;
  negativePrompt: string;
};

export type EliteAdBriefInputs = {
  brandName: string;
  industry: string;
  productOrService: string;
  targetAudience: string;
  desiredEmotion: string;
  visualStyle: string;
  headline: string;
  offerCta: string;
  colors: string;
  platform: string;
  orientation: string;
  luxuryLevel: string;
  referenceStyle: string;
  imageProps: string;
  clientIdea: string;
  stylePreset: string;
};

export function inferReferenceStyle(business: BusinessProfile): string {
  const ind = (business.industry || "").toLowerCase();
  if (/crypto|web3|blockchain/.test(ind)) return "Binance / premium fintech launch";
  if (/fintech|finance|bank/.test(ind)) return "Apple keynote meets Goldman digital";
  if (/auto|car|motor/.test(ind)) return "Mercedes-Benz cinematic campaign";
  if (/fashion|beauty/.test(ind)) return "Balenciaga editorial / Vogue";
  if (/real estate|property/.test(ind)) return "Sotheby's luxury property";
  if (/nightlife|club|bar/.test(ind)) return "Premium nightlife / Rolex evening";
  if (/tech|saas|software|app/.test(ind)) return "Apple product launch minimalism";
  if (/food|restaurant/.test(ind)) return "Michelin-star culinary campaign";
  return "Netflix key art meets Apple Services launch";
}

export function gatherEliteAdBriefInputs(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  userIdea?: string
): EliteAdBriefInputs {
  const analysis = analyzeBusinessForDesign(business);
  const psych = analyzeBrandPsychology(business);
  const safe = ensureBusinessContactOnCopy(copy, business);
  const style = resolvePremiumAdStyle(business);
  const fmt = FORMAT_RATIOS[format];
  const preset = resolveMobileAdPreset(business);

  return {
    brandName: business.businessName?.trim() || "Brand",
    industry: analysis.industry,
    productOrService:
      business.campaignGoal?.trim() ||
      business.tagline?.trim() ||
      `${analysis.industry} offering`,
    targetAudience: analysis.audience,
    desiredEmotion: psych.emotion || analysis.emotionalAppeal,
    visualStyle: `${style.label} — ${getCampaignVisualStyle(business)}`,
    headline: safe.headline,
    offerCta: safe.cta || business.callToAction?.trim() || "Learn more",
    colors: formatBrandPaletteForImagenVisual(business),
    platform: fmt.label,
    orientation: format,
    luxuryLevel: analysis.luxuryLevel,
    referenceStyle: inferReferenceStyle(business),
    imageProps: business.imageProps?.trim() || "",
    clientIdea:
      userIdea?.trim() ||
      business.campaignGoal?.trim() ||
      business.tagline?.trim() ||
      "",
    stylePreset: preset.label,
  };
}

export function formatEliteAdBriefForGroq(
  inputs: EliteAdBriefInputs,
  business?: BusinessProfile,
  copy?: CampaignCopy,
  format?: VideoFormat
): string {
  if (business && copy && format) {
    return formatImagePromptProfile(business, copy, format);
  }
  return [
    `Brand: ${inputs.brandName}`,
    `Industry: ${inputs.industry}`,
    `Product/Service: ${inputs.productOrService}`,
    `Audience: ${inputs.targetAudience}`,
    `Emotion: ${inputs.desiredEmotion}`,
    `Visual style: ${inputs.visualStyle}`,
    `Headline (exact): ${inputs.headline}`,
    `CTA (exact): ${inputs.offerCta}`,
    `Colors (grade only, never spell hex): ${inputs.colors}`,
    `Platform: ${inputs.platform} (${inputs.orientation})`,
    `Luxury level: ${inputs.luxuryLevel}`,
    `Reference aesthetic: ${inputs.referenceStyle}`,
    `Style preset: ${inputs.stylePreset}`,
    inputs.imageProps ? `Mandatory visual elements: ${inputs.imageProps}` : "",
    inputs.clientIdea ? `Client creative direction: ${inputs.clientIdea}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function parseEliteAdCreativePackageJson(
  raw: string
): Partial<EliteAdCreativePackage> | null {
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    const str = (k: string) =>
      typeof obj[k] === "string" ? (obj[k] as string).trim() : "";
    const art = (obj.artDirection as Record<string, unknown>) || {};
    const typo = (obj.typographyStrategy as Record<string, unknown>) || {};
    const pickArt = (k: string) =>
      typeof art[k] === "string" ? (art[k] as string).trim() : "";
    const pickTypo = (k: string) =>
      typeof typo[k] === "string" ? (typo[k] as string).trim() : "";

    return {
      creativeConcept: str("creativeConcept"),
      artDirection: {
        lighting: pickArt("lighting"),
        environment: pickArt("environment"),
        composition: pickArt("composition"),
        mood: pickArt("mood"),
        camera: pickArt("camera"),
        colorPalette: pickArt("colorPalette"),
      },
      typographyStrategy: {
        headlinePlacement: pickTypo("headlinePlacement"),
        fontStyle: pickTypo("fontStyle"),
        ctaTreatment: pickTypo("ctaTreatment"),
        hierarchy: pickTypo("hierarchy"),
      },
      finalImagePrompt: str("finalImagePrompt"),
      negativePrompt: str("negativePrompt"),
    };
  } catch {
    return null;
  }
}

export function buildRulesBasedEliteAdPackage(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  userIdea?: string
): EliteAdCreativePackage {
  const inputs = gatherEliteAdBriefInputs(business, copy, format, userIdea);
  const analysis = analyzeBusinessForDesign(business);
  const concept = buildCreativeConcept(business, analysis);
  const visual = buildVisualDirection(business, format, analysis, concept);
  const style = resolvePremiumAdStyle(business);
  const scene = buildSceneElementsProse(business);
  const hero = describeHeroSubject(business);
  const shot = getProfessionalShotRecipe(business, format);
  const niche = getNicheVisualAdaptation(business);
  const fmt = flyerFormatLabel(format);

  return {
    creativeConcept: `${concept.title}: ${concept.narrative}`.slice(0, 400),
    artDirection: {
      lighting: visual.lighting,
      environment: `${scene.slice(0, 200)} ${niche}`.slice(0, 280),
      composition: visual.composition,
      mood: visual.atmosphere,
      camera: shot.slice(0, 200),
      colorPalette: inputs.colors,
    },
    typographyStrategy: {
      headlinePlacement:
        "Center aligned — large headline on glass/gradient panel, vertical stack on center axis",
      fontStyle: `${visual.typographyStyle} Inter/Poppins/SF Pro typeset — never hand-drawn.`,
      ctaTreatment: `${style.typographyMood} — glowing rounded pill, center lower-third, high contrast label`,
      hierarchy:
        "Business name as hero headline XL center → subhead M → glowing CTA → calm footer band",
    },
    finalImagePrompt: [
      userIdea?.trim()
        ? `Implement client request exactly: ${userIdea.trim().slice(0, 420)}.`
        : "",
      `Print-ready commercial flyer for ${inputs.brandName} (${inputs.industry}) targeting ${inputs.targetAudience}.`,
      `Luxury ${inputs.referenceStyle} advertising artwork.`,
      `${hero}. ${scene.slice(0, 300)}`,
      `${visual.lighting} ${visual.composition}`,
      `Camera ${shot.slice(0, 120)}. Format ${fmt}.`,
      PREMIUM_COMMERCIAL_GRAPHIC_MOTIFS,
      `Emotion: ${inputs.desiredEmotion}. Cinematic depth, volumetric light, ray-traced reflections, hyper-detailed materials.`,
    ].join(" "),
    negativePrompt:
      "flat poster, generic gradient background, hand-drawn text, painted letters, floating random text, cheap neon, clipart, empty scene, Canva template, low detail, warped typography, fake logo, watermark, amateur layout, text over faces, misaligned text, " +
      CONTACT_TEXT_NEGATIVE_PROMPT +
      ", " +
      TRENDING_NEGATIVE_AESTHETIC,
  };
}

export function formatElitePackageForDisplay(pkg: EliteAdCreativePackage): string {
  const ad = pkg.artDirection;
  const ty = pkg.typographyStrategy;
  return [
    "1. CREATIVE CONCEPT",
    pkg.creativeConcept,
    "",
    "2. ART DIRECTION",
    `Lighting: ${ad.lighting}`,
    `Environment: ${ad.environment}`,
    `Composition: ${ad.composition}`,
    `Mood: ${ad.mood}`,
    `Camera: ${ad.camera}`,
    `Color palette: ${ad.colorPalette}`,
    "",
    "3. TYPOGRAPHY STRATEGY",
    `Headline: ${ty.headlinePlacement}`,
    `Fonts: ${ty.fontStyle}`,
    `CTA: ${ty.ctaTreatment}`,
    `Hierarchy: ${ty.hierarchy}`,
    "",
    "4. FINAL IMAGE PROMPT",
    pkg.finalImagePrompt,
    "",
    "5. NEGATIVE PROMPT",
    pkg.negativePrompt,
  ].join("\n");
}


/**
 * Merge Groq elite package + exact copy into GPT Image 1 master prompt.
 */
export function buildMasterPromptFromElitePackage(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  pkg: EliteAdCreativePackage,
  rawUserPrompt?: string
): string {
  const userPrompt = rawUserPrompt?.trim() ?? "";
  const inputs = gatherEliteAdBriefInputs(business, copy, format, userPrompt);
  const safe = ensureBusinessContactOnCopy(copy, business);
  const mobile = buildMobilePosterPromptBlocks(business, safe, format);
  const svgFooter = isSvgFlyerFooterMode();
  const copyBlock = buildMobileExactCopyLayoutBlock(business, safe, {
    svgFooter,
    format,
  });
  const clientDirective = buildClientMandatoryDirectiveBlock(business, userPrompt);
  const clientReminder = buildClientDirectiveReminder(userPrompt);
  const ad = pkg.artDirection;
  const ty = pkg.typographyStrategy;

  const printReady = buildPrintReadyAdvertisingBlock(business, safe, format);
  const trendingBlocks = isTrendingSocialFlyerEnabled()
    ? buildTrendingSocialPromptBlocks(business, safe, format)
    : null;

  const scenePrompt = condenseForClientPriority(
    pkg.finalImagePrompt,
    userPrompt,
    hasExplicitClientPrompt(userPrompt) ? 750 : 1200
  );

  const artDirection = condenseForClientPriority(
    `ART DIRECTION — Lighting: ${ad.lighting} Environment: ${ad.environment} Composition: ${ad.composition} Mood: ${ad.mood} Camera: ${ad.camera} Colors: ${ad.colorPalette}`,
    userPrompt,
    480
  );

  return assemblePromptWithAdherence([
    { priority: 100, id: "markers", content: `${SENIOR_DESIGNER_MARKER} ${ELITE_AGENCY_MARKER}` },
    { priority: 100, id: "client", content: clientDirective },
    ...(svgFooter
      ? [
          {
            priority: 100,
            id: "no-contact",
            content: buildNoContactTextInImageBlock(business, format, safe),
          },
          {
            priority: 100,
            id: "balance",
            content: buildCtaFooterBalancePromptBlock(business, format, safe),
          },
        ]
      : []),
    {
      priority: 99,
      id: "trending",
      content: trendingBlocks
        ? `${trendingBlocks.system} ${trendingBlocks.artDirection}`
        : PRINT_READY_FLYER_SYSTEM,
    },
    { priority: 98, id: "copy", content: copyBlock },
    { priority: 97, id: "reminder", content: clientReminder },
    {
      priority: 96,
      id: "scene",
      content: hasExplicitClientPrompt(userPrompt)
        ? `AD SCENE (print-ready, match client + Step 1 profile): ${scenePrompt}`
        : `PRINT-READY AD ARTWORK: ${scenePrompt}`,
    },
    {
      priority: 95,
      id: "business",
      content: printReady.slice(0, 1100),
    },
    { priority: 94, id: "typeset", content: buildPremiumInImageTypographyBlock(business) },
    { priority: 70, id: "meta", content: `Campaign ${inputs.brandName} | ${inputs.industry} | Preset ${mobile.preset.label}` },
    { priority: 65, id: "layout", content: trendingBlocks ? `${trendingBlocks.layout} ${mobile.contrast}` : `${mobile.zoneBlueprint} ${mobile.contrast}` },
    { priority: 55, id: "concept", content: `CREATIVE CONCEPT: ${pkg.creativeConcept.slice(0, 320)}` },
    { priority: 50, id: "art", content: artDirection },
    {
      priority: 48,
      id: "typo",
      content: `TYPOGRAPHY — ${ty.headlinePlacement} ${ty.fontStyle} ${ty.ctaTreatment} ${ty.hierarchy}`,
    },
    { priority: 45, id: "motifs", content: PREMIUM_COMMERCIAL_GRAPHIC_MOTIFS },
    { priority: 40, id: "logo", content: LOGO_ZONE_RULES },
    { priority: 35, id: "quality", content: mobile.quality },
    {
      priority: 30,
      id: "negative",
      content: `AVOID: ${pkg.negativePrompt}. ${CONTACT_TEXT_NEGATIVE_PROMPT}. Contradicting client directive, wrong industry, hand-drawn text, generic stock poster, contact text in image.`,
    },
    {
      priority: 100,
      id: "final",
      content:
        "FINAL: Trending premium social flyer — centered hierarchy, cinematic depth, art-directed layout, viral mobile ad quality.",
    },
  ]);
}

export function isEliteAgencyPrompt(prompt: string): boolean {
  return prompt.includes(ELITE_AGENCY_MARKER);
}
