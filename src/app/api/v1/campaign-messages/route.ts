import { NextRequest } from "next/server";
import { handleGenerateV1Safe } from "@/lib/api/v1/generateHandler";
import { optionsResponse, validateBusinessProfile, errorResponse } from "@/lib/api/v1/shared";
import type { BusinessProfile } from "@/lib/types";

export const maxDuration = 60;

export function OPTIONS() {
  return optionsResponse();
}

/** @deprecated Use POST /api/v1/generate with action "messages" */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = validateBusinessProfile(body.business);
  if (!parsed.ok) return errorResponse(parsed.error);
  return handleGenerateV1Safe(
    {
      action: "messages",
      business: parsed.business as BusinessProfile,
      userPrompt: String(body.userPrompt ?? ""),
    },
    req.nextUrl.origin
  );
}
