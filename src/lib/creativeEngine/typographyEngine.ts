import { getBusinessNameHeadline } from "../campaignGoalImageGuard";
import type { CampaignCopy } from "../campaignTextLayers";
import type { BusinessProfile, VideoFormat } from "../types";
import { FORMAT_RATIOS } from "../types";
import { resolveFontPairing } from "./fontPairings";
import type { FontPairing, TypographyScale } from "./types";

const MIN_HEADLINE = 44;
const MAX_HEADLINE = 118;

function wrapByChars(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
    if (lines.length >= maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines.length ? lines : [text.slice(0, maxChars)];
}

export function computeHeadlineFontSize(
  text: string,
  canvasW: number,
  canvasH: number,
  maxLines = 3
): { fontSize: number; lines: string[] } {
  const scale = canvasW / 1080;
  const maxW = canvasW * 0.88;
  const charsPerLine = Math.max(8, Math.floor(maxW / (scale * 28)));
  const lines = wrapByChars(text, charsPerLine, maxLines);

  let fontSize = Math.round(Math.min(MAX_HEADLINE, canvasH * 0.065) * scale);
  const longest = Math.max(...lines.map((l) => l.length), 1);

  while (fontSize > MIN_HEADLINE && longest * fontSize * 0.52 > maxW * 0.94) {
    fontSize -= 2;
  }

  const blockH = lines.length * fontSize * 1.08;
  const maxBlockH = canvasH * 0.22;
  while (fontSize > MIN_HEADLINE && blockH > maxBlockH) {
    fontSize -= 2;
  }

  return { fontSize, lines };
}

export function computeTypographyScale(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat
): TypographyScale {
  const { width, height } = FORMAT_RATIOS[format];
  const headlineText = getBusinessNameHeadline(business);
  const { fontSize: headlineSize } = computeHeadlineFontSize(
    headlineText,
    width,
    height
  );

  const scale = width / 1080;
  const subheadLen = (copy.tagline || "").length;
  let subhead = Math.round(Math.min(36, headlineSize * 0.38) * (subheadLen > 80 ? 0.88 : 1));

  return {
    brand: Math.round(Math.max(18, headlineSize * 0.32) * scale) || 22,
    headline: headlineSize,
    subhead,
    cta: Math.round(Math.min(40, headlineSize * 0.42)),
    footer: Math.round(Math.max(16, 20 * scale)),
    headlineLineHeight: 1.08,
    subheadLineHeight: 1.28,
    stackGap: Math.round(height * 0.024),
  };
}

export function buildTypographyPromptBlock(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat
): string {
  const pairing = resolveFontPairing(business);
  const typo = computeTypographyScale(business, copy, format);
  const name = getBusinessNameHeadline(business);

  return [
    "ELITE TYPOGRAPHY ENGINE:",
    `Font pairing — Headline: ${pairing.headline}. Subhead: ${pairing.subhead}. CTA: ${pairing.cta}. Footer: ${pairing.footer}.`,
    `HERO HEADLINE (business name): "${name}" — ${typo.headline}px equivalent, extra-bold, tight tracking (-0.02em), max 2–3 lines, center axis.`,
    copy.tagline?.trim()
      ? `Subhead: "${copy.tagline}" — ${typo.subhead}px equivalent, medium weight, softer opacity, centered under headline.`
      : "",
    copy.cta?.trim()
      ? `CTA pill: "${copy.cta}" — ${typo.cta}px label, rounded 999px, premium padding, soft outer glow.`
      : "",
    "Typography intelligence: auto-shrink on long names, preserve whitespace, no collisions, no text over faces.",
    "Typeset only — never hand-drawn. Vector-crisp kerning like Figma/InDesign export.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function getFontPairingForBusiness(business: BusinessProfile): FontPairing {
  return resolveFontPairing(business);
}
