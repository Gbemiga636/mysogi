import { NextRequest } from "next/server";
import { generateFlyerVariant } from "@/lib/generateFlyerCore";
import { buildCampaignCopy } from "@/lib/campaignTextLayers";
import { assertFlyerCopyReady } from "@/lib/campaignCopySanitize";
import { generateCampaignFlyerCopy } from "@/lib/groq";
import { pickFlyerDisplayUrl } from "@/lib/flyerDisplayUrl";
import { validateBusinessProfile, errorResponse } from "@/lib/api/v1/shared";
import { normalizeBusinessProfileContact } from "@/lib/businessContactCore";
import type { BusinessProfile, VideoFormat } from "@/lib/types";
import type { ReferenceFlyerStyleId } from "@/lib/referenceFlyerStyle";

export const maxDuration = 300;

/** Regenerate one flyer with a user adjustment after selecting a variant. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = validateBusinessProfile(body.business);
    if (!parsed.ok) {
      return errorResponse(parsed.error, 400);
    }

    const adjustmentNote = String(body.adjustmentNote ?? "").trim();
    if (adjustmentNote.length < 4) {
      return errorResponse("adjustmentNote is required (min 4 characters)", 400);
    }

    const business = normalizeBusinessProfileContact(parsed.business as BusinessProfile);
    const format = (body.format ?? "1:1") as VideoFormat;
    const campaignMessage = String(body.campaignMessage ?? "").trim();
    const userPrompt = String(body.userPrompt ?? "").trim();
    const previousPrompt = String(body.previousPrompt ?? "").trim();
    const referenceStyle = body.referenceStyle as ReferenceFlyerStyleId | undefined;

    const rawCopy = body.copy
      ? (body.copy as ReturnType<typeof buildCampaignCopy>)
      : await generateCampaignFlyerCopy(
          business,
          userPrompt || campaignMessage,
          format,
          campaignMessage
        ).catch(() => buildCampaignCopy(business));
    const copy = assertFlyerCopyReady(rawCopy, business);

    const result = await generateFlyerVariant({
      business,
      format,
      logoDataUrl: body.logoDataUrl as string | undefined,
      userPrompt: userPrompt || campaignMessage,
      copy,
      origin: req.nextUrl.origin,
      variantId: "adjust",
      referenceStyleOverride: referenceStyle,
      campaignMessage,
      adjustmentNote,
      previousPrompt: previousPrompt || undefined,
    });

    return Response.json({
      ok: true,
      variant: {
        id: result.id,
        label: result.label,
        referenceStyle: result.referenceStyle,
        imageUrl: result.imageUrl,
        displayUrl: pickFlyerDisplayUrl(result.imageUrl, result.localImageUrl),
        exportImageUrl: result.exportImageUrl,
        baseImageUrl: result.baseImageUrl,
        localImageUrl: result.localImageUrl,
        localBaseImageUrl: result.localBaseImageUrl,
        promptText: result.promptText,
        taskId: result.taskId,
      },
      copy,
      adjustmentNote,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Flyer adjustment failed";
    console.error("[flyer-adjust]", msg, e);
    return errorResponse(msg, 500);
  }
}
