import { NextRequest } from "next/server";
import { handleFlyerGenerateV1Safe } from "@/lib/api/v1/flyerHandler";
import { validateBusinessProfile, errorResponse } from "@/lib/api/v1/shared";
import type { BusinessProfile, VideoFormat } from "@/lib/types";

export const maxDuration = 300;

/** @deprecated Use POST /api/v1/flyer — campaignMessage recommended */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = validateBusinessProfile(body.business);
  if (!parsed.ok) {
    return errorResponse(parsed.error, 400);
  }

  const res = await handleFlyerGenerateV1Safe(
    {
      business: parsed.business as BusinessProfile,
      campaignMessage: String(body.campaignMessage ?? ""),
      format: (body.format ?? "1:1") as VideoFormat,
      userPrompt: String(body.userPrompt ?? ""),
      logoDataUrl: body.logoDataUrl as string | undefined,
    },
    req.nextUrl.origin
  );

  const data = await res.json();
  if (!data.ok) return res;

  const { ok: _ok, apiVersion: _v, ...legacy } = data;
  void _ok;
  void _v;
  return Response.json(legacy);
}
