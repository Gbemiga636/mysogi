import { NextRequest, NextResponse } from "next/server";
import { generateCaption, parseGroqError } from "@/lib/groq";
import type { BusinessProfile } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const business = body.business as BusinessProfile;
    const platform = body.platform ?? "Instagram & Facebook";
    const multilingual = body.multilingual === true;

    const caption = await generateCaption(business, platform, { multilingual });
    return NextResponse.json({ caption });
  } catch (e) {
    return NextResponse.json({ error: parseGroqError(e) }, { status: 500 });
  }
}
