import {
  buildSvgEmbeddedFontDefs,
  svgFontFamily,
  type EmbeddedFont,
} from "./flyerFontEmbed";
import { ctaButtonFill, type LuxuryPalette } from "./flyerLuxuryPalette";
import { textOnBrandFill } from "./flyerPremiumColors";
import { svgHeadlineOnImageFilter, svgTextShadowFilter } from "./flyerTypography";
import { themeFonts, type FlyerTypeTheme } from "./flyerTypeTheme";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeXmlAttr(value: string): string {
  return escapeXml(value).replace(/\r?\n/g, " ");
}

function familyAttr(font: EmbeddedFont): string {
  return escapeXmlAttr(svgFontFamily(font.family));
}

function fontDefs(theme: FlyerTypeTheme): string {
  return buildSvgEmbeddedFontDefs(themeFonts(theme));
}

function luxuryShadowDefs(): string {
  return `${svgHeadlineOnImageFilter("luxHead")}${svgTextShadowFilter("luxBody")}${svgTextShadowFilter("luxCta")}`;
}

/** Editorial title case — not shouty all-caps */
export function formatClassyText(text: string): string {
  const t = text.trim();
  if (!t) return t;
  if (t === t.toUpperCase() && t.length > 4) {
    return t
      .toLowerCase()
      .replace(/(?:^|\s|[-/&])\w/g, (c) => c.toUpperCase());
  }
  return t;
}

/** CTA label — clean uppercase inside button only */
export function formatCtaLabel(text: string): string {
  return formatClassyText(text).toUpperCase();
}

export function splitHeadlineEmphasis(line: string): {
  lead: string;
  accent: string;
} {
  const words = line.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 2) {
    return { lead: "", accent: line.trim() };
  }
  const accentCount = words.length >= 6 ? 2 : 1;
  const accent = words.slice(-accentCount).join(" ");
  const lead = words.slice(0, -accentCount).join(" ");
  return { lead, accent };
}

type HeadlineSegment = { text: string; fill: "white" | "accent" };

export function buildHeadlineSegments(
  line: string,
  businessName: string
): HeadlineSegment[] {
  const formatted = formatClassyText(line);
  const bn = formatClassyText(businessName.trim());
  if (!bn) {
    const { lead, accent } = splitHeadlineEmphasis(formatted);
    if (!lead) return [{ text: accent, fill: "white" }];
    return [
      { text: `${lead} `, fill: "white" },
      { text: accent, fill: "accent" },
    ];
  }

  const lineLower = formatted.toLowerCase();
  const bnLower = bn.toLowerCase();
  const idx = lineLower.indexOf(bnLower);

  if (idx >= 0) {
    const before = formatted.slice(0, idx);
    const namePart = formatted.slice(idx, idx + bn.length);
    const after = formatted.slice(idx + bn.length).trim();
    const segments: HeadlineSegment[] = [];
    if (before.trim()) segments.push({ text: before, fill: "white" });
    segments.push({ text: namePart, fill: "white" });
    if (after) {
      const { lead, accent } = splitHeadlineEmphasis(after);
      if (lead) {
        segments.push({ text: ` ${lead} `, fill: "white" });
        segments.push({ text: accent, fill: "accent" });
      } else {
        segments.push({ text: ` ${after}`, fill: "accent" });
      }
    }
    return segments.length ? segments : [{ text: formatted, fill: "white" }];
  }

  const { lead, accent } = splitHeadlineEmphasis(formatted);
  if (!lead) return [{ text: formatted, fill: "white" }];
  return [
    { text: `${lead} `, fill: "white" },
    { text: accent, fill: "accent" },
  ];
}

function headlineTspans(
  segments: HeadlineSegment[],
  palette: LuxuryPalette
): string {
  const accent = escapeXmlAttr(palette.accent);
  return segments
    .map((s) => {
      const fill =
        s.fill === "accent" ? accent : escapeXmlAttr(palette.headline);
      return `<tspan fill="${fill}">${escapeXml(s.text)}</tspan>`;
    })
    .join("");
}

function readabilityVeil(
  x: number,
  y: number,
  w: number,
  h: number,
  palette: LuxuryPalette
): string {
  const veil = escapeXmlAttr(palette.veil);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${veil}"/>`;
}

/** Agency headline — serif/sans luxury, soft veil for contrast */
export function buildClassyHeadlineSvg(opts: {
  canvasW: number;
  canvasH: number;
  lines: string[];
  fontSize: number;
  centerX: number;
  topY: number;
  maxWidth: number;
  accentColor: string;
  businessName: string;
  theme: FlyerTypeTheme;
  palette: LuxuryPalette;
}): Buffer {
  const lines = opts.lines.map(formatClassyText);
  const lineHeight = Math.round(opts.fontSize * 1.1);
  const padY = 16;
  const padX = 20;
  const blockH = lines.length * lineHeight + padY * 2;
  const blockW = opts.maxWidth;
  const boxX = Math.max(12, opts.centerX - blockW / 2);
  const boxY = opts.topY;
  const family = familyAttr(opts.theme.headline);

  let svg = `<svg width="${opts.canvasW}" height="${opts.canvasH}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<defs><style>${fontDefs(opts.theme)}</style>${luxuryShadowDefs()}</defs>`;
  svg += readabilityVeil(boxX, boxY, blockW, blockH, opts.palette);

  lines.forEach((line, i) => {
    const ty = boxY + padY + opts.fontSize + i * lineHeight;
    const segments = buildHeadlineSegments(line, opts.businessName);
    svg += `<text x="${opts.centerX}" y="${ty}" text-anchor="middle" font-family="${family}" font-size="${opts.fontSize}" font-weight="${opts.theme.headline.weight}" filter="url(#luxHead)" letter-spacing="0.02em">${headlineTspans(segments, opts.palette)}</text>`;
  });

  svg += "</svg>";
  return Buffer.from(svg);
}

/** Minimal subhead — Inter/Manrope */
export function buildClassyTaglineSvg(opts: {
  canvasW: number;
  canvasH: number;
  lines: string[];
  fontSize: number;
  centerX: number;
  topY: number;
  maxWidth: number;
  theme: FlyerTypeTheme;
  palette: LuxuryPalette;
}): Buffer {
  const lines = opts.lines.map(formatClassyText);
  const lineHeight = Math.round(opts.fontSize * 1.32);
  const padY = 10;
  const padX = 16;
  const blockH = lines.length * lineHeight + padY * 2;
  const blockW = Math.round(opts.maxWidth * 0.9);
  const boxX = Math.max(12, opts.centerX - blockW / 2);
  const boxY = opts.topY;
  const family = familyAttr(opts.theme.tagline);
  const fill = escapeXmlAttr(opts.palette.subhead);

  let svg = `<svg width="${opts.canvasW}" height="${opts.canvasH}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<defs><style>${fontDefs(opts.theme)}</style>${luxuryShadowDefs()}</defs>`;
  svg += readabilityVeil(boxX, boxY, blockW, blockH, opts.palette);

  lines.forEach((line, i) => {
    const ty = boxY + padY + opts.fontSize + i * lineHeight;
    svg += `<text x="${opts.centerX}" y="${ty}" text-anchor="middle" font-family="${family}" font-size="${opts.fontSize}" font-weight="${opts.theme.tagline.weight}" fill="${fill}" filter="url(#luxBody)" letter-spacing="0.03em">${escapeXml(line)}</text>`;
  });

  svg += "</svg>";
  return Buffer.from(svg);
}

/**
 * Premium CTA — glass + brand gradient, rounded, shadow (SaaS / luxury campaign UI).
 */
export function buildClassyCtaSvg(opts: {
  canvasW: number;
  canvasH: number;
  text: string;
  fontSize: number;
  brandColor: string;
  centerX: number;
  topY: number;
  maxWidth: number;
  theme: FlyerTypeTheme;
  palette: LuxuryPalette;
}): Buffer {
  const label = escapeXml(formatCtaLabel(opts.text));
  const padX = Math.round(opts.fontSize * 1.45);
  const padY = Math.round(opts.fontSize * 0.52);
  const estW = Math.min(
    opts.maxWidth,
    Math.max(168, Math.round(label.length * opts.fontSize * 0.5 + padX * 2))
  );
  const boxH = opts.fontSize + padY * 2;
  const boxX = opts.centerX - estW / 2;
  const boxY = opts.topY;
  const rx = 14;
  const family = familyAttr(opts.theme.cta);
  const btn = ctaButtonFill(opts.brandColor);
  const top = escapeXmlAttr(btn.top);
  const bottom = escapeXmlAttr(btn.bottom);
  const stroke = escapeXmlAttr(btn.stroke);
  const textFill = escapeXmlAttr(textOnBrandFill(opts.brandColor));

  const svg = `<svg width="${opts.canvasW}" height="${opts.canvasH}" xmlns="http://www.w3.org/2000/svg">
<defs>
<style>${fontDefs(opts.theme)}</style>
${luxuryShadowDefs()}
<filter id="ctaDrop" x="-25%" y="-40%" width="150%" height="180%">
<feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.42"/>
<feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.28"/>
</filter>
<linearGradient id="ctaFill" x1="0%" y1="0%" x2="0%" y2="100%">
<stop offset="0%" stop-color="${top}"/>
<stop offset="100%" stop-color="${bottom}"/>
</linearGradient>
<linearGradient id="ctaGlass" x1="0%" y1="0%" x2="0%" y2="100%">
<stop offset="0%" stop-color="rgba(255,255,255,0.22)"/>
<stop offset="45%" stop-color="rgba(255,255,255,0.06)"/>
<stop offset="100%" stop-color="rgba(255,255,255,0)"/>
</linearGradient>
</defs>
<g filter="url(#ctaDrop)">
<rect x="${boxX}" y="${boxY}" width="${estW}" height="${boxH}" rx="${rx}" fill="url(#ctaFill)" stroke="${stroke}" stroke-width="1.5"/>
<rect x="${boxX + 1}" y="${boxY + 1}" width="${estW - 2}" height="${Math.max(4, Math.round(boxH * 0.42))}" rx="${rx - 1}" fill="url(#ctaGlass)"/>
<text x="${opts.centerX}" y="${boxY + padY + opts.fontSize - 2}" text-anchor="middle" font-family="${family}" font-size="${opts.fontSize}" font-weight="${opts.theme.cta.weight}" fill="${textFill}" filter="url(#luxCta)" letter-spacing="0.07em">${label}</text>
</g>
</svg>`;

  return Buffer.from(svg.replace(/\s*\n\s*/g, ""));
}

/** Footer — readable, minimal tracking */
export function buildClassyFooterSvg(opts: {
  canvasW: number;
  canvasH: number;
  lines: string[];
  fontSize: number;
  centerX: number;
  topY: number;
  maxWidth: number;
  theme: FlyerTypeTheme;
  role: "location" | "contact";
  palette: LuxuryPalette;
  letterSpacing?: string;
  skipBackdrop?: boolean;
}): Buffer {
  const lines = opts.lines.map((l) => l.trim()).filter(Boolean);
  if (!lines.length) {
    return Buffer.from(
      `<svg width="${opts.canvasW}" height="${opts.canvasH}" xmlns="http://www.w3.org/2000/svg"/>`
    );
  }

  const font =
    opts.role === "location" ? opts.theme.location : opts.theme.contact;
  const lineHeight = Math.round(opts.fontSize * 1.22);
  const padY = 8;
  const blockH = lines.length * lineHeight + padY * 2;
  const blockW = opts.maxWidth;
  const boxX = Math.max(12, opts.centerX - blockW / 2);
  const boxY = opts.topY;
  const family = familyAttr(font);
  const fill = escapeXmlAttr(opts.palette.body);

  let svg = `<svg width="${opts.canvasW}" height="${opts.canvasH}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<defs><style>${fontDefs(opts.theme)}</style>${luxuryShadowDefs()}</defs>`;
  if (!opts.skipBackdrop) {
    svg += readabilityVeil(boxX, boxY, blockW, blockH, opts.palette);
  }

  lines.forEach((line, i) => {
    const ty = boxY + padY + opts.fontSize + i * lineHeight;
    svg += `<text x="${opts.centerX}" y="${ty}" text-anchor="middle" font-family="${family}" font-size="${opts.fontSize}" font-weight="${font.weight}" fill="${fill}" filter="url(#luxBody)" letter-spacing="${opts.letterSpacing ?? "0.04em"}">${escapeXml(formatClassyText(line))}</text>`;
  });

  svg += "</svg>";
  return Buffer.from(svg);
}

export function estimateClassyHeadlineHeight(
  lineCount: number,
  fontSize: number
): number {
  return Math.round(lineCount * fontSize * 1.1 + 32);
}

export function estimateClassyTaglineHeight(
  lineCount: number,
  fontSize: number
): number {
  return Math.round(lineCount * fontSize * 1.32 + 20);
}

export function estimateClassyCtaHeight(fontSize: number): number {
  return Math.round(fontSize * 2.04 + 16);
}

export function estimateClassyFooterHeight(
  lineCount: number,
  fontSize: number
): number {
  return Math.round(lineCount * fontSize * 1.22 + 16);
}

export { buildLuxuryPalette } from "./flyerLuxuryPalette";
