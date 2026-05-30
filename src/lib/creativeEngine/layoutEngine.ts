import { getBusinessNameHeadline } from "../campaignGoalImageGuard";
import type { CampaignCopy } from "../campaignTextLayers";
import type { BusinessProfile, VideoFormat } from "../types";
import { FORMAT_RATIOS } from "../types";
import { buildLuxuryPalette } from "./colorEngine";
import { resolveFontPairing } from "./fontPairings";
import { computeFlyerVerticalBalance } from "../flyerLayoutBalance";
import { computeTypographyScale } from "./typographyEngine";
import type { ComputedLayout, LayoutZone } from "./types";

const SAFE_MARGIN_RATIO = 0.06;

function estimateBlockHeight(
  lines: number,
  fontSize: number,
  lineHeight: number
): number {
  return Math.round(lines * fontSize * lineHeight);
}

function scoreBalance(
  canvasH: number,
  stackHeights: number[],
  gaps: number
): number {
  const total = stackHeights.reduce((a, b) => a + b, 0) + gaps;
  const usedRatio = total / canvasH;
  if (usedRatio > 0.72) return 0.62;
  if (usedRatio < 0.28) return 0.68;
  return 0.92;
}

export function computeSmartLayout(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat
): ComputedLayout {
  const { width: canvasW, height: canvasH } = FORMAT_RATIOS[format];
  const typo = computeTypographyScale(business, copy, format);
  const pairing = resolveFontPairing(business);
  const palette = buildLuxuryPalette(business);

  const safeMarginX = Math.round(canvasW * SAFE_MARGIN_RATIO);
  const safeMarginY = Math.round(canvasH * SAFE_MARGIN_RATIO);

  const balance = computeFlyerVerticalBalance(business, format, copy);

  const zones: Record<string, LayoutZone> = {
    top: { id: "top", topRatio: 0, bottomRatio: 0.14, align: "center" },
    headline: { id: "headline", topRatio: 0.16, bottomRatio: 0.48, align: "center" },
    subhead: { id: "subhead", topRatio: 0.48, bottomRatio: 0.58, align: "center" },
    cta: {
      id: "cta",
      topRatio: balance.ctaZoneTopRatio,
      bottomRatio: balance.ctaZoneBottomRatio,
      align: "center",
    },
    footer: {
      id: "footer",
      topRatio: balance.footerReserveTopRatio,
      bottomRatio: 0.98,
      align: "center",
    },
  };

  const headlineName = getBusinessNameHeadline(business);
  const headlineLines = headlineName.length > 28 ? 2 : headlineName.length > 14 ? 2 : 1;
  const headlineH = estimateBlockHeight(
    headlineLines,
    typo.headline,
    typo.headlineLineHeight
  );
  const subheadH = copy.tagline?.trim()
    ? estimateBlockHeight(2, typo.subhead, typo.subheadLineHeight)
    : 0;
  const ctaH = copy.cta?.trim() ? Math.round(typo.cta * 2.4 + 24) : 0;

  let y = Math.round(canvasH * 0.18);
  const headlineY = y;
  y += headlineH + typo.stackGap;
  const subheadY = copy.tagline?.trim() ? y : undefined;
  if (subheadY != null) y += subheadH + typo.stackGap;
  const ctaY = copy.cta?.trim() ? y : undefined;
  const footerY = Math.round(canvasH * 0.88);

  const stackHeights = [headlineH, subheadH, ctaH].filter(Boolean);
  const balanceScore = scoreBalance(
    canvasH,
    stackHeights,
    typo.stackGap * (stackHeights.length - 1)
  );

  return {
    canvasW,
    canvasH,
    safeMarginX,
    safeMarginY,
    zones,
    stack: { headlineY, subheadY, ctaY, footerY },
    typography: typo,
    fontPairing: pairing,
    palette,
    balanceScore,
  };
}

export function buildLayoutPromptBlock(layout: ComputedLayout): string {
  return [
    "SMART LAYOUT ENGINE — center-axis grid, art-directed spacing:",
    `Canvas ${layout.canvasW}×${layout.canvasH}px. Safe margins ${layout.safeMarginX}px.`,
    `[TOP 0–14%] Logo safe zone (composited after).`,
    `[CENTER] Hero headline at ${Math.round(layout.stack.headlineY / layout.canvasH * 100)}% — glass panel, blur behind type.`,
    layout.stack.subheadY != null
      ? `[SUBHEAD] Center stack at ${Math.round((layout.stack.subheadY / layout.canvasH) * 100)}%.`
      : "",
    layout.stack.ctaY != null
      ? `[CTA] Lower-center at ${Math.round((layout.stack.ctaY / layout.canvasH) * 100)}% — glowing pill. MUST stay above footer reserve (${Math.round((1 - layout.zones.footer.topRatio) * 100)}%).`
      : "",
    `[FOOTER ${Math.round(layout.zones.footer.topRatio * 100)}–${Math.round(layout.zones.footer.bottomRatio * 100)}%] SVG contact band only — calm, no busy texture. CTA must not enter this band.`,
    `Visual balance score target: ${Math.round(layout.balanceScore * 100)}% — equal rhythm, no overlap, no edge bleed.`,
  ]
    .filter(Boolean)
    .join(" ");
}
