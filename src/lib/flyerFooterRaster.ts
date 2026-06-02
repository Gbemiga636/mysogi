import "server-only";

import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import type { EmbeddedFont } from "./flyerFontEmbed";
import { resolveBundledFontPath } from "./flyerFontPaths";
import { formatClassyText } from "./flyerClassyType";
import type { FooterStackLayout } from "./flyerFooterOverlay";

const registeredFonts = new Set<string>();

function registerCanvasFont(font: EmbeddedFont): string | null {
  const fontPath = resolveBundledFontPath(font.package, font.file);
  if (!fontPath) {
    console.warn(
      `[flyerFooterRaster] missing font ${font.package}/${font.file}`
    );
    return null;
  }

  const alias = `Flyer_${font.package}_${font.weight}`;
  if (!registeredFonts.has(alias)) {
    GlobalFonts.registerFromPath(fontPath, alias);
    registeredFonts.add(alias);
  }
  return alias;
}

/**
 * Raster footer (gradient band + contact text) via Canvas.
 * Sharp/librsvg cannot render embedded WOFF2 in SVG on Linux/Vercel.
 */
export function buildFooterRasterOverlay(
  canvasW: number,
  canvasH: number,
  layout: FooterStackLayout,
  contactFont: EmbeddedFont,
  stripTopY: number
): Buffer | null {
  const alias = registerCanvasFont(contactFont);
  if (!alias) return null;

  const canvas = createCanvas(canvasW, canvasH);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvasW, canvasH);

  const stripTop = Math.max(0, stripTopY);
  const grad = ctx.createLinearGradient(0, stripTop, 0, canvasH);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.35, "rgba(0,0,0,0.55)");
  grad.addColorStop(1, "rgba(0,0,0,0.82)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, stripTop, canvasW, canvasH - stripTop);

  const lineHeight = Math.round(layout.fontSize * 1.22);
  const padY = 8;
  const weight = contactFont.weight;
  ctx.font = `${weight} ${layout.fontSize}px "${alias}"`;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 1;

  const centerX = Math.round(canvasW / 2);

  layout.lines.forEach((line, i) => {
    const text = formatClassyText(line);
    const y = layout.topY + padY + layout.fontSize + i * lineHeight;
    ctx.fillText(text, centerX, y);
  });

  return canvas.toBuffer("image/png");
}

export function canRasterizeFlyerFooter(contactFont: EmbeddedFont): boolean {
  return resolveBundledFontPath(contactFont.package, contactFont.file) != null;
}
