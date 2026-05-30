import { NextRequest, NextResponse } from "next/server";
import { isPiApiTaskId, parsePiApiError, pollPiApiTask } from "@/lib/piapi";
import { isPixverseTaskId, parsePixverseError, pollPixverseTask } from "@/lib/pixverse";
import { extractOutputUrl, parseImageGenError } from "@/lib/imageProvider";
import {
  extractOpenAISyncUrl,
  isOpenAISyncTaskId,
} from "@/lib/openaiImages";
import {
  getPrediction,
  mapReplicateStatus,
} from "@/lib/replicate";

export const maxDuration = 300;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (isPiApiTaskId(id)) {
      const result = await pollPiApiTask(id);

      if (result.status === "SUCCEEDED") {
        return NextResponse.json({
          id,
          status: "SUCCEEDED",
          outputUrl: result.outputUrl,
          provider: "piapi",
        });
      }

      if (result.status === "FAILED") {
        return NextResponse.json({
          id,
          status: "FAILED",
          error: result.error ?? "PiAPI video generation failed",
          provider: "piapi",
        });
      }

      return NextResponse.json({
        id,
        status: "RUNNING",
        provider: "piapi",
      });
    }

    if (isPixverseTaskId(id)) {
      const result = await pollPixverseTask(id);

      if (result.status === "SUCCEEDED") {
        return NextResponse.json({
          id,
          status: "SUCCEEDED",
          outputUrl: result.outputUrl,
          provider: "pixverse",
        });
      }

      if (result.status === "FAILED") {
        return NextResponse.json({
          id,
          status: "FAILED",
          error: result.error ?? "Pixverse video generation failed",
          provider: "pixverse",
        });
      }

      return NextResponse.json({
        id,
        status: "RUNNING",
        provider: "pixverse",
      });
    }

    if (isOpenAISyncTaskId(id)) {
      return NextResponse.json({
        id,
        status: "SUCCEEDED",
        outputUrl: extractOpenAISyncUrl(id),
        provider: "openai",
      });
    }

    const prediction = await getPrediction(id);
    const mapped = mapReplicateStatus(prediction.status);

    if (mapped === "SUCCEEDED") {
      const url = extractOutputUrl({ output: prediction.output });
      return NextResponse.json({
        id,
        status: "SUCCEEDED",
        outputUrl: url,
        provider: "replicate",
      });
    }

    if (mapped === "FAILED") {
      return NextResponse.json({
        id,
        status: "FAILED",
        error: prediction.error ?? "Generation failed",
        provider: "replicate",
      });
    }

    return NextResponse.json({
      id,
      status: "RUNNING",
      replicateStatus: prediction.status,
      provider: "replicate",
    });
  } catch (e) {
    const { id } = await params;
    const message = isPiApiTaskId(id)
      ? parsePiApiError(e)
      : isPixverseTaskId(id)
        ? parsePixverseError(e)
        : parseImageGenError(e);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
