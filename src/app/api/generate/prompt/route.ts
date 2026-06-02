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
import { withCampaignTypePromptLead } from "@/lib/campaignTypeEngine";
import type { BusinessProfile, VideoFormat } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const business = body.business as BusinessProfile;
    const type = body.type ?? "video";
    const format = (body.format ?? "1:1") as VideoFormat;
    const campaignMessage = String(body.campaignMessage ?? "").trim();
    const userPrompt = String(body.userPrompt ?? "").trim();

    if (type === "fast") {
      const text = await generateFastResponse(
        business,
        body.instruction ?? "Write one punchy ad headline under 12 words."
      );
      return NextResponse.json({ prompt: text });
    }

    if (type === "enhance-idea" || type === "enhance") {
      const idea = userPrompt;
      let enhanced = enhanceCreativeDirection(
        business,
        idea,
        format,
        campaignMessage
      );
      try {
        enhanced = await enhanceCreativeIdea(business, idea, format);
      } catch {
        /* use local enhancer */
      }
      const prompt = withCampaignTypePromptLead(
        enhanced,
        business,
        idea,
        campaignMessage
      );
      return NextResponse.json({
        prompt,
        enhancedIdea: prompt,
      });
    }

    if (type === "image" || type === "flyer") {
      if (isSimpleFlyerMode()) {
        const prompt = withCampaignTypePromptLead(
          buildDirectFlyerImagePrompt(business, format, userPrompt || undefined),
          business,
          userPrompt,
          campaignMessage
        );
        return NextResponse.json({ prompt, simpleMode: true });
      }

      const analysis = analyzeCampaignCreative(business, userPrompt, format);
      const prompt = await generateFlyerPrompt(
        business,
        userPrompt,
        format,
        body.style ?? derivePromptStyleFromBusiness(business),
        campaignMessage
      );
      return NextResponse.json({
        prompt,
        creativeBrief: formatCreativeDirectorBrief(analysis, business, format),
        analysis,
      });
    }

    const prompt = withCampaignTypePromptLead(
      await enhanceRunwayPrompt(business, userPrompt, format),
      business,
      userPrompt,
      campaignMessage
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
