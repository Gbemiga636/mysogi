import { getBrandPrimary, getBrandSecondary } from "../brandColors";
import {
  resolveReferenceFlyerStyle,
} from "../referenceFlyerStyle";
import type { BusinessProfile } from "../types";
import type { LuxuryPalette } from "./types";

export const PREMIUM_THEME_PALETTES: Record<string, LuxuryPalette> = {
  black_orange: {
    id: "black_orange",
    label: "Black + Orange Luxury",
    primary: "#0A0A0C",
    accent: "#F26522",
    background: "#050506",
    text: "#F5F5F7",
    textMuted: "#A1A1AA",
    ctaFill: "#F26522",
    ctaText: "#FFFFFF",
    glow: "#F2652288",
    gradient: "linear deep charcoal to warm amber rim light",
  },
  navy_gold: {
    id: "navy_gold",
    label: "Navy + Gold",
    primary: "#0B1D3A",
    accent: "#C9A227",
    background: "#06101F",
    text: "#F8F6F0",
    textMuted: "#94A3B8",
    ctaFill: "#C9A227",
    ctaText: "#0B1D3A",
    glow: "#C9A22766",
    gradient: "deep navy with gold edge lighting",
  },
  dark_fintech: {
    id: "dark_fintech",
    label: "Dark Fintech Blue",
    primary: "#0F172A",
    accent: "#38BDF8",
    background: "#020617",
    text: "#E2E8F0",
    textMuted: "#64748B",
    ctaFill: "#2563EB",
    ctaText: "#FFFFFF",
    glow: "#38BDF866",
    gradient: "midnight blue with cyan ambient glow",
  },
  purple_neon: {
    id: "purple_neon",
    label: "Purple Neon",
    primary: "#1A0B2E",
    accent: "#A855F7",
    background: "#0F0518",
    text: "#FAF5FF",
    textMuted: "#C4B5FD",
    ctaFill: "#9333EA",
    ctaText: "#FFFFFF",
    glow: "#A855F788",
    gradient: "violet haze with controlled neon rim",
  },
  emerald_luxury: {
    id: "emerald_luxury",
    label: "Emerald Luxury",
    primary: "#042F2E",
    accent: "#10B981",
    background: "#022C22",
    text: "#ECFDF5",
    textMuted: "#6EE7B7",
    ctaFill: "#059669",
    ctaText: "#FFFFFF",
    glow: "#10B98166",
    gradient: "deep emerald with soft gold highlights",
  },
  matte_black: {
    id: "matte_black",
    label: "Matte Black Premium",
    primary: "#111111",
    accent: "#FFFFFF",
    background: "#0A0A0A",
    text: "#FFFFFF",
    textMuted: "#71717A",
    ctaFill: "#FFFFFF",
    ctaText: "#111111",
    glow: "#FFFFFF33",
    gradient: "matte black with subtle silver edge light",
  },
  teal_gold_night: {
    id: "teal_gold_night",
    label: "Teal + Gold Night (Trial 3)",
    primary: "#2D6A6A",
    accent: "#C9A227",
    background: "#050508",
    text: "#E8F4F4",
    textMuted: "#7EB8B8",
    ctaFill: "#C9A227",
    ctaText: "#050508",
    glow: "#2D6A6A88",
    gradient: "deep black night with teal typography and gold accents",
  },
};

function pickThemeId(business: BusinessProfile): string {
  const ref = resolveReferenceFlyerStyle(business);
  if (ref === "trial4") return "purple_neon";
  if (ref === "trial2") return "black_orange";
  if (ref === "trial3") return "teal_gold_night";

  const ind = (business.industry || "").toLowerCase();
  if (/fintech|finance|bank|crypto/.test(ind)) return "dark_fintech";
  if (/real estate|property|luxury/.test(ind)) return "navy_gold";
  if (/fashion|beauty/.test(ind)) return "matte_black";
  if (/tech|saas|software|ai/.test(ind)) return "purple_neon";
  if (/health|wellness|organic/.test(ind)) return "emerald_luxury";
  const primary = getBrandPrimary(business).toLowerCase();
  if (/f26522|ff6|orange/.test(primary)) return "black_orange";
  return "dark_fintech";
}

export function buildLuxuryPalette(business: BusinessProfile): LuxuryPalette {
  const theme = PREMIUM_THEME_PALETTES[pickThemeId(business)];
  const brandPrimary = getBrandPrimary(business);
  const brandAccent = getBrandSecondary(business);

  return {
    ...theme,
    accent: brandAccent || theme.accent,
    ctaFill: brandAccent || theme.ctaFill,
    primary: brandPrimary || theme.primary,
  };
}

export function buildColorPromptBlock(business: BusinessProfile): string {
  const palette = buildLuxuryPalette(business);
  return [
    "COLOR INTELLIGENCE — luxury cinematic grade:",
    `Theme: ${palette.label}. Primary mood ${palette.primary}, accent ${palette.accent}.`,
    `Gradient direction: ${palette.gradient}.`,
    `CTA fill ${palette.ctaFill} with soft outer glow ${palette.glow}.`,
    "Maintain WCAG-level contrast on all typeset layers. Harmonize photo grade with brand accents — never paste hex codes as visible text.",
  ].join(" ");
}
