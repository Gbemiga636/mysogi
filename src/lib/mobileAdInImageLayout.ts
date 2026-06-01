/**

 * Mobile poster layout blueprint — all typography rendered INSIDE the AI image (no SVG).

 */



import type { CampaignCopy } from "./campaignTextLayers";

import { buildPremiumInImageTypographyBlock } from "./premiumInImageTypography";
import { isSvgFlyerFooterMode } from "./flyerSvgFooterMode";
import {
  buildTrendingExactCopyStructure,
  buildTrendingSocialPromptBlocks,
  isTrendingSocialFlyerEnabled,
  TRENDING_SAFE_ZONE_RULES,
} from "./trendingSocialFlyerSystem";
import {
  buildReferenceFlyerPromptBlocks,
  isReferenceFlyerStyleEnabled,
} from "./referenceFlyerStyle";
import { buildIntegratedContactTypesetBlock, buildNoContactTextInImageBlock } from "./businessContact";
import {
  buildCtaFooterBalancePromptBlock,
  computeFlyerVerticalBalance,
  pct,
} from "./flyerLayoutBalance";
import {
  businessNameHeadlinePrompt,
} from "./campaignGoalImageGuard";

import { resolveMobileAdPreset, type MobileAdPreset } from "./mobileAdPresets";

import type { BusinessProfile, VideoFormat } from "./types";

import { FORMAT_RATIOS } from "./types";



export const MOBILE_SAFE_MARGIN_RATIO = 0.06;



export const IN_IMAGE_TYPOGRAPHY_SYSTEM = [

  "Premium typeset layers inside the image — real fonts, not illustration.",

  "Editorial layouts: asymmetry is encouraged; perfect centering is NOT required.",

  "Type colors should feel designed (charcoal, ivory, cream, brand accent) — not default all-white.",

].join(" ");



export const IN_IMAGE_CONTRAST_SYSTEM = [

  "READABILITY:",

  "Place type on frosted glass, soft panels, or gentle gradient scrims — match scrim to type color (dark type on light panel, light type on dark scrim).",

  "Keep hero subject visible; soften or darken only behind text zones.",

  "Never let busy background compete with headline — but avoid flat generic all-white stacked text.",

].join(" ");



export function buildMobileZoneBlueprint(

  format: VideoFormat,

  preset: MobileAdPreset

): string {

  const isVertical = format === "9:16" || format === "4:5";

  const m = MOBILE_SAFE_MARGIN_RATIO;



  return [

    "MOBILE POSTER LAYOUT (flexible editorial grid — premium ads, not PowerPoint):",

    `Safe margins ${Math.round(m * 100)}% all sides. Format ${format} (${FORMAT_RATIOS[format].label}).`,

    isVertical

      ? "Story layout: copy column upper-left or left third; hero subject lower and center-right."

      : "Feed layout: copy left 40% column OR top band; hero right or center.",

    "TOP: calm band for logo overlay — do not draw a logo.",

    "BRAND NAME (mandatory on every flyer): small typeset label, top-left or top-center — always show the business name.",

    "HEADLINE: largest type, 1–2 lines, on glass card or scrim — position top-left or left-aligned (centering optional).",

    "SUBHEAD: medium weight under headline, aligned to same grid.",

    "HERO: people/product in lower/mid frame — no text across faces.",

    "CTA: one premium pill button with typeset label inside — align to balance composition (left, center, or right).",

    "BOTTOM: integrated contact footer — location, phone, email, website as crisp digital typeset (not hand-drawn).",

    `Style preset ${preset.label}: ${preset.reference}. ${preset.composition}`,

    `Overlays: ${preset.overlayStyle}. CTA: ${preset.ctaStyle}. Grade: ${preset.colorGrade}.`,

  ].join(" ");

}



export function buildCtaSuggestions(business: BusinessProfile): string[] {

  const ind = (business.industry || "").toLowerCase();

  if (/saas|software|app|tech|startup/.test(ind)) {

    return [

      "Start Free Today",

      "Try It Risk-Free",

      "Boost Revenue Now",

      "Get Started Free",

    ];

  }

  if (/finance|fintech|crypto/.test(ind)) {

    return ["Start Trading", "Open Account", "Grow Wealth Now", "Join Free"];

  }

  if (/food|restaurant/.test(ind)) {

    return ["Order Now", "Book a Table", "Taste Today", "Reserve Now"];

  }

  return [

    "Start Free Today",

    "Get Started",

    "Learn More",

    "Join Thousands",

    business.callToAction?.trim() || "Shop Now",

  ].filter(Boolean);

}



export function buildMobilePosterPromptBlocks(

  business: BusinessProfile,

  copy: CampaignCopy,

  format: VideoFormat

): {

  preset: MobileAdPreset;

  zoneBlueprint: string;

  typography: string;

  contrast: string;

  quality: string;

} {

  const preset = resolveMobileAdPreset(business);

  if (isTrendingSocialFlyerEnabled()) {
    const trending = buildTrendingSocialPromptBlocks(business, copy, format);
    return {
      preset,
      zoneBlueprint: trending.layout,
      typography: `${trending.system} ${trending.typography} ${buildPremiumInImageTypographyBlock(business, { trending: true })}`,
      contrast: `${IN_IMAGE_CONTRAST_SYSTEM} ${TRENDING_SAFE_ZONE_RULES}`,
      quality: trending.quality,
    };
  }

  return {

    preset,

    zoneBlueprint: buildMobileZoneBlueprint(format, preset),

    typography: `${IN_IMAGE_TYPOGRAPHY_SYSTEM} ${buildPremiumInImageTypographyBlock(business)} Fonts: ${preset.typography}.`,

    contrast: IN_IMAGE_CONTRAST_SYSTEM,

    quality: [

      "OUTPUT QUALITY: premium paid social ad — Apple/Nike/Stripe editorial polish.",

      "Typeset UI layers, cinematic photo, intentional asymmetry, designed color palette.",

      "NOT template-like, NOT all-white centered stack, NOT hand-drawn text.",

    ].join(" "),

  };

}



export function buildMobileExactCopyLayoutBlock(

  business: BusinessProfile,

  copy: CampaignCopy,

  options?: { svgFooter?: boolean; format?: VideoFormat }

): string {

  const svgFooter = options?.svgFooter ?? isSvgFlyerFooterMode();
  const format = options?.format ?? "9:16";

  if (isTrendingSocialFlyerEnabled()) {
    if (isReferenceFlyerStyleEnabled()) {
      const ref = buildReferenceFlyerPromptBlocks(business, copy, format);
      const name = business.businessName?.trim() || "Brand";
      return [
        ref.system,
        ref.copyStructure,
        businessNameHeadlinePrompt(name),
        ref.quality,
      ]
        .filter(Boolean)
        .join(" ");
    }
    const stack = buildTrendingExactCopyStructure(business, copy);
    const name = business.businessName?.trim() || "Brand";
    return [
      "EXACT COPY — trending social flyer, center-aligned typeset layers:",
      businessNameHeadlinePrompt(name),
      stack,
      svgFooter ? buildNoContactTextInImageBlock(business, format, copy) : "",
      "Designed poster composition — integrated glass/gradient panels, not text pasted on photo.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  const name = business.businessName?.trim() || "Brand";

  const lines: string[] = [
    businessNameHeadlinePrompt(name),
  ];

  if (copy.tagline?.trim()) {

    lines.push(`SUBHEADLINE typeset exactly: "${copy.tagline}"`);

  }

  if (copy.cta?.trim()) {
    const balance = computeFlyerVerticalBalance(business, format, copy);
    lines.push(
      `CTA BUTTON with typeset label inside pill (real UI button): "${copy.cta}" — vertical center ~${pct(balance.ctaMaxCenterRatio)}% from top, NEVER below ${pct(balance.footerReserveTopRatio)}%.`
    );
  }

  if (svgFooter) {
    lines.push(buildCtaFooterBalancePromptBlock(business, format, copy));
    lines.push(buildNoContactTextInImageBlock(business, format, copy));
  } else {
    lines.push(buildIntegratedContactTypesetBlock(business, copy, format));
  }



  return [

    "EXACT COPY — professional TYPESET layers in the image (spell every character perfectly):",

    buildPremiumInImageTypographyBlock(business),

    lines.join(". "),

    "Each phrase is a digital text layer with premium kerning — never painted or drawn on the photo.",

  ].join(" ");

}


