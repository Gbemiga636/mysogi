import { buildDirectFlyerImagePrompt, isSimpleFlyerMode } from "./directFlyerPrompt";
import {
  buildMasterFinishedFlyerPrompt,
  buildMasterSceneOnlyPrompt,
  buildSeniorDesignPlan,
  isFinishedFlyerDesignEnabled,
  isPremiumHybridFlyerEnabled,
} from "./seniorDesignerEngine";
import {
  analyzeAdAgencyDirection,
  buildAdAgencyCinematicImagePrompt,
} from "./adAgencyEngine";
import { buildExactTextFlyerPrompt } from "./flyerExactTextPrompt";
import { buildOpenAIIntegratedFlyerPrompt } from "./openaiFlyerDesign";
import {
  generateAdAgencySceneBrief,
  generateFlyerPrompt,
  generateOpenAIIntegratedVisualBrief,
} from "./groq";
import type { EliteAdCreativePackage } from "./eliteAdCreativeDirector";
import {
  buildCreativeFlyerContext,
  isEliteCreativeEngineEnabled,
} from "./creativeEngine/orchestrator";
import { assemblePromptWithAdherence } from "./promptAdherence";
import type { CampaignCopy } from "./campaignTextLayers";
import type { BusinessProfile, VideoFormat } from "./types";

export type SeniorFlyerPromptResult = {
  prompt: string;
  elitePackage?: EliteAdCreativePackage;
};

function looksLikeEnrichedPlate(prompt: string): boolean {
  const p = prompt.trim();
  if (p.length < 160) return false;
  if (/text-free|zero-text|background plate only|no letters|no readable writing/i.test(p)) {
    return false;
  }
  return /commercial|photograph|cinematic|advertising|campaign|luxury/i.test(p);
}

function looksLikeTextFreePlate(prompt: string): boolean {
  return /text-free|zero-text|background plate only|no letters|no readable writing/i.test(
    prompt
  );
}

/**
 * Premium hybrid: Steps 1–3 → cinematic scene (people, props, client items); text via SVG after.
 */
export async function resolveSeniorDesignerScenePrompt(
  business: BusinessProfile,
  format: VideoFormat,
  userPrompt: string
): Promise<string> {
  const idea =
    userPrompt.trim() ||
    business.campaignGoal?.trim() ||
    business.tagline?.trim() ||
    "";

  let conceptBoost: string | undefined;
  let visualBoost: string | undefined;
  try {
    const groq = await import("./groq");
    [conceptBoost, visualBoost] = await Promise.all([
      groq.generateSeniorDesignerConceptBrief(business, idea),
      groq.generateSeniorDesignerSceneVisualBrief(business, idea, format),
    ]);
  } catch (e) {
    console.warn("[senior-scene] Groq boost fallback:", e);
  }

  return buildMasterSceneOnlyPrompt(
    business,
    format,
    idea || undefined,
    conceptBoost,
    visualBoost
  );
}

/**
 * Senior designer: Steps 1–4 → complete finished ad in one image (typography inside artwork).
 */
export async function resolveSeniorDesignerFlyerPrompt(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  userPrompt: string,
  referenceStyleOverride?: import("./referenceFlyerStyle").ReferenceFlyerStyleId,
  campaignMessage = ""
): Promise<SeniorFlyerPromptResult> {
  const clientPrompt = userPrompt.trim();
  const ideaForGroq =
    clientPrompt ||
    business.tagline?.trim() ||
    business.industry?.trim() ||
    "";

  let elitePackage: EliteAdCreativePackage | undefined;
  try {
    const groq = await import("./groq");
    elitePackage = await groq.generateEliteAdCreativePackage(
      business,
      copy,
      format,
      ideaForGroq,
      clientPrompt
    );
  } catch (e) {
    console.warn("[senior-designer] elite creative package fallback:", e);
  }

  let prompt = buildMasterFinishedFlyerPrompt(
    business,
    copy,
    format,
    clientPrompt || undefined,
    undefined,
    undefined,
    elitePackage,
    referenceStyleOverride,
    campaignMessage
  );

  if (isEliteCreativeEngineEnabled()) {
    const ctx = buildCreativeFlyerContext(
      business,
      copy,
      format,
      clientPrompt,
      referenceStyleOverride,
      campaignMessage
    );
    if (elitePackage?.finalImagePrompt?.trim()) {
      prompt = assemblePromptWithAdherence([
        { priority: 100, id: "elite-scene", content: elitePackage.finalImagePrompt.slice(0, 1200) },
        { priority: 99, id: "engine", content: ctx.imagePromptBlock.slice(0, 2800) },
      ]);
    } else {
      prompt = ctx.imagePromptBlock;
    }
  }

  return { prompt, elitePackage };
}

/**
 * Overlay mode: business → cinematic photo, text added via SVG after.
 */
export function resolveDirectFlyerPrompt(
  business: BusinessProfile,
  format: VideoFormat,
  userPrompt: string
): string {
  const idea =
    userPrompt.trim() ||
    business.campaignGoal?.trim() ||
    business.tagline?.trim() ||
    "";
  return buildDirectFlyerImagePrompt(business, format, idea || undefined);
}

/** Legacy multi-layer agency path (FLYER_SIMPLE_MODE=false) */
export async function resolveAdAgencyVisualPrompt(
  business: BusinessProfile,
  format: VideoFormat,
  userPrompt: string,
  _clientPromptText?: string
): Promise<string> {
  const seed =
    userPrompt.trim() ||
    business.campaignGoal?.trim() ||
    business.tagline?.trim() ||
    "";

  const direction = analyzeAdAgencyDirection(business, format, seed || undefined);

  let sceneNarrative: string | undefined;
  try {
    sceneNarrative = await generateAdAgencySceneBrief(business, seed, format);
  } catch (e) {
    console.warn("[ad-agency] scene brief fallback:", e);
    if (seed.length >= 8) sceneNarrative = seed;
  }

  return buildAdAgencyCinematicImagePrompt(
    business,
    format,
    direction,
    sceneNarrative
  );
}

export async function resolveFlyerImagePrompt(
  business: BusinessProfile,
  format: VideoFormat,
  userPrompt: string,
  clientPromptText?: string,
  copy?: CampaignCopy
): Promise<string> {
  if (isPremiumHybridFlyerEnabled()) {
    return resolveSeniorDesignerScenePrompt(business, format, userPrompt);
  }
  if (isFinishedFlyerDesignEnabled() && copy) {
    const resolved = await resolveSeniorDesignerFlyerPrompt(
      business,
      copy,
      format,
      userPrompt
    );
    return resolved.prompt;
  }
  if (isSimpleFlyerMode()) {
    return resolveDirectFlyerPrompt(business, format, userPrompt);
  }
  return resolveAdAgencyVisualPrompt(business, format, userPrompt, clientPromptText);
}

export async function resolveEliteFlyerVisualPrompt(
  business: BusinessProfile,
  format: VideoFormat,
  userPrompt: string,
  clientPromptText?: string
): Promise<string> {
  return resolveFlyerImagePrompt(business, format, userPrompt, clientPromptText);
}

export async function resolveHybridFlyerPlatePrompt(
  business: BusinessProfile,
  format: VideoFormat,
  userPrompt: string,
  clientPromptText?: string
): Promise<string> {
  return resolveFlyerImagePrompt(business, format, userPrompt, clientPromptText);
}

export async function resolveExactTextFlyerPrompt(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  userPrompt: string,
  clientPromptText?: string
): Promise<string> {
  const idea = userPrompt.trim();
  let creativeBrief = idea;

  if (looksLikeEnrichedPlate(clientPromptText ?? "")) {
    creativeBrief = clientPromptText!.trim();
  } else if (idea.length >= 12) {
    try {
      creativeBrief = await generateFlyerPrompt(business, idea, format);
    } catch {
      /* keep raw idea */
    }
  }

  return buildExactTextFlyerPrompt(business, copy, format, creativeBrief);
}

export async function resolveOpenAIIntegratedFlyerPrompt(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  userPrompt: string,
  clientPromptText?: string
): Promise<string> {
  const seed =
    userPrompt.trim() ||
    (!looksLikeTextFreePlate(clientPromptText ?? "") ? clientPromptText?.trim() : "") ||
    business.campaignGoal?.trim() ||
    "";

  let visualNarrative: string | undefined;
  try {
    visualNarrative = await generateOpenAIIntegratedVisualBrief(
      business,
      seed,
      format
    );
  } catch (e) {
    console.warn("[openai-flyer] integrated fallback:", e);
    if (seed.length >= 8) visualNarrative = seed;
  }

  return buildOpenAIIntegratedFlyerPrompt(
    business,
    copy,
    format,
    visualNarrative
  );
}
