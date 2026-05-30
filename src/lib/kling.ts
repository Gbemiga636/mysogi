import { KlingAPI, KlingAPIError } from "kling-api";
import type { VideoFormat } from "./types";

export type KlingVideoMode = "text" | "image";

const T2V_PREFIX = "kling-t2v:";
const I2V_PREFIX = "kling-i2v:";

const VIDEO_NEGATIVE =
  "readable text, letters, words, numbers, typography, subtitles, captions, watermarks, signage";

/** Cheapest tier: kling-v1 + std mode (override via .env.local) */
export const KLING_VIDEO_MODEL =
  (process.env.KLING_VIDEO_MODEL?.trim() as
    | "kling-v1"
    | "kling-v1-6"
    | "kling-v2-5-turbo"
    | undefined) || "kling-v1";

export const KLING_VIDEO_MODE: "std" | "pro" =
  process.env.KLING_VIDEO_MODE === "pro" ? "pro" : "std";

const KLING_BASE_URL =
  process.env.KLING_API_BASE_URL?.trim() ||
  "https://api-singapore.klingai.com";

let client: KlingAPI | null = null;

export function getKlingCredentials(): {
  accessKey: string;
  secretKey: string;
} {
  const accessKey = process.env.KLING_ACCESS_KEY?.trim();
  const secretKey = process.env.KLING_SECRET_KEY?.trim();
  if (!accessKey || !secretKey) {
    throw new Error(
      "KLING_ACCESS_KEY and KLING_SECRET_KEY are required in .env.local. Restart npm run dev after adding them."
    );
  }
  return { accessKey, secretKey };
}

export function getKling(): KlingAPI {
  if (!client) {
    const { accessKey, secretKey } = getKlingCredentials();
    client = new KlingAPI({
      accessKey,
      secretKey,
      baseUrl: KLING_BASE_URL,
    });
  }
  return client;
}

export function mapFormatToKlingAspectRatio(
  format: VideoFormat
): "16:9" | "9:16" | "1:1" {
  if (format === "16:9") return "16:9";
  if (format === "1:1") return "1:1";
  return "9:16";
}

export function isKlingTaskId(taskId: string): boolean {
  return taskId.startsWith(T2V_PREFIX) || taskId.startsWith(I2V_PREFIX);
}

export function buildKlingTaskId(
  mode: KlingVideoMode,
  taskId: string
): string {
  return mode === "text" ? `${T2V_PREFIX}${taskId}` : `${I2V_PREFIX}${taskId}`;
}

export function parseKlingTaskId(
  compositeId: string
): { mode: KlingVideoMode; taskId: string } | null {
  if (compositeId.startsWith(T2V_PREFIX)) {
    return { mode: "text", taskId: compositeId.slice(T2V_PREFIX.length) };
  }
  if (compositeId.startsWith(I2V_PREFIX)) {
    return { mode: "image", taskId: compositeId.slice(I2V_PREFIX.length) };
  }
  return null;
}

export async function createKlingTextToVideo(params: {
  promptText: string;
  format: VideoFormat;
  duration?: number;
}): Promise<{ id: string }> {
  const kling = getKling();
  const duration = params.duration === 10 ? "10" : "5";

  const task = await kling.textToVideo({
    prompt: params.promptText,
    model_name: KLING_VIDEO_MODEL,
    aspect_ratio: mapFormatToKlingAspectRatio(params.format),
    duration,
    mode: KLING_VIDEO_MODE,
    negative_prompt: VIDEO_NEGATIVE,
  });

  const taskId = task.data.task_id;
  if (!taskId) throw new Error("Kling did not return a task id");
  return { id: buildKlingTaskId("text", taskId) };
}

export async function createKlingImageToVideo(params: {
  promptImage: string;
  promptText: string;
  format: VideoFormat;
  duration?: number;
}): Promise<{ id: string }> {
  const kling = getKling();
  const duration = params.duration === 10 ? "10" : "5";

  const task = await kling.imageToVideo({
    image: params.promptImage,
    prompt: params.promptText,
    model_name: KLING_VIDEO_MODEL,
    aspect_ratio: mapFormatToKlingAspectRatio(params.format),
    duration,
    mode: KLING_VIDEO_MODE,
    negative_prompt: VIDEO_NEGATIVE,
  });

  const taskId = task.data.task_id;
  if (!taskId) throw new Error("Kling did not return a task id");
  return { id: buildKlingTaskId("image", taskId) };
}

export function extractKlingVideoUrl(result: {
  data?: {
    task_result?: { videos?: readonly { url?: string }[] };
  };
}): string | null {
  const videos = result.data?.task_result?.videos;
  if (!videos?.length) return null;
  return videos[0]?.url ?? null;
}

export async function getKlingTask(compositeId: string): Promise<{
  status: "SUCCEEDED" | "FAILED" | "RUNNING";
  outputUrl?: string | null;
  error?: string;
  klingStatus?: string;
}> {
  const parsed = parseKlingTaskId(compositeId);
  if (!parsed) {
    throw new Error("Invalid Kling task id");
  }

  const kling = getKling();
  const result =
    parsed.mode === "text"
      ? await kling.queryTextToVideoTask(parsed.taskId)
      : await kling.queryImageToVideoTask(parsed.taskId);

  const klingStatus = result.data.task_status;

  if (klingStatus === "succeed") {
    return {
      status: "SUCCEEDED",
      outputUrl: extractKlingVideoUrl(result),
      klingStatus,
    };
  }

  if (klingStatus === "failed") {
    return {
      status: "FAILED",
      error: result.data.task_status_msg ?? result.message ?? "Kling generation failed",
      klingStatus,
    };
  }

  return { status: "RUNNING", klingStatus };
}

export function parseKlingError(error: unknown): string {
  if (error instanceof KlingAPIError) {
    if (error.code === 1004 || /authorization is expired/i.test(error.message)) {
      return "Kling API keys are expired or invalid. Create a new Access Key + Secret Key at app.klingai.com/global/dev, update .env.local, and restart npm run dev.";
    }
    return error.message;
  }
  const raw = error instanceof Error ? error.message : String(error);
  if (/authorization is expired|1004/i.test(raw)) {
    return "Kling API keys are expired or invalid. Regenerate keys in the Kling developer console and update .env.local.";
  }
  if (/401|unauthorized|invalid.*key/i.test(raw)) {
    return "Invalid Kling API credentials. Check KLING_ACCESS_KEY and KLING_SECRET_KEY in .env.local.";
  }
  if (/402|insufficient|credit|balance/i.test(raw)) {
    return "Kling account needs credits. Add billing in the Kling developer console.";
  }
  return raw || "Kling API request failed";
}
