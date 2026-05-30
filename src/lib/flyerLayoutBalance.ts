import type { CampaignCopy } from "./campaignTextLayers";
import type { BusinessProfile, VideoFormat } from "./types";

/** Vertical layout bands (0 = top, 1 = bottom) */
export type FlyerVerticalBalance = {
  footerLineCount: number;
  footerReserveRatio: number;
  footerReserveTopRatio: number;
  ctaZoneTopRatio: number;
  ctaZoneBottomRatio: number;
  ctaMaxCenterRatio: number;
  gapRatio: number;
};

const FOOTER_BASE_RATIO = 0.14;
const FOOTER_PER_LINE_RATIO = 0.034;
const CTA_TO_FOOTER_GAP = 0.07;
const CTA_BAND_HEIGHT = 0.09;

/** Client-safe footer line estimate — mirrors buildStructuredFooterLines field order. */
export function estimateFooterLineCount(
  business: BusinessProfile,
  copy?: CampaignCopy
): number {
  const location = copy?.location?.trim() || business.location?.trim();
  const phone = business.phone?.trim();
  const email = business.email?.trim();
  const website = business.website?.trim();
  const count = [location, phone, email, website].filter(Boolean).length;
  return Math.max(1, count);
}

export function computeFlyerVerticalBalance(
  business: BusinessProfile,
  format: VideoFormat,
  copy?: CampaignCopy
): FlyerVerticalBalance {
  void format;
  const lineCount = Math.max(1, estimateFooterLineCount(business, copy));
  const footerReserveRatio = Math.min(
    0.3,
    Math.max(0.22, FOOTER_BASE_RATIO + lineCount * FOOTER_PER_LINE_RATIO)
  );
  const footerReserveTopRatio = 1 - footerReserveRatio;
  const ctaZoneBottomRatio = footerReserveTopRatio - CTA_TO_FOOTER_GAP;
  const ctaZoneTopRatio = Math.max(0.46, ctaZoneBottomRatio - CTA_BAND_HEIGHT);
  const ctaMaxCenterRatio = (ctaZoneTopRatio + ctaZoneBottomRatio) / 2;

  return {
    footerLineCount: lineCount,
    footerReserveRatio,
    footerReserveTopRatio,
    ctaZoneTopRatio,
    ctaZoneBottomRatio,
    ctaMaxCenterRatio,
    gapRatio: CTA_TO_FOOTER_GAP,
  };
}

export function pct(ratio: number): number {
  return Math.round(ratio * 100);
}

/** Image prompt: keep CTA above SVG footer band */
export function buildCtaFooterBalancePromptBlock(
  business: BusinessProfile,
  format: VideoFormat,
  copy?: CampaignCopy
): string {
  const b = computeFlyerVerticalBalance(business, format, copy);
  return [
    "LAYOUT BALANCE — CTA vs SVG footer (critical, no collisions):",
    `Bottom ${pct(b.footerReserveRatio)}% of canvas is RESERVED for SVG contact footer (${b.footerLineCount} lines: location, phone, email, website).`,
    `That zone (${pct(b.footerReserveTopRatio)}%–100% from top) must be calm: dark gradient, frosted strip, or empty — NO CTA button, NO hero subject, NO busy texture.`,
    `CTA pill/button ONLY between ${pct(b.ctaZoneTopRatio)}% and ${pct(b.ctaZoneBottomRatio)}% from top (center ~${pct(b.ctaMaxCenterRatio)}%).`,
    `Minimum ${pct(b.gapRatio)}% clear gap between CTA bottom edge and footer reserve top — never overlap.`,
    "Headline and subhead live upper/mid frame. Hero visual mid-lower but above CTA zone.",
    "If promo badge exists, place beside or above CTA — never in footer reserve.",
  ].join(" ");
}

export function buildFooterReserveVisualBlock(
  business: BusinessProfile,
  format: VideoFormat,
  copy?: CampaignCopy
): string {
  const b = computeFlyerVerticalBalance(business, format, copy);
  return [
    `FOOTER RESERVE: bottom ${pct(b.footerReserveRatio)}% — soft dark gradient bar or blur,`,
    "zero readable contact text (added after as overlay), no buttons, no photography detail.",
  ].join(" ");
}
