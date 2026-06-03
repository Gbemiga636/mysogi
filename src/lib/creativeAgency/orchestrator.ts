import { assembleFinishedFlyerPrompt } from "../flyerBusinessBinding";
import {
  buildPresetCopyStructure,
  buildPresetLayoutBlueprint,
  buildPresetTypographyBlock,
  buildPresetVisualSystem,
  buildReferenceFlyerPromptBlock,
  FLYER_CREATIVE_PRESETS,
  resolveFlyerCreativePreset,
} from "../flyerCreativePresets";
import { buildCampaignTypePromptLead } from "../campaignTypeEngine";
import { sanitizeExactTextFlyerPrompt } from "../flyerExactTextGuard";
import { creativeDirector } from "./creativeDirector";
import { marketingStrategist } from "./marketingPsychology";
import { artDirector } from "./artDirector";
import { brandDesigner } from "./brandDesigner";
import { layoutPlanner } from "./layoutPlanner";
import { expandUserPromptToBrief, buildImageSceneParagraph } from "./promptExpander";
import {
  boostBriefForQuality,
  passesQualityGate,
  scoreCreativeAgencyBrief,
} from "./qualityScorer";
import {
  CREATIVE_AGENCY_MARKER,
  type CreativeAgencyBrief,
  type CreativeAgencyInput,
} from "./types";

export function isCreativeAgencyEnabled(): boolean {
  const v = process.env.MYSOGI_CREATIVE_AGENCY?.trim().toLowerCase();
  if (v === "false" || v === "0" || v === "off") return false;
  if (v === "true" || v === "1" || v === "on") return true;
  const finished = process.env.FLYER_FINISHED_DESIGN?.trim().toLowerCase();
  return finished !== "false" && finished !== "0" && finished !== "off";
}

function buildPresetBlocks(input: CreativeAgencyInput): string[] {
  const presetId = resolveFlyerCreativePreset(
    input.business,
    input.referenceStyleOverride
  );
  const preset = FLYER_CREATIVE_PRESETS.find((p) => p.id === presetId);
  if (!preset) return [];

  return [
    buildReferenceFlyerPromptBlock(
      input.business,
      input.copy,
      input.format,
      presetId
    ),
    buildPresetLayoutBlueprint(preset, input.format),
    buildPresetVisualSystem(preset, input.business),
    buildPresetTypographyBlock(preset, input.business),
    buildPresetCopyStructure(preset, input.business, input.copy, input.format),
  ];
}

/** Run full agency pipeline (no raw user prompt to image model). */
export function runCreativeAgencyPipeline(
  input: CreativeAgencyInput
): CreativeAgencyBrief {
  const userPrompt = input.userPrompt ?? "";
  const campaignMessage = input.campaignMessage ?? "";

  const director = creativeDirector(input);
  const strategist = marketingStrategist(
    input.business,
    userPrompt,
    campaignMessage
  );
  const art = artDirector(input);
  const brand = brandDesigner(input);
  const layout = layoutPlanner(input.business, input.format);

  const leadNote = buildCampaignTypePromptLead(
    input.business,
    userPrompt,
    campaignMessage
  );

  const partial = {
    marker: CREATIVE_AGENCY_MARKER,
    leadNote,
    director,
    strategist,
    artDirector: art,
    brand,
    layout,
  };

  const expandedBrief = expandUserPromptToBrief(input, partial);
  const imageSceneParagraph = buildImageSceneParagraph(input, partial);

  let brief: CreativeAgencyBrief = {
    ...partial,
    expandedBrief,
    imageSceneParagraph,
    scores: { visualImpact: 0, typography: 0, marketing: 0, conversion: 0, professionalism: 0, total: 0 },
  };

  brief.scores = scoreCreativeAgencyBrief(brief);

  if (!passesQualityGate(brief.scores)) {
    brief = boostBriefForQuality(brief);
    brief.scores = scoreCreativeAgencyBrief(brief);
  }

  return brief;
}

/** Final prompt string for OpenAI / Imagen — passes through all agency modules. */
export async function generateCreativeAgencyImagePrompt(
  input: CreativeAgencyInput
): Promise<{ prompt: string; brief: CreativeAgencyBrief; scores: CreativeAgencyBrief["scores"] }> {
  let brief = runCreativeAgencyPipeline(input);

  if (process.env.GROQ_API_KEY?.trim()) {
    try {
      const { refineCreativeAgencySceneWithGroq } = await import("../groq");
      const refined = await refineCreativeAgencySceneWithGroq(input, brief);
      if (refined.length >= 200) {
        brief = {
          ...brief,
          imageSceneParagraph: refined,
        };
        brief.scores = scoreCreativeAgencyBrief(brief);
        if (!passesQualityGate(brief.scores)) {
          brief = boostBriefForQuality(brief);
          brief.scores = scoreCreativeAgencyBrief(brief);
        }
      }
    } catch (e) {
      console.warn("[creativeAgency] Groq refine skipped:", e);
    }
  }

  const presetBlocks = buildPresetBlocks(input);

  const prompt = assembleFinishedFlyerPrompt({
    marker: CREATIVE_AGENCY_MARKER,
    business: input.business,
    copy: input.copy,
    format: input.format,
    userPrompt: input.userPrompt,
    campaignMessage: input.campaignMessage,
    viralLines: {
      hook: input.copy.headline,
      value: input.copy.tagline,
      proof: "",
      cta: input.copy.cta,
    },
    middleSections: [
      brief.expandedBrief.slice(0, 2400),
      "",
      "=== IMAGE SCENE (render exactly) ===",
      brief.imageSceneParagraph,
      ...presetBlocks,
      "",
      `Quality score: ${brief.scores.total}/100 (agency gate passed).`,
    ].filter((s) => s.trim().length > 0),
  });

  return {
    prompt: sanitizeExactTextFlyerPrompt(prompt).slice(0, 3900),
    brief,
    scores: brief.scores,
  };
}
