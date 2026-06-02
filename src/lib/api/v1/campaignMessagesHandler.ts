import {
  generateCampaignMessages,
  resolveCampaignMessageLimits,
} from "@/lib/campaignMessageGenerator";
import { detectCampaignType } from "@/lib/campaignTypeEngine";
import { parseGroqError } from "@/lib/groq";
import type { BusinessProfile } from "@/lib/types";
import { API_V1, errorResponse, jsonResponse } from "./shared";

export type CampaignMessagesRequest = {
  business: BusinessProfile;
  /** Optional extra creative hint (not required). */
  userPrompt?: string;
  /** Target max characters per message (40–500). Default 160. */
  maxLength?: number;
  /** Optional min characters; derived from maxLength when omitted. */
  minLength?: number;
};

export async function handleCampaignMessagesV1(
  body: CampaignMessagesRequest
) {
  const business = body.business;
  const userPrompt = String(body.userPrompt ?? "").trim();

  const limits = resolveCampaignMessageLimits(body.maxLength, body.minLength);
  const messages = await generateCampaignMessages(business, userPrompt, "", {
    limits,
  });
  const campaignType = detectCampaignType(business, userPrompt);

  return jsonResponse({
    ok: true,
    apiVersion: API_V1,
    messages,
    count: messages.length,
    minLength: limits.minLength,
    maxLength: limits.maxLength,
    campaignType: {
      id: campaignType.id,
      label: campaignType.label,
    },
  });
}

export async function handleCampaignMessagesV1Safe(
  body: CampaignMessagesRequest
) {
  try {
    return await handleCampaignMessagesV1(body);
  } catch (e) {
    console.error("[api/v1/campaign-messages]", e);
    return errorResponse(
      parseGroqError(e) || "Campaign message generation failed",
      500
    );
  }
}

export const CAMPAIGN_MESSAGES_ENDPOINT_DOC = {
  method: "POST",
  path: "/api/v1/campaign-messages",
  description:
    "Generate 3 campaign messages within maxLength (default 160). Call this first; user picks one message for the flyer endpoint.",
  request: {
    business: "BusinessProfile (required)",
    userPrompt: "string (optional)",
    maxLength: "number (optional, 40–500, default 160)",
    minLength: "number (optional)",
  },
  response: {
    ok: true,
    messages: ["string", "string", "string"],
    minLength: "number",
    maxLength: "number",
    campaignType: { id: "string", label: "string" },
  },
};
