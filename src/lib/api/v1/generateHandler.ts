import {
  handleCampaignMessagesV1,
  type CampaignMessagesRequest,
} from "./campaignMessagesHandler";
import {
  handleFlyerGenerateV1,
  type FlyerGenerateRequest,
} from "./flyerHandler";
import { startAsyncFlyerJob } from "./executeFlyerJob";
import { API_V1, errorResponse, jsonResponse } from "./shared";
import type { BusinessProfile } from "@/lib/types";
import type { VideoFormat } from "@/lib/types";

export type GenerateAction = "messages" | "flyer" | "full";

export type GenerateRequest = {
  action: GenerateAction;
  business: BusinessProfile;
  campaignMessage?: string;
  format?: VideoFormat;
  userPrompt?: string;
  logoDataUrl?: string;
  messageIndex?: number;
  /** Max characters per campaign message when action is messages or full (40–500). */
  maxLength?: number;
  minLength?: number;
  /** Default true for flyer/full — returns jobId immediately; poll GET /api/v1/jobs/:id */
  async?: boolean;
};

export const GENERATE_ENDPOINT_DOC = {
  method: "POST",
  path: "/api/v1/generate",
  description:
    "Mysogi ad API. Flyer/full default to async (job + poll). Pass async:false for blocking.",
  actions: {
    messages: "3 campaign messages — synchronous (~10s). Optional maxLength (40–500, default 160).",
    flyer: "2 flyer variants — async by default; poll /api/v1/jobs/:id.",
    full: "Messages + flyer — async by default.",
  },
  poll: "GET /api/v1/jobs/:jobId every 2–4s until status is succeeded or failed",
};

function wantsAsync(body: GenerateRequest): boolean {
  if (body.action === "messages") return false;
  return body.async !== false;
}

export async function handleGenerateV1(
  body: GenerateRequest,
  origin: string
) {
  const action = body.action;
  if (!action || !["messages", "flyer", "full"].includes(action)) {
    return errorResponse('action is required: "messages" | "flyer" | "full"');
  }

  const business = body.business;
  const userPrompt = String(body.userPrompt ?? "").trim();

  if (wantsAsync(body)) {
    if (action === "flyer" && !String(body.campaignMessage ?? "").trim()) {
      return errorResponse(
        'campaignMessage is required for action "flyer". Use action "full" or action "messages" first.'
      );
    }
    const { jobId } = await startAsyncFlyerJob(body, origin);
    return jsonResponse({
      ok: true,
      apiVersion: API_V1,
      async: true,
      action,
      jobId,
      status: "queued",
      pollUrl: `/api/v1/jobs/${jobId}`,
      pollIntervalMs: 3000,
      message:
        "Generation started. Poll pollUrl until status is succeeded or failed.",
    });
  }

  if (action === "messages") {
    const res = await handleCampaignMessagesV1({
      business,
      userPrompt,
      maxLength: body.maxLength,
      minLength: body.minLength,
    } as CampaignMessagesRequest);
    const data = await res.json();
    return jsonResponse({ ...data, action: "messages", async: false });
  }

  if (action === "flyer") {
    const res = await handleFlyerGenerateV1(
      {
        business,
        campaignMessage: String(body.campaignMessage ?? ""),
        format: body.format,
        userPrompt,
        logoDataUrl: body.logoDataUrl,
      } as FlyerGenerateRequest,
      origin
    );
    const data = await res.json();
    return jsonResponse({ ...data, async: false });
  }

  const { generateCampaignMessages } = await import(
    "@/lib/campaignMessageGenerator"
  );
  const { resolveCampaignMessageLimits } = await import(
    "@/lib/campaignMessageGenerator"
  );
  const limits = resolveCampaignMessageLimits(body.maxLength, body.minLength);
  const messages = await generateCampaignMessages(business, userPrompt, "", {
    limits,
  });
  const idx = Math.min(
    Math.max(0, Number(body.messageIndex ?? 0)),
    messages.length - 1
  );
  const campaignMessage = messages[idx] ?? "";

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
        async: false,
        error: flyerData.error ?? "Flyer generation failed",
        messages,
        selectedMessageIndex: idx,
        campaignMessage,
      },
      500
    );
  }

  return jsonResponse({
    ...flyerData,
    action: "full",
    async: false,
    messages,
    selectedMessageIndex: idx,
    campaignMessage,
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
    const message = e instanceof Error ? e.message : "Request failed";
    return errorResponse(message, 500);
  }
}
