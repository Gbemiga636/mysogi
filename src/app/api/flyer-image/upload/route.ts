import { NextRequest, NextResponse } from "next/server";
import { putFlyerImage } from "@/lib/flyerImageStore";

export const maxDuration = 60;

function parseDataUrl(dataUrl: string): { buffer: Buffer; mime: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (!match) throw new Error("Invalid image data URL");
  return {
    mime: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

async function fetchImageBuffer(url: string): Promise<{ buffer: Buffer; mime: string }> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mysogi-Ad-Studio/1.0" },
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) {
    throw new Error(`Could not download image (${res.status})`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const mime = (res.headers.get("content-type") ?? "image/png").split(";")[0].trim();
  return { buffer, mime: mime.startsWith("image/") ? mime : "image/png" };
}

/** Local flyer storage — no Cloudinary required */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dataUrl, imageUrl } = body as { dataUrl?: string; imageUrl?: string };

    let buffer: Buffer;
    let mime = "image/png";

    if (dataUrl) {
      const parsed = parseDataUrl(dataUrl);
      buffer = parsed.buffer;
      mime = parsed.mime;
    } else if (imageUrl) {
      const fetched = await fetchImageBuffer(imageUrl);
      buffer = fetched.buffer;
      mime = fetched.mime;
    } else {
      return NextResponse.json(
        { error: "Provide dataUrl or imageUrl" },
        { status: 400 }
      );
    }

    if (buffer.length < 100) {
      return NextResponse.json({ error: "Image was empty" }, { status: 400 });
    }

    const outMime = mime.includes("png") ? "image/png" : "image/jpeg";
    const { id, url } = await putFlyerImage(buffer, outMime);
    const origin = req.nextUrl.origin;
    const secureUrl = url.startsWith("http") ? url : `${origin}${url}`;

    return NextResponse.json({
      secureUrl,
      publicId: id,
      width: 0,
      height: 0,
      storage: "local",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
