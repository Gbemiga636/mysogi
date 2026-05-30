import { getBrandPrimary, getBrandSecondary } from "./brandColors";
import { blendHex, shadeHex } from "./flyerPremiumColors";
import type { BusinessProfile } from "./types";

export type LuxuryPalette = {
  headline: string;
  subhead: string;
  body: string;
  accent: string;
  ctaText: string;
  veil: string;
};

export function buildLuxuryPalette(business: BusinessProfile): LuxuryPalette {
  const primary = getBrandPrimary(business);
  const secondary = getBrandSecondary(business);
  return {
    headline: "#FFFFFF",
    subhead: "rgba(255,255,255,0.92)",
    body: "rgba(255,255,255,0.88)",
    accent: blendHex(secondary, "#FFFFFF", 0.25),
    ctaText: "#FFFFFF",
    veil: "rgba(8,10,16,0.52)",
  };
}

export function ctaButtonFill(brandSecondary: string): {
  top: string;
  bottom: string;
  stroke: string;
} {
  const base = shadeHex(brandSecondary, 0.88);
  return {
    top: blendHex(base, "#FFFFFF", 0.18),
    bottom: shadeHex(base, 0.72),
    stroke: "rgba(255,255,255,0.38)",
  };
}
