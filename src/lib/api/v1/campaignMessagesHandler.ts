import {
  CAMPAIGN_MESSAGE_MAX,
  CAMPAIGN_MESSAGE_MIN,
  generateCampaignMessages,
} from "@/lib/campaignMessageGenerator";
import { detectCampaignType } from "@/lib/campaignTypeEngine";
import { parseGroqError } from "@/lib/groq";
import type { BusinessProfile } from "@/lib/types";
import { API_V1, errorResponse, jsonResponse } from "./shared";

export type CampaignMessagesRequest = {
  business: BusinessProfile;
  /** Optional extra creative hint (not required). */
  userPrompt?: string;
};

export async function handleCampaignMessagesV1(
  body: CampaignMessagesRequest
) {
  const business = body.business;
  const userPrompt = String(body.userPrompt ?? "").trim();

  const messages = await generateCampaignMessages(business, userPrompt);
  const campaignType = detectCampaignType(business, userPrompt);

  return jsonResponse({
    ok: true,
    apiVersion: API_V1,
    messages,
    count: messages.length,
    minLength: CAMPAIGN_MESSAGE_MIN,
    maxLength: CAMPAIGN_MESSAGE_MAX,
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
    "Generate 3 full-length SMS/billboard campaign messages (145–160 chars each). Call this first; user picks one message for the flyer endpoint.",
  request: {
    business: "BusinessProfile (required)",
    userPrompt: "string (optional)",
  },
  response: {
    ok: true,
    messages: ["string", "string", "string"],
    minLength: 145,
    maxLength: 160,
    campaignType: { id: "string", label: "string" },
  },
};
