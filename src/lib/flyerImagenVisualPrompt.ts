import { buildBusinessVisualAnchor, IMAGEN_NO_GRAPHIC_SHAPES } from "./businessVisualAnchor";
import { formatBrandPaletteForImagenVisual } from "./brandColors";
import { getCampaignVisualStyle } from "./businessCampaign";
import { analyzeBrandPsychology, getNicheVisualAdaptation } from "./eliteCreativeDirector";
import { IMAGEN_NO_WRITING_CLOSER, scrubPromptForImagen } from "./flyerImagenScrub";
import { buildSceneElementsProse } from "./flyerSceneElements";
import { flyerFormatLabel } from "./flyerVisualCommon";
import type { BusinessProfile, VideoFormat } from "./types";

function buildNaturalCompositionGuide(): string {
  return [
    "Composition: upper area soft sky or bokeh, middle frame sharp hero subject,",
    "lower area natural photography with gentle vignette, bottom edge darker.",
    "Busy detail only in the middle. No flat graphic elements.",
  ].join(" ");
}

export function buildBusinessFlyerVisualPrompt(
  business: BusinessProfile,
  format: VideoFormat,
  creativeBrief?: string
): string {
  const industry = business.industry?.trim() || "professional services";
  const psych = analyzeBrandPsychology(business);
  const style = getCampaignVisualStyle(business);
  const niche = getNicheVisualAdaptation(business);
  const palette = formatBrandPaletteForImagenVisual(business);
  const scene = buildSceneElementsProse(business);
  const anchor = buildBusinessVisualAnchor(business, creativeBrief);
  const fmt = flyerFormatLabel(format);

  const raw = [
    anchor,
    `Format: ${fmt} commercial photograph for ${industry}.`,
    `Emotion: ${psych.emotion}. Tone: ${psych.tone}.`,
    `${niche}. ${style}.`,
    `Grading: ${palette}.`,
    scene,
    buildNaturalCompositionGuide(),
    IMAGEN_NO_GRAPHIC_SHAPES,
    "Cinematic depth of field, magazine campaign quality, rich shadows, glossy reflections.",
    IMAGEN_NO_WRITING_CLOSER,
  ]
    .filter(Boolean)
    .join(" ");

  return scrubPromptForImagen(raw, business).slice(0, 4200);
}
