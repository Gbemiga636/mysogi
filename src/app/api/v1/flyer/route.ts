import { NextRequest } from "next/server";
import { handleGenerateV1Safe } from "@/lib/api/v1/generateHandler";
import { optionsResponse, validateBusinessProfile, errorResponse } from "@/lib/api/v1/shared";
import type { BusinessProfile, VideoFormat } from "@/lib/types";

export const maxDuration = 300;

export function OPTIONS() {
  return optionsResponse();
}

/** @deprecated Use POST /api/v1/generate with action "flyer" */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = validateBusinessProfile(body.business);
  if (!parsed.ok) return errorResponse(parsed.error);
  return handleGenerateV1Safe(
    {
      action: "flyer",
      business: parsed.business as BusinessProfile,
      campaignMessage: String(body.campaignMessage ?? ""),
      format: body.format as VideoFormat | undefined,
      userPrompt: String(body.userPrompt ?? ""),
      logoDataUrl: body.logoDataUrl,
    },
    req.nextUrl.origin
  );
}
