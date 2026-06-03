import { getIndustryDesignSystem } from "./industrySystems";
import type { LayoutPlan } from "./types";
import type { BusinessProfile, VideoFormat } from "../types";

export function layoutPlanner(
  business: BusinessProfile,
  format: VideoFormat
): LayoutPlan {
  const industry = getIndustryDesignSystem(business);
  const isFintech = industry.key === "crypto_fintech";
  const isFood = industry.key === "food_restaurant";
  const isEditorial = industry.key === "fashion_beauty";

  if (isFintech) {
    return {
      heroSection: "Top 8%: logo masthead left. Background: subtle trading chart grid at 10–15% opacity",
      headlineZone:
        "Upper-left 25%: massive 2-line headline — one keyword in blue-purple gradient, rest white",
      subheadZone: "Below headline: short subhead + micro feature row (3 icons with labels)",
      benefitsZone: "Mid-left: glass promo card (bonus/offer) — frosted panel with glow border",
      visualFocus:
        "Center 40%: 3D hero coins/devices on circular neon platform with volumetric glow",
      trustZone:
        "Lower-mid horizontal stats bar: 4 metrics evenly spaced on dark glass strip",
      ctaZone:
        "Bottom center: wide glowing CTA pill (gradient fill + outer bloom), 8% from bottom",
      footerZone:
        "Bottom 10%: contact strip — phone, email, website on integrated dark bar (typeset)",
    };
  }

  if (isFood) {
    return {
      heroSection: "Top 55%: full-width appetite-triggering food photography — steam, warmth, shallow DOF",
      headlineZone: "On cream or dark glass band over photo lower-third: friendly serif headline",
      subheadZone: "Tagline under headline — sensory, short",
      benefitsZone: "Offer ribbon or badge overlapping photo edge when promo campaign",
      visualFocus: "Food hero IS the visual — no tech UI panels",
      trustZone: "Optional: 'Fresh daily' or rating line — small, not competing with food",
      ctaZone: "Warm CTA pill below photo band — Order Now / Visit Us style",
      footerZone: "Wood or dark strip bottom: contact lines centered",
    };
  }

  if (isEditorial) {
    return {
      heroSection: "Full-bleed editorial photo — model or product",
      headlineZone: "Lower-third on gradient scrim — large serif headline",
      subheadZone: "Single deck line under headline",
      benefitsZone: "Minimal — one collection or season line only",
      visualFocus: "Photography dominates 70%+ of canvas",
      trustZone: "Discreet brand mark top",
      ctaZone: "Understated pill or text CTA bottom center",
      footerZone: "Thin footer contact line",
    };
  }

  return {
    heroSection: `Industry-authentic hero for ${industry.label} — ${industry.heroSubjects}`,
    headlineZone: "Upper safe zone: hero headline largest type on canvas",
    subheadZone: "Below headline: supporting line max 12 words",
    benefitsZone: "Mid canvas: 2–3 benefit callouts OR offer card aligned to grid",
    visualFocus: industry.layoutBias,
    trustZone: "Trust row above CTA — icons + short labels OR stats",
    ctaZone: "CTA pill/button with clear isolation above footer reserve",
    footerZone: `Bottom ${format === "9:16" ? "12" : "10"}%: integrated contact footer strip`,
  };
}
