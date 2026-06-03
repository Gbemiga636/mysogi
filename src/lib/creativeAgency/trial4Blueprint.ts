/**
 * Trial 4 (Nexora Exchange) layout DNA — dense premium grid, glass panels,
 * 3D hero pedestal, stats bar, glowing CTA. Adapted per industry, same caliber.
 */

import type { CampaignCopy } from "../campaignTextLayers";
import { getBrandSecondary } from "../brandColors";
import { buildTypesetTextMasterRules } from "../businessContact";
import type { BusinessProfile, VideoFormat } from "../types";
import { FORMAT_RATIOS } from "../types";
import {
  buildNoAiLogoBlock,
  buildTrial4CtaLine,
  buildTrial4FooterReserveBlock,
  buildTrial4TopZoneLine,
} from "./agencyLayoutRules";
import { getIndustryDesignSystem, detectIndustryDesignKey } from "./industrySystems";
import type { AgencyBriefCore } from "./promptExpander";
import type { CreativeAgencyInput } from "./types";

export const TRIAL4_CALIBER_MARKER = "TRIAL-4-CALIBER-LAYOUT";

export { buildTrial4FooterReserveBlock } from "./agencyLayoutRules";

function brandAccents(business: BusinessProfile): { accent: string } {
  return {
    accent: getBrandSecondary(business) || "#6C5CE7",
  };
}

function scenePreamble(
  business: BusinessProfile,
  format: VideoFormat,
  label: string
): string {
  const name = business.businessName?.trim() || "the brand";
  return [
    `${TRIAL4_CALIBER_MARKER} — ${label} (${FORMAT_RATIOS[format].label}).`,
    `Finished premium campaign poster for ${name}.`,
    buildNoAiLogoBlock(),
  ].join("\n");
}

function sceneClosing(
  business: BusinessProfile,
  format: VideoFormat,
  copy: CampaignCopy,
  brief: AgencyBriefCore,
  extraForbidden?: string
): string {
  return [
    buildTypesetTextMasterRules(),
    buildTrial4FooterReserveBlock(business, format, copy),
    brief.artDirector.lighting,
    brief.artDirector.qualityBar,
    extraForbidden || "",
  ]
    .filter(Boolean)
    .join("\n");
}

function fintechScene(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  brief: AgencyBriefCore
): string {
  const headline = copy.headline?.trim() || "TRADE BEYOND LIMITS";
  const tagline = copy.tagline?.trim() || "The Future of Trading is Here";
  const cta = copy.cta?.trim() || "START TRADING NOW";

  return [
    scenePreamble(business, format, "Nexora Exchange fintech reference"),
    "Near-black UI canvas (#0a0e1a), electric blue and purple neon, cinematic volumetric lighting.",
    "",
    "MANDATORY LAYOUT (render every zone):",
    buildTrial4TopZoneLine(),
    `2. HEADLINE upper-left: "${headline.toUpperCase()}" — largest type; ONE keyword in blue-purple gradient, rest white bold sans.`,
    `3. SUBHEAD: "${tagline}" in lighter white sans.`,
    "4. CENTER HERO: three floating hyper-real 3D metallic crypto coins on circular glowing neon pedestal with floor reflection.",
    "5. BACKGROUND: candlestick chart grid at 12% opacity, digital mesh, depth haze.",
    "6. RIGHT: frosted glass Live Market panel — decorative price bars, no readable tickers.",
    "7. LEFT MID: three icon badges — Secure, Fast, Smart with labels.",
    "8. LEFT PROMO: frosted glass welcome-bonus card with glowing % numeral.",
    "9. STATS BAR (~48% from top): four metric cells on dark glass strip.",
    buildTrial4CtaLine(business, format, cta, copy),
    "11. TRUST ROW (~62% from top): four security badge icons with short caps labels (above footer reserve).",
    "12. Optional QR/badge shapes only above footer reserve — never in bottom calm band.",
    "",
    sceneClosing(business, format, copy, brief),
  ].join("\n");
}

function foodScene(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  brief: AgencyBriefCore
): string {
  const headline = copy.headline?.trim() || "TASTE THE DIFFERENCE";
  const tagline = copy.tagline?.trim() || "Fresh flavors, crafted daily";
  const cta = copy.cta?.trim() || "ORDER NOW";
  const { accent } = brandAccents(business);

  return [
    scenePreamble(business, format, "Trial-4 grid for food & restaurant"),
    "Warm cinematic food advertising — NOT a tech dashboard.",
    "",
    "MANDATORY LAYOUT:",
    buildTrial4TopZoneLine(),
    `2. HEADLINE: "${headline.toUpperCase()}" — one word in warm ${accent} gradient.`,
    `3. SUBHEAD: "${tagline}"`,
    "4. CENTER HERO: signature dish on glowing warm pedestal — steam, golden-hour rim light, shallow DOF.",
    "5. BACKGROUND: warm kitchen/restaurant bokeh.",
    "6. RIGHT: frosted glass Menu Highlights panel with three food slots.",
    "7. LEFT MID: Fresh, Fast, Local icon row.",
    "8. LEFT PROMO: glass offer card with discount numeral.",
    "9. STATS BAR (~48% from top): customers, rating, delivery time, years.",
    buildTrial4CtaLine(business, format, cta, copy),
    "",
    sceneClosing(
      business,
      format,
      copy,
      brief,
      "FORBIDDEN: crypto charts, trading UI, cold fintech neon, AI logos."
    ),
  ].join("\n");
}

function realEstateScene(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  brief: AgencyBriefCore
): string {
  const headline = copy.headline?.trim() || "LUXURY LIVING AWAITS";
  const tagline = copy.tagline?.trim() || "Your dream property starts here";
  const cta = copy.cta?.trim() || "BOOK A VIEWING";

  return [
    scenePreamble(business, format, "Trial-4 grid for real estate"),
    "Navy, ivory, champagne gold — architectural golden-hour hero.",
    "",
    "MANDATORY LAYOUT:",
    buildTrial4TopZoneLine(),
    `2. HEADLINE: "${headline.toUpperCase()}" — one keyword gold gradient.`,
    `3. SUBHEAD: "${tagline}"`,
    "4. CENTER HERO: luxury property exterior or interior on glowing pedestal staging.",
    "5. BACKGROUND: sky gradient, subtle city or landscape bokeh.",
    "6. RIGHT: glass panel with decorative price/amenity rows (no fake addresses).",
    "7. LEFT MID: Location, Premium, Trusted icon row.",
    "8. LEFT PROMO: glass open-house or offer card.",
    "9. STATS BAR: beds, sqft, rating, listings (decorative).",
    buildTrial4CtaLine(business, format, cta, copy),
    "",
    sceneClosing(business, format, copy, brief),
  ].join("\n");
}

function saasScene(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  brief: AgencyBriefCore
): string {
  const headline = copy.headline?.trim() || "WORK SMARTER";
  const tagline = copy.tagline?.trim() || "The platform teams love";
  const cta = copy.cta?.trim() || "START FREE TRIAL";

  return [
    scenePreamble(business, format, "Trial-4 grid for SaaS / tech"),
    "Charcoal matte, purple-blue mesh gradient, glass UI cards.",
    "",
    "MANDATORY LAYOUT:",
    buildTrial4TopZoneLine(),
    `2. HEADLINE: "${headline.toUpperCase()}"`,
    `3. SUBHEAD: "${tagline}"`,
    "4. CENTER HERO: floating laptop/phone mockups with abstract UI glow (no readable paragraphs).",
    "5. BACKGROUND: soft mesh gradient, wireframe accents.",
    "6. RIGHT: glass feature panel with three benefit rows.",
    "7. LEFT MID: Speed, Secure, Scale icons.",
    "8. LEFT PROMO: glass trial/pricing card.",
    "9. STATS BAR: users, uptime, integrations, rating.",
    buildTrial4CtaLine(business, format, cta, copy),
    "",
    sceneClosing(business, format, copy, brief),
  ].join("\n");
}

function healthcareScene(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  brief: AgencyBriefCore
): string {
  const headline = copy.headline?.trim() || "CARE YOU CAN TRUST";
  const tagline = copy.tagline?.trim() || "Compassionate experts, modern care";
  const cta = copy.cta?.trim() || "BOOK APPOINTMENT";

  return [
    scenePreamble(business, format, "Trial-4 grid for healthcare"),
    "Clinical clean whites, soft teal, caring photography.",
    "",
    "MANDATORY LAYOUT:",
    buildTrial4TopZoneLine(),
    `2. HEADLINE: "${headline.toUpperCase()}"`,
    `3. SUBHEAD: "${tagline}"`,
    "4. CENTER HERO: caring professional or wellness scene on soft-lit pedestal.",
    "5. BACKGROUND: calm clinic or wellness bokeh.",
    "6. RIGHT: glass services panel with three care lines.",
    "7. LEFT MID: Certified, Caring, Convenient icons.",
    "8. LEFT PROMO: glass checkup/offer card if applicable.",
    "9. STATS BAR: patients served, years, satisfaction, specialists.",
    buildTrial4CtaLine(business, format, cta, copy),
    "",
    sceneClosing(business, format, copy, brief, "FORBIDDEN: neon crypto, nightclub, aggressive sale clutter."),
  ].join("\n");
}

function retailScene(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  brief: AgencyBriefCore
): string {
  const headline = copy.headline?.trim() || "SHOP THE COLLECTION";
  const tagline = copy.tagline?.trim() || "Premium products, limited time";
  const cta = copy.cta?.trim() || "SHOP NOW";

  return [
    scenePreamble(business, format, "Trial-4 grid for e-commerce / retail"),
    "Product spotlight, bold offer energy, premium retail lighting.",
    "",
    "MANDATORY LAYOUT:",
    buildTrial4TopZoneLine(),
    `2. HEADLINE: "${headline.toUpperCase()}" — one word in promo accent gradient.`,
    `3. SUBHEAD: "${tagline}"`,
    "4. CENTER HERO: hero product cluster on glowing retail pedestal.",
    "5. BACKGROUND: studio gradient with soft spotlight.",
    "6. RIGHT: glass deal/product panel.",
    "7. LEFT MID: Free Shipping, Quality, Returns icons.",
    "8. LEFT PROMO: large sale % glass card.",
    "9. STATS BAR: happy buyers, products, rating, delivery.",
    buildTrial4CtaLine(business, format, cta, copy),
    "",
    sceneClosing(business, format, copy, brief),
  ].join("\n");
}

function fashionScene(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  brief: AgencyBriefCore
): string {
  const headline = copy.headline?.trim() || "DEFINE YOUR STYLE";
  const tagline = copy.tagline?.trim() || "New season collection";
  const cta = copy.cta?.trim() || "SHOP COLLECTION";

  return [
    scenePreamble(business, format, "Trial-4 grid for fashion & beauty"),
    "Editorial high-contrast photography, magazine cover energy.",
    "",
    "MANDATORY LAYOUT:",
    buildTrial4TopZoneLine(),
    `2. HEADLINE: "${headline.toUpperCase()}" — editorial serif or bold sans.`,
    `3. SUBHEAD: "${tagline}"`,
    "4. CENTER HERO: model or product macro on minimalist pedestal with rim light.",
    "5. BACKGROUND: soft gradient scrim or studio void.",
    "6. RIGHT: glass collection/details panel.",
    "7. LEFT MID: Craft, Quality, Trend icons.",
    "8. LEFT PROMO: glass drop/offer card.",
    "9. STATS BAR: collections, countries, materials, rating (decorative).",
    buildTrial4CtaLine(business, format, cta, copy),
    "",
    sceneClosing(business, format, copy, brief),
  ].join("\n");
}

function fitnessScene(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  brief: AgencyBriefCore
): string {
  const headline = copy.headline?.trim() || "UNLEASH YOUR POWER";
  const tagline = copy.tagline?.trim() || "Train harder, live stronger";
  const cta = copy.cta?.trim() || "JOIN NOW";

  return [
    scenePreamble(business, format, "Trial-4 grid for fitness & sports"),
    "High contrast, electric accent, athletic energy.",
    "",
    "MANDATORY LAYOUT:",
    buildTrial4TopZoneLine(),
    `2. HEADLINE: "${headline.toUpperCase()}"`,
    `3. SUBHEAD: "${tagline}"`,
    "4. CENTER HERO: athlete or equipment in dynamic action on glowing platform.",
    "5. BACKGROUND: gym arena bokeh, motion streaks subtle.",
    "6. RIGHT: glass program/membership panel.",
    "7. LEFT MID: Strength, Cardio, Community icons.",
    "8. LEFT PROMO: glass trial-week card.",
    "9. STATS BAR: members, coaches, classes, results.",
    buildTrial4CtaLine(business, format, cta, copy),
    "",
    sceneClosing(business, format, copy, brief),
  ].join("\n");
}

function genericPremiumScene(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  brief: AgencyBriefCore
): string {
  const industry = getIndustryDesignSystem(business);
  const headline = copy.headline?.trim() || business.businessName?.trim() || "YOUR BRAND";
  const tagline = copy.tagline?.trim() || "";
  const cta = copy.cta?.trim() || "GET STARTED";
  const { accent } = brandAccents(business);

  return [
    scenePreamble(business, format, `Trial-4 grid for ${industry.label}`),
    industry.visualMotifs,
    "",
    "MANDATORY LAYOUT:",
    buildTrial4TopZoneLine(),
    `2. HEADLINE: "${headline.toUpperCase()}" — accent word in ${accent} gradient.`,
    tagline ? `3. SUBHEAD: "${tagline}"` : "3. SUBHEAD: one line max 8 words.",
    `4. CENTER HERO: ${industry.heroSubjects}`,
    `5. BACKGROUND: ${industry.effects}`,
    "6. RIGHT: frosted glass info panel.",
    "7. LEFT MID: three feature icons with labels.",
    "8. LEFT PROMO: glass value/offer card.",
    "9. STATS/TRUST BAR (~48% from top): four benefit cells.",
    buildTrial4CtaLine(business, format, cta, copy),
    `Forbidden: ${industry.forbidden}. No AI logos.`,
    "",
    sceneClosing(business, format, copy, brief),
  ].join("\n");
}

const SCENE_BY_KEY: Record<
  string,
  (
    b: BusinessProfile,
    c: CampaignCopy,
    f: VideoFormat,
    brief: AgencyBriefCore
  ) => string
> = {
  crypto_fintech: fintechScene,
  food_restaurant: foodScene,
  real_estate: realEstateScene,
  saas_tech: saasScene,
  healthcare: healthcareScene,
  ecommerce_retail: retailScene,
  fashion_beauty: fashionScene,
  fitness_sports: fitnessScene,
  education: genericPremiumScene,
  travel_hospitality: genericPremiumScene,
  automotive: genericPremiumScene,
  nightlife_events: genericPremiumScene,
  legal_services: genericPremiumScene,
  construction_trades: genericPremiumScene,
  agriculture: genericPremiumScene,
  nonprofit: genericPremiumScene,
  energy_green: genericPremiumScene,
  media_podcast: genericPremiumScene,
  pets_services: genericPremiumScene,
  corporate_b2b: genericPremiumScene,
  default_premium: genericPremiumScene,
};

/** Full Trial-4-caliber scene spec — primary driver for the image model. */
export function buildTrial4MasterScene(
  input: CreativeAgencyInput,
  brief: AgencyBriefCore
): string {
  const key = detectIndustryDesignKey(input.business, input.userPrompt);
  const fn = SCENE_BY_KEY[key] ?? genericPremiumScene;
  return fn(input.business, input.copy, input.format, brief);
}

export function buildTrial4SceneParagraph(
  input: CreativeAgencyInput,
  brief: AgencyBriefCore
): string {
  const master = buildTrial4MasterScene(input, brief);
  const layoutLines = [
    brief.layout.heroSection,
    brief.layout.headlineZone,
    brief.layout.visualFocus,
    brief.layout.trustZone,
    brief.layout.ctaZone,
  ].join(" ");

  return `${master}\n\nLayout reinforcement: ${layoutLines}`.slice(0, 3200);
}
