import { NextRequest, NextResponse } from "next/server";
import { enrichPromptWithBusiness } from "@/lib/businessPrompt";
import { composeAdVideo } from "@/lib/ffmpeg";
import {
  createImageToVideo,
  createTextToVideo,
  extractOutputUrl,
  parseReplicateError,
  REPLICATE_MODELS,
  waitForTask,
} from "@/lib/replicate";
import { isVideoGeneratorEnabled } from "@/lib/featureFlags";
import type { BusinessProfile, VideoFormat } from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    if (!isVideoGeneratorEnabled()) {
      return NextResponse.json(
        {
          error:
            "AI video generation is disabled. Set MYSOGI_VIDEO_GENERATOR=true in .env.local and restart the dev server.",
        },
        { status: 403 }
      );
    }
    const body = await req.json();
    const format = (body.format ?? "16:9") as VideoFormat;
    const mode = body.mode ?? "text";
    const duration = body.duration ?? 5;
    const business = body.business as BusinessProfile | undefined;

    let promptText = String(body.promptText ?? "");
    if (business) {
      promptText = enrichPromptWithBusiness(business, promptText, "video");
    }

    const task =
      mode === "image" && body.promptImage
        ? await createImageToVideo({
            promptImage: body.promptImage,
            promptText,
            format,
            duration,
          })
        : await createTextToVideo({
            promptText,
            format,
            duration,
          });

    const taskId = task.id;

    if (body.wait) {
      const completed = await waitForTask(taskId);
      let url = extractOutputUrl(completed);
      const logoDataUrl = body.logoDataUrl as string | undefined;
      if (url && logoDataUrl) {
        const composed = await composeAdVideo({
          videoSource: url,
          format,
          logoDataUrl,
          overlayText: body.overlayText ?? business?.callToAction,
          businessName: business?.businessName,
          phone: business?.phone,
        });
        url = composed.outputUrl;
      }

      return NextResponse.json({
        taskId,
        status: "SUCCEEDED",
        videoUrl: url,
        promptText,
        provider: "replicate",
        model: REPLICATE_MODELS.video,
      });
    }

    return NextResponse.json({
      taskId,
      status: "RUNNING",
      promptText,
      provider: "replicate",
      model: REPLICATE_MODELS.video,
    });
  } catch (e) {
    const message = parseReplicateError(e);
    const status = /insufficient credit|402/i.test(message) ? 402 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
