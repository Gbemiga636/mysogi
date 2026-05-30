import { NextRequest } from "next/server";
import {
  GENERATE_ENDPOINT_DOC,
  handleGenerateV1Safe,
  type GenerateAction,
} from "@/lib/api/v1/generateHandler";
import {
  API_V1,
  BUSINESS_PROFILE_FIELDS,
  optionsResponse,
  validateBusinessProfile,
  errorResponse,
  jsonResponse,
} from "@/lib/api/v1/shared";
import type { BusinessProfile, VideoFormat } from "@/lib/types";

export const maxDuration = 300;

export function OPTIONS() {
  return optionsResponse();
}

export function GET() {
  return jsonResponse({
    ok: true,
    apiVersion: API_V1,
    ...GENERATE_ENDPOINT_DOC,
    businessProfileFields: BUSINESS_PROFILE_FIELDS,
    campaignTypeValues: [
      "grand_opening",
      "promo_sale",
      "product_launch",
      "event",
      "seasonal_offer",
      "limited_time",
      "general_brand",
    ],
  });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const parsed = validateBusinessProfile(
    (body as { business?: unknown })?.business
  );
  if (!parsed.ok) return errorResponse(parsed.error);

  const b = body as {
    action?: GenerateAction;
    format?: VideoFormat;
    campaignMessage?: string;
    userPrompt?: string;
    logoDataUrl?: string;
    messageIndex?: number;
    async?: boolean;
  };

  const action = b.action;
  if (!action) {
    return errorResponse(
      'action is required: "messages" | "flyer" | "full"'
    );
  }

  return handleGenerateV1Safe(
    {
      action,
      business: parsed.business as BusinessProfile,
      campaignMessage: b.campaignMessage,
      format: b.format,
      userPrompt: b.userPrompt,
      logoDataUrl: b.logoDataUrl,
      messageIndex: b.messageIndex,
      async: b.async,
    },
    req.nextUrl.origin
  );
}
