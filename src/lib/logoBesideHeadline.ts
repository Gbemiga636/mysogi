/**
 * Small logo centered at the top of the flyer content (above headline).
 * Real logo is composited in post — Imagen must not draw one.
 */
function logoWidthRatio(): number {
  const env = process.env.FLYER_LOGO_WIDTH_RATIO?.trim();
  const n = env ? Number(env) : NaN;
  if (Number.isFinite(n) && n > 0.02 && n < 0.2) return n;
  return 0.072;
}

function logoMaxWidthPx(): number {
  const env = process.env.FLYER_LOGO_MAX_PX?.trim();
  const n = env ? Number(env) : NaN;
  if (Number.isFinite(n) && n >= 48 && n <= 160) return Math.round(n);
  return 76;
}

export const FLYER_LOGO_CENTER_TOP = {
  get widthRatio() {
    return logoWidthRatio();
  },
  get maxWidthPx() {
    return logoMaxWidthPx();
  },
  /** From top of canvas — centered above headline */
  topRatio: 0.018,
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
