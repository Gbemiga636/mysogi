import type { BusinessProfile, VideoFormat } from "./types";
import {
  getVideoTask,
  setVideoTask,
  updateVideoTask,
} from "./videoTaskStore";

const BASE_URL = "https://app-api.pixverse.ai/openapi/v2";
const PREFIX = "pixverse-";

const VIDEO_NEGATIVE =
  "readable text, letters, words, typography, subtitles, watermarks";

export type PixverseTtsSpeaker = { speaker_id: string; name: string };

type PixverseResponse<T> = {
  ErrCode: number;
  ErrMsg: string;
  Resp: T;
};

function getApiKey(): string {
  const key =
    process.env.PIXVERSE_API_KEY?.trim() ||
    process.env.PIXVERSE_API_TOKEN?.trim();
  if (!key) {
    throw new Error(
      "PIXVERSE_API_KEY is required in .env.local. Restart npm run dev after adding it."
    );
  }
  return key;
}

function traceId(): string {
  return crypto.randomUUID();
}

async function pixverseRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("API-KEY", getApiKey());
  headers.set("Ai-trace-id", traceId());
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  const text = await res.text();
  let json: PixverseResponse<T>;
  try {
    json = JSON.parse(text) as PixverseResponse<T>;
  } catch {
    throw new Error(`Pixverse API error (${res.status}): ${text.slice(0, 200)}`);
  }

  if (json.ErrCode !== 0) {
    throw new Error(json.ErrMsg || `Pixverse error ${json.ErrCode}`);
  }

  return json.Resp;
}

export function isPixverseTaskId(id: string): boolean {
  return id.startsWith(PREFIX);
}

export function buildPixverseTaskId(videoId: number | string): string {
  return `${PREFIX}${videoId}`;
}

export function parsePixverseTaskId(taskId: string): number {
  return Number.parseInt(taskId.slice(PREFIX.length), 10);
}

export type PixverseAccountBalance = {
  accountId: number;
  creditMonthly: number;
  creditPackage: number;
  creditTotal: number;
};

export async function getPixverseAccountBalance(): Promise<PixverseAccountBalance> {
  const resp = await pixverseRequest<{
    account_id: number;
    credit_monthly: number;
    credit_package: number;
  }>("/account/balance", { method: "GET" });

  const creditMonthly = resp.credit_monthly ?? 0;
  const creditPackage = resp.credit_package ?? 0;

  return {
    accountId: resp.account_id ?? 0,
    creditMonthly,
    creditPackage,
    creditTotal: creditMonthly + creditPackage,
  };
}

export async function listPixverseTtsSpeakers(): Promise<PixverseTtsSpeaker[]> {
  const resp = await pixverseRequest<{ total: number; data: PixverseTtsSpeaker[] }>(
    "/video/lip_sync/tts_list",
    { method: "GET" }
  );
  return resp.data ?? [];
}

/** Resolve TTS speaker — Pixverse has no "Kokoro" name; use Auto or env override */
export async function resolveTtsSpeakerId(): Promise<string> {
  const preferred =
    process.env.PIXVERSE_TTS_SPEAKER_ID?.trim() ||
    process.env.PIXVERSE_TTS_SPEAKER?.trim() ||
    "Auto";

  if (/^\d+$/.test(preferred) || preferred === "Auto" || preferred === "auto") {
    return preferred === "auto" ? "Auto" : preferred;
  }

  const speakers = await listPixverseTtsSpeakers();
  const lower = preferred.toLowerCase();
  const match = speakers.find((s) => s.name.toLowerCase() === lower);
  if (match) return match.speaker_id;

  if (lower.includes("kokoro")) {
    const auto = speakers.find((s) => s.name.toLowerCase() === "auto");
    return auto?.speaker_id ?? "Auto";
  }

  return "Auto";
}

export function mapFormatToPixverse(
  format: VideoFormat
): { aspect_ratio: string; quality: string } {
  if (format === "16:9") return { aspect_ratio: "16:9", quality: "720p" };
  if (format === "1:1") return { aspect_ratio: "1:1", quality: "720p" };
  if (format === "4:5") return { aspect_ratio: "3:4", quality: "720p" };
  return { aspect_ratio: "9:16", quality: "720p" };
}

function buildTtsContent(
  business: BusinessProfile | undefined,
  script: string,
  userPrompt: string
): string | undefined {
  const raw =
    script.trim() ||
    userPrompt.trim() ||
    [
      business?.tagline,
      business?.callToAction,
      business?.businessName
        ? `${business.businessName}. ${business.campaignGoal || ""}`
        : "",
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

  if (!raw) return undefined;
  return raw.slice(0, 140);
}

export async function uploadPixverseImage(source: string): Promise<number> {
  const form = new FormData();
  if (source.startsWith("http://") || source.startsWith("https://")) {
    form.append("image_url", source);
  } else {
    const blob = await dataUrlToBlob(source);
    form.append("image", blob, "frame.png");
  }

  const resp = await pixverseRequest<{ img_id: number }>("/image/upload", {
    method: "POST",
    body: form,
  });
  return resp.img_id;
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

type GenerateBody = Record<string, unknown>;

async function applyTtsParams(
  body: GenerateBody,
  ttsContent: string | undefined
): Promise<void> {
  if (!ttsContent) return;
  const useTts = process.env.PIXVERSE_TTS_ENABLED !== "false";
  if (!useTts) return;

  body.lip_sync_tts_switch = true;
  body.lip_sync_tts_content = ttsContent;
  body.lip_sync_tts_speaker_id = await resolveTtsSpeakerId();
}

export async function createPixverseTextToVideo(params: {
  promptText: string;
  format: VideoFormat;
  duration?: number;
  business?: BusinessProfile;
  script?: string;
  userPrompt?: string;
}): Promise<{ id: string; videoId: number }> {
  const { aspect_ratio, quality } = mapFormatToPixverse(params.format);
  const model = process.env.PIXVERSE_VIDEO_MODEL?.trim() || "v5.6";
  const duration = params.duration === 10 ? 10 : 5;

  const body: GenerateBody = {
    aspect_ratio,
    duration,
    model,
    prompt: params.promptText,
    quality,
    motion_mode: "normal",
    negative_prompt: VIDEO_NEGATIVE,
    water_mark: false,
    seed: 0,
  };

  await applyTtsParams(
    body,
    buildTtsContent(params.business, params.script ?? "", params.userPrompt ?? "")
  );

  const resp = await pixverseRequest<{ video_id: number }>(
    "/video/text/generate",
    { method: "POST", body: JSON.stringify(body) }
  );

  return { id: buildPixverseTaskId(resp.video_id), videoId: resp.video_id };
}

export async function createPixverseImageToVideo(params: {
  promptImage: string;
  promptText: string;
  format: VideoFormat;
  duration?: number;
  business?: BusinessProfile;
  script?: string;
}): Promise<{ id: string; videoId: number }> {
  const imgId = await uploadPixverseImage(params.promptImage);
  const { aspect_ratio, quality } = mapFormatToPixverse(params.format);
  const model = process.env.PIXVERSE_VIDEO_MODEL?.trim() || "v5.6";
  const duration = params.duration === 10 ? 10 : 5;

  const body: GenerateBody = {
    img_id: imgId,
    aspect_ratio,
    duration,
    model,
    prompt: params.promptText,
    quality,
    motion_mode: "normal",
    negative_prompt: VIDEO_NEGATIVE,
    water_mark: false,
    seed: 0,
  };

  await applyTtsParams(
    body,
    buildTtsContent(params.business, params.script ?? "", params.promptText)
  );

  const resp = await pixverseRequest<{ video_id: number }>(
    "/video/img/generate",
    { method: "POST", body: JSON.stringify(body) }
  );

  return { id: buildPixverseTaskId(resp.video_id), videoId: resp.video_id };
}

export async function getPixverseVideoResult(videoId: number): Promise<{
  status: "SUCCEEDED" | "FAILED" | "RUNNING";
  outputUrl?: string | null;
  error?: string;
  pixverseStatus?: number;
}> {
  const resp = await pixverseRequest<{
    status: number;
    url?: string;
    prompt?: string;
  }>(`/video/result/${videoId}`, { method: "GET" });

  // 1 = success, 5 = generating, 7 = moderation failed, 8 = failed
  if (resp.status === 1 && resp.url) {
    return { status: "SUCCEEDED", outputUrl: resp.url, pixverseStatus: resp.status };
  }
  if (resp.status === 8 || resp.status === 7) {
    return {
      status: "FAILED",
      error:
        resp.status === 7
          ? "Pixverse moderation rejected the video"
          : "Pixverse video generation failed",
      pixverseStatus: resp.status,
    };
  }
  return { status: "RUNNING", pixverseStatus: resp.status };
}

export function parsePixverseError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (/insufficient balance|500090/i.test(raw)) {
    return (
      "Pixverse API credits are 0 (error 500090). Free credits on pixverse.ai / the mobile app " +
      "do not apply to the API — buy API credits at platform.pixverse.ai → Billing, " +
      "using the same account that created your API key. Check balance: GET /api/pixverse/status"
    );
  }
  if (/401|invalid.*key/i.test(raw)) {
    return "Invalid PIXVERSE_API_KEY. Check .env.local and restart npm run dev.";
  }
  return raw || "Pixverse request failed";
}

async function runPixversePollJob(
  taskId: string,
  videoId: number
): Promise<void> {
  const maxWait = Date.now() + 600000;
  while (Date.now() < maxWait) {
    try {
      const result = await getPixverseVideoResult(videoId);
      if (result.status === "SUCCEEDED") {
        updateVideoTask(taskId, {
          status: "SUCCEEDED",
          outputUrl: result.outputUrl,
          provider: "pixverse",
        });
        return;
      }
      if (result.status === "FAILED") {
        updateVideoTask(taskId, {
          status: "FAILED",
          error: result.error ?? "Pixverse generation failed",
          provider: "pixverse",
        });
        return;
      }
    } catch (e) {
      updateVideoTask(taskId, {
        status: "FAILED",
        error: parsePixverseError(e),
        provider: "pixverse",
      });
      return;
    }
    await new Promise((r) => setTimeout(r, 4000));
  }
  updateVideoTask(taskId, {
    status: "FAILED",
    error: "Pixverse video generation timed out",
    provider: "pixverse",
  });
}

export function startPixverseTextToVideoJob(params: {
  promptText: string;
  format: VideoFormat;
  duration?: number;
  business?: BusinessProfile;
  script?: string;
  userPrompt?: string;
}): Promise<string> {
  return (async () => {
    const { id, videoId } = await createPixverseTextToVideo(params);
    setVideoTask(id, { status: "RUNNING", provider: "pixverse" });
    void runPixversePollJob(id, videoId);
    return id;
  })();
}

export function startPixverseImageToVideoJob(params: {
  promptImage: string;
  promptText: string;
  format: VideoFormat;
  duration?: number;
  business?: BusinessProfile;
  script?: string;
}): Promise<string> {
  return (async () => {
    const { id, videoId } = await createPixverseImageToVideo(params);
    setVideoTask(id, { status: "RUNNING", provider: "pixverse" });
    void runPixversePollJob(id, videoId);
    return id;
  })();
}

export function getPixverseTask(taskId: string): {
  status: "SUCCEEDED" | "FAILED" | "RUNNING";
  outputUrl?: string | null;
  error?: string;
} {
  const cached = getVideoTask(taskId);
  if (cached) {
    return {
      status: cached.status,
      outputUrl: cached.outputUrl,
      error: cached.error,
    };
  }

  if (!isPixverseTaskId(taskId)) {
    return { status: "FAILED", error: "Unknown Pixverse task" };
  }

  const videoId = parsePixverseTaskId(taskId);
  if (!Number.isFinite(videoId)) {
    return { status: "FAILED", error: "Invalid Pixverse task id" };
  }

  return { status: "RUNNING" };
}

/** Poll Pixverse directly when task store was lost (e.g. server restart) */
export async function pollPixverseTask(taskId: string): Promise<{
  status: "SUCCEEDED" | "FAILED" | "RUNNING";
  outputUrl?: string | null;
  error?: string;
}> {
  const cached = getVideoTask(taskId);
  if (cached && cached.status !== "RUNNING") {
    return {
      status: cached.status,
      outputUrl: cached.outputUrl,
      error: cached.error,
    };
  }

  const videoId = parsePixverseTaskId(taskId);
  const result = await getPixverseVideoResult(videoId);
  if (result.status === "SUCCEEDED") {
    updateVideoTask(taskId, {
      status: "SUCCEEDED",
      outputUrl: result.outputUrl,
      provider: "pixverse",
    });
  } else if (result.status === "FAILED") {
    updateVideoTask(taskId, {
      status: "FAILED",
      error: result.error,
      provider: "pixverse",
    });
  }
  return result;
}
