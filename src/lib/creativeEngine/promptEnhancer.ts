import { buildCampaignTypePromptLead } from "../campaignTypeEngine";
import { resolveMobileAdPreset } from "../mobileAdPresets";
import type { BusinessProfile, VideoFormat } from "../types";

const INDUSTRY_VISUALS: Record<string, string> = {
  restaurant:
    "Luxury modern restaurant flyer with cinematic food photography, warm ambient lighting, premium typography, elegant CTA section, dark luxury background, realistic shadows, editorial composition, upscale dining aesthetic",
  fintech:
    "Trial 4 NEXORA EXCHANGE reference — dark fintech UI ad with 3D crypto/product icons, candlestick chart background, glassmorphism panels, gradient headline word, neon blue-purple glow, START TRADING style CTA",
  real_estate:
    "Luxury real estate campaign with golden hour architecture, navy and gold palette, refined serif headline energy, dramatic sky gradient, Sotheby's editorial composition",
  fashion:
    "High-fashion editorial ad with full-bleed model, minimal glass type panel, high contrast flash lighting, Balenciaga/Nike campaign polish",
  saas:
    "Trial 4 NEXORA-style premium fintech UI ad — near-black background, blue-purple neon, 3D floating icons on glowing pedestal, glass Live Market panel, stats bar, glowing CTA pill, dense Behance-quality grid layout",
  health:
    "Clean clinical wellness campaign with soft healing light, emerald trust accents, calm whitespace, premium healthcare brand polish",
  default:
    "Premium modern brand campaign with cinematic depth, glass typography panels, ambient glow, geometric decoration, luxury spacing, Behance-quality art direction",
};

function detectIndustryKey(industry: string): string {
  const ind = industry.toLowerCase();
  if (/food|restaurant|catering|chef|dining/.test(ind)) return "restaurant";
  if (/fintech|finance|bank|crypto|trading/.test(ind)) return "fintech";
  if (/real estate|property|estate/.test(ind)) return "real_estate";
  if (/fashion|beauty|cosmetic/.test(ind)) return "fashion";
  if (/saas|software|tech|app|startup|ai/.test(ind)) return "saas";
  if (/health|medical|wellness|clinic/.test(ind)) return "health";
  return "default";
}

/**
 * Transform simple user/business input into elite creative direction (internal prompt).
 */
export function enhanceCreativeDirection(
  business: BusinessProfile,
  userPrompt: string,
  format: VideoFormat,
  campaignMessage = ""
): string {
  const preset = resolveMobileAdPreset(business);
  const industryKey = detectIndustryKey(business.industry || "");
  const baseVisual = INDUSTRY_VISUALS[industryKey] || INDUSTRY_VISUALS.default;
  const name = business.businessName?.trim() || "the brand";
  const props = business.imageProps?.trim();
  const audience = business.targetAudience?.trim();
  const location = business.location?.trim();

  const parts = [
    buildCampaignTypePromptLead(business, userPrompt, campaignMessage),
    baseVisual,
    `Brand: ${name}. Format: ${format}. Style preset: ${preset.label} (${preset.reference}).`,
    `Composition: ${preset.composition}. Grade: ${preset.colorGrade}. Overlays: ${preset.overlayStyle}.`,
    audience ? `Audience: ${audience}.` : "",
    location ? `Market context: ${location} (visual mood only, never typeset).` : "",
    props ? `Mandatory visual elements: ${props}.` : "",
    userPrompt.trim()
      ? `Client creative direction: ${userPrompt.trim()}`
      : business.tagline?.trim()
        ? `Brand mood: ${business.tagline.trim()}`
        : "",
    "Center-aligned typography stack, business name as hero headline, cinematic depth, export-ready agency quality.",
  ];

  return parts.filter(Boolean).join(" ");
}

export function buildPromptEnhancementBlock(
  business: BusinessProfile,
  userPrompt: string,
  format: VideoFormat,
  campaignMessage = ""
): string {
  const enhanced = enhanceCreativeDirection(
    business,
    userPrompt,
    format,
    campaignMessage
  );
  return `ENHANCED CREATIVE DIRECTION (implement faithfully):\n${enhanced}`;
}
