import type { BusinessProfile } from "./types";
import {
  IMAGEN_NO_WRITING_CLOSER,
  neutralizeBusinessNameInPrompt as neutralizeName,
  scrubPromptForImagen,
  stripQuotedStrings,
} from "./flyerImagenScrub";

export const FLYER_ZERO_TEXT_POLICY =
  "Photograph only. No writing, numbers, or symbols anywhere in the image. Blank screens and blank signs.";

export const FLYER_NO_TEXT_SUFFIX =
  "Surfaces that would show writing appear blank or softly blurred without readable characters.";

const LEGACY_REPLACEMENTS: [RegExp, string][] = [
  [/typography-safe/gi, "clean spacing"],
  [/typography/gi, "spacing"],
  [/headline/gi, "upper area"],
  [/tagline/gi, "subtitle area"],
  [/cta/gi, "action area"],
  [/overlay/gi, "later"],
  [/zone\s+[a-g]/gi, "area"],
  [/colour/gi, "tone"],
  [/color/gi, "tone"],
  [/palette/gi, "grading"],
  [/layout/gi, "composition"],
  [/signage/gi, "blank facades"],
  [/generate\s+flyer/gi, "commercial photograph"],
];

export function stripQuotedCopyFromPrompt(prompt: string): string {
  return stripQuotedStrings(prompt);
}

export function neutralizeBusinessNameInPrompt(
  prompt: string,
  business?: BusinessProfile
): string {
  return neutralizeName(prompt, business);
}

export function sanitizeFlyerPromptForImagen(
  prompt: string,
  business?: BusinessProfile
): string {
  let p = scrubPromptForImagen(prompt, business);
  for (const [pattern, replacement] of LEGACY_REPLACEMENTS) {
    p = p.replace(pattern, replacement);
  }
  return p.replace(/\s{2,}/g, " ").trim();
}

/** Final pass — NO zone letters, NO designer labels */
export function finalizeImagenFlyerPrompt(
  prompt: string,
  business?: BusinessProfile
): string {
  const core = sanitizeFlyerPromptForImagen(prompt, business);
  const finalized = [core, FLYER_ZERO_TEXT_POLICY, IMAGEN_NO_WRITING_CLOSER].join(" ");
  return scrubPromptForImagen(finalized, business).slice(0, 4200);
}
