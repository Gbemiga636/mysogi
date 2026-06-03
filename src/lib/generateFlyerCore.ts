import { buildCampaignCopy } from "./campaignTextLayers";
import { ensureBusinessContactOnCopy } from "./businessContact";
import { assertFlyerCopyReady } from "./campaignCopySanitize";
import { composeCampaignFlyer } from "./composeCampaignFlyer";
import { composeLogoOnlyFlyer } from "./composeLogoOnly";
import { getFlyerTextMode } from "./composeEngine";
import { shouldUseFooterOverlayCompose } from "./flyerExactContactMode";
import { normalizeBusinessProfileContact } from "./businessContactCore";
import { isSimpleFlyerMode } from "./directFlyerPrompt";
import {
  buildCreativeFlyerContext,
  isEliteCreativeEngineEnabled,
} from "./creativeEngine/orchestrator";
import { exportFlyerBuffer, formatToExportPreset } from "./creativeEngine";
import {
  resolveExactTextFlyerPrompt,
  resolveFlyerImagePrompt,
  resolveSeniorDesignerFlyerPrompt,
} from "./flyerPlatePromptResolve";
import {
  generateAdBrainImagePrompt,
  isAdBrainEnabled,
  type AdBrainOutput,
} from "./adBrainEngine";
import {
  generateCreativeAgencyImagePrompt,
  isCreativeAgencyEnabled,
} from "./creativeAgency";
import {
  generateWorldClassFlyerImagePrompt,
  isWorldClassFlyerEnabled,
} from "./worldClassFlyerEngine";
import {
  isFinishedFlyerDesignEnabled,
  isPremiumHybridFlyerEnabled,
} from "./seniorDesignerEngine";
import {
  REFERENCE_STYLE_LABELS,
  getFlyerCreativePreset,
  resolveAlternateReferenceStyle,
  resolveReferenceFlyerStyle,
  type ReferenceFlyerStyleId,
} from "./referenceFlyerStyle";
import type { CampaignCopy } from "./campaignTextLayers";
import type { BusinessProfile, VideoFormat } from "./types";
import {
  createTextToImage,
  extractOutputUrl,
  waitForTask,
} from "./imageProvider";
import { fetchFlyerImageBuffer } from "./flyerImageStore";

export type FlyerVariantResult = {
  id: string;
  label: string;
  referenceStyle: ReferenceFlyerStyleId;
  imageUrl: string;
  exportImageUrl?: string;
  baseImageUrl: string;
  localImageUrl: string;
  localBaseImageUrl: string;
  promptText: string;
  taskId: string;
  adBrain?: AdBrainOutput;
};

export type GenerateFlyerVariantParams = {
  business: BusinessProfile;
  format: VideoFormat;
  logoDataUrl?: string;
  userPrompt: string;
  copy: CampaignCopy;
  origin: string;
  variantId: string;
  referenceStyleOverride?: ReferenceFlyerStyleId;
  variantCreativeNote?: string;
  campaignMessage?: string;
  adjustmentNote?: string;
  previousPrompt?: string;
};

export async function generateFlyerVariant(
  params: GenerateFlyerVariantParams
): Promise<FlyerVariantResult> {
  const business = normalizeBusinessProfileContact(params.business);
  const {
    format,
    logoDataUrl,
    userPrompt,
    copy,
    origin,
    variantId,
    referenceStyleOverride,
    variantCreativeNote,
    campaignMessage = "",
  } = params;

  const copyForFlyer = ensureBusinessContactOnCopy(copy, business);
  const textMode = getFlyerTextMode();
  const premiumHybrid = isPremiumHybridFlyerEnabled();
  const finishedInImage = isFinishedFlyerDesignEnabled() && !premiumHybrid;
  const referenceStyle = resolveReferenceFlyerStyle(
    business,
    referenceStyleOverride
  );
  const effectivePrompt = [
    campaignMessage.trim(),
    userPrompt,
    variantCreativeNote,
  ]
    .filter(Boolean)
    .join(" — ");

  const creativeCtx = isEliteCreativeEngineEnabled()
    ? buildCreativeFlyerContext(
        business,
        copyForFlyer,
        format,
        effectivePrompt,
        referenceStyleOverride,
        campaignMessage
      )
    : null;

  let promptText: string;
  let adBrain: AdBrainOutput | undefined;
  let renderTextInImage = false;
  let pixelPerfect = true;

  if (premiumHybrid) {
    promptText = await resolveFlyerImagePrompt(
      business,
      format,
      effectivePrompt,
      "",
      copyForFlyer,
      campaignMessage
    );
    renderTextInImage = false;
    pixelPerfect = true;
  } else if (finishedInImage) {
    const resolvedCopy = creativeCtx?.copy ?? copyForFlyer;
    if (isCreativeAgencyEnabled()) {
      const agency = await generateCreativeAgencyImagePrompt({
        business,
        copy: resolvedCopy,
        format,
        userPrompt: effectivePrompt,
        campaignMessage,
        referenceStyleOverride,
        adjustmentNote: params.adjustmentNote,
        previousPrompt: params.previousPrompt,
      });
      promptText = agency.prompt;
    } else if (isAdBrainEnabled()) {
      const brainResult = await generateAdBrainImagePrompt({
        business,
        copy: resolvedCopy,
        format,
        userPrompt: effectivePrompt,
        campaignMessage,
        referenceStyleOverride,
      });
      promptText = brainResult.prompt;
      adBrain = brainResult.brain;
    } else if (isWorldClassFlyerEnabled()) {
      promptText = await generateWorldClassFlyerImagePrompt({
        business,
        copy: resolvedCopy,
        format,
        userPrompt: effectivePrompt,
        campaignMessage,
        referenceStyleOverride,
      });
    } else {
      const resolved = await resolveSeniorDesignerFlyerPrompt(
        business,
        copy,
        format,
        effectivePrompt,
        referenceStyleOverride,
        campaignMessage
      );
      promptText = resolved.prompt;
    }
    renderTextInImage = true;
    pixelPerfect = false;
  } else if (textMode === "ai") {
    promptText = await resolveExactTextFlyerPrompt(
      business,
      copyForFlyer,
      format,
      effectivePrompt,
      ""
    );
    renderTextInImage = true;
    pixelPerfect = false;
  } else {
    promptText = await resolveFlyerImagePrompt(
      business,
      format,
      effectivePrompt,
      "",
      copy,
      campaignMessage
    );
    renderTextInImage = false;
    pixelPerfect = true;
  }

  const task = await createTextToImage({
    promptText,
    format,
    renderTextInImage,
    requestOrigin: origin,
  });

  const completed = await waitForTask(task.id, 600_000);
  const rawUrl = extractOutputUrl(completed);
  if (!rawUrl) {
    throw new Error("Image generation returned no URL");
  }

  const useFooterOverlay = shouldUseFooterOverlayCompose();
  const composeBase = {
    imageUrl: rawUrl,
    business,
    format,
    copy: creativeCtx?.copy ?? copyForFlyer,
    logoDataUrl,
    requestOrigin: origin,
  };

  const composed = useFooterOverlay
    ? await composeCampaignFlyer({
        ...composeBase,
        skipTextInCompose: true,
        footerOnlyInCompose: true,
        skipLogoInCompose: !logoDataUrl,
        logoBesideHeadline: true,
      })
    : finishedInImage || textMode === "ai"
      ? await composeLogoOnlyFlyer(composeBase)
      : await composeCampaignFlyer({
          ...composeBase,
          skipLogoInCompose: !logoDataUrl,
          logoBesideHeadline: Boolean(logoDataUrl),
        });

  let exportImageUrl: string | undefined;
  try {
    const buf = await fetchFlyerImageBuffer(
      composed.localImageUrl ?? composed.secureUrl
    );
    const exported = await exportFlyerBuffer(buf, formatToExportPreset(format));
    exportImageUrl = `data:image/jpeg;base64,${exported.buffer.toString("base64")}`;
  } catch {
    /* optional export buffer */
  }

  return {
    id: variantId,
    label: REFERENCE_STYLE_LABELS[referenceStyle],
    referenceStyle,
    imageUrl: composed.secureUrl,
    exportImageUrl,
    baseImageUrl: composed.baseImageUrl,
    localImageUrl: composed.localImageUrl ?? composed.secureUrl,
    localBaseImageUrl: composed.localBaseImageUrl ?? composed.baseImageUrl,
    promptText,
    taskId: task.id,
    adBrain,
  };
}

export async function generateDualFlyerVariants(params: {
  business: BusinessProfile;
  format: VideoFormat;
  logoDataUrl?: string;
  userPrompt: string;
  copy: CampaignCopy;
  origin: string;
  campaignMessage?: string;
}): Promise<FlyerVariantResult[]> {
  const primaryStyle = resolveReferenceFlyerStyle(params.business);
  const altStyle = resolveAlternateReferenceStyle(primaryStyle);

  const presetNote = (id: ReferenceFlyerStyleId) => {
    const p = getFlyerCreativePreset(id);
    return `Creative director look — ${p.label}: ${p.copyHint}`;
  };

  return Promise.all([
    generateFlyerVariant({
      ...params,
      variantId: "a",
      referenceStyleOverride: primaryStyle,
      variantCreativeNote: presetNote(primaryStyle),
      campaignMessage: params.campaignMessage,
    }),
    generateFlyerVariant({
      ...params,
      variantId: "b",
      referenceStyleOverride: altStyle,
      variantCreativeNote: presetNote(altStyle),
      campaignMessage: params.campaignMessage,
    }),
  ]);
}

export { buildCampaignCopy, assertFlyerCopyReady, isSimpleFlyerMode };
