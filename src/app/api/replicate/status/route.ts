import { NextResponse } from "next/server";
import {
  getReplicateToken,
  parseReplicateError,
  REPLICATE_MODELS,
  testReplicateConnection,
} from "@/lib/replicate";
import { withNetworkRetry } from "@/lib/networkRetry";
import { getReplicate } from "@/lib/replicate";

/** Verify REPLICATE_API_TOKEN and model access */
export async function GET() {
  try {
    getReplicateToken();
    const ping = await testReplicateConnection();
    if (!ping.ok) {
      return NextResponse.json(
        {
          ok: false,
          tokenConfigured: true,
          error: ping.error,
        },
        { status: 503 }
      );
    }

    const replicate = getReplicate();
    const [imageModel, videoModel] = await Promise.all([
      withNetworkRetry(
        () =>
          replicate.models.get(
            REPLICATE_MODELS.image.split("/")[0]!,
            REPLICATE_MODELS.image.split("/")[1]!
          ),
        { label: "models.get.image" }
      ),
      withNetworkRetry(
        () =>
          replicate.models.get(
            REPLICATE_MODELS.video.split("/")[0]!,
            REPLICATE_MODELS.video.split("/")[1]!
          ),
        { label: "models.get.video" }
      ),
    ]);
    return NextResponse.json({
      ok: true,
      tokenConfigured: true,
      imageModel: REPLICATE_MODELS.image,
      videoModel: REPLICATE_MODELS.video,
      models: {
        image: imageModel.name ?? REPLICATE_MODELS.image,
        video: videoModel.name ?? REPLICATE_MODELS.video,
      },
      message:
        "Replicate ready — Google Imagen 4 for flyers, MiniMax video-01 for ads.",
    });
  } catch (e) {
    const message = parseReplicateError(e);
    return NextResponse.json(
      {
        ok: false,
        tokenConfigured: Boolean(process.env.REPLICATE_API_TOKEN?.trim()),
        imageModel: REPLICATE_MODELS.image,
        videoModel: REPLICATE_MODELS.video,
        error: message,
      },
      { status: 500 }
    );
  }
}
