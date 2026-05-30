import { NextRequest, NextResponse } from "next/server";
import { derivePromptStyleFromBusiness } from "@/lib/businessCampaign";
import { buildDirectFlyerImagePrompt, isSimpleFlyerMode } from "@/lib/directFlyerPrompt";
import {
  analyzeCampaignCreative,
  formatCreativeDirectorBrief,
} from "@/lib/creativeDirector";
import { enhanceCreativeDirection } from "@/lib/creativeEngine/promptEnhancer";
import {
  enhanceCreativeIdea,
  enhanceRunwayPrompt,
  generateFlyerPrompt,
  generateFastResponse,
  parseGroqError,
} from "@/lib/groq";
import type { BusinessProfile, VideoFormat } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const business = body.business as BusinessProfile;
    const type = body.type ?? "video";
    const format = (body.format ?? "1:1") as VideoFormat;

    if (type === "fast") {
      const text = await generateFastResponse(
        business,
        body.instruction ?? "Write one punchy ad headline under 12 words."
      );
      return NextResponse.json({ prompt: text });
    }

    if (type === "enhance-idea" || type === "enhance") {
      const idea = String(body.userPrompt ?? "").trim();
      let enhanced = enhanceCreativeDirection(business, idea, format);
      try {
        enhanced = await enhanceCreativeIdea(business, idea, format);
      } catch {
        /* use local enhancer */
      }
      return NextResponse.json({
        prompt: enhanced,
        enhancedIdea: enhanced,
      });
    }

    if (type === "image" || type === "flyer") {
      const idea = String(body.userPrompt ?? "").trim();

      if (isSimpleFlyerMode()) {
        const prompt = buildDirectFlyerImagePrompt(business, format, idea || undefined);
        return NextResponse.json({ prompt, simpleMode: true });
      }

      const analysis = analyzeCampaignCreative(business, idea, format);
      const prompt = await generateFlyerPrompt(
        business,
        idea,
        format,
        body.style ?? derivePromptStyleFromBusiness(business)
      );
      return NextResponse.json({
        prompt,
        creativeBrief: formatCreativeDirectorBrief(analysis, business, format),
        analysis,
      });
    }

    const prompt = await enhanceRunwayPrompt(
      business,
      body.userPrompt ?? "",
      format
    );
    return NextResponse.json({ prompt });
  } catch (e) {
    console.error("[generate/prompt]", parseGroqError(e), e);
    return NextResponse.json(
      { error: parseGroqError(e) },
      { status: 500 }
    );
  }
}
