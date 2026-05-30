/**
 * Print-ready commercial flyer brief — uses full Step 1 + generated copy to drive the ad image.
 */

import { buildNoContactTextInImageBlock } from "./businessContact";
import { businessNameHeadlinePrompt } from "./campaignGoalImageGuard";
import { getCampaignTypeLabel } from "./campaignProfile";
import { describeHexAsVisualColor, getBrandPrimary, getBrandSecondary } from "./brandColors";
import { formatBusinessCampaignBrief } from "./businessCampaign";
import type { CampaignCopy } from "./campaignTextLayers";
import { resolveMobileAdPreset } from "./mobileAdPresets";
import {
  buildTrendingArtDirectorBlock,
  isTrendingSocialFlyerEnabled,
  TRENDING_SOCIAL_FLYER_SYSTEM,
} from "./trendingSocialFlyerSystem";
import type { BusinessProfile, VideoFormat } from "./types";
import { FORMAT_RATIOS } from "./types";

const PRINT_GRAPHIC_MOTIFS =
  "Layered ad design: frosted glass panels, geometric accents, gradient meshes, premium CTA pill with depth, Z-layered photo + graphics + typeset copy.";

export const PRINT_READY_FLYER_SYSTEM = [
  "PRINT-READY COMMERCIAL FLYER (not a random AI picture — a finished advertisement):",
  "Design like a senior art director delivering final art to a printer: precise grid, intentional hierarchy,",
  "every element placed for conversion, industry-authentic photography, professional typeset layers,",
  "graphic shapes (panels, rules, pills, soft gradients) supporting the message.",
  "The result must look like paid Meta/Google display creative or a professional print flyer — ready to publish.",
].join(" ");

export function formatCompleteStep1Profile(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat
): string {
  const preset = resolveMobileAdPreset(business);
  const primary = describeHexAsVisualColor(getBrandPrimary(business));
  const accent = describeHexAsVisualColor(getBrandSecondary(business));

  const lines = [
    "=== STEP 1 BUSINESS PROFILE (use ALL fields — this defines the entire ad) ===",
    `Business name: ${business.businessName?.trim() || "(required)"}`,
    business.tagline?.trim() ? `Brand tagline / promise: ${business.tagline.trim()}` : "",
    business.industry?.trim() ? `Industry: ${business.industry.trim()}` : "",
    business.targetAudience?.trim()
      ? `Target audience: ${business.targetAudience.trim()}`
      : "",
    getCampaignTypeLabel(business)
      ? `Campaign type: ${getCampaignTypeLabel(business)}`
      : "",
    business.location?.trim() ? `Market / location: ${business.location.trim()}` : "",
    business.callToAction?.trim() ? `Primary CTA: ${business.callToAction.trim()}` : "",
    business.phone?.trim() ? `Phone: ${business.phone.trim()}` : "",
    business.email?.trim() ? `Email: ${business.email.trim()}` : "",
    business.website?.trim() ? `Website: ${business.website.trim()}` : "",
    `Brand color grade: primary ${primary}, accent ${accent} (use on panels, CTA, accents — never as hex text)`,
    `Ad style preset: ${preset.label} (${preset.reference})`,
    business.imageProps?.trim()
      ? `Mandatory visuals / props / people: ${business.imageProps.trim()}`
      : "",
    `Format: ${format} — ${FORMAT_RATIOS[format].label}`,
    "=== GENERATED MARKETING COPY (typeset exactly in the flyer) ===",
    `HERO HEADLINE (business name): ${copy.headline}`,
    copy.tagline?.trim() ? `Subheadline: ${copy.tagline}` : "",
    `CTA button: ${copy.cta}`,
    "Contact details: added via SVG footer after generation — never typeset in the image.",
    "=== END PROFILE ===",
  ];

  return lines.filter(Boolean).join("\n");
}

/** Step 1 + copy for IMAGE prompts — never includes contact text to render */
export function formatImagePromptProfile(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat
): string {
  const preset = resolveMobileAdPreset(business);
  const primary = describeHexAsVisualColor(getBrandPrimary(business));
  const accent = describeHexAsVisualColor(getBrandSecondary(business));

  const lines = [
    "=== BUSINESS CONTEXT (inform visuals only — contact fields are SVG overlay, never typeset in image) ===",
    `Business name (MANDATORY typeset on every flyer): ${business.businessName?.trim() || "(required)"}`,
    business.tagline?.trim() ? `Brand promise: ${business.tagline.trim()}` : "",
    business.industry?.trim() ? `Industry: ${business.industry.trim()}` : "",
    business.targetAudience?.trim()
      ? `Target audience: ${business.targetAudience.trim()}`
      : "",
    business.location?.trim()
      ? `Regional setting context only (do NOT typeset as text): ${business.location.trim()}`
      : "",
    business.callToAction?.trim() ? `Primary CTA theme: ${business.callToAction.trim()}` : "",
    `Brand color grade: primary ${primary}, accent ${accent}`,
    `Ad style preset: ${preset.label} (${preset.reference})`,
    business.imageProps?.trim()
      ? `Mandatory visuals / props / people: ${business.imageProps.trim()}`
      : "",
    `Format: ${format} — ${FORMAT_RATIOS[format].label}`,
    businessNameHeadlinePrompt(business.businessName?.trim() || "Brand"),
    "=== TYPESET IN IMAGE ONLY (exact spelling) ===",
    `HERO HEADLINE (business name — largest type): ${copy.headline}`,
    copy.tagline?.trim() ? `Subheadline: ${copy.tagline}` : "",
    `CTA button: ${copy.cta}`,
    "=== DO NOT TYPESET: phone, email, website, location, address — SVG footer handles these ===",
    "=== END PROFILE ===",
  ];

  return lines.filter(Boolean).join("\n");
}

export function buildIndustryGraphicShapes(business: BusinessProfile): string {
  const ind = (business.industry || "").toLowerCase();
  const preset = resolveMobileAdPreset(business);

  let shapes =
    "Graphic design elements: frosted glass cards, 2px accent rules, rounded CTA pill, soft corner gradient, subtle geometric accents at 6–12% opacity.";

  if (/tech|saas|software|app/.test(ind)) {
    shapes +=
      " Add floating UI card silhouette, soft grid dots, device-frame curve — no readable UI text.";
  } else if (/food|restaurant/.test(ind)) {
    shapes += " Warm vignette, optional circular badge area for offer, organic soft shapes.";
  } else if (/finance|fintech|crypto/.test(ind)) {
    shapes += " Clean data-curve lines, glass dashboard panel, trust strip at footer.";
  } else if (/fashion|beauty/.test(ind)) {
    shapes += " Minimal thin frames, editorial negative space, refined line dividers.";
  } else if (/real estate|property/.test(ind)) {
    shapes += " Architectural line accents, premium dark footer band, sky gradient panel for headline.";
  }

  return `${shapes} Preset overlays: ${preset.overlayStyle}`;
}

export function buildPrintReadyPlacementSpec(format: VideoFormat): string {
  const fmt = FORMAT_RATIOS[format];
  if (isTrendingSocialFlyerEnabled()) {
    return [
      "TRENDING SOCIAL PLACEMENT (center axis, 9:16 mobile hero):",
      `Canvas ${format} (${fmt.label}). 6% safe margins all sides.`,
      "TOP: logo + brand name. CENTER: headline + subhead on glass panel. LOWER-CENTER: glowing CTA pill.",
      "BOTTOM: calm band for SVG contact. Equal vertical spacing — 8px rhythm.",
    ].join(" ");
  }
  return [
    "PRINT-READY PLACEMENT (pixel-perfect hierarchy — nothing random):",
    `Canvas ${format} (${fmt.label}). 6% safe margins.`,
    "1 TOP: logo-safe calm band. 2 BRAND LABEL: small typeset name aligned to grid.",
    "3 HEADLINE BLOCK: largest type on glass/scrim panel, aligned left or editorial grid — 18–40% from top.",
    "4 SUBHEAD: directly under headline, same alignment. 5 HERO: subject/product 35–75% frame — never under type.",
    "6 CTA: one pill button with typeset label — optical center or grid-balanced. 7 FOOTER: contact on translucent strip (SVG overlay).",
    "Align all type to one vertical grid. Consistent spacing rhythm (8px modular feel).",
  ].join(" ");
}

export function buildPrintReadyAdvertisingBlock(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat
): string {
  const trending = isTrendingSocialFlyerEnabled();
  return [
    trending ? TRENDING_SOCIAL_FLYER_SYSTEM : PRINT_READY_FLYER_SYSTEM,
    formatImagePromptProfile(business, copy, format),
    buildNoContactTextInImageBlock(business, format, copy),
    buildPrintReadyPlacementSpec(format),
    trending ? buildTrendingArtDirectorBlock(business, format) : buildIndustryGraphicShapes(business),
    PRINT_GRAPHIC_MOTIFS,
    formatBusinessCampaignBrief(business, format, { forImagePrompt: true }),
    "This business's story must drive every visual choice — wrong industry or generic stock is unacceptable.",
  ].join(" ");
}
