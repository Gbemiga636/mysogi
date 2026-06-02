import { NextRequest } from "next/server";
import {
  AD_BRAIN_ENDPOINT_DOC,
  handleAdBrainV1Safe,
} from "@/lib/api/v1/adBrainHandler";
import {
  API_V1,
  optionsResponse,
  validateBusinessProfile,
  errorResponse,
  jsonResponse,
} from "@/lib/api/v1/shared";
import type { BusinessProfile, VideoFormat } from "@/lib/types";

export const maxDuration = 60;

export function OPTIONS() {
  return optionsResponse();
}

export function GET() {
  return jsonResponse({
    ok: true,
    apiVersion: API_V1,
    ...AD_BRAIN_ENDPOINT_DOC,
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
    format?: VideoFormat;
    userPrompt?: string;
    campaignMessage?: string;
  };

  return handleAdBrainV1Safe({
    business: parsed.business as BusinessProfile,
    format: b.format,
    userPrompt: b.userPrompt,
    campaignMessage: b.campaignMessage,
  });
}
