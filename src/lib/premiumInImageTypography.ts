/**
 * Premium in-image typography — GPT Image renders typeset layers (never SVG, never hand-drawn).
 */

import { describeHexAsVisualColor, getBrandPrimary, getBrandSecondary } from "./brandColors";
import { isTrendingSocialFlyerEnabled } from "./trendingSocialFlyerSystem";
import type { BusinessProfile } from "./types";

export const PREMIUM_TYPESET_CORE = [
  "TYPESET TYPOGRAPHY ONLY (non-negotiable):",
  "All copy must look like professional digital design exported from Figma, InDesign, or Canva — real font files, not artwork.",
  "Vector-crisp letterforms, even baselines, consistent stroke weight, professional kerning and line-height.",
  "FORBIDDEN: hand-drawn, brush script, painted, chalk, marker, crayon, graffiti, sketched, doodled, wavy baselines,",
  "uneven letter heights, faux 3D extruded letters, embossed paint FX, smudged edges, illustrated letterforms, AI scribble text.",
  "Never write as if someone painted or drew letters on the photo — only placed typeset layers.",
].join(" ");

export const PREMIUM_TYPE_COLOR_RULES = [
  "TYPE COLOR (do NOT make everything white):",
  "Choose a sophisticated editorial palette — 2 or 3 text colors max, harmonious with the photo grade.",
  "Headline may be deep charcoal, soft ivory, warm off-white, or rich brand accent on a panel — whatever reads premium on that background.",
  "Subhead slightly softer than headline. CTA button label high contrast against the pill fill.",
  "Footer small and refined (muted gray, soft cream, or subtle accent) — not screaming white unless the design demands it.",
].join(" ");

export const PREMIUM_TYPE_LAYOUT_RULES = [
  "TYPE LAYOUT (not everything centered — design intentionally):",
  "Use editorial asymmetry: headline top-left or left column is excellent; split layouts welcome.",
  "CTA pill may sit left-aligned, center, or right-aligned — whichever balances the hero subject.",
  "Align type to a clear vertical grid with generous margins; magazine / Apple / Stripe ad rhythm.",
  "Headline 1–2 lines max with dramatic size vs subhead. CTA is a real UI button with padding and border-radius.",
].join(" ");

export function buildBrandTypographyColors(business: BusinessProfile): string {
  const primary = describeHexAsVisualColor(getBrandPrimary(business));
  const accent = describeHexAsVisualColor(getBrandSecondary(business));
  return `Brand type accents: primary tone ${primary}, accent tone ${accent} — use on CTA pill, highlights, or headline accent word (not as hex codes in image).`;
}

export function buildPremiumInImageTypographyBlock(
  business: BusinessProfile,
  options?: { trending?: boolean }
): string {
  const trending = options?.trending ?? isTrendingSocialFlyerEnabled();
  if (trending) {
    return [
      PREMIUM_TYPESET_CORE,
      PREMIUM_TYPE_COLOR_RULES,
      buildBrandTypographyColors(business),
      "CENTERED TYPE STACK: business name as hero headline → subhead → CTA on vertical center axis — equal spacing, glass panels, premium mobile ad rhythm.",
      "HERO HEADLINE must be the business name — largest, extra-bold, perfect spelling. Fonts: Inter, Poppins, SF Pro, Satoshi.",
      "Integrate type with glassmorphism cards, gradient scrims, blur overlays — type is part of the design system.",
    ].join(" ");
  }
  return [
    PREMIUM_TYPESET_CORE,
    PREMIUM_TYPE_COLOR_RULES,
    buildBrandTypographyColors(business),
    PREMIUM_TYPE_LAYOUT_RULES,
    "Fonts: modern premium sans (Inter, Poppins, SF Pro style) or refined serif for luxury — never comic or script display unless fashion editorial calls for it.",
    "Integrate type with frosted glass cards, soft gradient scrims, or light panels — type sits ON design layers, not floating with no structure.",
  ].join(" ");
}
