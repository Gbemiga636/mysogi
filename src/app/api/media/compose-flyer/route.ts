import { NextRequest, NextResponse } from "next/server";
import { composeCampaignFlyer } from "@/lib/composeCampaignFlyer";
import { parseComposeError, getFlyerComposeEngine } from "@/lib/composeEngine";
import { parseReplicateError } from "@/lib/replicate";
import type { CampaignCopy } from "@/lib/campaignTextLayers";
import type { BusinessProfile, VideoFormat } from "@/lib/types";

export const maxDuration = 120;

/** Composes campaign text (+ optional logo) on AI visual — Sharp by default */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const imageUrl = body.imageUrl as string | undefined;
    const business = body.business as BusinessProfile | undefined;
    const format = (body.format ?? "9:16") as VideoFormat;
    const logoDataUrl = body.logoDataUrl as string | undefined;

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }
    if (!business?.businessName && !business?.campaignGoal) {
      return NextResponse.json(
        { error: "business profile is required" },
        { status: 400 }
      );
    }

    const origin = req.nextUrl.origin;

    const result = await composeCampaignFlyer({
      imageUrl,
      business,
      format,
      copy: body.copy as CampaignCopy | undefined,
      logoDataUrl,
      skipTextInCompose: body.skipTextInCompose ?? false,
      skipLogoInCompose: body.skipLogoInCompose ?? false,
      requestOrigin: origin,
    });

    return NextResponse.json({
      imageUrl: result.secureUrl,
      baseImageUrl: result.baseImageUrl,
      localImageUrl: result.localImageUrl ?? result.secureUrl,
      localBaseImageUrl: result.localBaseImageUrl ?? result.baseImageUrl,
      publicId: result.publicId,
      basePublicId: result.basePublicId,
      composeEngine: result.composeEngine ?? getFlyerComposeEngine(),
    });
  } catch (e) {
    const message =
      parseReplicateError(e) ||
      parseComposeError(e) ||
      (e instanceof Error ? e.message : "Compose failed");
    console.error("[compose-flyer]", message, e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
