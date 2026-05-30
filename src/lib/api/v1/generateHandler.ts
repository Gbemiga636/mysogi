import {
  handleCampaignMessagesV1,
  type CampaignMessagesRequest,
} from "./campaignMessagesHandler";
import {
  handleFlyerGenerateV1,
  type FlyerGenerateRequest,
} from "./flyerHandler";
import { API_V1, errorResponse, jsonResponse } from "./shared";
import type { BusinessProfile } from "@/lib/types";
import type { VideoFormat } from "@/lib/types";

export type GenerateAction = "messages" | "flyer" | "full";

export type GenerateRequest = {
  action: GenerateAction;
  business: BusinessProfile;
  /** Required when action is flyer or full. */
  campaignMessage?: string;
  format?: VideoFormat;
  userPrompt?: string;
  logoDataUrl?: string;
  /** When action is full, which message index to use (0–2). Default 0. */
  messageIndex?: number;
};

export const GENERATE_ENDPOINT_DOC = {
  method: "POST",
  path: "/api/v1/generate",
  description: "Single Mysogi ad API. Use action to choose the operation.",
  actions: {
    messages: "Return 3 campaign SMS messages (145–160 chars).",
    flyer: "Generate 2 flyer image variants. Requires campaignMessage.",
    full: "Run messages then flyer in one call (uses message at messageIndex, default 0).",
  },
};

export async function handleGenerateV1(
  body: GenerateRequest,
  origin: string
) {
  const action = body.action;
  if (!action || !["messages", "flyer", "full"].includes(action)) {
    return errorResponse(
      'action is required: "messages" | "flyer" | "full"'
    );
  }

  const business = body.business;
  const userPrompt = String(body.userPrompt ?? "").trim();

  if (action === "messages") {
    const res = await handleCampaignMessagesV1({
      business,
      userPrompt,
    } as CampaignMessagesRequest);
    const data = await res.json();
    return jsonResponse({ ...data, action: "messages" });
  }

  if (action === "flyer") {
    const campaignMessage = String(body.campaignMessage ?? "").trim();
    if (!campaignMessage) {
      return errorResponse(
        'campaignMessage is required when action is "flyer". Use action "messages" first or action "full".'
      );
    }
    const res = await handleFlyerGenerateV1(
      {
        business,
        campaignMessage,
        format: body.format,
        userPrompt,
        logoDataUrl: body.logoDataUrl,
      } as FlyerGenerateRequest,
      origin
    );
    const data = await res.json();
    return jsonResponse({ ...data, action: "flyer" });
  }

  // full: messages → pick message → flyer
  const msgRes = await handleCampaignMessagesV1({
    business,
    userPrompt,
  });
  const msgData = await msgRes.json();
  if (!msgData.ok || !Array.isArray(msgData.messages) || !msgData.messages.length) {
    return errorResponse("Could not generate campaign messages", 500);
  }

  const idx = Math.min(
    Math.max(0, Number(body.messageIndex ?? 0)),
    msgData.messages.length - 1
  );
  const campaignMessage = String(msgData.messages[idx] ?? "").trim();

  const flyerRes = await handleFlyerGenerateV1(
    {
      business,
      campaignMessage,
      format: body.format,
      userPrompt,
      logoDataUrl: body.logoDataUrl,
    },
    origin
  );
  const flyerData = await flyerRes.json();
  if (!flyerData.ok) {
    return jsonResponse(
      {
        ok: false,
        action: "full",
        error: flyerData.error ?? "Flyer generation failed",
        messages: msgData.messages,
        selectedMessageIndex: idx,
        campaignMessage,
      },
      500
    );
  }

  return jsonResponse({
    ok: true,
    apiVersion: API_V1,
    action: "full",
    messages: msgData.messages,
    selectedMessageIndex: idx,
    campaignMessage,
    campaignType: msgData.campaignType,
    ...flyerData,
  });
}

export async function handleGenerateV1Safe(
  body: GenerateRequest,
  origin: string
) {
  try {
    return await handleGenerateV1(body, origin);
  } catch (e) {
    console.error("[api/v1/generate]", e);
    const message =
      e instanceof Error ? e.message : "Request failed";
    return errorResponse(message, 500);
  }
}
