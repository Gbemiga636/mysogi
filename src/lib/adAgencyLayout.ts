import type { AdAgencyCreativeDirection } from "./adAgencyEngine";
import type { FlyerStackPositions } from "./flyerOverlayTypography";

export type AgencyLayoutHints = {
  topStartRatio: number;
  stackGapRatio: number;
  headlineAlign: "left" | "center";
  ctaEmphasis: "glass" | "solid" | "pill";
};

/** Map creative direction → SVG/Canvas overlay layout hints */
export function getAgencyLayoutHints(
  direction: AdAgencyCreativeDirection
): AgencyLayoutHints {
  const id = direction.campaignStyle.id;

  const base: AgencyLayoutHints = {
    topStartRatio: 0.09,
    stackGapRatio: 0.024,
    headlineAlign: "left",
    ctaEmphasis: "glass",
  };

  switch (id) {
    case "automotive":
      return { ...base, topStartRatio: 0.07, headlineAlign: "left", ctaEmphasis: "solid" };
    case "fashion":
      return { ...base, topStartRatio: 0.1, headlineAlign: "left", ctaEmphasis: "pill" };
    case "nightlife":
      return { ...base, topStartRatio: 0.08, ctaEmphasis: "pill" };
    case "fintech":
    case "crypto":
      return { ...base, topStartRatio: 0.085, headlineAlign: "left", ctaEmphasis: "glass" };
    case "real_estate":
      return { ...base, topStartRatio: 0.075, ctaEmphasis: "solid" };
    case "restaurant":
      return { ...base, topStartRatio: 0.095, ctaEmphasis: "pill" };
    case "corporate":
      return { ...base, topStartRatio: 0.088, headlineAlign: "left", ctaEmphasis: "solid" };
    case "luxury":
      return { ...base, topStartRatio: 0.1, headlineAlign: "center", ctaEmphasis: "glass" };
    default:
      return base;
  }
}

/** Apply agency layout offsets to copy stack Y positions */
export function applyAgencyLayoutToStack(
  canvasH: number,
  positions: FlyerStackPositions,
  hints: AgencyLayoutHints
): FlyerStackPositions {
  const shift = Math.round(canvasH * (hints.topStartRatio - 0.09));
  if (shift === 0) return positions;

  const bump = (y: number | undefined) =>
    y !== undefined ? y + shift : undefined;

  return {
    headlineY: positions.headlineY + shift,
    taglineY: bump(positions.taglineY),
    ctaY: bump(positions.ctaY),
    locationY: bump(positions.locationY),
    contactY: positions.contactY,
  };
}
