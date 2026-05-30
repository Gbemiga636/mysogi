import { NextRequest } from "next/server";
import { handleGenerateV1Safe } from "@/lib/api/v1/generateHandler";
import { validateBusinessProfile, errorResponse } from "@/lib/api/v1/shared";
import type { BusinessProfile, VideoFormat } from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = validateBusinessProfile(body.business);
  if (!parsed.ok) {
    return errorResponse(parsed.error, 400);
  }

  const asyncFlag = body.async !== false;

  const res = await handleGenerateV1Safe(
    {
      action: "flyer",
      business: parsed.business as BusinessProfile,
      campaignMessage: String(body.campaignMessage ?? ""),
      format: (body.format ?? "1:1") as VideoFormat,
      userPrompt: String(body.userPrompt ?? ""),
      logoDataUrl: body.logoDataUrl as string | undefined,
      async: asyncFlag,
    },
    req.nextUrl.origin
  );

  const data = await res.json();
  if (!data.ok && !data.jobId) return res;

  if (data.jobId) return res;

  const { ok: _ok, apiVersion: _v, ...legacy } = data;
  void _ok;
  void _v;
  return Response.json(legacy);
}
