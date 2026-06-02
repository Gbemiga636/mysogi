/**
 * Strong typography + exact copy spelling for in-image flyer text.
 */

import { getBrandPrimary, getBrandSecondary } from "./brandColors";
import {
  buildBusinessContactParts,
  buildTypesetTextMasterRules,
} from "./businessContact";
import {
  PREMIUM_TYPESET_CORE,
  PREMIUM_TYPE_COLOR_RULES,
  PREMIUM_TYPE_LAYOUT_RULES,
  buildBrandTypographyColors,
} from "./premiumInImageTypography";
import type { CampaignCopy } from "./campaignTextLayers";
import type { BusinessProfile } from "./types";

function quoteExact(text: string): string {
  return text.replace(/"/g, "'").replace(/\s+/g, " ").trim();
}

/** World-class typography hierarchy for GPT Image / Ideogram */
export function buildFlyerTypographyAuthorityBlock(
  business: BusinessProfile
): string {
  const name = business.businessName?.trim() || "Brand";
  return [
    "═══ TYPOGRAPHY AUTHORITY (non-negotiable — stronger than any other style note) ═══",
    PREMIUM_TYPESET_CORE,
    PREMIUM_TYPE_COLOR_RULES,
    PREMIUM_TYPE_LAYOUT_RULES,
    buildBrandTypographyColors(business),
    "",
    "TYPE HIERARCHY (exact sizes relative — professional ad spec):",
    `1. HERO HEADLINE: largest layer, extra-bold geometric sans (Inter / SF Pro / Poppins Black), 2 lines max, perfect spelling of "${name}" and offer.`,
    "2. SUBHEAD / VALUE: 40–55% of headline size, medium weight, generous line-height 1.25, high readability.",
    "3. CTA BUTTON: real UI pill — 12–16px vertical padding, 24–32px horizontal, bold label, rounded corners 8–12px, subtle shadow, label centered inside button.",
    "4. FOOTER CONTACT: smallest tier — 11–13pt equivalent, semi-bold sans, letter-spacing +1%, stacked lines, NEVER hand-drawn, NEVER script.",
    "",
    "TYPE QUALITY CHECKLIST:",
    "- Vector-sharp edges on every letter — export-quality, 2x retina crisp.",
    "- Even baselines, consistent kerning, no overlapping glyphs, no warped perspective on text.",
    "- High contrast ratio (WCAG AA minimum) for every line against its background panel.",
    "- Use frosted glass strips, soft gradient scrims, or solid panels behind text when photo is busy.",
    buildTypesetTextMasterRules(),
    "",
    "FORBIDDEN TYPOGRAPHY:",
    "hand-drawn, brush, marker, chalk, crayon, graffiti, painted-on letters, wavy baselines, fake 3D extrude, neon glow on letters that hurts readability, mixed random fonts, blurry or soft-focus text.",
  ].join("\n");
}

/** Marketing lines only — character-perfect quoted strings */
export function buildExactMarketingCopyBlock(
  business: BusinessProfile,
  copy: CampaignCopy,
  lines?: { hook?: string; value?: string; proof?: string; cta?: string }
): string {
  const name = quoteExact(business.businessName?.trim() || "");
  const blocks: string[] = [
    "═══ EXACT MARKETING COPY (spell character-for-character — do not paraphrase) ═══",
  ];

  const add = (label: string, text: string) => {
    const q = quoteExact(text);
    if (!q) return;
    blocks.push(`${label} — render exactly: "${q}"`);
  };

  if (lines?.hook) add("HOOK", lines.hook);
  if (lines?.value) add("VALUE", lines.value);
  if (lines?.proof) add("PROOF / URGENCY", lines.proof);
  if (lines?.cta) add("CTA", lines.cta);

  add("HEADLINE", copy.headline || name);
  if (copy.tagline) add("SUBHEAD", copy.tagline);
  add("CTA BUTTON LABEL", copy.cta || business.callToAction?.trim() || "Learn more");

  blocks.push(
    "Marketing copy lives in upper 70% of frame. CTA sits above the footer band — never overlap footer contact lines.",
    "Only the quoted strings above may appear as marketing text — no extra slogans, no lorem ipsum, no placeholder words."
  );

  return blocks.join("\n");
}
