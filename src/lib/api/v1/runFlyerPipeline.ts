import { buildCampaignCopy } from "@/lib/campaignTextLayers";
import {
  generateDualFlyerVariants,
  assertFlyerCopyReady,
} from "@/lib/generateFlyerCore";
import {
  buildCreativeFlyerContext,
  isEliteCreativeEngineEnabled,
} from "@/lib/creativeEngine/orchestrator";
import {
  getFlyerTextMode,
  getLogoComposeEngine,
} from "@/lib/composeEngine";
import { isSimpleFlyerMode } from "@/lib/directFlyerPrompt";
import {
  buildSeniorDesignPlan,
  isFinishedFlyerDesignEnabled,
  isPremiumHybridFlyerEnabled,
} from "@/lib/seniorDesignerEngine";
import { generateCampaignFlyerCopy } from "@/lib/groq";
import {
  flyerImageProviderLabel,
  getFlyerImageProvider,
} from "@/lib/imageProvider";
import { detectCampaignType } from "@/lib/campaignTypeEngine";
import { computeFlyerVerticalBalance, pct } from "@/lib/flyerLayoutBalance";
import { API_V1 } from "./shared";
import { pickFlyerDisplayUrl } from "@/lib/flyerDisplayUrl";
import type { FlyerGenerateRequest } from "./flyerHandler";
import type { BusinessProfile } from "@/lib/types";

export type FlyerPipelineResult = Record<string, unknown>;

export async function runFlyerPipeline(
  body: FlyerGenerateRequest,
  origin: string
): Promise<FlyerPipelineResult> {
  const business = body.business;
  const format = body.format ?? "9:16";
  const logoDataUrl = body.logoDataUrl;
  const userPrompt = String(body.userPrompt ?? "").trim();
  const campaignMessage = String(body.campaignMessage ?? "").trim();

  const textMode = getFlyerTextMode();
  const imageProvider = getFlyerImageProvider();
  const premiumHybrid = isPremiumHybridFlyerEnabled();
  const finishedInImage = isFinishedFlyerDesignEnabled() && !premiumHybrid;

  const creativeBrief =
    campaignMessage ||
    userPrompt ||
    business.tagline?.trim() ||
    business.industry?.trim() ||
    undefined;

  const designPlan =
    premiumHybrid || finishedInImage
      ? buildSeniorDesignPlan(business, format)
      : null;

  const rawCopy = await generateCampaignFlyerCopy(
    business,
    creativeBrief,
    format,
    campaignMessage
  ).catch(() => buildCampaignCopy(business));
  const copy = assertFlyerCopyReady(rawCopy, business);

  const campaignType = detectCampaignType(
    business,
    creativeBrief ?? "",
    campaignMessage
  );
  const layoutBalance = computeFlyerVerticalBalance(business, format, copy);

  const creativeCtx = isEliteCreativeEngineEnabled()
    ? buildCreativeFlyerContext(
        business,
        copy,
        format,
        creativeBrief ?? "",
        undefined,
        campaignMessage
      )
    : null;

  const variants = await generateDualFlyerVariants({
    business,
    format,
    logoDataUrl,
    userPrompt: creativeBrief ?? "",
    copy,
    origin,
    campaignMessage,
  });

  const primary = variants[0];

  return {
    ok: true,
    apiVersion: API_V1,
    dual: true,
    variants: variants.map((v) => ({
      id: v.id,
      label: v.label,
      referenceStyle: v.referenceStyle,
      imageUrl: v.imageUrl,
      displayUrl: pickFlyerDisplayUrl(v.imageUrl, v.localImageUrl),
      exportImageUrl: v.exportImageUrl,
      baseImageUrl: v.baseImageUrl,
      localImageUrl: v.localImageUrl,
      localBaseImageUrl: v.localBaseImageUrl,
      promptText: v.promptText,
      taskId: v.taskId,
      adBrain: v.adBrain,
    })),
    imageUrl: pickFlyerDisplayUrl(primary.imageUrl, primary.localImageUrl),
    displayUrl: pickFlyerDisplayUrl(primary.imageUrl, primary.localImageUrl),
    exportImageUrl: primary.exportImageUrl,
    baseImageUrl: primary.baseImageUrl,
    localImageUrl: primary.localImageUrl,
    localBaseImageUrl: primary.localBaseImageUrl,
    copy: creativeCtx?.copy ?? copy,
    promptText: primary.promptText,
    enhancedCreativeDirection: creativeCtx?.enhancedCreativeDirection,
    creativeEngine: creativeCtx
      ? {
          qualityScore: creativeCtx.quality.score,
          qualityPassed: creativeCtx.quality.passed,
          fontPairing: creativeCtx.layout.fontPairing.label,
          palette: creativeCtx.layout.palette.label,
          balanceScore: creativeCtx.layout.balanceScore,
        }
      : undefined,
    clientPromptUsed: userPrompt || undefined,
    campaignMessage,
    campaignType: {
      id: campaignType.id,
      label: campaignType.label,
    },
    layoutBalance: {
      footerReservePercent: pct(layoutBalance.footerReserveRatio),
      ctaZoneTopPercent: pct(layoutBalance.ctaZoneTopRatio),
      ctaZoneBottomPercent: pct(layoutBalance.ctaZoneBottomRatio),
    },
    textMode: premiumHybrid
      ? "premium-hybrid"
      : finishedInImage
        ? "mobile-poster-in-image"
        : textMode,
    finishedDesign: finishedInImage,
    premiumHybrid,
    simpleMode: isSimpleFlyerMode() && !premiumHybrid && !finishedInImage,
    seniorDesigner: designPlan
      ? {
          concept: designPlan.concept.title,
          luxuryLevel: designPlan.analysis.luxuryLevel,
          campaignStyle: designPlan.visual.atmosphere.slice(0, 120),
          imageProps: business.imageProps?.trim() || undefined,
        }
      : undefined,
    logoCompose: getLogoComposeEngine(),
    imageProvider,
    imageProviderLabel: flyerImageProviderLabel(),
  };
}

export async function runFullFlyerPipeline(
  business: BusinessProfile,
  body: Omit<FlyerGenerateRequest, "business" | "campaignMessage"> & {
    userPrompt?: string;
    messageIndex?: number;
    maxLength?: number;
    minLength?: number;
  },
  origin: string,
  onProgress?: (progress: "messages" | "copy" | "variants") => void
): Promise<FlyerPipelineResult & { messages: string[]; selectedMessageIndex: number }> {
  const { generateCampaignMessages, resolveCampaignMessageLimits } =
    await import("@/lib/campaignMessageGenerator");
  onProgress?.("messages");
  const userPrompt = String(body.userPrompt ?? "").trim();
  const limits = resolveCampaignMessageLimits(body.maxLength, body.minLength);
  const messages = await generateCampaignMessages(business, userPrompt, "", {
    limits,
  });
  const idx = Math.min(
    Math.max(0, Number(body.messageIndex ?? 0)),
    messages.length - 1
  );
  const campaignMessage = messages[idx] ?? "";

  onProgress?.("copy");
  const result = await runFlyerPipeline(
    {
      business,
      campaignMessage,
      format: body.format,
      userPrompt,
      logoDataUrl: body.logoDataUrl,
    },
    origin
  );

  return {
    ...result,
    messages,
    selectedMessageIndex: idx,
    action: "full",
  };
}
