import {
  buildCampaignCreativeAngle,
  getCampaignVisualStyle,
} from "./businessCampaign";
import { formatBrandPaletteForPrompt } from "./brandColors";
import { FLYER_RESERVED_ZONES_PROMPT } from "./flyerLayoutZones";
import {
  buildEliteAgencyImagenPrompt,
  ELITE_VISUAL_MARKETING_LANGUAGE,
} from "./eliteCreativeDirector";
import {
  finalizeImagenFlyerPrompt,
  stripQuotedCopyFromPrompt,
} from "./flyerTextGuard";
import {
  getProfessionalShotRecipe,
  PRO_AGENCY_COMPOSITION_RULES,
} from "./professionalFlyerVisuals";
import { flyerFormatLabel, industryFlyerVisuals } from "./flyerVisualCommon";
import type { BusinessProfile, VideoFormat } from "./types";

/** Injected into every agency-grade flyer prompt */
export const AD_AGENCY_VISUAL_LANGUAGE = [
  "premium advertising campaign style",
  "luxury flyer composition",
  "cinematic commercial lighting",
  "conversion-focused ad design",
  "hero product or service placement as focal point",
  "clear visual hierarchy for paid social",
  "offer highlight zone with subtle glow",
  "dedicated mid-lower glow band for post overlay",
  "clean negative-space bands for post-production overlays",
  "premium brand aesthetics",
  "magazine-quality marketing design",
  "realistic commercial photography style",
  "high-converting Instagram Facebook WhatsApp ad creative",
  "looks like a top Lagos or global agency-produced paid social ad not stock photography",
  "Behance-quality marketing layout, professional creative director approved",
].join(", ");

export type CreativeDirectorAnalysis = {
  businessCategory: string;
  audienceType: string;
  brandMood: string;
  flyerObjective: string;
  marketingComposition: string;
  visualHierarchy: string;
  advertisingStyle: string;
  heroSubject: string;
  shotNotes: string;
};

function inferBrandMood(business: BusinessProfile): string {
  const t = [
    business.tagline,
    business.campaignGoal,
    business.industry,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/luxury|premium|exclusive|elite|vip/.test(t)) {
    return "luxury, aspirational, high-end exclusivity";
  }
  if (/trust|secure|safe|reliable|professional/.test(t)) {
    return "trustworthy, credible, professional confidence";
  }
  if (/fast|quick|instant|now|today|urgent|sale|discount|offer/.test(t)) {
    return "urgent, energetic, conversion-driven excitement";
  }
  if (/warm|family|community|local|authentic/.test(t)) {
    return "warm, approachable, community-connected";
  }
  if (/bold|power|strong|leader/.test(t)) {
    return "bold, authoritative, market-leading";
  }
  return "premium, confident, conversion-focused";
}

function inferAudienceType(business: BusinessProfile): string {
  const a = (business.targetAudience || "").trim();
  if (a) return a;
  const ind = (business.industry || "").toLowerCase();
  if (/crypto|fintech|tech|saas/.test(ind)) {
    return "digitally savvy professionals and mobile-first investors";
  }
  if (/food|restaurant/.test(ind)) {
    return "local food lovers and families ordering online";
  }
  if (/fashion|beauty/.test(ind)) {
    return "style-conscious millennials and Gen Z shoppers";
  }
  return "Nigerian mobile-first consumers seeking quality and value";
}

function inferFlyerObjective(business: BusinessProfile, idea: string): string {
  if (idea.trim()) return idea.trim();
  if (business.campaignGoal?.trim()) return business.campaignGoal.trim();
  const cta = business.callToAction || "take action";
  return `Drive ${cta.toLowerCase()} for ${business.businessName || "the brand"}`;
}

function inferAdvertisingStyle(
  business: BusinessProfile,
  format: VideoFormat
): string {
  const ind = (business.industry || "").toLowerCase();
  const fmt =
    format === "9:16"
      ? "vertical story ad"
      : format === "1:1"
        ? "feed square ad"
        : "display banner ad";
  if (/food|restaurant/.test(ind)) {
    return `appetite appeal ${fmt}, food commercial photography, warm hero dish`;
  }
  if (/fashion|beauty/.test(ind)) {
    return `editorial fashion ${fmt}, beauty campaign gloss, model-product hero`;
  }
  if (/crypto|fintech|finance/.test(ind)) {
    return `fintech performance ${fmt}, trust + growth visual language`;
  }
  if (/real estate/.test(ind)) {
    return `luxury property ${fmt}, aspiration lifestyle commercial`;
  }
  return `high-converting DTC ${fmt}, performance marketing creative, scroll-stopping paid social`;
}

function inferHeroSubject(business: BusinessProfile): string {
  const ind = (business.industry || "").toLowerCase();
  if (/food|restaurant/.test(ind)) {
    return "hero dish or drink as the star product with supporting ambiance";
  }
  if (/fashion|beauty/.test(ind)) {
    return "hero product or styled model silhouette with product focus";
  }
  if (/crypto|fintech|finance/.test(ind)) {
    return "abstract finance hero: generic coins and chart lines without labels, blank glass UI panels";
  }
  if (/real estate/.test(ind)) {
    return "hero property exterior or interior as aspirational focal point";
  }
  if (/tech|saas|app/.test(ind)) {
    return "hero device mockup or software interface glow as product anchor";
  }
  return `hero visual embodying ${business.industry || "the service"} as the unmistakable focal point`;
}

/**
 * Creative director pre-analysis (runs before every flyer prompt).
 */
export function analyzeCampaignCreative(
  business: BusinessProfile,
  creativeIdea: string,
  format: VideoFormat
): CreativeDirectorAnalysis {
  const industry = business.industry?.trim() || "general business";
  const idea = buildCampaignCreativeAngle(business, creativeIdea);
  const visualStyle = getCampaignVisualStyle(business);

  return {
    businessCategory: `${industry} — ${visualStyle} category`,
    audienceType: inferAudienceType(business),
    brandMood: inferBrandMood(business),
    flyerObjective: inferFlyerObjective(business, idea),
    marketingComposition:
      "Full-bleed ad layout: top logo band in post, upper headline hierarchy, hero center-weighted, offer energy mid-lower, CTA conversion zone, footer contact strip — billboard balance",
    visualHierarchy:
      "Eye flow: top logo → headline band → hero product/service → offer highlight → CTA button → footer — scroll-stopping paid social",
    advertisingStyle: inferAdvertisingStyle(business, format),
    heroSubject: inferHeroSubject(business),
    shotNotes: [
      industryFlyerVisuals(industry),
      getProfessionalShotRecipe(business, format),
      formatBrandPaletteForPrompt(business),
    ].join(" "),
  };
}

export function formatCreativeDirectorBrief(
  analysis: CreativeDirectorAnalysis,
  business: BusinessProfile,
  format: VideoFormat
): string {
  return [
    "=== CREATIVE DIRECTOR BRIEF (paid social ad) ===",
    `1. Business category: ${analysis.businessCategory}`,
    `2. Audience: ${analysis.audienceType}`,
    `3. Brand mood: ${analysis.brandMood}`,
    `4. Flyer objective: ${analysis.flyerObjective}`,
    `5. Marketing composition: ${analysis.marketingComposition}`,
    `6. Visual hierarchy: ${analysis.visualHierarchy}`,
    `7. Advertising style: ${analysis.advertisingStyle}`,
    `Client: ${business.businessName || "Brand"} | Market: ${business.location || "Nigeria"} | Format: ${flyerFormatLabel(format)}`,
    `Hero subject: ${analysis.heroSubject}`,
    `Shot notes: ${analysis.shotNotes}`,
  ].join("\n");
}

/**
 * Build Imagen 4 prompt written like an ad agency visual plate brief.
 */
export function buildAgencyFlyerPrompt(
  business: BusinessProfile,
  creativeIdea: string,
  format: VideoFormat,
  _analysis?: CreativeDirectorAnalysis
): string {
  return buildEliteAgencyImagenPrompt(business, creativeIdea, format);
}

export function mergeUserBriefWithAgencyPrompt(
  userPrompt: string,
  business: BusinessProfile,
  format: VideoFormat
): string {
  if (userPrompt.trim().length < 20) {
    return buildEliteAgencyImagenPrompt(business, userPrompt, format);
  }

  return finalizeImagenFlyerPrompt(
    [
      buildEliteAgencyImagenPrompt(business, userPrompt, format),
      `Client visual direction: ${stripQuotedCopyFromPrompt(userPrompt.trim())}.`,
      AD_AGENCY_VISUAL_LANGUAGE + ".",
      ELITE_VISUAL_MARKETING_LANGUAGE + ".",
    ].join(" "),
    business
  );
}
