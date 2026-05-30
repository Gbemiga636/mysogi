/**
 * Small logo centered at the top of the flyer content (above headline).
 * Real logo is composited in post — Imagen must not draw one.
 */
export const FLYER_LOGO_CENTER_TOP = {
  widthRatio: 0.038,
  maxWidthPx: 40,
  /** From top of canvas — small logo centered above headline */
  topRatio: 0.02,
} as const;

/** @deprecated Use FLYER_LOGO_CENTER_TOP */
export const LOGO_BESIDE_HEADLINE = FLYER_LOGO_CENTER_TOP;

export function getFlyerLogoSize(canvasW: number): number {
  return Math.min(
    Math.round(canvasW * FLYER_LOGO_CENTER_TOP.widthRatio),
    FLYER_LOGO_CENTER_TOP.maxWidthPx
  );
}

/** @deprecated Use getFlyerLogoSize */
export const getLogoBesideHeadlineSize = getFlyerLogoSize;

export function getFlyerLogoCenterTopPosition(
  canvasW: number,
  canvasH: number,
  logoW: number,
  _logoH: number
): { left: number; top: number } {
  const left = Math.max(0, Math.round((canvasW - logoW) / 2));
  const top = Math.round(canvasH * FLYER_LOGO_CENTER_TOP.topRatio);
  return { left, top };
}

/** @deprecated Use getFlyerLogoCenterTopPosition */
export const getLogoBesideHeadlinePosition = getFlyerLogoCenterTopPosition;
