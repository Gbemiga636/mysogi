import { NextRequest, NextResponse } from "next/server";
import { buildCampaignCopy } from "@/lib/campaignTextLayers";
import { detectFlyerTextFromImage } from "@/lib/groq";
import type { BusinessProfile } from "@/lib/types";

export const maxDuration = 60;

/** Vision OCR — reads baked-in flyer text so polish editor fields can be pre-filled */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const imageUrl = body.imageUrl as string | undefined;
    const business = body.business as BusinessProfile | undefined;

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    let copy;
    try {
      copy = await detectFlyerTextFromImage(imageUrl, business);
    } catch {
      copy = business ? buildCampaignCopy(business) : buildCampaignCopy({
        businessName: "",
        tagline: "",
        phone: "",
        email: "",
        website: "",
        location: "",
        industry: "",
        targetAudience: "",
        campaignType: "",
        campaignGoal: "",
        brandColors: "",
        brandPrimary: "#0B1F3A",
        brandSecondary: "#F26522",
        callToAction: "Get Started",
      });
    }

    return NextResponse.json({ copy, method: "vision" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Text detection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
