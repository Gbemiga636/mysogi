import { buildCampaignCopy } from "./campaignTextLayers";
import { assertFlyerCopyReady } from "./campaignCopySanitize";
import { composeCampaignFlyer } from "./composeCampaignFlyer";
import { getFlyerTextMode } from "./composeEngine";
import { isSimpleFlyerMode } from "./directFlyerPrompt";
import {
  buildCreativeFlyerContext,
  isEliteCreativeEngineEnabled,
} from "./creativeEngine/orchestrator";
import { exportFlyerBuffer, formatToExportPreset } from "./creativeEngine";
import { isSvgFlyerFooterMode } from "./flyerSvgFooterMode";
import {
  resolveExactTextFlyerPrompt,
  resolveFlyerImagePrompt,
  resolveSeniorDesignerFlyerPrompt,
} from "./flyerPlatePromptResolve";
import {
  isFinishedFlyerDesignEnabled,
  isPremiumHybridFlyerEnabled,
} from "./seniorDesignerEngine";
import {
  REFERENCE_STYLE_LABELS,
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
};

export async function generateFlyerVariant(
  params: GenerateFlyerVariantParams
): Promise<FlyerVariantResult> {
  const {
    business,
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
        copy,
        format,
        effectivePrompt,
        referenceStyleOverride,
        campaignMessage
      )
    : null;

  let promptText: string;
  let renderTextInImage = false;
  let pixelPerfect = true;

  if (premiumHybrid) {
    promptText = await resolveFlyerImagePrompt(
      business,
      format,
      effectivePrompt,
      "",
      copy
    );
    renderTextInImage = false;
    pixelPerfect = true;
  } else if (finishedInImage) {
    const resolved = await resolveSeniorDesignerFlyerPrompt(
      business,
      copy,
      format,
      effectivePrompt,
      referenceStyleOverride,
      campaignMessage
    );
    promptText = resolved.prompt;
    renderTextInImage = true;
    pixelPerfect = false;
  } else if (textMode === "ai") {
    promptText = await resolveExactTextFlyerPrompt(
      business,
      copy,
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
      copy
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

  const svgFooter =
    (finishedInImage || premiumHybrid) && isSvgFlyerFooterMode();

  const composed = await composeCampaignFlyer({
    imageUrl: rawUrl,
    business,
    format,
    copy: creativeCtx?.copy ?? copy,
    logoDataUrl,
    skipTextInCompose: finishedInImage || textMode === "ai" || !pixelPerfect,
    footerOnlyInCompose: svgFooter,
    skipLogoInCompose: !logoDataUrl,
    requestOrigin: origin,
    logoBesideHeadline: Boolean(
      logoDataUrl && (finishedInImage || premiumHybrid)
    ),
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

  const variantNotes: Record<ReferenceFlyerStyleId, string> = {
    trial2:
      "Creative variant: dark matte SaaS ad with overlapping phone mockups, left-aligned type, geometric accents.",
    trial3:
      "Creative variant: cinematic luxury night editorial, centered serif headline, hero photography, teal and gold grade.",
    trial4:
      "Creative variant: dense premium fintech UI ad, 3D floating icons, glass panels, neon blue-purple glow.",
  };

  return Promise.all([
    generateFlyerVariant({
      ...params,
      variantId: "a",
      referenceStyleOverride: primaryStyle,
      variantCreativeNote: variantNotes[primaryStyle],
      campaignMessage: params.campaignMessage,
    }),
    generateFlyerVariant({
      ...params,
      variantId: "b",
      referenceStyleOverride: altStyle,
      variantCreativeNote: variantNotes[altStyle],
      campaignMessage: params.campaignMessage,
    }),
  ]);
}

export { buildCampaignCopy, assertFlyerCopyReady, isSimpleFlyerMode };
