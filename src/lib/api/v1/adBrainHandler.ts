import { runAdBrain, type AdBrainOutput } from "@/lib/adBrainEngine";
import { buildCampaignCopy } from "@/lib/campaignTextLayers";
import { parseGroqError } from "@/lib/groq";
import type { BusinessProfile, VideoFormat } from "@/lib/types";
import { API_V1, errorResponse, jsonResponse } from "./shared";

export type AdBrainRequest = {
  business: BusinessProfile;
  format?: VideoFormat;
  userPrompt?: string;
  campaignMessage?: string;
};

export async function handleAdBrainV1(body: AdBrainRequest): Promise<Response> {
  const business = body.business;
  const format = body.format ?? "9:16";
  const copy = buildCampaignCopy(business);
  const brain: AdBrainOutput = await runAdBrain({
    business,
    copy,
    format,
    userPrompt: String(body.userPrompt ?? "").trim(),
    campaignMessage: String(body.campaignMessage ?? "").trim(),
  });

  return jsonResponse({
    ok: true,
    apiVersion: API_V1,
    adBrain: brain,
  });
}

export async function handleAdBrainV1Safe(body: AdBrainRequest): Promise<Response> {
  try {
    return await handleAdBrainV1(body);
  } catch (e) {
    console.error("[api/v1/ad-brain]", e);
    return errorResponse(parseGroqError(e) || "Ad Brain generation failed", 500);
  }
}

export const AD_BRAIN_ENDPOINT_DOC = {
  method: "POST",
  path: "/api/v1/ad-brain",
  description:
    "Run Mysogi Ad Brain only — business understanding, viral angle, Instagram copy, creative direction, image_prompt.",
  request: {
    business: "BusinessProfile (required)",
    format: "9:16 | 4:5 | 1:1 | 16:9 (optional)",
    userPrompt: "string (optional)",
    campaignMessage: "string (optional)",
  },
  response: {
    ok: true,
    adBrain: {
      business_understanding: "string",
      viral_angle: "string",
      copy: ["hook", "value", "proof", "cta"],
      creative_direction: "string",
      image_prompt: "string",
    },
  },
};
