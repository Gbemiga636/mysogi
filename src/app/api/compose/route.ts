import { NextRequest, NextResponse } from "next/server";
import { composeAdVideo } from "@/lib/ffmpeg";
import type { VideoFormat } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await composeAdVideo({
      videoSource: body.videoSource,
      format: (body.format ?? "16:9") as VideoFormat,
      overlayText: body.overlayText,
      logoDataUrl: body.logoDataUrl,
      audioDataUrl: body.audioDataUrl,
      businessName: body.businessName,
      phone: body.phone,
    });

    return NextResponse.json(result);
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : "FFmpeg compose failed — ensure ffmpeg is installed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
