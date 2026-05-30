import { NextRequest, NextResponse } from "next/server";
import { overlayLogoOnImage, parseCloudinaryError } from "@/lib/cloudinary";
import { composeAdVideo } from "@/lib/ffmpeg";
import type { VideoFormat } from "@/lib/types";

export const maxDuration = 120;

/** Apply business logo after async Replicate task completes */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, videoUrl, logoDataUrl, format, overlayText, businessName, phone } =
      body as {
        imageUrl?: string;
        videoUrl?: string;
        logoDataUrl?: string;
        format?: VideoFormat;
        overlayText?: string;
        businessName?: string;
        phone?: string;
      };

    if (!logoDataUrl) {
      return NextResponse.json(
        { error: "logoDataUrl is required" },
        { status: 400 }
      );
    }

    if (imageUrl) {
      const result = await overlayLogoOnImage(imageUrl, logoDataUrl);
      return NextResponse.json({ imageUrl: result.secureUrl });
    }

    if (videoUrl) {
      const composed = await composeAdVideo({
        videoSource: videoUrl,
        format: format ?? "9:16",
        logoDataUrl,
        overlayText,
        businessName,
        phone,
      });
      return NextResponse.json({ videoUrl: composed.outputUrl });
    }

    return NextResponse.json(
      { error: "Provide imageUrl or videoUrl" },
      { status: 400 }
    );
  } catch (e) {
    const message = parseCloudinaryError(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
