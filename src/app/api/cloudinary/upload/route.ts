import { NextRequest, NextResponse } from "next/server";
import { getFlyerComposeEngine } from "@/lib/composeEngine";
import { putFlyerImage } from "@/lib/flyerImageStore";
import {
  isCloudinaryConfigured,
  parseCloudinaryError,
  uploadImage,
} from "@/lib/cloudinary";

export const maxDuration = 60;

function parseDataUrl(dataUrl: string): Buffer {
  const match = dataUrl.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (!match) throw new Error("Invalid image data URL");
  return Buffer.from(match[2], "base64");
}

/** Local disk first; Cloudinary when configured (hybrid / polish editor) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, dataUrl, preserveTransparency } = body as {
      imageUrl?: string;
      dataUrl?: string;
      preserveTransparency?: boolean;
    };

    if (!imageUrl && !dataUrl) {
      return NextResponse.json(
        { error: "Provide imageUrl or dataUrl" },
        { status: 400 }
      );
    }

    const origin = req.nextUrl.origin;
    const engine = getFlyerComposeEngine();

    if (engine !== "sharp" && isCloudinaryConfigured()) {
      try {
        const result = await uploadImage({
          imageUrl,
          dataUrl,
          preserveTransparency: Boolean(preserveTransparency),
        });
        return NextResponse.json({
          publicId: result.publicId,
          secureUrl: result.secureUrl,
          width: result.width,
          height: result.height,
          storage: "cloudinary",
        });
      } catch (e) {
        console.warn("[upload] Cloudinary failed, using local disk:", e);
      }
    }

    let buffer: Buffer;
    if (dataUrl) {
      buffer = parseDataUrl(dataUrl);
    } else if (imageUrl) {
      const res = await fetch(imageUrl, { signal: AbortSignal.timeout(60_000) });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      buffer = Buffer.from(await res.arrayBuffer());
    } else {
      throw new Error("Provide imageUrl or dataUrl");
    }

    const { id, url } = await putFlyerImage(buffer, "image/png");
    return NextResponse.json({
      publicId: id,
      secureUrl: `${origin}${url}`,
      storage: "local",
    });
  } catch (e) {
    const message = parseCloudinaryError(e);
    console.error("[cloudinary/upload]", message, e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
