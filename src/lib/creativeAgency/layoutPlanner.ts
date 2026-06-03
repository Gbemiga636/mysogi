import { getIndustryDesignSystem } from "./industrySystems";
import {
  computeFlyerVerticalBalance,
  pct,
} from "../flyerLayoutBalance";
import type { LayoutPlan } from "./types";
import type { BusinessProfile, VideoFormat } from "../types";

function ctaZoneLine(business: BusinessProfile, format: VideoFormat): string {
  const b = computeFlyerVerticalBalance(business, format);
  return `CTA pill vertical center ~${pct(b.ctaMaxCenterRatio)}% from top (${pct(b.ctaZoneTopRatio)}–${pct(b.ctaZoneBottomRatio)}%) — never in bottom ${pct(b.footerReserveRatio)}% footer reserve`;
}

function footerZoneLine(business: BusinessProfile, format: VideoFormat): string {
  const b = computeFlyerVerticalBalance(business, format);
  return `Bottom ${pct(b.footerReserveRatio)}%: empty calm strip for Sharp contact overlay — no CTA, no stats, no logo`;
}

export function layoutPlanner(
  business: BusinessProfile,
  format: VideoFormat,
  userPrompt?: string
): LayoutPlan {
  const industry = getIndustryDesignSystem(business, userPrompt);
  const cta = ctaZoneLine(business, format);
  const footer = footerZoneLine(business, format);
  const topBand =
    "Top 8–10%: empty calm band for client logo overlay — NO AI logo or brand mark";

  if (industry.key === "crypto_fintech") {
    return {
      heroSection: `${topBand}. Background: trading chart grid at 10–15% opacity`,
      headlineZone:
        "Upper-left 25%: massive 2-line headline — one keyword in blue-purple gradient, rest white",
      subheadZone: "Below headline: short subhead + micro feature row (3 icons with labels)",
      benefitsZone: "Mid-left: glass promo card — frosted panel with glow border",
      visualFocus:
        "Center 40%: 3D hero coins on circular neon platform with volumetric glow",
      trustZone: "Stats bar ~48% from top: 4 metrics on dark glass strip",
      ctaZone: cta,
      footerZone: footer,
    };
  }

  if (industry.key === "food_restaurant") {
    return {
      heroSection: "Top 55%: appetite-triggering food photography — steam, warmth, shallow DOF",
      headlineZone: "On cream or dark glass band: friendly headline",
      subheadZone: "Tagline under headline — sensory, short",
      benefitsZone: "Offer ribbon or glass promo card mid-frame",
      visualFocus: "Food hero on warm glowing pedestal — no tech UI",
      trustZone: "Stats bar ~48% from top",
      ctaZone: cta,
      footerZone: footer,
    };
  }

  if (industry.key === "fashion_beauty") {
    return {
      heroSection: "Full-bleed editorial photo — model or product",
      headlineZone: "Lower-third on gradient scrim — large serif headline",
      subheadZone: "Single deck line under headline",
      benefitsZone: "Minimal — one collection or season line only",
      visualFocus: "Photography dominates 70%+ of canvas",
      trustZone: "Stats/trust bar mid-frame",
      ctaZone: cta,
      footerZone: footer,
    };
  }

  return {
    heroSection: `${topBand}. ${industry.heroSubjects}`,
    headlineZone: "Upper safe zone: hero headline largest type on canvas",
    subheadZone: "Below headline: supporting line max 12 words",
    benefitsZone: "Mid canvas: 2–3 benefit callouts OR offer glass card",
    visualFocus: industry.layoutBias,
    trustZone: "Trust/stats row ~48% from top — icons + short labels",
    ctaZone: cta,
    footerZone: footer,
  };
}
