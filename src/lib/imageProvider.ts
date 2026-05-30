import {
  createOpenAITextToImage,
  extractOpenAISyncUrl,
  isOpenAISyncTaskId,
  parseOpenAIImageError,
} from "./openaiImages";
import {
  createTextToImage as createReplicateTextToImage,
  extractOutputUrl,
  parseReplicateError,
  waitForTask as waitForReplicateTask,
} from "./replicate";
import type { VideoFormat } from "./types";

export type FlyerImageProvider = "replicate" | "openai";

export function getFlyerImageProvider(): FlyerImageProvider {
  const v = process.env.FLYER_IMAGE_PROVIDER?.trim().toLowerCase();
  if (v === "openai") return "openai";
  return "replicate";
}

/** Switch back instantly: set FLYER_IMAGE_PROVIDER=replicate in .env.local */
export function flyerImageProviderLabel(): string {
  if (getFlyerImageProvider() !== "openai") return "Replicate Imagen 4";
  const model = process.env.FLYER_OPENAI_MODEL?.trim() || "gpt-image-1";
  return `OpenAI ${model} (1 request, no retry)`;
}

export async function createTextToImage(params: {
  promptText: string;
  format: VideoFormat;
  renderTextInImage?: boolean;
  requestOrigin?: string;
}): Promise<{ id: string }> {
  if (getFlyerImageProvider() === "openai") {
    const result = await createOpenAITextToImage(params);
    return { id: result.id };
  }
  return createReplicateTextToImage(params);
}

export async function waitForTask(predictionId: string, maxWaitMs = 600_000) {
  if (isOpenAISyncTaskId(predictionId)) {
    return {
      status: "SUCCEEDED" as const,
      output: extractOpenAISyncUrl(predictionId),
    };
  }
  return waitForReplicateTask(predictionId, maxWaitMs);
}

export function parseImageGenError(error: unknown): string {
  if (getFlyerImageProvider() === "openai") {
    return parseOpenAIImageError(error);
  }
  return parseReplicateError(error);
}

export { extractOutputUrl };
