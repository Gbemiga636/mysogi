import type { CampaignCopy } from "../campaignTextLayers";
import {
  buildCtaFooterBalancePromptBlock,
  computeFlyerVerticalBalance,
  pct,
} from "../flyerLayoutBalance";
import type { BusinessProfile, VideoFormat } from "../types";

/** Client logo is composited after generation — never draw one in the AI image. */
export function buildNoAiLogoBlock(): string {
  return [
    "LOGO RULE (non-negotiable):",
    "Do NOT draw, invent, or render any logo, logomark, brand icon, hexagon mark, app icon, watermark, or pictorial brand symbol.",
    "Do NOT place a fake logo in the top-left or top-center.",
    "Leave the top 8–10% of the canvas as a calm, uncluttered dark band (subtle gradient only) — the client's real logo is overlaid after generation.",
    "Business name may appear only as typeset headline text (not as a logo graphic).",
  ].join(" ");
}

/** Trial-4 footer + CTA vertical balance for Sharp contact overlay. */
export function buildTrial4FooterReserveBlock(
  business: BusinessProfile,
  format: VideoFormat,
  copy?: CampaignCopy
): string {
  const b = computeFlyerVerticalBalance(business, format, copy);
  return [
    "VERTICAL LAYOUT — Sharp contact footer (critical):",
    buildCtaFooterBalancePromptBlock(business, format, copy),
    `All UI elements (CTA pill, stats bar, trust badges, promo cards, QR decorative shapes) must sit ABOVE ${pct(b.footerReserveTopRatio)}% from the top.`,
    `Bottom ${pct(b.footerReserveRatio)}% (${pct(b.footerReserveTopRatio)}%–100%): calm empty dark glass gradient only — NO CTA, NO stats, NO headline, NO busy detail — exact phone/email/website composited here after.`,
    `CTA vertical center target ~${pct(b.ctaMaxCenterRatio)}% from top (never below ${pct(b.ctaZoneBottomRatio)}%).`,
  ].join(" ");
}

export function buildTrial4TopZoneLine(): string {
  return "1. TOP BAND (8–10% height): empty calm dark gradient strip at top-center — NO logo, NO icon, NO brand mark (client logo overlaid later).";
}

export function buildTrial4CtaLine(
  business: BusinessProfile,
  format: VideoFormat,
  cta: string,
  copy?: CampaignCopy
): string {
  const b = computeFlyerVerticalBalance(business, format, copy);
  return `CTA: wide glowing gradient pill with typeset label "${cta.toUpperCase()}" — vertical center ~${pct(b.ctaMaxCenterRatio)}% from top (between ${pct(b.ctaZoneTopRatio)}% and ${pct(b.ctaZoneBottomRatio)}%, never in bottom ${pct(b.footerReserveRatio)}%).`;
}
