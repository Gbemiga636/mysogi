import { NextRequest } from "next/server";
import { handleCampaignMessagesV1Safe } from "@/lib/api/v1/campaignMessagesHandler";
import { validateBusinessProfile, errorResponse } from "@/lib/api/v1/shared";
import type { BusinessProfile } from "@/lib/types";

export const maxDuration = 60;

/** @deprecated Use POST /api/v1/campaign-messages */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = validateBusinessProfile(body.business);
  if (!parsed.ok) {
    return errorResponse(parsed.error, 400);
  }
  const res = await handleCampaignMessagesV1Safe({
    business: parsed.business as BusinessProfile,
    userPrompt: String(body.userPrompt ?? ""),
  });
  const data = await res.json();
  if (!data.ok) return res;
  return Response.json({
    messages: data.messages,
    maxLength: data.maxLength,
    minLength: data.minLength,
    campaignType: data.campaignType,
  });
}
