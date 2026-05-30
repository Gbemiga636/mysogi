import { NextRequest, NextResponse } from "next/server";
import { generateScript } from "@/lib/groq";
import type { BusinessProfile } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const business = body.business as BusinessProfile;
    const durationSeconds = body.durationSeconds ?? 15;
    const tone = body.tone ?? "bold and conversion-focused";

    const script = await generateScript(business, durationSeconds, tone);
    return NextResponse.json({ script });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Script generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
