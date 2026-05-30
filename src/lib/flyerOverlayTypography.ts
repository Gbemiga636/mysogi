import type { AgencyLayoutHints } from "./adAgencyLayout";
import { FLYER_ZONE_PERCENT } from "./flyerZoneSpec";

export type FlyerTextRole =
  | "headline"
  | "tagline"
  | "cta"
  | "location"
  | "contact";

export type FlyerStackPositions = {
  headlineY: number;
  taglineY?: number;
  ctaY?: number;
  locationY?: number;
  contactY?: number;
};

/** Vertical center of a layout band (legacy) */
export function yCenterInBand(
  canvasH: number,
  band: keyof typeof FLYER_ZONE_PERCENT,
  blockHeight: number
): number {
  const z = FLYER_ZONE_PERCENT[band];
  const top = z.top * canvasH;
  const bandH = (z.bottom - z.top) * canvasH;
  return Math.max(top + 4, Math.round(top + Math.max(0, (bandH - blockHeight) / 2)));
}

/**
 * Top-down stack for upper copy; footer anchored from bottom — clean flyer rhythm.
 */
export function layoutFlyerCopyStack(
  canvasH: number,
  heights: {
    headline: number;
    tagline?: number;
    cta?: number;
    location?: number;
    contact?: number;
  },
  agencyHints?: AgencyLayoutHints
): FlyerStackPositions {
  const gap = Math.round(canvasH * (agencyHints?.stackGapRatio ?? 0.024));
  const topStart = Math.round(canvasH * (agencyHints?.topStartRatio ?? 0.09));
  let y = topStart;

  const pos: FlyerStackPositions = { headlineY: y };
  y += heights.headline + gap;

  if (heights.tagline) {
    pos.taglineY = y;
    y += heights.tagline + gap;
  }

  const bottomPad = Math.round(canvasH * 0.028);
  if (heights.contact) {
    pos.contactY = canvasH - bottomPad - heights.contact;
  }
  if (heights.location) {
    const contactTop = pos.contactY ?? canvasH - bottomPad;
    pos.locationY =
      contactTop - gap - (heights.location ?? 0);
  }

  if (heights.cta) {
    const footerTop = pos.locationY ?? pos.contactY ?? canvasH;
    const ctaAnchor = footerTop - gap - heights.cta;
    const minCta = y + gap;
    pos.ctaY = Math.max(minCta, Math.round(ctaAnchor));
  }

  return pos;
}

/** Shrink font until longest line fits max width */
export function fitFontSizeToWidth(
  lines: string[],
  maxWidth: number,
  baseSize: number,
  minSize: number,
  role: FlyerTextRole
): number {
  const longest = Math.max(...lines.map((l) => l.length), 1);
  const charW =
    role === "headline" ? 0.52 : role === "cta" ? 0.58 : 0.46;
  let size = Math.round(baseSize * (role === "headline" ? 1.04 : role === "cta" ? 1.02 : 1));
  while (size > minSize && longest * size * charW > maxWidth * 0.9) {
    size -= 1;
  }
  return size;
}

export function estimateBlockHeight(
  lineCount: number,
  fontSize: number,
  role: FlyerTextRole
): number {
  const lh =
    role === "headline" ? 1.08 : role === "tagline" ? 1.22 : 1.18;
  return Math.round(lineCount * fontSize * lh);
}

export function roleMinFontSize(role: FlyerTextRole, canvasW: number): number {
  const s = canvasW / 1080;
  const mins = {
    headline: Math.round(44 * s),
    tagline: Math.round(26 * s),
    cta: Math.round(34 * s),
    location: Math.round(20 * s),
    contact: Math.round(19 * s),
  };
  return mins[role];
}
