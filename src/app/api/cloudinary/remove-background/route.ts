import { NextRequest, NextResponse } from "next/server";
import {
  applyBackgroundRemoval,
  parseCloudinaryError,
  uploadImage,
} from "@/lib/cloudinary";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { publicId, imageUrl, dataUrl } = body as {
      publicId?: string;
      imageUrl?: string;
      dataUrl?: string;
    };

    let targetPublicId = publicId;

    if (!targetPublicId) {
      if (!imageUrl && !dataUrl) {
        return NextResponse.json(
          { error: "Provide publicId, imageUrl, or dataUrl" },
          { status: 400 }
        );
      }
      const uploaded = await uploadImage({ dataUrl, imageUrl });
      targetPublicId = uploaded.publicId;
    }

    const result = await applyBackgroundRemoval(targetPublicId);

    return NextResponse.json({
      publicId: result.publicId,
      secureUrl: result.secureUrl,
      width: result.width,
      height: result.height,
    });
  } catch (e) {
    const message = parseCloudinaryError(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
