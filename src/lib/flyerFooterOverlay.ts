import type { OverlayOptions } from "sharp";
import { estimateFooterDisplayLines } from "./businessContactCore";
import { trimOverlayText } from "./campaignLayout";
import type { CampaignCopy } from "./campaignTextLayers";
import {
  buildClassyFooterSvg,
  buildLuxuryPalette,
  estimateClassyFooterHeight,
  formatClassyText,
} from "./flyerClassyType";
import { getFlyerTypeTheme } from "./flyerTypeTheme";
import {
  fitFontSizeToWidth,
  roleMinFontSize,
} from "./flyerOverlayTypography";
import { FLYER_ZONE_PERCENT, zoneFontSize } from "./flyerZoneSpec";
import { computeTypographyScale } from "./creativeEngine/typographyEngine";
import { computeFlyerVerticalBalance } from "./flyerLayoutBalance";
import type { BusinessProfile, VideoFormat } from "./types";

export type FooterStackLayout = {
  lines: string[];
  fontSize: number;
  blockH: number;
  topY: number;
  maxW: number;
};

/** One line per field — phone, email, website, location — for crisp SVG footer. */
export function buildStructuredFooterLines(
  business: BusinessProfile,
  copy?: CampaignCopy
): string[] {
  return estimateFooterDisplayLines(business, copy).map((line) =>
    trimOverlayText(line, 56)
  );
}

export function layoutFooterStackForCanvas(
  canvasW: number,
  canvasH: number,
  format: VideoFormat,
  lines: string[],
  business?: BusinessProfile,
  copy?: CampaignCopy
): FooterStackLayout | null {
  const trimmed = lines.map((l) => l.trim()).filter(Boolean);
  if (!trimmed.length) return null;

  const balance =
    business != null
      ? computeFlyerVerticalBalance(business, format, copy)
      : null;
  const reserveTopPx = balance
    ? Math.round(canvasH * balance.footerReserveTopRatio)
    : Math.round(canvasH * FLYER_ZONE_PERCENT.location.top);

  const typo = business
    ? computeTypographyScale(
        business,
        { headline: "", tagline: "", cta: "", location: "", contact: "" },
        format
      )
    : null;
  const baseSize = typo?.footer ?? zoneFontSize(format, "contact");
  const minSize = Math.max(13, Math.round(roleMinFontSize("contact", canvasW) * 0.82));

  const bottomPad = Math.round(canvasH * 0.022);
  const maxFooterH = Math.max(
    Math.round(canvasH * 0.1),
    canvasH - reserveTopPx - bottomPad
  );
  const maxW = Math.round(canvasW * 0.88);

  let fontSize = baseSize;
  const fitted = trimmed;

  while (fontSize >= minSize) {
    const displayLines = fitted.map((l) => formatClassyText(l));
    const blockH = estimateClassyFooterHeight(displayLines.length, fontSize);
    const fitsHeight = blockH <= maxFooterH;
    const fitsWidth = displayLines.every(
      (line) => line.length * fontSize * 0.48 <= maxW * 0.94
    );
    if (fitsHeight && fitsWidth) {
      const sized = fitFontSizeToWidth(
        displayLines,
        maxW,
        fontSize,
        minSize,
        "contact"
      );
      const finalH = estimateClassyFooterHeight(displayLines.length, sized);
      return {
        lines: fitted,
        fontSize: sized,
        blockH: finalH,
        topY: Math.max(reserveTopPx, canvasH - bottomPad - finalH),
        maxW,
      };
    }
    fontSize -= 1;
  }

  const displayLines = fitted.map((l) => formatClassyText(l));
  const sized = Math.max(
    minSize,
    fitFontSizeToWidth(displayLines, maxW, minSize, minSize, "contact")
  );
  const finalH = estimateClassyFooterHeight(fitted.length, sized);
  return {
    lines: fitted,
    fontSize: sized,
    blockH: finalH,
    topY: Math.max(
      reserveTopPx,
      canvasH - bottomPad - Math.min(finalH, maxFooterH)
    ),
    maxW,
  };
}

export function buildFooterStackSvgOverlay(
  canvasW: number,
  canvasH: number,
  layout: FooterStackLayout,
  business: BusinessProfile,
  stripTopY?: number
): Buffer {
  const theme = getFlyerTypeTheme(business);
  const palette = buildLuxuryPalette(business);
  const stripTop = stripTopY ?? layout.topY - 8;
  const stripH = canvasH - stripTop;

  let svg = `<svg width="${canvasW}" height="${canvasH}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<defs><linearGradient id="footerStrip" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(0,0,0,0)"/><stop offset="35%" stop-color="rgba(0,0,0,0.55)"/><stop offset="100%" stop-color="rgba(0,0,0,0.82)"/></linearGradient></defs>`;
  svg += `<rect x="0" y="${stripTop}" width="${canvasW}" height="${stripH}" fill="url(#footerStrip)"/>`;

  const inner = buildClassyFooterSvg({
    canvasW,
    canvasH,
    lines: layout.lines,
    fontSize: layout.fontSize,
    centerX: Math.round(canvasW / 2),
    topY: layout.topY,
    maxWidth: layout.maxW,
    theme,
    role: "contact",
    palette,
    letterSpacing: "0.03em",
    skipBackdrop: true,
  })
    .toString("utf8")
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");

  svg += inner;
  svg += "</svg>";
  return Buffer.from(svg);
}

/** Append pixel-perfect footer SVG overlay(s) to Sharp composites. */
export function appendFlyerFooterSvgComposites(
  composites: OverlayOptions[],
  opts: {
    canvasW: number;
    canvasH: number;
    format: VideoFormat;
    business: BusinessProfile;
    copy?: CampaignCopy;
  }
): boolean {
  const lines = buildStructuredFooterLines(opts.business, opts.copy);
  const layout = layoutFooterStackForCanvas(
    opts.canvasW,
    opts.canvasH,
    opts.format,
    lines,
    opts.business,
    opts.copy
  );
  if (!layout) return false;

  const balance = computeFlyerVerticalBalance(
    opts.business,
    opts.format,
    opts.copy
  );
  const stripTop = Math.round(
    opts.canvasH * balance.footerReserveTopRatio - opts.canvasH * 0.012
  );

  composites.push({
    input: buildFooterStackSvgOverlay(
      opts.canvasW,
      opts.canvasH,
      layout,
      opts.business,
      stripTop
    ),
    top: 0,
    left: 0,
  });
  return true;
}
