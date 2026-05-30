import { buildContactFooterDirective } from "./businessContact";
import type { CampaignCopy } from "./campaignTextLayers";
import { buildBusinessFlyerVisualPrompt } from "./flyerImagenVisualPrompt";
import { scrubPromptForImagen } from "./flyerImagenScrub";
import {
  buildExactTextImagenSuffix,
  buildExactTextVerticalLayout,
  buildTypographyPrecisionBlock,
  FLYER_EXACT_TEXT_COMPLIANCE,
  sanitizeExactTextFlyerPrompt,
} from "./flyerExactTextGuard";
import type { BusinessProfile, VideoFormat } from "./types";

export const EXACT_TEXT_FLYER_MARKER = "FINISHED-MARKETING-FLYER";

/**
 * AI renders copy in-image (less reliable). Prefer hybrid mode for perfect text.
 */
export function buildExactTextFlyerPrompt(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  creativeBrief?: string
): string {
  const visual = buildBusinessFlyerVisualPrompt(business, format, creativeBrief);
  const words = buildTypographyPrecisionBlock(copy, business);
  const spacing = buildExactTextVerticalLayout();

  const brief = [
    visual,
    buildContactFooterDirective(business),
    words,
    spacing,
    FLYER_EXACT_TEXT_COMPLIANCE,
    buildExactTextImagenSuffix(),
  ].join(" ");

  return sanitizeExactTextFlyerPrompt(scrubPromptForImagen(brief, business)).slice(
    0,
    4200
  );
}

export function isExactTextFlyerPrompt(prompt: string): boolean {
  return (
    prompt.includes(EXACT_TEXT_FLYER_MARKER) ||
    prompt.includes("Render exactly:") ||
    prompt.includes("FINISHED-MARKETING-FLYER")
  );
}
