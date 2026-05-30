import {
  formatBrandPaletteForImagenVisual,
  formatBrandPaletteForPrompt,
} from "./brandColors";
import { getCampaignVisualStyle } from "./businessCampaign";
import { buildBusinessFlyerVisualPrompt } from "./flyerImagenVisualPrompt";
import { buildSceneElementsProse } from "./flyerSceneElements";
import { formatBusinessVisualMandate } from "./flyerZoneSpec";
import { flyerFormatLabel } from "./flyerVisualCommon";
import type { BusinessProfile, VideoFormat } from "./types";

/** Full creative-director identity — used for Groq prompt writing and Imagen briefs */
export const ELITE_CREATIVE_DIRECTOR_SYSTEM = `You are an elite creative director and luxury advertising designer trained in world-class marketing campaigns, billboard ads, luxury brand visuals, conversion-focused social media flyers, and premium commercial design.

Your job is NOT to generate ordinary images.
Your job is to create HIGH-CONVERTING MARKETING AD FLYERS that look designed by a premium advertising agency.

Before generating any prompt, think through: (1) brand analysis — what is sold, what emotion the buyer feels; (2) ad design strategy — hero, hierarchy, conversion zones; (3) visual marketing language; (4) composition rules; (5) industry adaptation; (6) world-class agency brief output.

MARKETING > ART. CONVERSION > DECORATION. BRAND PSYCHOLOGY > RANDOM BEAUTY.

Never output "generate flyer" — output a premium commercial campaign visual brief with ad psychology, visual hierarchy, cinematic lighting, and magazine-quality branding.`;

export const ELITE_VISUAL_MARKETING_LANGUAGE = [
  "cinematic commercial lighting",
  "premium luxury advertising campaign",
  "editorial magazine ad style",
  "rich shadows",
  "glossy premium reflections",
  "dramatic contrast",
  "hero product photography",
  "brand-centered composition",
  "elite luxury aesthetic",
  "campaign-quality flyer design",
  "social media ad excellence",
  "billboard commercial realism",
  "high-end conversion-focused design",
  "premium ad layout with clear visual hierarchy",
  "luxury color harmony",
  "cinematic ad photography",
  "polished luxury branding",
  "scroll-stopping paid social creative",
  "Behance Cannes agency campaign realism",
].join(", ");

export type BrandPsychology = {
  selling: string;
  emotion: string;
  tone: string;
};

export function analyzeBrandPsychology(business: BusinessProfile): BrandPsychology {
  const combined = [
    business.tagline,
    business.campaignGoal,
    business.industry,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let tone = "premium, confident, conversion-focused";
  let emotion = "trust and desire to act now";

  if (/luxury|premium|exclusive|elite|vip/.test(combined)) {
    tone = "luxury, exclusivity, elite";
    emotion = "aspiration, exclusivity, prestige";
  } else if (/nightlife|club|bar|party|event/.test(combined)) {
    tone = "nightlife, bold energy, premium glow";
    emotion = "excitement, FOMO, vibrant night energy";
  } else if (/crypto|fintech|finance/.test(combined)) {
    tone = "futuristic digital wealth, trust + momentum";
    emotion = "confidence, growth, secure prosperity";
  } else if (/real estate|property/.test(combined)) {
    tone = "architectural elegance, wealth psychology";
    emotion = "aspirational lifestyle, success, stability";
  } else if (/fashion|beauty/.test(combined)) {
    tone = "editorial fashion campaign";
    emotion = "desire, self-expression, style authority";
  } else if (/food|restaurant/.test(combined)) {
    tone = "appetite appeal, warm premium culinary";
    emotion = "craving, comfort, urgency to order";
  } else if (/corporate|b2b|consult|legal|account/.test(combined)) {
    tone = "trust, clean power, sophistication";
    emotion = "credibility, professionalism, confidence";
  } else if (/urgent|sale|discount|offer|fast/.test(combined)) {
    tone = "urgency, high-energy promotion";
    emotion = "excitement, fear of missing out";
  }

  const selling =
    business.campaignGoal?.trim() ||
    business.industry?.trim() ||
    "premium product or service";

  return { selling, emotion, tone };
}

export function getNicheVisualAdaptation(business: BusinessProfile): string {
  const ind = (business.industry || "").toLowerCase();
  const psych = analyzeBrandPsychology(business);

  if (/luxury|premium|jewel|watch|hotel/.test(ind)) {
    return "Luxury: premium cinematic, gold black teal deep contrast, rich shadows, elite composition, aspirational desire";
  }
  if (/real estate|property|estate/.test(ind)) {
    return "Real estate: architectural elegance, wealth psychology, aspirational lifestyle, golden hour property hero";
  }
  if (/crypto|blockchain|fintech|finance/.test(ind)) {
    return "Crypto/fintech: futuristic digital wealth, neon finance aesthetics, trust + momentum, sleek glass UI glow";
  }
  if (/nightlife|club|bar|lounge/.test(ind)) {
    return "Nightlife: moody premium lighting, bold glow, high energy, FOMO atmosphere";
  }
  if (/fashion|beauty|cosmetic/.test(ind)) {
    return "Fashion/beauty: editorial campaign style, glossy skin and product, runway lighting, desire-driven";
  }
  if (/corporate|b2b|consult|bank|insurance/.test(ind)) {
    return "Corporate: trust, clean power, sophistication, restrained premium palette";
  }
  if (/food|restaurant|catering|bakery/.test(ind)) {
    return "Food: appetite appeal, warm culinary hero, steam and texture, order-now energy";
  }

  return `Campaign tone: ${psych.tone} — evoke ${psych.emotion}`;
}

export function describeHeroSubject(business: BusinessProfile): string {
  const ind = (business.industry || "").toLowerCase();
  if (/food|restaurant/.test(ind)) {
    return "hero dish or signature drink as scroll-stopping product star, steam and texture, premium food commercial";
  }
  if (/fashion|beauty/.test(ind)) {
    return "hero product or editorial model moment, glossy campaign lighting, style authority";
  }
  if (/crypto|fintech|finance/.test(ind)) {
    return "futuristic finance hero — abstract growth visuals, glass UI glow, digital wealth mood without readable UI text";
  }
  if (/real estate|property/.test(ind)) {
    return "aspirational property hero — architecture, lifestyle, wealth psychology";
  }
  if (/tech|saas|app/.test(ind)) {
    return "hero device or software glow as product anchor, sleek innovation aesthetic";
  }
  if (/nightlife|club|bar/.test(ind)) {
    return "venue atmosphere hero — bottles, crowd energy, premium night glow";
  }
  return `hero visual embodying ${business.industry || "the service"} as unmistakable campaign focal point`;
}

/** Layer 1 — brand analysis for Imagen */
export function buildBrandAnalysisBlock(business: BusinessProfile): string {
  const psych = analyzeBrandPsychology(business);
  const name = business.businessName?.trim() || "the brand";
  return [
    "=== 1. BRAND ANALYSIS ===",
    `Selling: ${psych.selling}`,
    `Buyer emotion: ${psych.emotion}`,
    `Campaign tone: ${psych.tone}`,
    `Brand: ${name}${business.industry ? ` | ${business.industry}` : ""}`,
    business.targetAudience ? `Audience: ${business.targetAudience}` : "",
    business.location ? `Market: ${business.location}` : "",
    business.tagline ? `Brand mood line: ${business.tagline}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Layer 2 — ad design strategy */
export function buildAdDesignStrategyBlock(
  business: BusinessProfile,
  format: VideoFormat
): string {
  const hero = describeHeroSubject(business);
  const fmt = flyerFormatLabel(format);
  return [
    "=== 2. AD DESIGN STRATEGY ===",
    `Format: ${fmt} paid social / billboard-level composition — NOT random art or wallpaper.`,
    `Hero: ${hero}`,
    "Structure: strong hero subject | premium background supporting product | top logo band (empty for post) | headline hierarchy | offer/energy mid-lower | CTA conversion zone | balanced margins",
    "Goals: scroll-stopping thumb-stop, clear visual hierarchy, conversion-focused balance, magazine-quality campaign realism",
  ].join("\n");
}

/** Layer 4 — marketing composition (finished flyer or plate) */
export function buildMarketingCompositionBlock(exactTextMode: boolean): string {
  if (exactTextMode) {
    return [
      "=== 4. COMPOSITION (marketing hierarchy) ===",
      "TOP: empty logo band (real logo added in post)",
      "UPPER: headline + tagline typography zones — premium hierarchy, never crowded",
      "CENTER: hero product/service — cinematic focal point, busiest detail here only",
      "MID-LOWER: CTA button zone — high-contrast conversion design",
      "BOTTOM: location + contact footer — clean, readable, professional",
      "Eye flow: logo band → headline → hero → offer energy → CTA → footer. Generous spacing between bands.",
    ].join("\n");
  }
  return [
    "=== 4. COMPOSITION ===",
    "TOP: logo safe zone empty | UPPER: headline band empty | CENTER: hero focus | MID-LOWER: offer glow empty | BOTTOM: CTA/contact bands empty",
    "Marketing layout only — proper spacing for post overlays, never overcrowd.",
  ].join("\n");
}

/**
 * Full creative campaign block for exact-text finished flyers.
 * Pairs agency creativity with separate typography/compliance sections.
 */
export function buildExactTextCreativeCampaignBlock(
  business: BusinessProfile,
  format: VideoFormat,
  creativeBrief?: string
): string {
  const palette = formatBrandPaletteForImagenVisual(business);
  const niche = getNicheVisualAdaptation(business);
  const style = getCampaignVisualStyle(business);
  const idea =
    creativeBrief?.trim() ||
    business.campaignGoal?.trim() ||
    `Premium ${business.industry || "brand"} launch in ${business.location || "market"}`;

  return [
    "WORLD-CLASS AGENCY BRIEF — finished luxury marketing flyer (high-converting, not generic AI art).",
    "",
    buildBrandAnalysisBlock(business),
    "",
    buildAdDesignStrategyBlock(business, format),
    "",
    "=== 3. VISUAL MARKETING LANGUAGE ===",
    ELITE_VISUAL_MARKETING_LANGUAGE + ".",
    "",
    buildMarketingCompositionBlock(true),
    "",
    "=== 5. INDUSTRY ADAPTATION ===",
    niche + ".",
    `Industry visual direction: ${style}.`,
    `Color grade (lighting only, never as text): ${palette}.`,
    "",
    "=== 6. CREATIVE ANGLE ===",
    idea.slice(0, 500),
    "",
    buildSceneElementsProse(business),
  ].join("\n");
}

export function buildEliteAgencyImagenPrompt(
  business: BusinessProfile,
  creativeIdea: string,
  format: VideoFormat
): string {
  return buildBusinessFlyerVisualPrompt(business, format, creativeIdea);
}

export function formatEliteDirectorBriefForGroq(
  business: BusinessProfile,
  format: VideoFormat
): string {
  const psych = analyzeBrandPsychology(business);
  return [
    buildBrandAnalysisBlock(business),
    buildAdDesignStrategyBlock(business, format),
    `Visual language: ${ELITE_VISUAL_MARKETING_LANGUAGE}`,
    buildMarketingCompositionBlock(false),
    `Industry: ${getNicheVisualAdaptation(business)}`,
    `Hero: ${describeHeroSubject(business)}`,
    `Palette (lighting): ${formatBrandPaletteForPrompt(business)}`,
    `Psychology summary: sell ${psych.selling}, feel ${psych.emotion}`,
    "Output: text-free Imagen plate — Cloudinary adds copy + logo",
  ].join("\n");
}
