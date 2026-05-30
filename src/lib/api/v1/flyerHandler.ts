import { parseComposeError } from "@/lib/composeEngine";
import { parseImageGenError } from "@/lib/imageProvider";
import { jsonResponse, errorResponse } from "./shared";
import { runFlyerPipeline } from "./runFlyerPipeline";
import type { BusinessProfile, VideoFormat } from "@/lib/types";

export type FlyerGenerateRequest = {
  business: BusinessProfile;
  campaignMessage: string;
  format?: VideoFormat;
  userPrompt?: string;
  logoDataUrl?: string;
};

export async function handleFlyerGenerateV1(
  body: FlyerGenerateRequest,
  origin: string
) {
  const campaignMessage = String(body.campaignMessage ?? "").trim();
  if (!campaignMessage) {
    return errorResponse(
      "campaignMessage is required — use action messages first, or action full with async"
    );
  }

  const result = await runFlyerPipeline(body, origin);
  return jsonResponse({ ...result, action: "flyer" });
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
    "Generate 2 flyer variants. Prefer POST /api/v1/generate with async true.",
  request: {
    business: "BusinessProfile (required)",
    campaignMessage: "string (required)",
    format: '"9:16" | "4:5" | "1:1" | "16:9" (default "9:16")',
  },
};
