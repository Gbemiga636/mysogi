import type { VideoFormat } from "./types";
import { FORMAT_RATIOS } from "./types";

/**
 * Single source of truth: Imagen empty bands ↔ Cloudinary overlay positions.
 * Percentages are from the TOP of the canvas (0 = top, 1 = bottom).
 */
export const FLYER_ZONE_PERCENT = {
  /** Logo safe area — top-right, keep clear */
  logo: { top: 0.02, bottom: 0.14, side: 0.04 },
  /** Headline overlay band */
  headline: { top: 0.07, bottom: 0.2 },
  /** Tagline overlay band */
  tagline: { top: 0.2, bottom: 0.3 },
  /** Hero product photography — busiest detail ONLY here */
  hero: { top: 0.32, bottom: 0.68 },
  /** Offer / promo glow (empty pill shape) */
  offerGlow: { top: 0.66, bottom: 0.76 },
  /** CTA band — must stay above footer reserve */
  cta: { top: 0.5, bottom: 0.66 },
  /** Location line — inside footer reserve */
  location: { top: 0.78, bottom: 0.9 },
  /** Contact line */
  contact: { top: 0.94, bottom: 0.99 },
} as const;

/**
 * Visual spacing hint for Imagen — no letters A–G, no designer words.
 * @deprecated Prefer buildBusinessFlyerVisualPrompt spacing guide.
 */
export function buildFlyerZonesImagenPrompt(): string {
  return [
    "Soft unobtrusive top area, calm band under it,",
    "dominant sharp subject in middle frame, gentle glow mid-lower,",
    "simple lower area, darker bottom edge, busiest detail in middle only.",
  ].join(" ");
}

export function getCanvasSize(format: VideoFormat): { width: number; height: number } {
  const { width, height } = FORMAT_RATIOS[format];
  return { width, height };
}

/** Cloudinary y offset from north or south edge */
export function zoneYOffset(
  format: VideoFormat,
  zone: keyof typeof FLYER_ZONE_PERCENT,
  anchor: "north" | "south"
): number {
  const { height } = getCanvasSize(format);
  const z = FLYER_ZONE_PERCENT[zone];
  if (anchor === "north") {
    return Math.round(height * z.top + height * 0.01);
  }
  return Math.round(height * (1 - z.bottom) + height * 0.01);
}

export function zoneFontSize(
  format: VideoFormat,
  role: "headline" | "tagline" | "cta" | "location" | "contact"
): number {
  const { width, height } = getCanvasSize(format);
  const scale = height / 1920;
  const wScale = width / 1080;
  const sizes = {
    headline: Math.round(Math.min(88 * scale, width * 0.08 * wScale)),
    tagline: Math.round(Math.min(30 * scale, width * 0.03 * wScale)),
    cta: Math.round(Math.min(36 * scale, width * 0.036 * wScale)),
    location: Math.round(Math.min(28 * scale, width * 0.026 * wScale)),
    contact: Math.round(Math.min(26 * scale, width * 0.024 * wScale)),
  };
  return Math.max(18, sizes[role]);
}

export function formatBusinessVisualMandate(business: {
  industry?: string;
  targetAudience?: string;
  location?: string;
  campaignGoal?: string;
  tagline?: string;
  brandPrimary?: string;
  brandSecondary?: string;
}): string {
  return [
    "MANDATORY — visual must match this business (not generic stock):",
    business.industry ? `Industry: ${business.industry}` : "",
    business.targetAudience ? `Audience: ${business.targetAudience}` : "",
    business.location ? `Market: ${business.location}` : "",
    business.campaignGoal ? `Campaign goal: ${business.campaignGoal}` : "",
    business.tagline ? `Brand mood: ${business.tagline}` : "",
    business.brandPrimary && business.brandSecondary
      ? "Match brand tones in lighting and accents only, never as written values"
      : "",
  ]
    .filter(Boolean)
    .join(". ");
}
