import {
  buildIndustryLockedVisualBlock,
} from "../flyerBusinessBinding";
import {
  buildPresetLayoutBlueprint,
  buildPresetTypographyBlock,
  buildPresetVisualSystem,
  FLYER_CREATIVE_PRESETS,
  getFlyerCreativePreset,
  resolveFlyerCreativePreset,
  type FlyerCreativePresetId,
} from "../flyerCreativePresets";
import { buildCampaignTypePromptLead } from "../campaignTypeEngine";
import { buildExactMarketingCopyBlock } from "../flyerTypographyAuthority";
import { buildExactSpellingVerificationBlock } from "../flyerTypographyAuthority";
import { buildFlyerAdjustmentBlock } from "../flyerAdjustment";
import { sanitizeExactTextFlyerPrompt } from "../flyerExactTextGuard";
import { buildFooterVerificationBookend } from "../flyerFooterLock";
import { buildStep1ExactContactLockBlock } from "../flyerContactPrompt";
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
import { detectIndustryDesignKey } from "./industrySystems";
import { buildNoAiLogoBlock } from "./agencyLayoutRules";
import {
  buildTrial4FooterReserveBlock,
  TRIAL4_CALIBER_MARKER,
} from "./trial4Blueprint";
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

function isAgencyGroqRefineEnabled(): boolean {
  const v = process.env.MYSOGI_AGENCY_GROQ_REFINE?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "on";
}

/** Trial-4-caliber preset per industry (dense grid layouts). */
export function resolveAgencyFlyerPreset(input: CreativeAgencyInput): FlyerCreativePresetId {
  const override = input.referenceStyleOverride;
  if (override) {
    return resolveFlyerCreativePreset(input.business, override);
  }

  const envStyle = process.env.REFERENCE_FLYER_STYLE?.trim().toLowerCase();
  if (envStyle && envStyle !== "false" && envStyle !== "off") {
    const fromEnv = resolveFlyerCreativePreset(input.business, envStyle);
    if (fromEnv) return fromEnv;
  }

  const key = detectIndustryDesignKey(input.business, input.userPrompt);
  const byIndustry: Record<string, FlyerCreativePresetId> = {
    crypto_fintech: "cd_01",
    food_restaurant: "cd_09",
    real_estate: "cd_10",
    fashion_beauty: "cd_14",
    saas_tech: "cd_02",
    healthcare: "cd_15",
    ecommerce_retail: "cd_18",
    fitness_sports: "cd_11",
    education: "cd_20",
    travel_hospitality: "cd_19",
    automotive: "cd_16",
    nightlife_events: "cd_24",
    legal_services: "cd_26",
    construction_trades: "cd_47",
    agriculture: "cd_48",
    nonprofit: "cd_49",
    energy_green: "cd_39",
    media_podcast: "cd_46",
    pets_services: "cd_26",
    corporate_b2b: "cd_26",
    default_premium: "cd_01",
  };
  return byIndustry[key] ?? "cd_01";
}

function buildPresetBlocks(input: CreativeAgencyInput): string[] {
  const presetId = resolveAgencyFlyerPreset(input);
  const p = getFlyerCreativePreset(presetId);
  if (!FLYER_CREATIVE_PRESETS.some((x) => x.id === presetId)) return [];

  return [
    `CREATIVE-DIRECTOR PRESET ${presetId} — ${p.label}: ${p.layoutHint} ${p.visualHint}`,
    buildPresetLayoutBlueprint(p, input.format),
    buildPresetVisualSystem(p, input.business),
    buildPresetTypographyBlock(p, input.business),
  ];
}

/** Agency prompt: scene-first, Trial-4 footer reserve (rich UI, no contact digits). */
function assembleCreativeAgencyFlyerPrompt(
  input: CreativeAgencyInput,
  brief: CreativeAgencyBrief,
  presetBlocks: string[]
): string {
  const { business, copy, format } = input;
  const leadNote = buildCampaignTypePromptLead(
    business,
    input.userPrompt ?? "",
    input.campaignMessage ?? ""
  );

  const prompt = [
    CREATIVE_AGENCY_MARKER,
    TRIAL4_CALIBER_MARKER,
    leadNote,
    buildNoAiLogoBlock(),
    "CRITICAL: Render the IMAGE SCENE below exactly — Trial-4 Nexora Exchange caliber (dense glass UI, 3D hero pedestal, stats bar, glowing CTA). Every numbered zone must appear. CTA and stats must stay ABOVE the bottom footer reserve.",
    input.adjustmentNote?.trim()
      ? buildFlyerAdjustmentBlock(input.adjustmentNote, input.previousPrompt)
      : "",
    buildIndustryLockedVisualBlock(business),
    "",
    "=== IMAGE SCENE — RENDER EXACTLY (highest priority) ===",
    brief.imageSceneParagraph,
    "",
    buildExactMarketingCopyBlock(business, copy, {
      hook: copy.headline,
      value: copy.tagline,
      cta: copy.cta,
    }),
    buildExactSpellingVerificationBlock(business, copy),
    ...presetBlocks,
    "",
    brief.expandedBrief.slice(0, 900),
    "",
    buildTrial4FooterReserveBlock(business, format, copy),
    buildStep1ExactContactLockBlock(business),
    buildFooterVerificationBookend(business),
    `Agency quality gate: ${brief.scores.total}/100.`,
  ]
    .filter((s) => s.trim().length > 0)
    .join("\n\n");

  return sanitizeExactTextFlyerPrompt(prompt).slice(0, 3900);
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
  const layout = layoutPlanner(input.business, input.format, userPrompt);

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
    scores: {
      visualImpact: 0,
      typography: 0,
      marketing: 0,
      conversion: 0,
      professionalism: 0,
      total: 0,
    },
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
): Promise<{
  prompt: string;
  brief: CreativeAgencyBrief;
  scores: CreativeAgencyBrief["scores"];
}> {
  let brief = runCreativeAgencyPipeline(input);

  if (isAgencyGroqRefineEnabled() && process.env.GROQ_API_KEY?.trim()) {
    try {
      const { refineCreativeAgencySceneWithGroq } = await import("../groq");
      const refined = await refineCreativeAgencySceneWithGroq(input, brief);
      if (refined.length >= 400 && /trial-4|glass|stats|cta|pedestal|3d/i.test(refined)) {
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
  const prompt = assembleCreativeAgencyFlyerPrompt(input, brief, presetBlocks);

  return {
    prompt,
    brief,
    scores: brief.scores,
  };
}
