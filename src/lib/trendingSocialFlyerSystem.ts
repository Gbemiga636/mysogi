/**
 * Trending social-media flyer design system — Apple / Nike / Spotify / Stripe quality.
 * Centered, cinematic, mobile-first 9:16 hero ads (not text pasted on a photo).
 */

import type { CampaignCopy } from "./campaignTextLayers";
import { resolveMobileAdPreset } from "./mobileAdPresets";
import {
  buildReferenceFlyerPromptBlocks,
  isReferenceFlyerStyleEnabled,
} from "./referenceFlyerStyle";
import type { BusinessProfile, VideoFormat } from "./types";
import { FORMAT_RATIOS } from "./types";

export const TRENDING_SOCIAL_MARKER = "TRENDING-SOCIAL-FLYER";

export function isTrendingSocialFlyerEnabled(): boolean {
  if (process.env.TRENDING_SOCIAL_FLYER?.trim().toLowerCase() === "false") {
    return false;
  }
  if (process.env.TRENDING_SOCIAL_FLYER?.trim().toLowerCase() === "true") {
    return true;
  }
  return process.env.FLYER_FINISHED_DESIGN?.trim().toLowerCase() !== "false";
}

export const TRENDING_SOCIAL_FLYER_SYSTEM = [
  `${TRENDING_SOCIAL_MARKER} — professional creative director output for Instagram Story / TikTok / mobile ads.`,
  "Intentionally designed — NOT random text pasted on a photo. NOT template clutter. NOT amateur AI layout.",
  "Premium, modern, viral, trendy, minimal, cinematic, mobile-first — billion-dollar brand campaign quality.",
  "References: Apple launch posters, Spotify campaigns, Nike ads, Uber promos, Stripe heroes, luxury fashion, AI startup launches.",
].join(" ");

export const TRENDING_SAFE_ZONE_RULES = [
  "TEXT SAFE ZONES (intelligent placement):",
  "DO NOT: place type over faces, eyes, or key product details; bleed text to edges; overlap the hero subject; ignore safe margins.",
  "DO: center headline stack on vertical axis; blur/darken busy regions behind type; keep 6% side margins; equal vertical rhythm between blocks.",
  "Subject stays in mid/lower frame — type lives in designed glass/gradient panels in upper and center bands.",
  "Text must feel integrated — part of the layout system, not floating stickers.",
].join(" ");

export const TRENDING_VISUAL_EFFECTS = [
  "MODERN EFFECTS (apply tastefully):",
  "Glassmorphism cards, smooth gradient fades, cinematic vignette, ambient glow on CTA, soft depth blur behind panels,",
  "realistic drop shadows, subtle reflections, rounded containers, neon edge rim on subject (controlled), layered depth.",
  "Alive and premium — never garish cheap neon soup.",
].join(" ");

export const TRENDING_BACKGROUND_SYSTEM = [
  "CINEMATIC BACKGROUND (foundation of the flyer):",
  "Foreground / midground / background separation — expensive realistic depth.",
  "Center or lower-center the hero subject; professional crop; cinematic color grade; volumetric light.",
  "Auto-blur busy areas behind text; darken regions under type; add top-to-bottom gradient overlay for readability.",
  "Depth haze, bokeh, soft spotlight on product/person — Instagram/TikTok hero ad polish.",
].join(" ");

export const TRENDING_NEGATIVE_AESTHETIC = [
  "FORBIDDEN AESTHETIC:",
  "template Canva look, cluttered collage, random font sizes, misaligned stacks, text-on-face, edge-hugging copy,",
  "hand-drawn type, cheap clip art, flat boring stock, amateur spacing, watermark, low-res, generic AI poster.",
].join(" ");

export function buildTrendingLayoutBlueprint(format: VideoFormat): string {
  const isVertical = format === "9:16" || format === "4:5";
  const fmt = FORMAT_RATIOS[format].label;

  return [
    "VERTICAL CENTERED LAYOUT GRID (align on center axis — perfect spacing rhythm):",
    `[TOP 0–12%] Small logo zone (empty — logo composited after).`,
    `[CENTER 18–52%] HERO HEADLINE — the business name, extra-large, center aligned, max 2 lines, glass/gradient panel.`,
    `[CENTER 52–62%] Supporting subheadline — lighter weight, centered, balanced line-height under headline.`,
    `[LOWER CENTER 58–72%] Large CTA pill button — glowing/high contrast, center aligned. NEVER below 72% from top.`,
    `[BOTTOM 16–24%] Calm band — reserved for SVG footer only; no CTA, no hero detail.`,
    isVertical
      ? `Format ${format} (${fmt}) — Instagram Story / TikTok / mobile poster optimized.`
      : `Format ${format} (${fmt}) — centered feed ad composition.`,
    "8px modular spacing feel — equal gaps between headline, subhead, and CTA.",
  ].join(" ");
}

export function buildTrendingTypographyHierarchy(
  business: BusinessProfile
): string {
  const preset = resolveMobileAdPreset(business);
  return [
    "PREMIUM TYPOGRAPHY HIERARCHY (center aligned, modern sans):",
    `HERO HEADLINE: the business name "${business.businessName?.trim() || "Brand"}" — extra-bold, very largest type, center aligned, perfect spelling, Inter/Poppins/SF Pro.`,
    "SUBHEAD: medium weight, smaller, centered under the business name — generous line-height.",
    "CTA BUTTON: bold label inside rounded pill — high contrast fill, soft outer glow, center lower-third.",
    `Preset accent: ${preset.typography}. Typeset digital fonts only — never hand-drawn.`,
  ].join(" ");
}

export function buildTrendingArtDirectorBlock(
  business: BusinessProfile,
  format: VideoFormat
): string {
  const preset = resolveMobileAdPreset(business);
  return [
    "AI ART DIRECTOR BEHAVIOR:",
    "Analyze composition; choose centered stack; balance hero vs type; match grade to brand; maintain minimalism.",
    `Visual mood: ${preset.reference}. Grade: ${preset.colorGrade}. Overlays: ${preset.overlayStyle}. CTA: ${preset.ctaStyle}.`,
    `Composition: ${preset.composition}`,
    TRENDING_BACKGROUND_SYSTEM,
    TRENDING_VISUAL_EFFECTS,
    TRENDING_SAFE_ZONE_RULES,
  ].join(" ");
}

export function buildTrendingExactCopyStructure(
  business: BusinessProfile,
  copy: CampaignCopy
): string {
  const name = business.businessName?.trim() || copy.headline?.trim() || "Brand";

  return [
    "CENTERED TYPE STACK (typeset inside image — spell exactly):",
    `1 HERO HEADLINE (largest, center): "${name}" — this IS the Step 1 business name`,
    copy.tagline?.trim()
      ? `2 SUBHEADLINE (center, under business name): "${copy.tagline}"`
      : "",
    copy.cta?.trim()
      ? `3 CTA BUTTON (lower-center, glowing pill): "${copy.cta}"`
      : "",
    "Align all layers on the vertical center axis with equal spacing — designed poster, not pasted text.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildTrendingSocialPromptBlocks(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  styleOverride?: import("./referenceFlyerStyle").ReferenceFlyerStyleId
): {
  system: string;
  layout: string;
  typography: string;
  artDirection: string;
  copyStructure: string;
  quality: string;
} {
  if (isReferenceFlyerStyleEnabled()) {
    const ref = buildReferenceFlyerPromptBlocks(
      business,
      copy,
      format,
      styleOverride
    );
    return {
      system: ref.system,
      layout: ref.layout,
      typography: ref.typography,
      artDirection: ref.visual,
      copyStructure: ref.copyStructure,
      quality: ref.quality,
    };
  }

  return {
    system: TRENDING_SOCIAL_FLYER_SYSTEM,
    layout: buildTrendingLayoutBlueprint(format),
    typography: buildTrendingTypographyHierarchy(business),
    artDirection: buildTrendingArtDirectorBlock(business, format),
    copyStructure: buildTrendingExactCopyStructure(business, copy),
    quality: [
      "OUTPUT: viral premium social ad — polished, realistic, luxury, high-converting, art-directed.",
      "Layered composition: background photo + gradient/glass overlays + typeset UI text + glowing CTA.",
      TRENDING_NEGATIVE_AESTHETIC,
    ].join(" "),
  };
}
