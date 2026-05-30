import { NextRequest, NextResponse } from "next/server";
import { buildCampaignCopy } from "@/lib/campaignTextLayers";
import { generateCampaignFlyerCopy } from "@/lib/groq";
import type { BusinessProfile } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const business = body.business as BusinessProfile | undefined;
    if (!business?.businessName && !business?.campaignGoal) {
      return NextResponse.json(
        { error: "business profile is required" },
        { status: 400 }
      );
    }

    let copy;
    try {
      copy = await generateCampaignFlyerCopy(business);
    } catch {
      copy = buildCampaignCopy(business);
    }

    return NextResponse.json({ copy });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Flyer copy generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
