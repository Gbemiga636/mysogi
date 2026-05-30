import { NextRequest, NextResponse } from "next/server";
import { enrichPromptWithBusiness } from "@/lib/businessPrompt";
import { applyFlyerVisualBoost } from "@/lib/flyerPrompt";
import {
  createTextToImage,
  extractOutputUrl,
  getFlyerImageProvider,
  parseImageGenError,
  waitForTask,
} from "@/lib/imageProvider";
import type { BusinessProfile, VideoFormat } from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const format = (body.format ?? "1:1") as VideoFormat;
    const wait = body.wait ?? false;
    const business = body.business as BusinessProfile | undefined;

    let promptText = String(body.promptText ?? "");
    if (business) {
      promptText = applyFlyerVisualBoost(
        enrichPromptWithBusiness(business, promptText, "flyer", format),
        business,
        format
      );
    } else {
      promptText = applyFlyerVisualBoost(promptText);
    }

    const task = await createTextToImage({
      promptText,
      format,
    });

    const taskId = task.id;

    if (!wait) {
      return NextResponse.json({ taskId, status: "RUNNING", promptText });
    }

    const completed = await waitForTask(taskId);
    const url = extractOutputUrl(completed);

    return NextResponse.json({
      taskId,
      status: completed.status,
      imageUrl: url,
      promptText,
      imageProvider: getFlyerImageProvider(),
    });
  } catch (e) {
    const message = parseImageGenError(e);
    const status = /insufficient credit|402/i.test(message) ? 402 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
