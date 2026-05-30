import { NextResponse } from "next/server";
import {
  getFlyerImageProvider,
  flyerImageProviderLabel,
} from "@/lib/imageProvider";
import {
  buildImageGenerateParams,
  getOpenAIApiFamily,
  getOpenAIApiKey,
  normalizeOpenAIModel,
  resolveGptImageSize,
} from "@/lib/openaiImages";
import { isFinishedFlyerDesignEnabled } from "@/lib/seniorDesignerEngine";

export async function GET() {
  const provider = getFlyerImageProvider();
  const keySet = Boolean(process.env.OPENAI_API_KEY?.trim());
  const model = normalizeOpenAIModel(process.env.FLYER_OPENAI_MODEL);
  const family = getOpenAIApiFamily(model);

  let openaiOk = false;
  let openaiError: string | undefined;

  if (keySet) {
    try {
      getOpenAIApiKey();
      openaiOk = true;
    } catch (e) {
      openaiError = e instanceof Error ? e.message : "OpenAI not configured";
    }
  }

  const sampleBody =
    family === "gpt"
      ? buildImageGenerateParams(model, "test", "1:1")
      : null;

  return NextResponse.json({
    flyerImageProvider: provider,
    label: flyerImageProviderLabel(),
    openai: {
      keyConfigured: keySet,
      ok: openaiOk,
      error: openaiError,
      configuredModel: model,
      apiFamily: family,
      effectiveModel: family === "gpt" ? "gpt-image-1" : model,
      quality: process.env.FLYER_OPENAI_QUALITY?.trim() || "medium",
      forceSquare: process.env.FLYER_OPENAI_FORCE_SQUARE !== "false",
      defaultSize: resolveGptImageSize("1:1"),
      parametersSent:
        family === "gpt"
          ? ["model", "prompt", "n", "size", "quality"]
          : ["model", "prompt", "n", "size", "quality", "style"],
      parametersNeverSent: [
        "response_format",
        ...(family === "gpt" ? ["style"] : []),
      ],
      sampleRequestKeys: sampleBody ? Object.keys(sampleBody) : [],
      retries: 0,
      finishedDesign: isFinishedFlyerDesignEnabled(),
      seniorDesignerEngine: true,
      integratedDesignHint: isFinishedFlyerDesignEnabled()
        ? "Senior designer: 4-step creative direction → complete ad in image (typography, layout, CTA)."
        : "Set FLYER_FINISHED_DESIGN=true for full designed ads. false = photo + SVG overlay.",
      switchBackHint:
        "Set FLYER_IMAGE_PROVIDER=replicate in .env.local to use Imagen 4 again.",
      dalleHint:
        family === "dalle"
          ? "Legacy DALL·E params — only if your account still supports them."
          : "Using gpt-image-1 API (recommended). dall-e-3 in FLYER_OPENAI_MODEL is ignored when API_FAMILY=gpt.",
    },
  });
}
