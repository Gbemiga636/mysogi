import { buildBusinessFlyerVisualPrompt } from "./flyerImagenVisualPrompt";
import type { BusinessProfile, VideoFormat } from "./types";

/** Text-free cinematic plate for hybrid flyer pipeline */
export function buildCreativeFlyerPlatePrompt(
  business: BusinessProfile,
  format: VideoFormat,
  creativeBrief?: string
): string {
  return buildBusinessFlyerVisualPrompt(business, format, creativeBrief);
}
