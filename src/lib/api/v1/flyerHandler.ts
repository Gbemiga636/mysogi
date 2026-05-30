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
  parseComposeError,
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
  parseImageGenError,
} from "@/lib/imageProvider";
import { detectCampaignType } from "@/lib/campaignTypeEngine";
import { computeFlyerVerticalBalance, pct } from "@/lib/flyerLayoutBalance";
import type { BusinessProfile, VideoFormat } from "@/lib/types";
import { API_V1, errorResponse, jsonResponse } from "./shared";

export type FlyerGenerateRequest = {
  business: BusinessProfile;
  /** User-selected message from POST /api/v1/campaign-messages — primary creative driver. */
  campaignMessage: string;
  format?: VideoFormat;
  /** Optional extra creative direction (secondary to campaignMessage). */
  userPrompt?: string;
  /** Optional logo as data URL: data:image/png;base64,... */
  logoDataUrl?: string;
};

export async function handleFlyerGenerateV1(
  body: FlyerGenerateRequest,
  origin: string
) {
  const business = body.business;
  const format = (body.format ?? "9:16") as VideoFormat;
  const logoDataUrl = body.logoDataUrl;
  const userPrompt = String(body.userPrompt ?? "").trim();
  const campaignMessage = String(body.campaignMessage ?? "").trim();

  if (!campaignMessage) {
    return errorResponse(
      "campaignMessage is required — generate messages via POST /api/v1/campaign-messages first, then pass the chosen message here"
    );
  }

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

  return jsonResponse({
    ok: true,
    apiVersion: API_V1,
    dual: true,
    variants: variants.map((v) => ({
      id: v.id,
      label: v.label,
      referenceStyle: v.referenceStyle,
      imageUrl: v.imageUrl,
      exportImageUrl: v.exportImageUrl,
      baseImageUrl: v.baseImageUrl,
      localImageUrl: v.localImageUrl,
      localBaseImageUrl: v.localBaseImageUrl,
      promptText: v.promptText,
      taskId: v.taskId,
    })),
    imageUrl: primary.imageUrl,
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
  });
}

export async function handleFlyerGenerateV1Safe(
  body: FlyerGenerateRequest,
  origin: string
) {
  try {
    return await handleFlyerGenerateV1(body, origin);
  } catch (e) {
    const msg =
      parseImageGenError(e) ||
      parseComposeError(e) ||
      (e instanceof Error ? e.message : "Flyer generation failed");
    console.error("[api/v1/flyer]", msg, e);
    return errorResponse(msg, 500);
  }
}

export const FLYER_ENDPOINT_DOC = {
  method: "POST",
  path: "/api/v1/flyer",
  description:
    "Generate 2 distinct AI flyer variants (images + marketing copy). Requires campaignMessage from the campaign-messages endpoint. Long-running (up to ~5 min).",
  request: {
    business: "BusinessProfile (required)",
    campaignMessage: "string (required, 145–160 chars recommended)",
    format: '"9:16" | "4:5" | "1:1" | "16:9" (default "9:16")',
    userPrompt: "string (optional)",
    logoDataUrl: "string (optional, base64 data URL)",
  },
  response: {
    ok: true,
    dual: true,
    variants: "array of 2 flyer options with imageUrl, localImageUrl, etc.",
    imageUrl: "primary variant URL",
    copy: "headline, tagline, cta, contact",
    campaignType: { id: "string", label: "string" },
  },
};
