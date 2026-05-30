import { stripColorCodesFromText } from "./flyerExactTextGuard";
import type { BusinessProfile } from "./types";

/** Words/phrases Imagen often paints as visible junk text */
const BANNED_PHRASES = [
  "zone a",
  "zone b",
  "zone c",
  "zone d",
  "zone e",
  "zone f",
  "zone g",
  "headline",
  "tagline",
  "footer",
  "overlay",
  "compliance",
  "forbidden",
  "typography",
  "hex",
  "rgb",
  "palette",
  "layout",
  "placeholder",
  "lorem",
  "sample text",
  "call-to-action",
  "cta button",
  "logo band",
  "logo zone",
  "safe zone",
  "empty band",
  "post overlay",
  "marketing overlay",
  "numbered line",
  "character-accurate",
  "non-negotiable",
  "brand analysis",
  "ad design strategy",
  "scene elements",
  "hero scene",
  "visual marketing language",
  "industry adaptation",
  "creative angle",
  "world-class agency",
  "exact-text",
  "zero-text",
  "text-free",
  "pixel-perfect",
  "cloudinary",
  "imagen",
  "=== ",
  "glow shape",
  "pill shape",
  "abstract shape",
  "geometric",
  "sticker",
  "badge shape",
  "floating circle",
  "ui card",
];

const BANNED_WORD_RE =
  /\b(zone|colour|color|colours|colors|palette|headline|tagline|footer|overlay|typography|hex|compliance|forbidden|lorem|placeholder|cta|rgb|hsl|pantone)\b/gi;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function stripQuotedStrings(prompt: string): string {
  return prompt
    .replace(/"[^"]{2,200}"/g, "")
    .replace(/'[^']{2,200}'/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function neutralizeBusinessNameInPrompt(
  prompt: string,
  business?: BusinessProfile
): string {
  const name = business?.businessName?.trim();
  if (!name || name.length < 3) return prompt;
  return prompt.replace(new RegExp(escapeRegExp(name), "gi"), "the business");
}

/**
 * Strip every label/meta term that Imagen might render as on-image text.
 */
export function scrubPromptForImagen(
  prompt: string,
  business?: BusinessProfile
): string {
  let p = stripColorCodesFromText(prompt);
  p = stripQuotedStrings(p);
  p = neutralizeBusinessNameInPrompt(p, business);

  for (const phrase of BANNED_PHRASES) {
    p = p.replace(new RegExp(escapeRegExp(phrase), "gi"), "");
  }

  p = p.replace(BANNED_WORD_RE, "");
  p = p.replace(/={2,}/g, "");
  p = p.replace(/\bLINE\s*\d+\b/gi, "");
  p = p.replace(/\(\s*\d+\s*–\s*\d+\s*%[^)]*\)/g, "");
  p = p.replace(/\b\d+\s*–\s*\d+\s*%/g, "");
  p = p.replace(/\bNOT\b/gi, "");
  p = p.replace(/\bZERO\b/gi, "");
  p = p.replace(/\bONLY\b/gi, "");
  p = p.replace(/\bMUST\b/gi, "");
  p = p.replace(/\bNEVER\b/gi, "");

  return p.replace(/\s{2,}/g, " ").replace(/\s+([,.])/g, "$1").trim();
}

export const IMAGEN_NO_WRITING_CLOSER =
  "Professional commercial photo only. Every surface is blank of writing: no signs, labels, screens, packaging text, watermarks, or captions anywhere in the frame.";
